import os
import requests
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
import uuid
import json

from database import Client, CampaignMetric, get_config

def get_google_ads_token():
    """Refresh the OAuth2 access token for Google Ads."""
    client_id = os.getenv("GOOGLE_ADS_CLIENT_ID") or get_config("GOOGLE_ADS_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_ADS_CLIENT_SECRET") or get_config("GOOGLE_ADS_CLIENT_SECRET")
    refresh_token = os.getenv("GOOGLE_ADS_REFRESH_TOKEN") or get_config("GOOGLE_ADS_REFRESH_TOKEN")
    
    if not (client_id and client_secret and refresh_token):
        return None
        
    url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }
    
    try:
        res = requests.post(url, data=data)
        if res.status_code == 200:
            return res.json().get("access_token")
    except Exception as e:
        print(f"[Google Ads] Failed to refresh token: {e}")
    return None

def sync_google_campaigns_for_client(client_id: str, db: Session, start: str = None, end: str = None):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        return False, "Client not found."
        
    customer_id = getattr(client, "google_ads_customer_id", None)
    
    # Parse dates
    if not start or not end:
        today_date = datetime.utcnow().date()
        start_date = today_date.replace(day=1)
        start = start_date.strftime("%Y-%m-%d")
        end = today_date.strftime("%Y-%m-%d")
    else:
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d").date()
            target_date = datetime.strptime(end, "%Y-%m-%d").date()
        except Exception:
            target_date = datetime.utcnow().date()
            start_date = target_date.replace(day=1)
            start = start_date.strftime("%Y-%m-%d")
            end = target_date.strftime("%Y-%m-%d")
            
    try:
        target_date = datetime.strptime(end, "%Y-%m-%d").date()
        start_date_obj = datetime.strptime(start, "%Y-%m-%d").date()
    except Exception:
        target_date = datetime.utcnow().date()
        start_date_obj = target_date.replace(day=1)

    # Clean range existing google snapshots
    db.query(CampaignMetric).filter(
        CampaignMetric.client_id == client_id,
        CampaignMetric.platform == "google",
        CampaignMetric.date >= start_date_obj,
        CampaignMetric.date <= target_date
    ).delete()
    db.commit()

    dev_token = os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN") or get_config("GOOGLE_ADS_DEVELOPER_TOKEN")
    access_token = get_google_ads_token() if dev_token else None

    # ── Fallback: Demo Mode (Mock data generation) ──
    if not customer_id or not dev_token or not access_token:
        print(f"[Google Ads] Generating mock data for {client.name} (Start: {start}, End: {end})")
        if "vs" in client.name.lower() or "hospital" in client.name.lower():
            if "2026-07" in start or "2026-07" in end:
                mock_campaigns = [
                    {
                        "campaign_id": "google_camp_1",
                        "campaign_name": "PMax - Oncology & Cancer Care",
                        "spend": 175000.0,
                        "reach": 510000,
                        "impressions": 510000,
                        "clicks": 22400,
                        "leads": 810,
                        "ctr": 4.39,
                        "cpc": 7.81,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_2",
                        "campaign_name": "Search - Emergency & Ambulance Care 24x7",
                        "spend": 138000.0,
                        "reach": 168000,
                        "impressions": 168000,
                        "clicks": 15600,
                        "leads": 660,
                        "ctr": 9.29,
                        "cpc": 8.85,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_3",
                        "campaign_name": "Search - Cardiology & Heart Surgery",
                        "spend": 120000.0,
                        "reach": 138000,
                        "impressions": 138000,
                        "clicks": 12900,
                        "leads": 560,
                        "ctr": 9.35,
                        "cpc": 9.30,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_4",
                        "campaign_name": "Search - Orthopedics & Joint Replacement",
                        "spend": 102000.0,
                        "reach": 122000,
                        "impressions": 122000,
                        "clicks": 11400,
                        "leads": 480,
                        "ctr": 9.34,
                        "cpc": 8.95,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_5",
                        "campaign_name": "PMax - Neurology & Spine Surgery",
                        "spend": 82000.0,
                        "reach": 205000,
                        "impressions": 205000,
                        "clicks": 9500,
                        "leads": 370,
                        "ctr": 4.63,
                        "cpc": 8.63,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_6",
                        "campaign_name": "Search - Nephrology & Dialysis Unit",
                        "spend": 58000.0,
                        "reach": 74000,
                        "impressions": 74000,
                        "clicks": 6700,
                        "leads": 275,
                        "ctr": 9.05,
                        "cpc": 8.66,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_7",
                        "campaign_name": "Search - Gastroenterology & Liver Clinic",
                        "spend": 50000.0,
                        "reach": 64000,
                        "impressions": 64000,
                        "clicks": 6000,
                        "leads": 240,
                        "ctr": 9.38,
                        "cpc": 8.33,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_8",
                        "campaign_name": "PMax - Multispecialty OPD Appointments",
                        "spend": 45000.0,
                        "reach": 155000,
                        "impressions": 155000,
                        "clicks": 7800,
                        "leads": 220,
                        "ctr": 5.03,
                        "cpc": 5.77,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_9",
                        "campaign_name": "Search - Urology & Robotic Surgery",
                        "spend": 40000.0,
                        "reach": 52000,
                        "impressions": 52000,
                        "clicks": 4600,
                        "leads": 190,
                        "ctr": 8.85,
                        "cpc": 8.70,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_10",
                        "campaign_name": "Search - Pulmonology & Chest Medicine",
                        "spend": 32000.0,
                        "reach": 41000,
                        "impressions": 41000,
                        "clicks": 3800,
                        "leads": 155,
                        "ctr": 9.27,
                        "cpc": 8.42,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_11",
                        "campaign_name": "Display - Health Checkup Packages",
                        "spend": 25000.0,
                        "reach": 430000,
                        "impressions": 430000,
                        "clicks": 13200,
                        "leads": 95,
                        "ctr": 3.07,
                        "cpc": 1.89,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    },
                    {
                        "campaign_id": "google_camp_12",
                        "campaign_name": "Display - Brand Awareness & Hospital Trust",
                        "spend": 18000.0,
                        "reach": 590000,
                        "impressions": 590000,
                        "clicks": 11700,
                        "leads": 40,
                        "ctr": 1.98,
                        "cpc": 1.54,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    },
                    {
                        "campaign_id": "google_camp_13",
                        "campaign_name": "Video - World Class Infrastructure & Tour",
                        "spend": 15000.0,
                        "reach": 260000,
                        "impressions": 260000,
                        "clicks": 6600,
                        "leads": 20,
                        "ctr": 2.54,
                        "cpc": 2.27,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    },
                    {
                        "campaign_id": "google_camp_14",
                        "campaign_name": "Search - Maternity & Pediatrics Care",
                        "spend": 18000.0,
                        "reach": 24000,
                        "impressions": 24000,
                        "clicks": 2300,
                        "leads": 85,
                        "ctr": 9.58,
                        "cpc": 7.83,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_15",
                        "campaign_name": "Search - Seasonal Dengue & Flu Awareness",
                        "spend": 7000.0,
                        "reach": 9800,
                        "impressions": 9800,
                        "clicks": 840,
                        "leads": 30,
                        "ctr": 8.57,
                        "cpc": 8.33,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    },
                    {
                        "campaign_id": "google_camp_16",
                        "campaign_name": "PMax - International Patient Help Desk",
                        "spend": 15000.0,
                        "reach": 36000,
                        "impressions": 36000,
                        "clicks": 1700,
                        "leads": 45,
                        "ctr": 4.72,
                        "cpc": 8.82,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    }
                ]
            else:
                mock_campaigns = [
                    {
                        "campaign_id": "google_camp_1",
                        "campaign_name": "PMax - Oncology & Cancer Care",
                        "spend": 145000.0,
                        "reach": 420000,
                        "impressions": 420000,
                        "clicks": 18400,
                        "leads": 680,
                        "ctr": 4.38,
                        "cpc": 7.88,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_2",
                        "campaign_name": "Search - Emergency & Ambulance Care 24x7",
                        "spend": 112000.0,
                        "reach": 138000,
                        "impressions": 138000,
                        "clicks": 12800,
                        "leads": 540,
                        "ctr": 9.28,
                        "cpc": 8.75,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_3",
                        "campaign_name": "Search - Cardiology & Heart Surgery",
                        "spend": 98000.0,
                        "reach": 115000,
                        "impressions": 115000,
                        "clicks": 10800,
                        "leads": 460,
                        "ctr": 9.39,
                        "cpc": 9.07,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_4",
                        "campaign_name": "Search - Orthopedics & Joint Replacement",
                        "spend": 85000.0,
                        "reach": 102000,
                        "impressions": 102000,
                        "clicks": 9600,
                        "leads": 410,
                        "ctr": 9.41,
                        "cpc": 8.85,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_5",
                        "campaign_name": "PMax - Neurology & Spine Surgery",
                        "spend": 68000.0,
                        "reach": 170000,
                        "impressions": 170000,
                        "clicks": 7900,
                        "leads": 310,
                        "ctr": 4.65,
                        "cpc": 8.61,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_6",
                        "campaign_name": "Search - Nephrology & Dialysis Unit",
                        "spend": 48000.0,
                        "reach": 62000,
                        "impressions": 62000,
                        "clicks": 5600,
                        "leads": 235,
                        "ctr": 9.03,
                        "cpc": 8.57,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_7",
                        "campaign_name": "Search - Gastroenterology & Liver Clinic",
                        "spend": 42000.0,
                        "reach": 55000,
                        "impressions": 55000,
                        "clicks": 5100,
                        "leads": 210,
                        "ctr": 9.27,
                        "cpc": 8.24,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_8",
                        "campaign_name": "PMax - Multispecialty OPD Appointments",
                        "spend": 38000.0,
                        "reach": 130000,
                        "impressions": 130000,
                        "clicks": 6500,
                        "leads": 190,
                        "ctr": 5.00,
                        "cpc": 5.85,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_9",
                        "campaign_name": "Search - Urology & Robotic Surgery",
                        "spend": 34000.0,
                        "reach": 44000,
                        "impressions": 44000,
                        "clicks": 3900,
                        "leads": 160,
                        "ctr": 8.86,
                        "cpc": 8.72,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_10",
                        "campaign_name": "Search - Pulmonology & Chest Medicine",
                        "spend": 28000.0,
                        "reach": 36000,
                        "impressions": 36000,
                        "clicks": 3400,
                        "leads": 135,
                        "ctr": 9.44,
                        "cpc": 8.24,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_11",
                        "campaign_name": "Display - Health Checkup Packages",
                        "spend": 22000.0,
                        "reach": 390000,
                        "impressions": 390000,
                        "clicks": 11800,
                        "leads": 85,
                        "ctr": 3.03,
                        "cpc": 1.86,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    },
                    {
                        "campaign_id": "google_camp_12",
                        "campaign_name": "Display - Brand Awareness & Hospital Trust",
                        "spend": 16000.0,
                        "reach": 520000,
                        "impressions": 520000,
                        "clicks": 10500,
                        "leads": 35,
                        "ctr": 2.02,
                        "cpc": 1.52,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    },
                    {
                        "campaign_id": "google_camp_13",
                        "campaign_name": "Video - World Class Infrastructure & Tour",
                        "spend": 12500.0,
                        "reach": 220000,
                        "impressions": 220000,
                        "clicks": 5600,
                        "leads": 15,
                        "ctr": 2.55,
                        "cpc": 2.23,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    },
                    {
                        "campaign_id": "google_camp_14",
                        "campaign_name": "Search - Maternity & Pediatrics Care",
                        "spend": 18200.0,
                        "reach": 24000,
                        "impressions": 24000,
                        "clicks": 2300,
                        "leads": 80,
                        "ctr": 9.58,
                        "cpc": 7.91,
                        "objective": "OUTCOME_LEADS",
                        "status": "ACTIVE"
                    },
                    {
                        "campaign_id": "google_camp_15",
                        "campaign_name": "Search - Seasonal Dengue & Flu Awareness",
                        "spend": 8500.0,
                        "reach": 11000,
                        "impressions": 11000,
                        "clicks": 920,
                        "leads": 35,
                        "ctr": 8.36,
                        "cpc": 9.24,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    },
                    {
                        "campaign_id": "google_camp_16",
                        "campaign_name": "PMax - International Patient Help Desk",
                        "spend": 14200.0,
                        "reach": 35000,
                        "impressions": 35000,
                        "clicks": 1600,
                        "leads": 42,
                        "ctr": 4.57,
                        "cpc": 8.88,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED"
                    }
                ]
            multiplier = 1.0
        else:
            mock_campaigns = [
                {
                    "campaign_id": "google_camp_1",
                    "campaign_name": "PMax - High Intent Leads",
                    "spend": 12500.0,
                    "reach": 25000,
                    "impressions": 48000,
                    "clicks": 1420,
                    "leads": 98,
                    "ctr": 2.96,
                    "cpc": 8.80,
                    "objective": "OUTCOME_LEADS",
                    "status": "ACTIVE"
                },
                {
                    "campaign_id": "google_camp_2",
                    "campaign_name": "Search - Brand Keywords",
                    "spend": 4500.0,
                    "reach": 8500,
                    "impressions": 12000,
                    "clicks": 950,
                    "leads": 32,
                    "ctr": 7.92,
                    "cpc": 4.74,
                    "objective": "OUTCOME_LEADS",
                    "status": "ACTIVE"
                },
                {
                    "campaign_id": "google_camp_3",
                    "campaign_name": "Display - Retargeting Audience",
                    "spend": 3200.0,
                    "reach": 115000,
                    "impressions": 180000,
                    "clicks": 2100,
                    "leads": 12,
                    "ctr": 1.17,
                    "cpc": 1.52,
                    "objective": "OUTCOME_TRAFFIC",
                    "status": "PAUSED"
                }
            ]
            multiplier = 1.0 + (abs(hash(client.name)) % 10) / 10.0
        
        for mc in mock_campaigns:
            spend_val = round(mc["spend"] * multiplier, 2)
            reach_val = int(mc["reach"] * multiplier)
            imp_val = int(mc["impressions"] * multiplier)
            clicks_val = int(mc["clicks"] * multiplier)
            leads_val = int(mc["leads"] * multiplier) if mc["objective"] == "OUTCOME_LEADS" else 0
            
            cpc_val = round(spend_val / clicks_val, 2) if clicks_val > 0 else mc["cpc"]
            cpl_val = round(spend_val / leads_val, 2) if leads_val > 0 else 0.0
            ctr_val = round((clicks_val / imp_val) * 100, 2) if imp_val > 0 else mc["ctr"]

            db.add(CampaignMetric(
                id=str(uuid.uuid4()),
                client_id=client_id,
                campaign_id=mc["campaign_id"],
                campaign_name=mc["campaign_name"],
                date=target_date,
                spend=spend_val,
                reach=reach_val,
                impressions=imp_val,
                clicks=clicks_val,
                ctr=ctr_val,
                cpc=cpc_val,
                leads=leads_val,
                cpl=cpl_val,
                status=mc["status"],
                objective=mc["objective"],
                platform="google"
            ))
            
        db.commit()
        return True, f"Demo Mode: Generated 3 Google Ads campaigns for {start} to {end}."

    # ── Step 2: Query real Google Ads API ──
    cust_id_clean = customer_id.replace("-", "").strip()
    url = f"https://googleads.googleapis.com/v17/customers/{cust_id_clean}/googleAds:search"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "developer-token": dev_token,
        "Content-Type": "application/json"
    }
    
    gaql = f"""
        SELECT 
            campaign.id, 
            campaign.name, 
            campaign.status, 
            campaign.advertising_channel_type,
            metrics.cost_micros, 
            metrics.clicks, 
            metrics.impressions,
            metrics.conversions
        FROM campaign 
        WHERE segments.date BETWEEN '{start}' AND '{end}'
    """
    
    try:
        res = requests.post(url, headers=headers, json={"query": gaql})
        data = res.json()
        
        if res.status_code != 200:
            error_msg = data.get("error", {}).get("message", f"Google Ads API Error (HTTP {res.status_code})")
            client.ad_account_error = f"[Google Ads] {error_msg}"
            db.commit()
            return False, error_msg

        results = data.get("results", [])
        
        for row in results:
            camp = row.get("campaign", {})
            metrics_row = row.get("metrics", {})
            
            c_id = camp.get("id")
            c_name = camp.get("name", "Unnamed Campaign")
            c_status = camp.get("status", "UNKNOWN")
            
            spend_micros = int(metrics_row.get("costMicros", 0))
            spend_val = round(spend_micros / 1000000.0, 2)
            
            clicks_val = int(metrics_row.get("clicks", 0))
            impressions_val = int(metrics_row.get("impressions", 0))
            conversions_val = float(metrics_row.get("conversions", 0.0))
            leads_val = int(conversions_val)
            
            ctr_val = round((clicks_val / impressions_val) * 100, 2) if impressions_val > 0 else 0.0
            cpc_val = round(spend_val / clicks_val, 2) if clicks_val > 0 else 0.0
            cpl_val = round(spend_val / leads_val, 2) if leads_val > 0 else 0.0
            
            adv_type = camp.get("advertisingChannelType", "")
            objective = "OUTCOME_LEADS" if adv_type in ("SEARCH", "MULTI_CHANNEL") else "OUTCOME_TRAFFIC"
            
            db.add(CampaignMetric(
                id=str(uuid.uuid4()),
                client_id=client_id,
                campaign_id=f"google_{c_id}",
                campaign_name=c_name,
                date=target_date,
                spend=spend_val,
                reach=impressions_val,
                impressions=impressions_val,
                clicks=clicks_val,
                ctr=ctr_val,
                cpc=cpc_val,
                leads=leads_val,
                cpl=cpl_val,
                status=c_status,
                objective=objective,
                platform="google"
            ))
            
        db.commit()
        return True, f"Successfully synced {len(results)} Google Ads campaigns."
        
    except Exception as e:
        error_msg = f"Google Ads Connection Exception: {str(e)}"
        client.ad_account_error = error_msg
        db.commit()
        return False, error_msg
