import os
import uuid
import json
import re
import requests  # <--- Added the missing requests library
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from groq import Groq
# Internal Imports
import database as models
from database import get_db, Client, User, Report, SystemConfig, ContentCalendar, create_tables, seed_admin, supabase, get_config, set_config
from auth import hash_password, verify_password, create_token, get_current_user, require_admin, AuthIdentity
from services.platform_router import fetch_platform_data
import routes
import routes_v3

from apscheduler.schedulers.background import BackgroundScheduler
from services.meta_ads import sync_all_campaigns

def scheduled_meta_ads_sync():
    db = models.SessionLocal()
    try:
        sync_all_campaigns(db)
    finally:
        db.close()


# --- 1. SETUP & CONFIGURATION ---
load_dotenv(find_dotenv(), override=True)

# Moved these to the top so Python knows about them before the routes run!
INSTAGRAM_APP_ID = os.getenv("INSTAGRAM_APP_ID")
INSTAGRAM_APP_SECRET = os.getenv("INSTAGRAM_APP_SECRET")
REDIRECT_URI = "http://localhost:8000/api/auth/instagram/callback"

app = FastAPI(title="Canit Pulse v4")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "canit-pulse-api"}

# Explicitly open CORS to prevent frontend handshake blocks
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:5173",
        "https://canit-pulse.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")
app.include_router(routes_v3.router_v3, prefix="/api")

client_ai = Groq(api_key=os.getenv("GROQ_API_KEY"))

from typing import Optional

# --- 2. SCHEMAS ---
class ClientCreate(BaseModel):
    name: str
    industry: str
    website_url: Optional[str] = None
    handle: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    question: str
    history: list = []

class PersonalityRequest(BaseModel):
    personality: str  # "analytical", "creative", "executive"

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

# AI Personality prompt directives
PERSONALITY_DIRECTIVES = {
    "analytical": "Be data-driven, precise, and metrics-focused. Use numbers and percentages to back every recommendation.",
    "creative": "Be bold, imaginative, and trend-forward. Suggest unconventional strategies and fresh content ideas.",
    "executive": "Be concise and high-level. Focus on ROI, strategic priorities, and bottom-line impact. Max 80 words total.",
}

# --- 5. CLIENT CRUD (Remaining) ---
@app.put("/api/clients/{client_id}")
def update_client(client_id: str, client_data: ClientCreate, current_user: AuthIdentity = Depends(require_admin), db: Session = Depends(get_db)):
    from services.permissions import can_edit_client
    if not can_edit_client(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to edit clients.")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    if client_data.website_url:
        import urllib.parse
        try:
            parsed = urllib.parse.urlparse(client_data.website_url)
            if not all([parsed.scheme in ["http", "https"], parsed.netloc]):
                raise HTTPException(status_code=400, detail="Invalid website URL format. Must start with http:// or https://")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid website URL format.")
            
    client.name = client_data.name
    client.industry = client_data.industry
    client.website_url = client_data.website_url
    if client_data.handle is not None:
        client.instagram_handle = client_data.handle
    db.commit()
    db.refresh(client)
    return client



@app.delete("/api/clients/{client_id}")
def delete_client(client_id: str, current_user: AuthIdentity = Depends(require_admin), db: Session = Depends(get_db)):
    from services.permissions import can_delete_client
    if not can_delete_client(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to delete clients.")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    try:
        from database import ContentCalendar, Deliverable, Report, ClientAccess, Competitor, ClientBlog, AnalyticsSnapshot, User
        
        # 1. content_calendar (has client_id string)
        db.query(ContentCalendar).filter(ContentCalendar.client_id == client_id).delete(synchronize_session=False)
        
        # 2. deliverables (has FK to clients.id)
        db.query(Deliverable).filter(Deliverable.client_id == client_id).delete(synchronize_session=False)
        
        # 3. reports (has FK to clients.id)
        db.query(Report).filter(Report.client_id == client_id).delete(synchronize_session=False)
        
        # 4. client_access (has FK to clients.id)
        db.query(ClientAccess).filter(ClientAccess.client_id == client_id).delete(synchronize_session=False)
        
        # 5. competitors (has FK to clients.id)
        db.query(Competitor).filter(Competitor.client_id == client_id).delete(synchronize_session=False)
        
        # 6. client_blogs (has FK to clients.id)
        db.query(ClientBlog).filter(ClientBlog.client_id == client_id).delete(synchronize_session=False)
        
        # 7. analytics_snapshots (has client_id string)
        db.query(AnalyticsSnapshot).filter(AnalyticsSnapshot.client_id == client_id).delete(synchronize_session=False)
        
        # 8. users (has FK to clients.id)
        db.query(User).filter(User.client_id == client_id).delete(synchronize_session=False)
        
        # 8.5 monthly_seo_reports (has FK to clients.id)
        from database import MonthlySEOReport
        db.query(MonthlySEOReport).filter(MonthlySEOReport.client_id == client_id).delete(synchronize_session=False)
        
        # 9. finally clients row
        db.delete(client)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- 6. REPORT GENERATION ---
@app.post("/api/clients/{client_id}/generate")
def generate_full_report(client_id: str, current_user: AuthIdentity = Depends(require_admin), db: Session = Depends(get_db)):
    from services.permissions import can_generate_reports
    if not can_generate_reports(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to generate reports.")
    client_rec = db.query(Client).filter(Client.id == client_id).first()
    if not client_rec:
        raise HTTPException(status_code=404, detail="Client not found")


    client_keys = {
        "ig_access_token": client_rec.ig_access_token,
        "ig_account_id": client_rec.ig_user_id,
        "ad_account_id": client_rec.ad_account_id,
        "instagram_handle": client_rec.instagram_handle,
        "fb_page_id": client_rec.fb_page_id,
        "fb_page_token": client_rec.fb_page_token,
        "x_user_id": client_rec.x_user_id,
        "x_token": client_rec.x_token,
    }

    platform = getattr(client_rec, "platform", "instagram") or "instagram"
    platform_data = fetch_platform_data(platform, client_keys)

    # Fetch extra connected platforms so they are not blank in UI tabs
    facebook_data = {}
    if client_rec.fb_page_id and client_rec.fb_page_token:
        if platform == "facebook":
            facebook_data = platform_data
        else:
            from facebook import get_client_facebook_stats
            facebook_data = get_client_facebook_stats(client_keys)

    youtube_data = {}
    if client_rec.youtube_channel_id:
        from youtube import get_client_youtube_stats
        youtube_api_key = get_config("youtube_api_key", "")
        youtube_data = get_client_youtube_stats(
            channel_id=client_rec.youtube_channel_id,
            api_key=youtube_api_key
        )

    instagram_data = {}
    if platform == "instagram":
        instagram_data = platform_data
    elif client_rec.ig_user_id:
        from instagram import get_client_instagram_stats
        instagram_data = get_client_instagram_stats(client_keys)

    # Cache post thumbnails to avoid CORS/expiration issues
    try:
        from services.thumbnail_cache import cache_platform_thumbnails
        if instagram_data:
            cache_platform_thumbnails(client_id, instagram_data)
        if facebook_data:
            cache_platform_thumbnails(client_id, facebook_data)
    except Exception as cache_err:
        print("Failed to cache post thumbnails:", cache_err)

    full_stats = {
        "platforms": {
            "instagram": instagram_data,
            "facebook": facebook_data,
            "youtube": youtube_data
        },
        "instagram": instagram_data,
        "facebook": facebook_data,
        "youtube": youtube_data
    }

    try:
        data_stats = platform_data if platform_data.get("status") == "success" else {}
        
        # If the platform returns bifurcated data, fall back to 'organic' keys if needed, 
        # but the top-level keys should be populated as well.
        
        # Load AI personality from system config
        ai_personality = get_config("ai_personality", "analytical")
        personality_directive = PERSONALITY_DIRECTIVES.get(ai_personality, PERSONALITY_DIRECTIVES["analytical"])

        prompt = f"""You are a senior digital marketing strategist.
{personality_directive}

Client: {client_rec.name} | Industry: {client_rec.industry}

{platform.capitalize()} data:
- Followers: {data_stats.get('followers', 'N/A')}
- Posts analysed: {data_stats.get('total_posts', 'N/A')}
- Total reach: {data_stats.get('total_reach', 'N/A')}
- Engagement rate: {data_stats.get('engagement_rate', 'N/A')}
- Likes: {data_stats.get('total_likes', 'N/A')}
- Comments: {data_stats.get('total_comments', 'N/A')}
- Saves: {data_stats.get('total_saves', 'N/A')}

Give exactly 3 numbered, specific, actionable growth strategies based on this data.
Be direct. No fluff. Max 120 words total."""

        ai_response = client_ai.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        ai_text = ai_response.choices[0].message.content
    except Exception as e:
        print(f"AI failed: {e}")
        ai_text = "Focus on consistent posting. Engage with comments within the first hour. Use Reels for maximum reach."

    # UPSERT — one report per client per month
    current_month = datetime.now().strftime("%B")
    current_year  = str(datetime.now().year)

    existing = db.query(Report).filter(
        Report.client_id == client_id,
        Report.month == current_month,
        Report.year == current_year,
    ).first()

    if existing:
        existing.ig_data    = full_stats
        existing.ai_insight = ai_text
        db.commit()
        return {"status": "updated", "report_id": existing.id}
    else:
        new_report = Report(
            id=str(uuid.uuid4()),
            client_id=client_id,
            month=current_month,
            year=current_year,
            ig_data=full_stats,
            ai_insight=ai_text,
        )
        db.add(new_report)
        db.commit()
        return {"status": "created", "report_id": new_report.id}


@app.post("/api/clients/{client_id}/refresh-report")
def refresh_report_for_month(client_id: str, current_user: AuthIdentity = Depends(require_admin), db: Session = Depends(get_db), month: str = None, year: str = None):
    """Re-fetch platform data for a specific month/year and update the existing report.
    This allows refreshing past reports when new posts were added after the original generation."""
    from services.permissions import can_generate_reports
    if not can_generate_reports(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to refresh reports.")
    client_rec = db.query(Client).filter(Client.id == client_id).first()
    if not client_rec:
        raise HTTPException(status_code=404, detail="Client not found")


    if not month or not year:
        raise HTTPException(status_code=400, detail="month and year query parameters are required (e.g. ?month=May&year=2026)")

    # Convert month name to number for the API
    month_map = {
        "January": 1, "February": 2, "March": 3, "April": 4,
        "May": 5, "June": 6, "July": 7, "August": 8,
        "September": 9, "October": 10, "November": 11, "December": 12
    }
    month_num = month_map.get(month)
    if not month_num:
        raise HTTPException(status_code=400, detail=f"Invalid month name: {month}")

    client_keys = {
        "ig_access_token": client_rec.ig_access_token,
        "ig_account_id": client_rec.ig_user_id,
        "ad_account_id": client_rec.ad_account_id,
        "instagram_handle": client_rec.instagram_handle,
        "fb_page_id": client_rec.fb_page_id,
        "fb_page_token": client_rec.fb_page_token,
        "x_user_id": client_rec.x_user_id,
        "x_token": client_rec.x_token,
    }

    platform = getattr(client_rec, "platform", "instagram") or "instagram"
    platform_data = fetch_platform_data(platform, client_keys, month=month_num, year=int(year))

    # Fetch extra connected platforms for the refreshed month/year
    facebook_data = {}
    if client_rec.fb_page_id and client_rec.fb_page_token:
        if platform == "facebook":
            facebook_data = platform_data
        else:
            from facebook import get_client_facebook_stats
            facebook_data = get_client_facebook_stats(client_keys, month=month_num, year=int(year))

    youtube_data = {}
    if client_rec.youtube_channel_id:
        from youtube import get_client_youtube_stats
        youtube_api_key = get_config("youtube_api_key", "")
        youtube_data = get_client_youtube_stats(
            channel_id=client_rec.youtube_channel_id,
            api_key=youtube_api_key,
            month=month,
            year=year
        )

    instagram_data = {}
    if platform == "instagram":
        instagram_data = platform_data
    elif client_rec.ig_user_id:
        from instagram import get_client_instagram_stats
        instagram_data = get_client_instagram_stats(client_keys, month=month_num, year=int(year))

    # Cache post thumbnails to avoid CORS/expiration issues
    try:
        from services.thumbnail_cache import cache_platform_thumbnails
        if instagram_data:
            cache_platform_thumbnails(client_id, instagram_data)
        if facebook_data:
            cache_platform_thumbnails(client_id, facebook_data)
    except Exception as cache_err:
        print("Failed to cache post thumbnails:", cache_err)

    full_stats = {
        "platforms": {
            "instagram": instagram_data,
            "facebook": facebook_data,
            "youtube": youtube_data
        },
        "instagram": instagram_data,
        "facebook": facebook_data,
        "youtube": youtube_data
    }

    # Find the existing report for this month/year
    existing = db.query(Report).filter(
        Report.client_id == client_id,
        Report.month == month,
        Report.year == year,
    ).first()

    if existing:
        existing.ig_data = full_stats
        existing.created_at = datetime.utcnow()
        db.commit()
        post_count = platform_data.get("total_posts", 0) if platform_data.get("status") == "success" else 0
        return {"status": "refreshed", "report_id": existing.id, "month": month, "year": year, "posts_fetched": post_count}
    else:
        # Create new report for that month
        new_report = Report(
            id=str(uuid.uuid4()),
            client_id=client_id,
            month=month,
            year=year,
            ig_data=full_stats,
            ai_insight="Report data refreshed. Generate a new AI insight from the admin dashboard.",
        )
        db.add(new_report)
        db.commit()
        post_count = platform_data.get("total_posts", 0) if platform_data.get("status") == "success" else 0
        return {"status": "created", "report_id": new_report.id, "month": month, "year": year, "posts_fetched": post_count}


@app.get("/api/clients/{client_id}/benchmarks")
def get_benchmarks(client_id: str, db: Session = Depends(get_db)):
    client_rec = db.query(Client).filter(Client.id == client_id).first()
    if not client_rec:
        raise HTTPException(status_code=404, detail="Client not found")

    report = db.query(Report).filter(
        Report.client_id == client_id
    ).order_by(Report.created_at.desc()).first()

    ig = {}
    if report and report.ig_data:
        ig = report.ig_data.get("instagram", {})

    try:
        prompt = f"""You are a market research analyst specializing in the Indian market.

Industry: {client_rec.industry}
Brand: {client_rec.name}
Current stats:
- Followers: {ig.get('followers', 0)}
- Engagement rate: {ig.get('engagement_rate', '0%')}
- Monthly posts: {ig.get('total_posts', 0)}

Identify the top 3 real Indian competitors in the "{client_rec.industry}" space.
Estimate realistic figures for each.

Respond ONLY with valid JSON, no markdown:
{{
  "industry": "{client_rec.industry}",
  "competitors": [
    {{"name": "Brand Name", "revenue_lakhs": 500, "followers": 45000, "engagement_rate": 4.2, "monthly_posts": 18}}
  ],
  "your_brand": {{
    "name": "{client_rec.name}",
    "revenue_lakhs": 10,
    "followers": {ig.get('followers', 0)},
    "engagement_rate": {str(ig.get('engagement_rate', '0%')).replace('%','') or 0},
    "monthly_posts": {ig.get('total_posts', 0)},
    "potential_revenue_lakhs": 80,
    "potential_followers": 5000
  }}
}}"""

        res = client_ai.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.3,
        )
        raw = res.choices[0].message.content.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        return json.loads(raw)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports")
def get_all_reports(current_user: AuthIdentity = Depends(require_admin), db: Session = Depends(get_db)):
    import time
    from services.egress_logger import log_egress
    start_time = time.time()
    
    from database import MonthlySEOReport
    if current_user.role == "employee":
        if not current_user.client_id:
            return {"success": True, "reports": [], "seo_reports": []}
        reports = db.query(Report.id, Report.month, Report.year, Report.client_id).filter(Report.client_id == current_user.client_id).order_by(Report.created_at.desc()).all()
        seo_reports = db.query(MonthlySEOReport).filter(MonthlySEOReport.client_id == current_user.client_id).order_by(MonthlySEOReport.uploaded_at.desc()).all()
    else:
        reports = db.query(Report.id, Report.month, Report.year, Report.client_id).order_by(Report.created_at.desc()).all()
        seo_reports = db.query(MonthlySEOReport).order_by(MonthlySEOReport.uploaded_at.desc()).all()
        
    clients = db.query(Client.id, Client.name).all()
    client_name_map = {c.id: c.name for c in clients}
        
    result = []
    for r in reports:
        result.append({
            "id": r.id,
            "client_name": client_name_map.get(r.client_id, "Unknown"),
            "month": r.month,
            "year": r.year,
            "client_id": r.client_id,
        })
        
    seo_result = []
    for sr in seo_reports:
        seo_result.append({
            "id": sr.id,
            "client_name": client_name_map.get(sr.client_id, "Unknown"),
            "month": sr.month,
            "year": sr.year,
            "client_id": sr.client_id,
            "filename": sr.filename,
            "url": sr.url,
            "uploaded_at": sr.uploaded_at.isoformat() if sr.uploaded_at else None
        })
        
    payload = {"success": True, "reports": result, "seo_reports": seo_result}
    log_egress("GET /api/reports (Dashboard)", start_time, len(result) + len(seo_result), payload)
    return payload

@app.delete("/api/reports/seo/{report_id}")
def delete_seo_report(report_id: str, current_user: AuthIdentity = Depends(require_admin), db: Session = Depends(get_db)):
    from services.permissions import can_delete_report
    if not can_delete_report(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to delete reports.")
    from database import MonthlySEOReport
    r = db.query(MonthlySEOReport).filter(MonthlySEOReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="SEO report not found")
    db.delete(r)
    db.commit()
    return {"success": True}

@app.get("/api/reports/{report_id}")
def get_single_report(report_id: str, current_user: AuthIdentity = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check tenant isolation/employee view permissions
    from services.permissions import is_internal
    if not is_internal(current_user.role) and current_user.role != "client":
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    if current_user.role in ("employee", "client") and current_user.client_id != report.client_id:
        raise HTTPException(status_code=403, detail="Forbidden: Access to another tenant's report is denied.")
    client_rec = db.query(Client).filter(Client.id == report.client_id).first()
    return {
        "id": report.id,
        "client_id": report.client_id,
        "brand_name": client_rec.name if client_rec else "Unknown",
        "month": report.month,
        "year": report.year,
        "ig_data": report.ig_data or {},
        "ai_insight": report.ai_insight or "",
        "client_logo_url": client_rec.client_logo_url if client_rec else None,
    }

@app.delete("/api/reports/{report_id}")
def delete_report(report_id: str, current_user: AuthIdentity = Depends(require_admin), db: Session = Depends(get_db)):
    """Delete a specific report from the archive."""
    from services.permissions import can_delete_report
    if not can_delete_report(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to delete reports.")
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    try:
        db.delete(report)
        db.commit()
        return {"success": True, "message": "Report deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")


# --- 8. AI CHAT & RESEARCH ---
@app.post("/api/reports/{report_id}/chat")
def chat_with_report(report_id: str, req: ChatRequest, current_user: AuthIdentity = Depends(get_current_user), db: Session = Depends(get_db)):
    from services.permissions import can_use_ai
    if not can_use_ai(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to use AI chatbot.")
        
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if current_user.role in ("employee", "client") and current_user.client_id != report.client_id:
        raise HTTPException(status_code=403, detail="Forbidden: Access to another tenant's report is denied.")
    
    system_msg = f"You are a CMO assistant analyzing this data: {report.ig_data}"
    messages = [{"role": "system", "content": system_msg}] + req.history + [{"role": "user", "content": req.question}]
    
    res = client_ai.chat.completions.create(messages=messages, model="llama-3.1-8b-instant")
    return {"answer": res.choices[0].message.content}


# --- 9. SETTINGS COMMAND CENTER ---

@app.get("/api/settings/health")
def check_api_health(current_user: AuthIdentity = Depends(require_admin)):
    from services.permissions import can_access_settings
    if not can_access_settings(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to access settings.")
    """Ping Meta Graph API and Groq to return live connection status."""
    import time

    # --- Meta Graph API Check ---
    meta_status = {"status": "offline", "latency_ms": 0}
    try:
        start = time.time()
        meta_res = requests.get(
            "https://graph.facebook.com/v19.0/me",
            params={"access_token": "ping"},  # Will return an error, but proves reachability
            timeout=5
        )
        latency = round((time.time() - start) * 1000)
        # A response (even an auth error) means the API is reachable
        if meta_res.status_code in (200, 400, 401, 403):
            meta_status = {"status": "connected", "latency_ms": latency}
    except Exception:
        meta_status = {"status": "offline", "latency_ms": 0}

    # --- Groq API Check ---
    groq_status = {"status": "offline", "latency_ms": 0}
    try:
        start = time.time()
        groq_res = client_ai.chat.completions.create(
            messages=[{"role": "user", "content": "ping"}],
            model="llama-3.1-8b-instant",
            max_tokens=1,
        )
        latency = round((time.time() - start) * 1000)
        if groq_res.choices:
            groq_status = {"status": "connected", "latency_ms": latency}
    except Exception:
        groq_status = {"status": "offline", "latency_ms": 0}

    return {"meta": meta_status, "groq": groq_status}


@app.get("/api/settings/quota")
def get_monthly_quota(current_user: AuthIdentity = Depends(require_admin), db: Session = Depends(get_db)):
    from services.permissions import can_access_settings
    if not can_access_settings(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to access settings.")
    """Return the number of reports generated this month and estimated API usage."""
    current_month = datetime.now().strftime("%B")
    current_year = str(datetime.now().year)

    reports_this_month = db.query(Report).filter(
        Report.month == current_month,
        Report.year == current_year,
    ).count()

    # ~3 API calls per report (platform data + AI insight + benchmark)
    estimated_calls = reports_this_month * 3
    monthly_cap = 100

    return {
        "reports_generated": reports_this_month,
        "estimated_api_calls": estimated_calls,
        "monthly_cap": monthly_cap,
        "month": current_month,
        "year": current_year,
    }


@app.post("/api/settings/ai-personality")
def update_ai_personality(req: PersonalityRequest, current_user: AuthIdentity = Depends(require_admin)):
    from services.permissions import can_access_settings
    if not can_access_settings(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to access settings.")
    """Set the global AI report personality."""
    allowed = ["analytical", "creative", "executive"]
    if req.personality not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid personality. Choose from: {allowed}")
    set_config("ai_personality", req.personality)
    return {"success": True, "personality": req.personality}


@app.get("/api/settings/ai-personality")
def get_ai_personality(current_user: AuthIdentity = Depends(require_admin)):
    from services.permissions import can_access_settings
    if not can_access_settings(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to access settings.")
    """Get the current AI report personality."""
    personality = get_config("ai_personality", "analytical")
    return {"personality": personality}


class YoutubeApiKeyRequest(BaseModel):
    youtube_api_key: str

@app.post("/api/settings/youtube-api-key")
def update_youtube_api_key(req: YoutubeApiKeyRequest, current_user: AuthIdentity = Depends(require_admin)):
    from services.permissions import can_access_settings
    if not can_access_settings(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to access settings.")
    
    new_key = req.youtube_api_key.strip()
    if new_key == "********":
        return {"success": True, "message": "YouTube API Key unchanged."}
        
    set_config("youtube_api_key", new_key)
    return {"success": True, "message": "YouTube API Key updated."}

@app.get("/api/settings/youtube-api-key")
def get_youtube_api_key(current_user: AuthIdentity = Depends(require_admin)):
    from services.permissions import can_access_settings
    if not can_access_settings(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to access settings.")
    key = get_config("youtube_api_key", "")
    # Mask the key for frontend security
    masked_key = "********" if key else ""
    return {"youtube_api_key": masked_key}


@app.post("/api/settings/change-password")
def change_admin_password(req: PasswordChangeRequest, db: Session = Depends(get_db)):
    """Change the admin user's password."""
    from auth import hash_password, verify_password

    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")

    if not verify_password(req.current_password, admin.hashed_pw):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    admin.hashed_pw = hash_password(req.new_password)
    db.commit()
    return {"success": True, "message": "Password updated successfully."}




@app.get("/industry-news")
def get_industry_news_direct(industry: str, client_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Direct route for industry news without prefix."""
    from routes import get_industry_news
    return get_industry_news(industry, client_id, db)



# --- 10. STARTUP ---
@app.on_event("startup")
def startup_event():
    from apscheduler.schedulers.background import BackgroundScheduler
    create_tables()
    seed_admin("report@canit.in", "canit#123", "Canit Team")
    
    # Start the background sync scheduler for Ad Performance and Organic Snapshots
    try:
        from services.snapshot_service import scheduled_organic_snapshot_sync
        scheduler = BackgroundScheduler()
        # Meta Ads: every 6 hours
        scheduler.add_job(scheduled_meta_ads_sync, 'interval', hours=6)
        # Organic Analytics: once a week (every 7 days)
        scheduler.add_job(scheduled_organic_snapshot_sync, 'interval', days=7)
        scheduler.start()
        print("Meta Ads Sync Scheduler started (every 6 hours).")
        print("Organic Analytics Snapshot Scheduler started (every 7 days).")
    except Exception as e:
        print("Failed to start scheduler:", e)
    
    # Auto-seed Client Access credentials for the 'canit' brand portal
    db = models.SessionLocal()
    try:
        # Check if Canit Sol has already been seeded before to avoid recreating it after deletion
        has_seeded = get_config("canit_sol_seeded", "false")
        
        if has_seeded != "true":
            # Find existing Canit client record, or create if not found
            canit_client = db.query(models.Client).filter(models.Client.name.like("%Canit%")).first()
            if not canit_client:
                canit_client = models.Client(
                    id="062b61aa-a2a4-4fad-be3c-40357f3c8cc2",
                    name="Canit Sol",
                    industry="Tech Solutions",
                    status="live"
                )
                db.add(canit_client)
                db.commit()
                db.refresh(canit_client)
                print("Created default Canit Sol client record during startup.")
            
            # Verify/create the ClientAccess login record for 'canit' username
            existing_access = db.query(models.ClientAccess).filter(models.ClientAccess.username == "canit").first()
            if not existing_access:
                new_access = models.ClientAccess(
                    id=str(uuid.uuid4()),
                    client_id=canit_client.id,
                    username="canit",
                    password_hash=hash_password("canit#123"),
                    is_active=True,
                    report_access_scope="client"
                )
                db.add(new_access)
                print(f"Seeded client access credentials: username 'canit', password 'canit#123'")
            else:
                # Sync the hashed password to match 'canit#123'
                existing_access.password_hash = hash_password("canit#123")
                existing_access.client_id = canit_client.id
                print(f"Synchronized client access credentials for 'canit'")
            db.commit()
            set_config("canit_sol_seeded", "true")
            print("Successfully recorded 'canit_sol_seeded' as true.")
        else:
            print("Canit Sol was already seeded; skipping auto-creation to respect deletion.")
    except Exception as e:
        print("Error seeding 'canit' client access:", e)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)