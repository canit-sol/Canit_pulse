import requests
from datetime import datetime
from calendar import monthrange

BASE_URL = "https://graph.threads.net/v1.0"

def get_client_threads_stats(client_keys: dict, month=None, year=None) -> dict:
    now = datetime.now()
    target_month = int(month) if month else now.month
    target_year = int(year) if year else now.year

    if isinstance(client_keys, str):
        return {"platform": "threads", "status": "error", "error": "Invalid keys"}

    handle = client_keys.get("instagram_handle", "Unknown")
    token = client_keys.get("ig_access_token") or ""
    ig_user_id = client_keys.get("ig_account_id") or ""

    if not token or not ig_user_id:
        return {
            "platform": "threads",
            "status": "not_connected",
            "handle": handle,
            "error": f"No Threads credentials set for {handle}"
        }

    try:
        return _fetch_real_data(ig_user_id, token, handle, target_month, target_year)
    except Exception as e:
        print(f"❌ Threads API failed for {handle}: {e}")
        return {
            "platform": "threads",
            "status": "error",
            "handle": handle,
            "error": str(e)
        }


def _fetch_real_data(user_id, token, handle, month, year) -> dict:
    # 1. PROFILE INFO
    info_res = requests.get(f"{BASE_URL}/{user_id}", params={
        "fields": "id,username,name,threads_profile_picture_url,threads_biography",
        "access_token": token
    }).json()

    if "error" in info_res:
        raise Exception(f"Profile error: {info_res['error']['message']}")

    followers = 0

    # 2. FETCH POSTS
    posts_res = requests.get(f"{BASE_URL}/{user_id}/threads", params={
        "fields": "id,text,media_type,permalink,timestamp",
        "limit": 100,
        "access_token": token
    }).json()

    if "error" in posts_res:
        raise Exception(f"Threads error: {posts_res['error']['message']}")

    all_threads = posts_res.get("data", [])
    month_posts = []

    total_likes = 0
    total_views = 0
    total_replies = 0
    total_reposts = 0
    total_quotes = 0

    for post in all_threads:
        ts = post.get("timestamp", "")
        if not ts:
            continue
        post_date = datetime.fromisoformat(ts.replace("Z", "+00:00").replace("+0000", "+00:00"))

        if post_date.month == month and post_date.year == year:
            # 3. PER-POST INSIGHTS
            metrics = "likes,replies,reposts,quotes,views"
            insights_res = requests.get(f"{BASE_URL}/{post['id']}/insights", params={
                "metric": metrics,
                "access_token": token
            }).json()

            raw_data = {
                item["name"]: item["values"][0]["value"]
                for item in insights_res.get("data", [])
                if item.get("values")
            }

            p_likes = raw_data.get("likes", 0)
            p_replies = raw_data.get("replies", 0)
            p_reposts = raw_data.get("reposts", 0)
            p_quotes = raw_data.get("quotes", 0)
            p_views = raw_data.get("views", 0)

            total_likes += p_likes
            total_replies += p_replies
            total_reposts += p_reposts
            total_quotes += p_quotes
            total_views += p_views

            month_posts.append({
                "id": post["id"],
                "caption": post.get("text", "")[:200],
                "media_type": post.get("media_type", "TEXT"),
                "permalink": post.get("permalink", ""),
                "timestamp": ts,
                "day": post_date.day,
                "likes": p_likes,
                "comments": p_replies,
                "reach": p_views,
                "impressions": p_views,
                "saves": p_reposts + p_quotes,
                "is_boosted": False
            })

    month_posts.sort(key=lambda x: x["day"])

    # 4. AGGREGATE
    eng_rate = 0
    total_engagements = total_likes + total_replies + total_reposts + total_quotes
    if total_views > 0:
        eng_rate = round((total_engagements) / total_views * 100, 2)

    weekly = {"Wk 1": 0, "Wk 2": 0, "Wk 3": 0, "Wk 4": 0, "Wk 5": 0}
    for p in month_posts:
        d = p["day"]
        if d <= 7:    weekly["Wk 1"] += 1
        elif d <= 14: weekly["Wk 2"] += 1
        elif d <= 21: weekly["Wk 3"] += 1
        elif d <= 28: weekly["Wk 4"] += 1
        else:         weekly["Wk 5"] += 1

    return {
        "platform": "threads",
        "status": "success",
        "handle": handle,
        "account_name": info_res.get("name", handle),
        "followers": followers,
        "posts": month_posts,
        "total_posts": len(month_posts),
        "total_likes": total_likes,
        "total_reach": _fmt(total_views),
        "total_impressions": _fmt(total_views),
        "total_comments": total_replies,
        "total_saves": total_reposts + total_quotes,
        "engagement_rate": f"{eng_rate}%",
        "weekly_posts": [{"week": k, "count": v} for k, v in weekly.items() if v > 0]
    }

def _fmt(n: int) -> str:
    if n >= 1_000_000: return f"{n/1_000_000:.1f}M"
    if n >= 1_000: return f"{n/1_000:.1f}K"
    return str(n)
