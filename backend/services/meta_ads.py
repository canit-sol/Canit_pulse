import requests
from datetime import datetime, date
from sqlalchemy.orm import Session
import uuid
import json

from database import Client, CampaignMetric

def get_action_value(actions_list, action_type):
    if not actions_list:
        return 0
    for action in actions_list:
        if action.get("action_type") == action_type:
            return int(action.get("value", 0))
    return 0

def sync_campaign_metrics_for_client(client_id: str, db: Session, start: str = None, end: str = None):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client or not client.ad_account_id:
        return False, "No ad account ID found for this client."

    token = client.fb_page_token or client.ig_access_token
    if not token:
        msg = "Missing Meta access token."
        client.ad_account_error = msg
        db.commit()
        return False, msg

    raw_act_id = client.ad_account_id.strip()
    act_id = raw_act_id if raw_act_id.startswith("act_") else f"act_{raw_act_id}"
    token = token.strip()

    if not start or not end:
        today_date = datetime.utcnow().date()
        start_date = today_date.replace(day=1)
        start = start_date.strftime("%Y-%m-%d")
        end = today_date.strftime("%Y-%m-%d")

    try:
        target_date = datetime.strptime(end, "%Y-%m-%d").date()
        start_date_obj = datetime.strptime(start, "%Y-%m-%d").date()
    except Exception:
        target_date = datetime.utcnow().date()
        start_date_obj = target_date.replace(day=1)

    time_range_param = json.dumps({"since": start, "until": end})

    # ── Step 1: Fetch insights for the date range ──────────────
    url = f"https://graph.facebook.com/v19.0/{act_id}/insights"
    params = {
        "access_token": token,
        "level": "campaign",
        "time_range": time_range_param,
        "fields": "campaign_id,campaign_name,spend,reach,impressions,clicks,cpc,ctr,actions,objective",
        "limit": 500
    }

    try:
        res = requests.get(url, params=params)
        data = res.json()

        if res.status_code != 200:
            error_msg = data.get("error", {}).get("message", f"Meta API Error (HTTP {res.status_code})")
            client.ad_account_error = error_msg
            db.commit()
            return False, error_msg

        if client.ad_account_error:
            client.ad_account_error = None
            db.commit()

        campaigns = data.get("data", [])

        # ── Step 2: Fetch status ONLY for campaigns returned by insights ──
        # Query each campaign individually to get its current status
        campaign_ids = [c["campaign_id"] for c in campaigns if "campaign_id" in c]
        status_map = {}

        if campaign_ids:
            # Batch fetch: comma-separated IDs using the batch endpoint
            # Fall back to per-campaign if batch fails
            try:
                ids_str = ",".join(campaign_ids)
                batch_url = f"https://graph.facebook.com/v19.0/"
                batch_params = {
                    "access_token": token,
                    "ids": ids_str,
                    "fields": "id,status,effective_status"
                }
                s_res = requests.get(batch_url, params=batch_params)
                if s_res.status_code == 200:
                    batch_data = s_res.json()
                    for c_id, c_info in batch_data.items():
                        # Use status (toggle) not effective_status (delivery state)
                        # effective_status can show ACTIVE for archived campaigns
                        status_map[c_id] = c_info.get("status") or c_info.get("effective_status") or "UNKNOWN"
            except Exception as e:
                print(f"[Ads Sync] Batch status fetch failed: {e}")

        # ── Step 3: Delete existing snapshot for this date range ──
        # Delete snapshots dated within the range, not just target_date,
        # so re-syncing a range fully replaces old data for that range
        db.query(CampaignMetric).filter(
            CampaignMetric.client_id == client_id,
            CampaignMetric.date >= start_date_obj,
            CampaignMetric.date <= target_date
        ).delete()
        db.commit()

        # ── Step 4: Write one snapshot per campaign dated at target_date ──
        for c in campaigns:
            c_id = c.get("campaign_id")
            actions = c.get("actions", [])

            spend_val       = float(c.get("spend", 0.0))
            reach_val       = int(c.get("reach", 0))
            impressions_val = int(c.get("impressions", 0))
            clicks_val      = int(c.get("clicks", 0))
            ctr_val         = float(c.get("ctr", 0.0))
            cpc_val         = float(c.get("cpc", 0.0))
            objective = c.get("objective", "")
            if objective == "OUTCOME_LEADS":
                leads_val = (
                    get_action_value(actions, "onsite_conversion.lead_grouped") or
                    get_action_value(actions, "lead") or
                    get_action_value(actions, "onsite_web_lead")
                )
            else:
                leads_val = 0  # Only lead-objective campaigns contribute to lead count
            visits_val      = get_action_value(actions, "landing_page_view") or get_action_value(actions, "link_click")
            likes_val       = get_action_value(actions, "like")
            cpl_val         = round(spend_val / leads_val, 2) if leads_val > 0 and spend_val > 0 else 0.0

            c_status = status_map.get(c_id, "UNKNOWN")
            c_objective = c.get("objective", "")

            db.add(CampaignMetric(
                id=str(uuid.uuid4()),
                client_id=client_id,
                campaign_id=c_id,
                campaign_name=c.get("campaign_name", "Unknown Campaign"),
                date=target_date,
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
                status=c_status,
                objective=c_objective
            ))

        db.commit()
        return True, f"Synced {len(campaigns)} campaigns for {start} → {end}."

    except Exception as e:
        error_msg = f"Internal Exception: {str(e)}"
        client.ad_account_error = error_msg
        db.commit()
        return False, error_msg


def sync_all_campaigns(db: Session):
    clients = db.query(Client).filter(Client.ad_account_id.isnot(None)).all()
    results = []
    for client in clients:
        success, msg = sync_campaign_metrics_for_client(client.id, db)
        results.append((client.name, success, msg))
        print(f"[Ads Sync] {client.name}: {msg}")
    return results
