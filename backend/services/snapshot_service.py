import datetime
from sqlalchemy.orm import Session
from database import Client, AnalyticsSnapshot
from services.platform_router import fetch_platform_data
import traceback

def run_automated_snapshots(db: Session):
    """
    Runs weekly to fetch and store organic social metrics for all clients.
    Ensures that a historical archive is preserved independently of user logins.
    """
    clients = db.query(Client).all()
    now = datetime.datetime.utcnow()
    month_name = now.strftime("%B")
    year_str = str(now.year)
    
    results = []

    month_map = {
        "January": 1, "February": 2, "March": 3, "April": 4,
        "May": 5, "June": 6, "July": 7, "August": 8,
        "September": 9, "October": 10, "November": 11, "December": 12
    }
    month_num = month_map.get(month_name, now.month)

    for client in clients:
        try:
            # Prepare keys
            keys = {
                "ig_access_token": client.ig_access_token,
                "fb_page_token": client.fb_page_token,
                "ig_account_id": client.ig_user_id,
                "fb_page_id": client.fb_page_id
            }

            # Fetch Instagram
            if keys["ig_access_token"] and keys["ig_account_id"]:
                ig_data = fetch_platform_data("instagram", keys, month=month_num, year=year_str)
                if ig_data.get("status") != "error":
                    snap_ig = AnalyticsSnapshot(
                        client_id=client.id,
                        month=month_name,
                        year=year_str,
                        platform="instagram",
                        followers=int(ig_data.get("followers", 0) or 0),
                        total_reach=int(ig_data.get("total_reach", 0) or 0),
                        total_impressions=int(ig_data.get("total_impressions", 0) or 0),
                        engagement_rate=float(str(ig_data.get("engagement_rate") or 0).replace("%", "") or 0),
                        total_likes=int(ig_data.get("total_likes", 0) or 0),
                        total_comments=int(ig_data.get("total_comments", 0) or 0),
                        total_saves=int(ig_data.get("total_saves", 0) or 0),
                        post_count=int(ig_data.get("total_posts", 0) or len(ig_data.get("posts", []))),
                    )
                    db.add(snap_ig)

            # Fetch Facebook
            if keys["fb_page_token"] and keys["fb_page_id"]:
                fb_data = fetch_platform_data("facebook", keys, month=month_num, year=year_str)
                if fb_data.get("status") == "success":
                    snap_fb = AnalyticsSnapshot(
                        client_id=client.id,
                        month=month_name,
                        year=year_str,
                        platform="facebook",
                        followers=int(fb_data.get("followers", 0) or 0),
                        total_reach=int(fb_data.get("total_reach", 0) or 0),
                        total_impressions=int(fb_data.get("total_impressions", 0) or 0),
                        engagement_rate=float(str(fb_data.get("engagement_rate") or 0).replace("%", "") or 0),
                        total_likes=int(fb_data.get("total_likes", 0) or 0),
                        total_comments=int(fb_data.get("total_comments", 0) or 0),
                        post_count=int(fb_data.get("total_posts", 0) or len(fb_data.get("posts", []))),
                    )
                    db.add(snap_fb)

            db.commit()
            results.append((client.name, True, "Organic snapshots saved."))
        except Exception as e:
            db.rollback()
            print(f"[Snapshot Error] Client {client.name}: {e}")
            traceback.print_exc()
            results.append((client.name, False, str(e)))

    return results

def scheduled_organic_snapshot_sync():
    """Wrapper for APScheduler"""
    from database import SessionLocal
    db = SessionLocal()
    try:
        results = run_automated_snapshots(db)
        for res in results:
            print(f"[Organic Sync] {res[0]}: {res[2]}")
    finally:
        db.close()
