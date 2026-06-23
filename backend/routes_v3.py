"""
New routes for v3:
- POST /api/reports/generate-from-instagram  ← replaces PDF upload
- POST /api/reports/{id}/chat                ← AI chat
- GET  /api/clients/{id}/instagram-preview   ← preview before generating
All existing v2 routes remain.
"""
import uuid, json, os, psutil
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
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
    from auth import verify_password
    if not verify_password(req.password, user.hashed_pw):
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
        month_map = {
            "January": 1, "February": 2, "March": 3, "April": 4,
            "May": 5, "June": 6, "July": 7, "August": 8,
            "September": 9, "October": 10, "November": 11, "December": 12
        }
        month_num = month_map.get(data.month, 1)
        year_num = int(data.year)

        instagram_data = get_client_instagram_stats(client_keys, month=month_num, year=year_num)
        
        facebook_data = {}
        if client.fb_page_id and client.fb_page_token:
            facebook_data = get_client_facebook_stats(client_keys, month=month_num, year=year_num)


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
                from facebook import fetch_combined_deduplicated_metrics
                combined_metrics = fetch_combined_deduplicated_metrics(
                    client.ad_account_id, client.fb_page_token or client.ig_access_token, month_num, year_num
                )
            except Exception as e:
                print("Failed to fetch combined metrics during report generation:", e)
        # Cache post thumbnails to avoid CORS/expiration issues
        try:
            from services.thumbnail_cache import cache_platform_thumbnails
            if instagram_data:
                cache_platform_thumbnails(client.id, instagram_data)
            if facebook_data:
                cache_platform_thumbnails(client.id, facebook_data)
        except Exception as cache_err:
            print("Failed to cache post thumbnails:", cache_err)

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

        # Save to DB (slim storage to avoid 19MB blobs)
        raw_ig_data = {
            "platforms": {
                "instagram": instagram_data,
                "facebook": facebook_data,
                "youtube": youtube_data
            },
            "instagram_data": {k: v for k, v in instagram_data.items() if k != "posts"},
            "posts": instagram_data.get("posts", []),
            "synopsis": synopsis,
            "combined": {
                "total_reach": combined_metrics["total_reach"],
                "paid_reach": combined_metrics["paid_reach"],
                "organic_reach": combined_metrics["organic_reach"],
                "total_impressions": combined_metrics["total_impressions"],
                "paid_impressions": combined_metrics["paid_impressions"],
                "organic_impressions": combined_metrics["organic_impressions"],
                "total_followers": int(instagram_data.get("followers") or 0) + int(facebook_data.get("followers") or 0)
            }
        }

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
                    "total_followers": int(instagram_data.get("followers") or 0) + int(facebook_data.get("followers") or 0)
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
                    engagement_rate=float(str(instagram_data.get("engagement_rate") or 0).replace("%", "") or 0),
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
                    engagement_rate=float(str(facebook_data.get("engagement_rate") or 0).replace("%", "") or 0),
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
    import time
    from services.egress_logger import log_egress
    start_time = time.time()
    
    try:
        # Fetch only required fields from Report to avoid pulling HTML blobs
        reports = db.query(Report.id, Report.client_id, Report.month, Report.year).all()
        
        # Pre-fetch client names mapping to avoid N+1 queries
        clients = db.query(Client.id, Client.name).all()
        client_name_map = {c.id: c.name for c in clients}
        
        archive_list = []
        for r in reports:
            archive_list.append({
                "id": r.id,
                "client_id": r.client_id,
                "client_name": client_name_map.get(r.client_id, "Unknown Client"),
                "month": r.month,
                "year": r.year,
            })
            
        # Reverse the list so the newest reports are at the top!
        result = {"success": True, "reports": archive_list[::-1]}
        
        log_egress("GET /api/v3/reports", start_time, len(reports), result)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch archive: {str(e)}")
    
# Deprecated duplicate get_single_report endpoint removed. Handled by backend/main.py.

@router_v3.get("/clients/{client_id}/analytics")
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

    from database import AnalyticsSnapshot
    snapshots = db.query(AnalyticsSnapshot).filter(AnalyticsSnapshot.client_id == client_id).order_by(AnalyticsSnapshot.created_at.desc()).all()
    historical = []
    for s in snapshots:
        historical.append({
            "month": s.month,
            "year": s.year,
            "platform": s.platform,
            "followers": s.followers,
            "reach": s.total_reach,
            "engagement_rate": s.engagement_rate,
        })

    return {
        "client_name": client.name,
        "month": target_month,
        "year": target_year,
        "instagram": ig_data,
        "facebook": fb_data,
        "combined": combined_info,
        "historical_snapshots": historical
    }


# Debug endpoint to inspect stored Facebook data
@router_v3.get("/debug/client/{client_id}/facebook-data")
def debug_client_facebook_data(client_id: str, month: str = None, year: str = None, db: Session = Depends(get_db)):
    from datetime import datetime
    from facebook import get_client_facebook_stats
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Using fb_page_id as a proxy to test since facebook_data might not exist
    stored = getattr(client, 'facebook_data', {}) 
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

# ── AD PERFORMANCE DASHBOARD ─────────────────────────────

from services.meta_ads import sync_campaign_metrics_for_client
from database import CampaignMetric

@router_v3.get("/clients/{client_id}/ad-performance")
def get_ad_performance(
    client_id: str,
    start: str = None,
    end: str = None,
    db: Session = Depends(get_db)
):
    import time
    from datetime import datetime, timedelta
    from services.egress_logger import log_egress
    from database import AdBudget
    start_time = time.time()
    
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")

    MONTH_NAMES = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    def _parse_month_year_local(m: str):
        parts = m.strip().split()
        if len(parts) != 2:
            return None, None
        MONTH_NAMES_SHORT = {
            "jan": "January", "feb": "February", "mar": "March", "apr": "April",
            "may": "May", "jun": "June", "jul": "July", "aug": "August",
            "sep": "September", "oct": "October", "nov": "November", "dec": "December",
        }
        raw = parts[0]
        year = parts[1]
        if raw in MONTH_NAMES:
            return raw, year
        return MONTH_NAMES_SHORT.get(raw.lower(), raw), year

    start_date = None
    end_date = None
    month_param = None
    year_param = None

    if start:
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d").date()
            month_param = MONTH_NAMES[start_date.month - 1]
            year_param = str(start_date.year)
        except Exception as e:
            print("Failed to parse start date:", e)

    if end:
        try:
            end_date = datetime.strptime(end, "%Y-%m-%d").date()
        except Exception as e:
            print("Failed to parse end date:", e)

    # Filter campaign snapshots by the requested date range
    if start_date and end_date:
        metrics = db.query(CampaignMetric).filter(
            CampaignMetric.client_id == client_id,
            CampaignMetric.date >= start_date,
            CampaignMetric.date <= end_date
        ).all()
    else:
        today = datetime.utcnow().date()
        start_date = today.replace(day=1)
        end_date = today
        metrics = db.query(CampaignMetric).filter(
            CampaignMetric.client_id == client_id,
            CampaignMetric.date >= start_date,
            CampaignMetric.date <= end_date
        ).all()
        
    # Keep only the latest snapshot per campaign_id within the range
    seen = {}
    for m in sorted(metrics, key=lambda x: x.date):
        seen[m.campaign_id] = m
    campaigns = list(seen.values())

    
    total_spend = sum(c.spend for c in campaigns)
    total_reach = sum(c.reach for c in campaigns)
    total_clicks = sum(c.clicks for c in campaigns)
    # Only sum leads from actual lead-objective campaigns
    # For awareness/engagement/traffic, the leads_val holds reach/engagement — don't aggregate those
    LEAD_OBJECTIVES = {"OUTCOME_LEADS", "OUTCOME_CONVERSIONS", ""}
    total_leads = sum(
        c.leads for c in campaigns
        if getattr(c, "objective", "") in LEAD_OBJECTIVES
    )
    total_cpc = (total_spend / total_clicks) if total_clicks > 0 else 0
    total_cpl = (total_spend / total_leads) if total_leads > 0 else 0
    
    # Query budget from ad_budgets for target month, fallback to client.monthly_ad_budget
    budget = 0.0
    if month_param and year_param:
        budget_rows = db.query(AdBudget).filter(AdBudget.client_id == client_id).all()
        month_budgets = []
        for b in budget_rows:
            bm, by = _parse_month_year_local(b.month)
            if bm == month_param and by == year_param:
                month_budgets.append(b)
        if month_budgets:
            budget = sum(b.budget or 0.0 for b in month_budgets)
        else:
            budget = client.monthly_ad_budget or 0.0
    else:
        budget = client.monthly_ad_budget or 0.0

    remaining_budget = max(0.0, budget - total_spend)

    result = {
        "success": True,
        "budget": budget,
        "total_spend": total_spend,
        "remaining_budget": remaining_budget,
        "metrics": {
            "reach": total_reach,
            "clicks": total_clicks,
            "leads": total_leads,
            "cpc": round(total_cpc, 2),
            "cpl": round(total_cpl, 2),
        },
        "ad_account_error": client.ad_account_error,
        "campaigns": [
            {
                "campaign_id": c.campaign_id,
                "campaign_name": c.campaign_name,
                "spend": c.spend,
                "reach": c.reach,
                "impressions": c.impressions,
                "clicks": c.clicks,
                "ctr": round(c.ctr, 2),
                "cpc": round(c.cpc, 2),
                "leads": c.leads,
                "cpl": round(c.cpl, 2),
                "visits": c.visits,
                "likes": c.likes,
                "status": c.status,
                "date": str(c.date),
                "objective": c.objective or ""
            } for c in campaigns
        ]
    }
    log_egress(f"GET /api/v3/clients/{client_id}/ad-performance", start_time, len(campaigns), result)
    return result

class AdBudgetRequest(BaseModel):
    budget: float

@router_v3.post("/clients/{client_id}/ad-budget")
def update_ad_budget(client_id: str, req: AdBudgetRequest, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    
    client.monthly_ad_budget = req.budget
    db.commit()
    return {"success": True, "budget": client.monthly_ad_budget}

@router_v3.post("/clients/{client_id}/sync-ads")
def manual_sync_ads(client_id: str, start: str = None, end: str = None, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    
    success, msg = sync_campaign_metrics_for_client(client_id, db, start, end)
    return {"success": success, "message": msg}


