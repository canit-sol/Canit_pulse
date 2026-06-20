import requests
from datetime import datetime, date
from sqlalchemy.orm import Session
import uuid

# To avoid circular imports, import models here
from database import Client, CampaignMetric

def get_action_value(actions_list, action_type):
    """Helper to extract specific action values like 'lead', 'onsite_conversion.post_save', etc."""
    if not actions_list:
        return 0
    for action in actions_list:
        if action.get("action_type") == action_type:
            return int(action.get("value", 0))
    return 0

def sync_campaign_metrics_for_client(client_id: str, db: Session, start: str = None, end: str = None):
    """
    Fetches the latest cumulative campaign metrics for a specific client
    and saves a daily snapshot in the campaign_metrics table.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client or not client.ad_account_id:
        return False, "No ad account ID found for this client."

    token = client.fb_page_token or client.ig_access_token
    if not token:
        msg = "Missing Meta access token."
        client.ad_account_error = msg
        db.commit()
        return False, msg

    # Strip any accidental whitespace from the database values
    raw_act_id = client.ad_account_id.strip()
    act_id = raw_act_id if raw_act_id.startswith("act_") else f"act_{raw_act_id}"
    token = token.strip()

    url = f"https://graph.facebook.com/v19.0/{act_id}/insights"
    
    # We fetch lifetime data to get the total cumulative metrics for the campaign up to today.
    # The dashboard will display these current totals.
    import json
    
    time_range_param = json.dumps({"since": start, "until": end}) if start and end else json.dumps({"since": "2026-01-01", "until": "2026-12-31"})

    params = {
        "access_token": token,
        "level": "campaign",
        "time_range": time_range_param,
        "fields": "campaign_id,campaign_name,spend,reach,impressions,clicks,cpc,ctr,actions"
    }

    try:
        res = requests.get(url, params=params)
        data = res.json()

        if res.status_code != 200:
            error_msg = data.get("error", {}).get("message", f"Unknown Meta API Error (HTTP {res.status_code})")
            client.ad_account_error = error_msg
            db.commit()
            return False, error_msg

        # If successful, clear any previous errors
        if client.ad_account_error:
            client.ad_account_error = None
            db.commit()

        campaigns = data.get("data", [])
        today = datetime.utcnow().date()
        
        # We also want to fetch campaign status (ACTIVE, PAUSED) which requires the /campaigns endpoint
        # Let's do a quick batch or separate request to get statuses for the active campaigns we found
        campaign_ids = [c["campaign_id"] for c in campaigns if "campaign_id" in c]
        status_map = {}
        if campaign_ids:
            # We can query the ad account's campaigns to get their statuses
            status_url = f"https://graph.facebook.com/v19.0/{act_id}/campaigns"
            status_params = {
                "access_token": token,
                "fields": "id,status",
                "limit": 100
            }
            try:
                s_res = requests.get(status_url, params=status_params)
                if s_res.status_code == 200:
                    for c_info in s_res.json().get("data", []):
                        status_map[c_info["id"]] = c_info.get("status", "UNKNOWN")
            except Exception as e:
                print("Failed to fetch statuses:", e)

        # Delete existing snapshot for today to prevent mixing campaigns from different time ranges
        db.query(CampaignMetric).filter(
            CampaignMetric.client_id == client_id,
            CampaignMetric.date == today
        ).delete()
        db.commit()

        for c in campaigns:
            c_id = c.get("campaign_id")
            
            # Find existing snapshot for today
            existing = db.query(CampaignMetric).filter(
                CampaignMetric.client_id == client_id,
                CampaignMetric.campaign_id == c_id,
                CampaignMetric.date == today
            ).first()

            actions = c.get("actions", [])
            
            # Action types map:
            # Leads: 'lead'
            # Page Likes: 'like'
            # Landing Page Views: 'landing_page_view'
            # Profile Visits (Instagram): 'onsite_conversion.post_save' (Proxy if standard doesn't exist) or 'profile_visit'
            
            spend_val = float(c.get("spend", 0.0))
            reach_val = int(c.get("reach", 0))
            impressions_val = int(c.get("impressions", 0))
            clicks_val = int(c.get("clicks", 0))
            ctr_val = float(c.get("ctr", 0.0))
            cpc_val = float(c.get("cpc", 0.0))
            
            leads_val = get_action_value(actions, "lead")
            visits_val = get_action_value(actions, "landing_page_view") + get_action_value(actions, "link_click") # Fallback to link_clicks if landing_page_view not available
            likes_val = get_action_value(actions, "like")
            
            # Calculate CPL
            cpl_val = 0.0
            if leads_val > 0 and spend_val > 0:
                cpl_val = spend_val / leads_val

            c_status = status_map.get(c_id, "ACTIVE")

            if existing:
                existing.spend = spend_val
                existing.reach = reach_val
                existing.impressions = impressions_val
                existing.clicks = clicks_val
                existing.ctr = ctr_val
                existing.cpc = cpc_val
                existing.leads = leads_val
                existing.cpl = cpl_val
                existing.visits = visits_val
                existing.likes = likes_val
                existing.status = c_status
            else:
                new_metric = CampaignMetric(
                    id=str(uuid.uuid4()),
                    client_id=client_id,
                    campaign_id=c_id,
                    campaign_name=c.get("campaign_name", "Unknown Campaign"),
                    date=today,
                    spend=spend_val,
                    reach=reach_val,
                    impressions=impressions_val,
                    clicks=clicks_val,
                    ctr=ctr_val,
                    cpc=cpc_val,
                    leads=leads_val,
                    cpl=cpl_val,
                    visits=visits_val,
                    likes=likes_val,
                    status=c_status
                )
                db.add(new_metric)
        
        db.commit()
        return True, f"Synced {len(campaigns)} campaigns successfully."

    except Exception as e:
        error_msg = f"Internal Exception: {str(e)}"
        client.ad_account_error = error_msg
        db.commit()
        return False, error_msg

def sync_all_campaigns(db: Session):
    """
    Called by the background scheduler to sync all clients with ad_account_id.
    """
    clients = db.query(Client).filter(Client.ad_account_id.isnot(None)).all()
    results = []
    for client in clients:
        success, msg = sync_campaign_metrics_for_client(client.id, db)
        results.append((client.name, success, msg))
        print(f"[Ads Sync] {client.name}: {msg}")
    return results
