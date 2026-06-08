"""
New routes for v3:
- POST /api/reports/generate-from-instagram  ← replaces PDF upload
- POST /api/reports/{id}/chat                ← AI chat
- GET  /api/clients/{id}/instagram-preview   ← preview before generating
All existing v2 routes remain.
"""
import uuid, json, os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from database import get_db, User, Client, Report, get_config
from auth import get_current_user, require_admin, require_client, AuthIdentity


# 🎯 Notice we only import the new, smart function now!
from instagram import get_client_instagram_stats
from facebook import get_client_facebook_stats
from youtube import get_client_youtube_stats
from ai_chat import generate_synopsis, chat_with_report
from report_generator_v3 import generate_report_html
from services.blog_ingestor import fetch_client_blogs

# Create the router instance
router_v3 = APIRouter()

# --- LOGIN ROUTE ---
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

@router_v3.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # 1. Search for the user
    user = db.query(User).filter(User.email == req.email).first()
    
    # 2. If user doesn't exist
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # 3. Check password (make sure this matches admin123 from your terminal!)
    if req.password != user.password:
        raise HTTPException(status_code=401, detail="Invalid password")
        
    # 4. Success! Tell the UI who just logged in
    return {
        "success": True,
        "role": user.role, # 'admin' or 'client'
        "client_id": user.client_id or "canit"
    }


# ── GENERATE FROM INSTAGRAM ─────────────────────────────

class GenerateFromInstagram(BaseModel):
    client_id: str
    month: str
    year: str
    use_mock: bool = False   # set True during dev/testing


@router_v3.post("/reports/generate")
@router_v3.post("/reports/generate-from-instagram")
def generate_report(
    data: GenerateFromInstagram,
    background_tasks: BackgroundTasks,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    if not client.instagram_handle and not client.website_url:
        raise HTTPException(status_code=400, detail="No Website URL or Instagram handle set for this client. Edit client to add one.")

    handle = client.instagram_handle
    if not handle:
        import re
        handle = re.sub(r"[^a-zA-Z0-9_.]", "", client.name.lower()) if client.name else "demo"
        
    if client.website_url:
        background_tasks.add_task(fetch_client_blogs, client.id, client.website_url)

    try:
        # 🎯 ONE LINE FIX: Our smart function handles real vs mock automatically!
        client_keys = {
            "ig_access_token": client.ig_access_token,
            "ig_account_id": client.ig_user_id,
            "ad_account_id": client.ad_account_id,
            "instagram_handle": handle,
            "fb_page_id": client.fb_page_id,
            "fb_page_token": client.fb_page_token,
            "x_user_id": client.x_user_id,
            "x_token": client.x_token,
            "client_id": client.id,
        }
        instagram_data = get_client_instagram_stats(client_keys, month=data.month, year=data.year)
        
        facebook_data = {}
        if client.fb_page_id and client.fb_page_token:
            month_map = {
                "January": 1, "February": 2, "March": 3, "April": 4,
                "May": 5, "June": 6, "July": 7, "August": 8,
                "September": 9, "October": 10, "November": 11, "December": 12
            }
            month_num = month_map.get(data.month, 1)
            facebook_data = get_client_facebook_stats(client_keys, month=month_num, year=data.year)


        youtube_data = {}
        if client.youtube_channel_id:
            youtube_api_key = get_config("youtube_api_key", "")
            youtube_data = get_client_youtube_stats(
                channel_id=client.youtube_channel_id,
                api_key=youtube_api_key,
                month=data.month,
                year=data.year
            )

        # Fetch combined deduplicated metrics
        combined_metrics = {
            "total_reach": 0,
            "paid_reach": 0,
            "organic_reach": 0,
            "total_impressions": 0,
            "paid_impressions": 0,
            "organic_impressions": 0
        }
        if client.ad_account_id and (client.fb_page_token or client.ig_access_token):
            try:
                month_map = {
                    "January": 1, "February": 2, "March": 3, "April": 4,
                    "May": 5, "June": 6, "July": 7, "August": 8,
                    "September": 9, "October": 10, "November": 11, "December": 12
                }
                month_num = month_map.get(data.month, 1)
                from facebook import fetch_combined_deduplicated_metrics
                combined_metrics = fetch_combined_deduplicated_metrics(
                    client.ad_account_id, client.fb_page_token or client.ig_access_token, month_num, int(data.year)
                )
            except Exception as e:
                print("Failed to fetch combined metrics during report generation:", e)

        # Build report_data dict for synopsis + storage
        report_data = {
            "client_name": client.name,
            "month": data.month,
            "year": data.year,
        }

        # Generate AI synopsis (pass both platforms for cross-platform intelligence)
        synopsis = generate_synopsis(report_data, instagram_data, facebook_data)

        # Generate bento HTML
        report_id = str(uuid.uuid4())[:8]
        report_data["report_id"] = report_id

        html = generate_report_html(report_data, instagram_data, synopsis, client.brand_color)

        # Save to DB
        report = Report(
            id=report_id,
            client_id=client.id,
            month=data.month,
            year=data.year,
            html_content=html,
            ig_data={
                "platforms": {
                    "instagram": instagram_data,
                    "facebook": facebook_data,
                    "youtube": youtube_data
                },
                "instagram_data": {k: v for k, v in instagram_data.items() if k != "posts"}, # Legacy
                "posts": instagram_data.get("posts", []), # Legacy
                "synopsis": synopsis,
                "combined": {
                    "total_reach": combined_metrics["total_reach"],
                    "paid_reach": combined_metrics["paid_reach"],
                    "organic_reach": combined_metrics["organic_reach"],
                    "total_impressions": combined_metrics["total_impressions"],
                    "paid_impressions": combined_metrics["paid_impressions"],
                    "organic_impressions": combined_metrics["organic_impressions"],
                    "total_followers": (instagram_data.get("followers") or 0) + (facebook_data.get("followers") or 0)
                }
            }
        )
        db.add(report)
        db.commit()

        # ── Auto-save analytics snapshots for predictive intelligence ──
        try:
            from database import AnalyticsSnapshot
            if instagram_data.get("status") != "error":
                snap_ig = AnalyticsSnapshot(
                    client_id=client.id,
                    report_id=report_id,
                    month=data.month,
                    year=data.year,
                    platform="instagram",
                    followers=int(instagram_data.get("followers", 0) or 0),
                    total_reach=int(instagram_data.get("total_reach", 0) or 0),
                    total_impressions=int(instagram_data.get("total_impressions", 0) or 0),
                    engagement_rate=float(str(instagram_data.get("engagement_rate", 0)).replace("%", "") or 0),
                    total_likes=int(instagram_data.get("total_likes", 0) or 0),
                    total_comments=int(instagram_data.get("total_comments", 0) or 0),
                    total_saves=int(instagram_data.get("total_saves", 0) or 0),
                    post_count=int(instagram_data.get("total_posts", 0) or len(instagram_data.get("posts", []))),
                )
                db.add(snap_ig)
                
            if facebook_data.get("status") == "success":
                snap_fb = AnalyticsSnapshot(
                    client_id=client.id,
                    report_id=report_id,
                    month=data.month,
                    year=data.year,
                    platform="facebook",
                    followers=int(facebook_data.get("followers", 0) or 0),
                    total_reach=int(facebook_data.get("total_reach", 0) or 0),
                    total_impressions=int(facebook_data.get("total_impressions", 0) or 0),
                    engagement_rate=float(str(facebook_data.get("engagement_rate", 0)).replace("%", "") or 0),
                    total_likes=int(facebook_data.get("total_likes", 0) or 0),
                    total_comments=int(facebook_data.get("total_comments", 0) or 0),
                    total_saves=int(facebook_data.get("total_saves", 0) or 0),
                    post_count=int(facebook_data.get("total_posts", 0) or len(facebook_data.get("posts", []))),
                )
                db.add(snap_fb)
                
            db.commit()
        except Exception as snap_err:
            print(f"[Snapshot] Failed to save analytics snapshots: {snap_err}")

        return {
            "success": True,
            "report_id": report_id,
            "report_url": f"/report/{report_id}",
            "client": client.name,
            "stats": {
                "total_posts": instagram_data.get("total_posts", 0),
                "active_days": len(instagram_data.get("active_days", [])),
                "total_reach": instagram_data.get("total_reach"),
                "engagement_rate": instagram_data.get("engagement_rate"),
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


# ── AI CHAT ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    history: List[dict] = []
    context: Optional[str] = None
    platform_data: Optional[dict] = None

@router_v3.post("/reports/{report_id}/chat")
def report_chat(
    report_id: str,
    req: ChatRequest,
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    try:
        ig = req.platform_data if req.platform_data else (report.ig_data or {})
        client_rec = db.query(Client).filter(Client.id == report.client_id).first()
        
        report_data = {
            "client_name": client_rec.name if client_rec else "this brand",
            "month": report.month,
            "year": report.year,
        }
        
        answer = chat_with_report(req.question, report_data, ig, req.history, req.context)
        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


# ── INSTAGRAM PREVIEW ───────────────────────────────────

@router_v3.get("/clients/{client_id}/instagram-preview")
def instagram_preview(
    client_id: str,
    month: str,
    year: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")

    # 🎯 ONE LINE FIX: Using the smart function here too!
    client_keys = {
        "ig_access_token": client.ig_access_token,
        "ig_account_id": client.ig_user_id,
        "ad_account_id": client.ad_account_id,
        "instagram_handle": client.instagram_handle or "demo",
        "fb_page_id": client.fb_page_id,
        "fb_page_token": client.fb_page_token,
        "x_user_id": client.x_user_id,
        "x_token": client.x_token,
        "client_id": client.id,
    }
    data = get_client_instagram_stats(client_keys)

    return {
        "total_posts": data.get("total_posts", 0),
        "active_days": data.get("active_days", []),
        "total_reach": data.get("total_reach", "0"),
        "engagement_rate": data.get("engagement_rate", "0%"),
        "sample_posts": data.get("posts", [])[:3],
    }

# ── FACEBOOK LIVE INSIGHTS (FOR TAB) ────────────────────

@router_v3.get("/facebook/insights")
def get_facebook_insights_tab(
    client_id: str,
    month: str = None,
    year: str = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Live Facebook analytics for the dashboard tab — same pipeline as report generation."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")

    if not client.fb_page_id or not client.fb_page_token:
        return {"platform": "facebook", "status": "not_connected", "error": "Facebook not connected."}

    from datetime import datetime
    now = datetime.now()
    target_month = month or str(now.month)
    target_year = year or str(now.year)

    client_keys = {
        "fb_page_id": client.fb_page_id,
        "fb_page_token": client.fb_page_token,
        "ad_account_id": client.ad_account_id,
        "client_id": client.id,
    }
    fb_data = get_client_facebook_stats(client_keys, month=target_month, year=target_year)
    
    # Fetch combined deduplicated metrics
    combined_metrics = {
        "total_reach": 0,
        "paid_reach": 0,
        "organic_reach": 0,
        "total_impressions": 0,
        "paid_impressions": 0,
        "organic_impressions": 0
    }
    if client.ad_account_id and (client.fb_page_token or client.ig_access_token):
        try:
            from facebook import fetch_combined_deduplicated_metrics
            combined_metrics = fetch_combined_deduplicated_metrics(
                client.ad_account_id, client.fb_page_token or client.ig_access_token, int(target_month), int(target_year)
            )
        except Exception as e:
            print("Failed to fetch combined metrics for facebook insights:", e)
            
    fb_data["combined"] = combined_metrics
    return fb_data
# ── GET ALL REPORTS (THE ARCHIVE) ────────────────────────

@router_v3.get("/reports")
def get_all_reports(db: Session = Depends(get_db)):
    """Fetches a list of all generated reports from the database vault."""
    try:
        # Fetch all reports and grab the client name for the UI
        reports = db.query(Report).all()
        
        archive_list = []
        for r in reports:
            client = db.query(Client).filter(Client.id == r.client_id).first()
            archive_list.append({
                "id": r.id,
                "client_id": r.client_id,
                "client_name": client.name if client else "Unknown Client",
                "month": r.month,
                "year": r.year,
            })
            
        # Reverse the list so the newest reports are at the top!
        return {"success": True, "reports": archive_list[::-1]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch archive: {str(e)}")
    
# ── GET SINGLE REPORT (VIEWER) ──────────────────────────

@router_v3.get("/reports/{report_id}")
def get_single_report(report_id: str, db: Session = Depends(get_db)):
    """Fetches the exact HTML of a specific report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found in vault")
        
    return {
        "success": True,
        "html_content": report.html_content,
        "month": report.month,
        "year": report.year
    }

@router_v3.get("/clients/{client_id}/analytics")

# Debug endpoint to inspect stored Facebook data
@router_v3.get("/debug/client/{client_id}/facebook-data")

def debug_client_facebook_data(client_id: str, month: str = None, year: str = None, db: Session = Depends(get_db)):
    from datetime import datetime
    from facebook import get_client_facebook_stats
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    stored = client.facebook_data or {}
    live = {}
    if client.fb_page_id and client.fb_page_token:
        try:
            live = get_client_facebook_stats(
                {
                    "fb_page_id": client.fb_page_id,
                    "fb_page_token": client.fb_page_token,
                    "ad_account_id": client.ad_account_id or "",
                },
                month=month or str(datetime.utcnow().month),
                year=year or str(datetime.utcnow().year),
            )
        except Exception as e:
            print(f"[DEBUG] Failed to fetch live Facebook data: {e}")
    return {
        "stored": stored,
        "live": live,
        "merged": {**stored, **live}
    }

def get_client_analytics(client_id: str, month: str = None, year: str = None, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    
    from datetime import datetime
    now = datetime.now()
    target_month = month or str(now.month)
    target_year = year or str(now.year)
    
    keys = {
        "ig_access_token": client.ig_access_token,
        "ig_account_id": client.ig_user_id,
        "ad_account_id": client.ad_account_id,
        "instagram_handle": client.instagram_handle or "",
        "fb_page_id": client.fb_page_id,
        "fb_page_token": client.fb_page_token,
        "client_id": client.id,
    }
    
    ig_data = get_client_instagram_stats(keys, month=target_month, year=target_year)
    
    print(f"🔵 FB keys: page_id={keys.get('fb_page_id')}, has_token={bool(keys.get('fb_page_token'))}")
    fb_data = get_client_facebook_stats(keys, month=target_month, year=target_year)
    print(f"🔵 FB result: {fb_data.get('status')} - {fb_data.get('error', 'ok')}")
    
    combined_followers = (ig_data.get("followers") or 0) + (fb_data.get("followers") or 0)
    
    combined_metrics = {
        "total_reach": 0,
        "paid_reach": 0,
        "organic_reach": 0,
        "total_impressions": 0,
        "paid_impressions": 0,
        "organic_impressions": 0
    }
    if client.ad_account_id and (client.fb_page_token or client.ig_access_token):
        try:
            from facebook import fetch_combined_deduplicated_metrics
            combined_metrics = fetch_combined_deduplicated_metrics(
                client.ad_account_id, client.fb_page_token or client.ig_access_token, int(target_month), int(target_year)
            )
        except Exception as e:
            print("Failed to fetch combined metrics for analytics:", e)
            
    combined_info = {
        "total_followers": combined_followers,
        "platforms_connected": [p for p, d in [("instagram", ig_data), ("facebook", fb_data)] if d.get("status") == "success"]
    }
    combined_info.update(combined_metrics)

    return {
        "client_name": client.name,
        "month": target_month,
        "year": target_year,
        "instagram": ig_data,
        "facebook": fb_data,
        "combined": combined_info
    }


# ── DOWNLOAD REPORT PDF ──────────────────────────

@router_v3.get("/reports/{report_id}/download-pdf")
def download_report_pdf(
    report_id: str,
    background_tasks: BackgroundTasks,
    current_user: AuthIdentity = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches all raw metrics for the month, calculates brand health/gauges, maps schemas, and returns a high-fidelity PDF."""
    # 1. Fetch active report
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found in vault")
        
    # Check tenant access (clients can only view their own reports)
    if current_user.role == "client" and current_user.client_id != report.client_id:
        raise HTTPException(status_code=403, detail="Forbidden: Access to another tenant's report is denied.")
        
    # 2. Fetch Client
    client = db.query(Client).filter(Client.id == report.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    # 3. Extract Platform Stats
    ig_raw = report.ig_data
    print(f"[PDF DEBUG] Raw ig_data type: {type(ig_raw)}")
    print(f"[PDF DEBUG] Raw ig_data: {ig_raw}")
    if isinstance(ig_raw, str):
        ig_raw = json.loads(ig_raw)
        print(f"[PDF DEBUG] After json.loads: {ig_raw}")
    
    # Handle both data formats:
    # New format: {"platforms": {"instagram": {...}, "facebook": {...}, ...}}
    # Old format: {"instagram": {...}, "facebook": {...}, "synopsis": "...", ...}
    platforms = ig_raw.get("platforms", {})
    if platforms:  # New format
        instagram_data = platforms.get("instagram", {})
        facebook_data = platforms.get("facebook", {})
    else:  # Old format
        instagram_data = ig_raw.get("instagram", {})
        facebook_data = ig_raw.get("facebook", {})
    
    synopsis = ig_raw.get("synopsis", "")
    print(f"[PDF DEBUG] platforms: {platforms}")
    print(f"[PDF DEBUG] instagram_data extracted: {instagram_data}")
    print(f"[PDF DEBUG] facebook_data extracted: {facebook_data}")
    print(f"[PDF DEBUG] synopsis: {synopsis}")

    # 4a. Fetch live Facebook data (like client portal does)
    if client.fb_page_id and client.fb_page_token:
        try:
            month_map = {
                "January": 1, "February": 2, "March": 3, "April": 4,
                "May": 5, "June": 6, "July": 7, "August": 8,
                "September": 9, "October": 10, "November": 11, "December": 12
            }
            month_num = month_map.get(report.month, 1)
            live_fb_data = get_client_facebook_stats(
                {
                    "fb_page_id": client.fb_page_id,
                    "fb_page_token": client.fb_page_token,
                    "ad_account_id": client.ad_account_id or "",
                },
                month=month_num,
                year=report.year,
            )
            if live_fb_data and live_fb_data.get("status") == "success":
                facebook_data.update(live_fb_data)
                facebook_data["posts"] = live_fb_data.get("posts", []) or facebook_data.get("posts", [])
                facebook_data["active_days"] = live_fb_data.get("active_days", []) or facebook_data.get("active_days", [])
                facebook_data["weekly_posts"] = live_fb_data.get("weekly_posts", []) or facebook_data.get("weekly_posts", [])
                facebook_data["type_counts"] = live_fb_data.get("type_counts", {}) or facebook_data.get("type_counts", {})
                print(f"[PDF DEBUG] Merged live Facebook data: total_reach={facebook_data.get('total_reach')}, total_impressions={facebook_data.get('total_impressions')}, total_posts={facebook_data.get('total_posts')}")
            else:
                print(f"[PDF DEBUG] Live Facebook data not available or error: {live_fb_data}")
        except Exception as e:
            print(f"[PDF DEBUG] Failed to fetch live Facebook data: {e}")
        else:
            print(f"[PDF DEBUG] No Facebook credentials configured for client {client.id}")
        # Normalize Facebook metrics for PDF rendering (expected keys in the template)
        # The PDF template reads fb_page_reach, fb_impressions, fb_reactions, fb_comments, fb_shares, fb_followers, fb_engagement, fb_posts
        facebook_data['page_reach'] = facebook_data.get('total_reach') or 0
        facebook_data['impressions'] = facebook_data.get('total_impressions') or 0
        facebook_data['page_likes'] = facebook_data.get('total_likes') or 0
        facebook_data['page_comments'] = facebook_data.get('total_comments') or 0
        facebook_data['page_shares'] = facebook_data.get('total_shares') or 0
        facebook_data['page_saves'] = facebook_data.get('total_saves') or 0
        # Map total_reactions/total_likes to 'reactions' for PDF template
        facebook_data['reactions'] = facebook_data.get('total_reactions') or facebook_data.get('total_likes') or 0
        facebook_data['comments'] = facebook_data.get('total_comments') or 0
        facebook_data['shares'] = facebook_data.get('total_shares') or 0
        # Ensure followers and engagement_rate are preserved from live data
        # (they come from live_fb_data via facebook_data.update(live_fb_data))
        # Normalize total post count for Facebook (PDF expects a numeric value)
        facebook_data['posts'] = len(facebook_data.get('posts', [])) if isinstance(facebook_data.get('posts'), list) else 0
        # Map Facebook type_counts to template expected format (Photos, Video / Reels, Link Shares)
        fb_type_counts = facebook_data.get('type_counts', {})
        if fb_type_counts:
            mapped_type_counts = {
                'Photos': fb_type_counts.get('IMAGE', 0) + fb_type_counts.get('CAROUSEL_ALBUM', 0),
                'Video / Reels': fb_type_counts.get('VIDEO', 0),
                'Link Shares': fb_type_counts.get('LINK', 0) + fb_type_counts.get('LINK_SHARE', 0)
            }
            # Remove zero entries
            facebook_data['type_counts'] = {k: v for k, v in mapped_type_counts.items() if v > 0}
            if not facebook_data['type_counts']:
                facebook_data['type_counts'] = {'Photos': 0, 'Video / Reels': 0, 'Link Shares': 0}
        
        # 5. Resolve Previous Report for MoM comparisons in Brand Health
        def get_previous_month_year(month_name: str, year_str: str):
            months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ]
            try:
                idx = months.index(month_name)
                if idx == 0:
                    return months[11], str(int(year_str) - 1)
                else:
                    return months[idx - 1], year_str
            except ValueError:
                return None, None

    prev_month, prev_year = get_previous_month_year(report.month, report.year)
    prev_report = None
    if prev_month and prev_year:
        prev_report = db.query(Report).filter(
            Report.client_id == report.client_id,
            Report.month == prev_month,
            Report.year == prev_year
        ).first()

    prev_ig = {}
    if prev_report:
        prev_raw = prev_report.ig_data
        if isinstance(prev_raw, str):
            prev_raw = json.loads(prev_raw)
        prev_ig = prev_raw.get("platforms", {}).get("instagram", {}) if "platforms" in prev_raw else prev_raw.get("instagram", prev_raw)

    # 5. Calculate Brand Health and Gauges
    from services.brand_health import compute_brand_health
    from services.gauge_engine import compute_gauges
    from database import ContentCalendar
    
    bh_result = compute_brand_health(instagram_data, platform="instagram", prev_data=prev_ig)
    
    cal_count = db.query(ContentCalendar).filter(ContentCalendar.client_id == report.client_id).count()
    gauge_result = compute_gauges(platform_data=instagram_data, prev_data=prev_ig, cal_count=cal_count, platform="instagram")
    gauges = gauge_result.get("gauges", {})
    
    # 6. Fetch & Map Monthly SEO Report
    from database import MonthlySEOReport
    seo_report = db.query(MonthlySEOReport).filter(
        MonthlySEOReport.client_id == report.client_id,
        MonthlySEOReport.month == report.month,
        MonthlySEOReport.year == report.year
    ).first()
    
    seo_metrics = seo_report.seo_metrics if seo_report else {}
    
    # Map keyword rankings to target_keywords
    target_keywords = []
    if seo_metrics and "keyword_rankings" in seo_metrics:
        for r in seo_metrics["keyword_rankings"]:
            target_keywords.append({
                "keyword": r.get("keyword", ""),
                "rank": f"Pos #{r.get('position', '—')}",
                "trend": r.get("change", "0")
            })
            
    # Map search trends to visits_trend
    visits_trend = []
    if seo_metrics and "search_trends" in seo_metrics:
        for t in seo_metrics["search_trends"]:
            visits_trend.append({
                "visits": t.get("clicks", 0),
                "month": t.get("date", "")
            })
            
    # Calculate SEO Score using same logic as frontend
    def calculate_seo_score_backend(m: dict) -> int:
        if not m: return 0
        score = 50
        ctr = m.get("ctr", 0)
        if ctr > 5: score += 15
        elif ctr > 2: score += 10
        elif ctr > 0: score += 5
        
        br = m.get("bounce_rate", 0)
        if 0 < br < 50: score += 15
        elif 50 <= br < 70: score += 10
        elif br >= 70: score += 5
        
        pos = m.get("avg_position", 0)
        if 0 < pos < 5: score += 10
        elif 5 <= pos < 15: score += 5
        
        imp = m.get("impressions", 0)
        if imp > 50000: score += 10
        elif imp > 10000: score += 5
        
        sess = m.get("sessions", 0)
        if sess > 10000: score += 10
        elif sess > 1000: score += 5
        return min(100, max(0, int(round(score))))

    # Fetch Blogs from ClientBlog table
    from database import ClientBlog
    from sqlalchemy import and_, extract
    months = {
        "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
        "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
    }
    month_idx = list(months.keys()).index(report.month) + 1 if report.month in months else 0
    year_int = int(report.year)
    blogs = db.query(ClientBlog).filter(
        and_(
            ClientBlog.client_id == report.client_id,
            ClientBlog.published_at.isnot(None),
            extract('month', ClientBlog.published_at) == month_idx,
            extract('year', ClientBlog.published_at) == year_int,
        )
    ).all()
    
    blog_posts_list = [{
        "title": b.title,
        "excerpt": b.excerpt or "",
        "date": b.created_at.strftime("%Y-%m-%d") if b.created_at else ""
    } for b in blogs]
    
    seo_data_mapped = {
        "website_visits": seo_metrics.get("sessions", "N/A"),
        "seo_score": calculate_seo_score_backend(seo_metrics),
        "blog_posts_list": blog_posts_list,
        "blog_posts": len(blog_posts_list),
        "impressions": seo_metrics.get("impressions", "N/A"),
        "clicks": seo_metrics.get("clicks", "N/A"),
        "avg_position": seo_metrics.get("avg_position", "N/A"),
        "bounce_rate": seo_metrics.get("bounce_rate", "N/A"),
        "target_keywords": target_keywords,
        "unique_users": seo_metrics.get("users", 0),
        "key_conversions": seo_metrics.get("key_events", 0),
        "visits_trend": visits_trend
    }
    
    # 7. Assemble Report Data Mapped
    # Resolve growth MoM stats
    growth_reach = "Stable"
    if prev_ig and instagram_data:
        p_reach = prev_ig.get("total_reach", 0) or 0
        c_reach = instagram_data.get("total_reach", 0) or 0
        if p_reach > 0:
            diff = ((c_reach - p_reach) / p_reach) * 100
            growth_reach = f"{diff:+.1f}% MoM"

    # AI performance observations
    ai_perf_obs = f"Engagement rate is {instagram_data.get('engagement_rate', '0%')}, which represents healthy audience activity relative to follower tier."
    ai_format_obs = "Video content continues to perform strongly across key interaction metrics."
    ai_cadence_obs = f"Active days: {len(instagram_data.get('active_days', []))} days registered this cycle."
    strategic_forecast = "Leaning into video reels and high-interest carousels is projected to lift organic brand reach."
    recommendations = []
    
    from insight_engine import generate_insights
    insights = generate_insights(instagram_data, growth={"reach": 0, "followers": 0, "engagement": 0, "has_previous": bool(prev_ig)}, month=report.month, year=report.year)
    if insights:
        recommendations = [ins for ins in insights[:5]]
        
    report_data_mapped = {
        "client_name": client.name,
        "month": report.month,
        "year": report.year,
        "brand_health_index": bh_result.score,
        "audience_growth": bh_result.metadata.get("has_prev_data", False) and f"{instagram_data.get('followers', 0) - prev_ig.get('followers', 0):+d}" or "Stable",
        "reach_acceleration": growth_reach,
        "engagement_energy_label": bh_result.label,
        "market_percentile": "Top 15%",
        "interaction_energy": gauges.get("engagement_quality", 70.0),
        "consistency_index": gauges.get("content_consistency", 70.0),
        "reach_efficiency": gauges.get("reach_efficiency", 70.0),
        "virality_factor": gauges.get("virality_potential", 70.0),
        "ai_perf_observation": ai_perf_obs,
        "ai_format_observation": ai_format_obs,
        "ai_cadence_observation": ai_cadence_obs,
        "strategic_forecast": strategic_forecast,
        "recommendations": recommendations,
        "action_steps": recommendations[:3] if len(recommendations) >= 3 else ["Create structured campaign around core keywords"],
        "next_reach_proj": "+12.4% Projected",
        "next_engagement_proj": "+8.5% Projected",
        "next_conversion_proj": "+15.0% Projected"
    }

    # 8. Render to PDF
    from pdf_generator import generate_pdf_html, generate_pdf_from_html
    
    try:
        # Get brand color
        brand_color = client.brand_color or "#c8922a"
        
        # Debug: Print what data we have
        print(f"[PDF DEBUG] report_data_mapped keys: {list(report_data_mapped.keys()) if report_data_mapped else 'None'}")
        print(f"[PDF DEBUG] instagram_data: {instagram_data}")
        print(f"[PDF DEBUG] facebook_data: {facebook_data}")
        print(f"[PDF DEBUG] seo_data_mapped: {seo_data_mapped}")
        print(f"[PDF DEBUG] synopsis length: {len(synopsis) if synopsis else 0}")
        print(f"[PDF DEBUG] brand_color: {brand_color}")
        
        html_content = generate_pdf_html(
            report_data=report_data_mapped,
            instagram_data=instagram_data,
            synopsis=synopsis,
            seo_data=seo_data_mapped,
            facebook_data=facebook_data,
            brand_color=brand_color
        )
        
        temp_dir = "backend/uploads/temp_pdf"
        os.makedirs(temp_dir, exist_ok=True)
        temp_pdf_path = os.path.join(temp_dir, f"{report_id}.pdf")
        
        generate_pdf_from_html(html_content, temp_pdf_path)
        
        # Background cleanup task
        def remove_file(path: str):
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
                
        background_tasks.add_task(remove_file, temp_pdf_path)
        
        pdf_filename = f"{client.name.replace(' ', '_')}_Report_{report.month}_{report.year}.pdf"
        
        return FileResponse(
            path=temp_pdf_path,
            filename=pdf_filename,
            media_type="application/pdf"
        )
    except Exception as e:
        import traceback
        print(f"[PDF ERROR] {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")