import os
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
import uuid

from database import Client, CampaignMetric, get_config

def get_google_ads_client(customer_id: str = None):
    """Initializes and returns a GoogleAdsClient instance using configured credentials."""
    client_id = os.getenv("GOOGLE_ADS_CLIENT_ID") or get_config("GOOGLE_ADS_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_ADS_CLIENT_SECRET") or get_config("GOOGLE_ADS_CLIENT_SECRET")
    refresh_token = os.getenv("GOOGLE_ADS_REFRESH_TOKEN") or get_config("GOOGLE_ADS_REFRESH_TOKEN")
    dev_token = os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN") or get_config("GOOGLE_ADS_DEVELOPER_TOKEN")

    if not (client_id and client_secret and refresh_token and dev_token):
        return None

    config = {
        "developer_token": dev_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "use_proto_plus": True,
    }

    try:
        from google.ads.googleads.client import GoogleAdsClient
        return GoogleAdsClient.load_from_dict(config)
    except Exception as e:
        print(f"[Google Ads] Error initializing GoogleAdsClient: {e}")
        return None


def sync_google_campaigns_for_client(client_id: str, db: Session, start: str = None, end: str = None):
    """
    Syncs live Google Ads campaign performance for a client broken down by day (segments.date).
    Stores accurate daily metrics so month filtering in Pulse is 100% accurate.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        return False, "Client not found."

    customer_id = getattr(client, "google_ads_customer_id", None)
    if customer_id:
        customer_id = customer_id.replace("-", "").strip()

    # Parse dates
    today_date = datetime.utcnow().date()
    if not start or not end:
        start_date = today_date.replace(day=1)
        start = start_date.strftime("%Y-%m-%d")
        end = today_date.strftime("%Y-%m-%d")
    else:
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d").date()
            target_date = datetime.strptime(end, "%Y-%m-%d").date()
        except Exception:
            target_date = today_date
            start_date = target_date.replace(day=1)
            start = start_date.strftime("%Y-%m-%d")
            end = target_date.strftime("%Y-%m-%d")

    try:
        target_date = datetime.strptime(end, "%Y-%m-%d").date()
        start_date_obj = datetime.strptime(start, "%Y-%m-%d").date()
    except Exception:
        target_date = today_date
        start_date_obj = target_date.replace(day=1)

    # Clean existing range snapshots for this client on platform 'google'
    db.query(CampaignMetric).filter(
        CampaignMetric.client_id == client_id,
        CampaignMetric.platform == "google",
        CampaignMetric.date >= start_date_obj,
        CampaignMetric.date <= target_date
    ).delete()
    db.commit()

    google_client = get_google_ads_client(customer_id) if customer_id else None

    if not customer_id or not google_client:
        return False, "Google Ads credentials or Customer ID not configured."

    try:
        ga_service = google_client.get_service("GoogleAdsService")

        # GAQL query with daily breakdown via segments.date
        query = f"""
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.advertising_channel_type,
                segments.date,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.average_cpc
            FROM campaign
            WHERE segments.date BETWEEN '{start}' AND '{end}'
            ORDER BY segments.date DESC
        """

        response = ga_service.search(customer_id=customer_id, query=query)
        results = list(response)

        # Fallback if 0 activity: pull all campaigns list with 0 spend so user sees their campaign catalog
        if not results:
            fallback_query = """
                SELECT
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    campaign.advertising_channel_type
                FROM campaign
                WHERE campaign.status != 'REMOVED'
                ORDER BY campaign.name ASC
            """
            try:
                fallback_resp = ga_service.search(customer_id=customer_id, query=fallback_query)
                for row in fallback_resp:
                    camp = row.campaign
                    adv_type = camp.advertising_channel_type.name if hasattr(camp.advertising_channel_type, "name") else str(camp.advertising_channel_type)
                    objective = "OUTCOME_LEADS" if adv_type in ("SEARCH", "MULTI_CHANNEL") else "OUTCOME_TRAFFIC"

                    db.add(CampaignMetric(
                        id=str(uuid.uuid4()),
                        client_id=client_id,
                        campaign_id=f"google_{camp.id}",
                        campaign_name=camp.name,
                        date=target_date,
                        spend=0.0,
                        reach=0,
                        impressions=0,
                        clicks=0,
                        ctr=0.0,
                        cpc=0.0,
                        leads=0,
                        cpl=0.0,
                        status=camp.status.name if hasattr(camp.status, "name") else str(camp.status),
                        objective=objective,
                        platform="google"
                    ))
                db.commit()
                client.ad_account_error = None
                db.commit()
                return True, f"Synced {len(list(fallback_resp))} campaigns with 0 spend for {start} to {end}."
            except Exception as e:
                print(f"[Google Ads] Fallback query error: {e}")

        # Insert each daily segment with its exact date
        for row in results:
            camp = row.campaign
            metrics_row = row.metrics
            row_date = datetime.strptime(row.segments.date, "%Y-%m-%d").date()

            spend_val = round(metrics_row.cost_micros / 1_000_000, 2)
            clicks_val = int(metrics_row.clicks)
            impressions_val = int(metrics_row.impressions)
            conversions_val = float(metrics_row.conversions)
            leads_val = int(conversions_val)

            ctr_val = round((clicks_val / impressions_val) * 100, 2) if impressions_val > 0 else 0.0
            cpc_val = round(spend_val / clicks_val, 2) if clicks_val > 0 else (round(metrics_row.average_cpc / 1_000_000, 2) if metrics_row.average_cpc else 0.0)
            cpl_val = round(spend_val / leads_val, 2) if leads_val > 0 else 0.0

            adv_type = camp.advertising_channel_type.name if hasattr(camp.advertising_channel_type, "name") else str(camp.advertising_channel_type)
            objective = "OUTCOME_LEADS" if adv_type in ("SEARCH", "MULTI_CHANNEL") else "OUTCOME_TRAFFIC"

            db.add(CampaignMetric(
                id=str(uuid.uuid4()),
                client_id=client_id,
                campaign_id=f"google_{camp.id}_{row.segments.date}",
                campaign_name=camp.name,
                date=row_date,
                spend=spend_val,
                reach=impressions_val,
                impressions=impressions_val,
                clicks=clicks_val,
                ctr=ctr_val,
                cpc=cpc_val,
                leads=leads_val,
                cpl=cpl_val,
                status=camp.status.name if hasattr(camp.status, "name") else str(camp.status),
                objective=objective,
                platform="google"
            ))

        client.ad_account_error = None
        db.commit()
        return True, f"Successfully synced {len(results)} daily Google Ads records."

    except Exception as e:
        error_msg = str(e)
        print(f"[Google Ads] Sync error for client {client_id}: {error_msg}")
        client.ad_account_error = f"[Google Ads] {error_msg}"
        db.commit()
        return False, error_msg
