import requests
import base64
from datetime import datetime
from calendar import monthrange

# 🎯 Locked to v25.0 to ensure stability
BASE_URL = "https://graph.facebook.com/v25.0"

def get_client_instagram_stats(client_keys: dict, month=None, year=None) -> dict:
    now = datetime.now()
    target_month = int(month) if month else now.month
    target_year = int(year) if year else now.year

    if isinstance(client_keys, str):
        handle = client_keys
        token = ""
        ig_user_id = ""
        ad_account_id = ""
    else:
        handle = client_keys.get("instagram_handle", "Unknown")
        token = client_keys.get("ig_access_token") or ""
        ig_user_id = client_keys.get("ig_account_id") or ""
        ad_account_id = client_keys.get("ad_account_id") or ""

    if not token or not ig_user_id:
        return {
            "platform": "instagram",
            "status": "not_connected",
            "handle": handle,
            "error": f"No Instagram credentials set for {handle}"
        }

    try:
        return _fetch_real_data(ig_user_id, token, handle, target_month, target_year, ad_account_id)
    except Exception as e:
        print(f"❌ IG API failed for {handle}: {e}")
        return {
            "platform": "instagram",
            "status": "error",
            "handle": handle,
            "error": str(e)
        }


def _fetch_real_data(ig_id, token, handle, month, year, ad_account_id) -> dict:
    # --- 1. PROFILE INFO ---
    info_res = requests.get(f"{BASE_URL}/{ig_id}", params={
        "fields": "username,name,followers_count,media_count",
        "access_token": token
    }).json()

    if "error" in info_res:
        raise Exception(f"Profile error: {info_res['error']['message']}")

    followers = info_res.get("followers_count", 0)

    # --- 1b. FETCH MONTHLY UNIQUE REACH (period=days_28) ---
    instagram_reach_unique_month = 0
    try:
        # Construct range: at most 29 days to satisfy the 30-day API limit,
        # but ending on the last day of the target month.
        days_in_month = monthrange(year, month)[1]
        if days_in_month > 30:
            start_day = 3
        elif days_in_month > 28:
            start_day = 2
        else:
            start_day = 1
            
        start_date = f"{year}-{month:02d}-{start_day:02d}"
        end_date = f"{year}-{month:02d}-{days_in_month:02d}"
        
        reach_url = f"{BASE_URL}/{ig_id}/insights"
        reach_res = requests.get(reach_url, params={
            "metric": "reach",
            "period": "days_28",
            "since": start_date,
            "until": end_date,
            "access_token": token
        }, timeout=15).json()
        
        print(f"[RAW IG REACH RESPONSE] {reach_res}")
        
        if "error" not in reach_res and "data" in reach_res and reach_res["data"]:
            vals = reach_res["data"][0].get("values", [])
            if vals:
                # Take the last value representing the end of the month
                instagram_reach_unique_month = int(vals[-1].get("value", 0))
                print(f"[IG REACH INSIGHTS] Fetched rolling monthly reach: {instagram_reach_unique_month}")
        else:
            if "error" in reach_res:
                print(f"⚠️ [IG REACH INSIGHTS] Error: {reach_res['error'].get('message', 'Unknown')}")
    except Exception as exc:
        print(f"[IG REACH INSIGHTS] Failed: {exc}")

    debug_paid_msg = ""
    # --- 2. FETCH PAID DATA (Global + Post-Mapped) ---
    if ad_account_id:
        print(f"\n[MERGE DEBUG] Ad account ID found: {ad_account_id}, triggering paid fetch...")
        paid_data = _fetch_all_paid_data(ad_account_id, token, month, year)
        debug_paid_msg = paid_data.get("debug_msg", "")
    else:
        print("\n[MERGE DEBUG] No Ad account ID provided. Paid data will be zero.")
        paid_data = {"global": {"reach": 0, "impressions": 0, "likes": 0}, "mapped": {}, "debug_msg": "No ad account configured"}
        debug_paid_msg = "No ad account ID provided."
        
    global_paid = paid_data["global"]
    mapped_paid = paid_data["mapped"]

    # --- 3. ORGANIC MEDIA FETCH & MERGE ---
    media_res = requests.get(f"{BASE_URL}/{ig_id}/media", params={
        "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
        "limit": 100,
        "access_token": token
    }).json()

    if "error" in media_res:
        raise Exception(f"Media error: {media_res['error']['message']}")

    all_media = media_res.get("data", [])
    month_posts = []

    organic_reach_total = 0
    organic_impressions_total = 0
    organic_likes_total = 0
    total_saves = 0
    total_comments = 0

    for post in all_media:
        ts = post.get("timestamp", "")
        if not ts:
            continue
        post_date = datetime.fromisoformat(ts.replace("Z", "+00:00"))

        if post_date.month == month and post_date.year == year:
            media_type = post.get("media_type", "IMAGE")
            insights = _get_post_insights(post["id"], token, media_type)

            if media_type == "VIDEO":
                safe_image_url = post.get("thumbnail_url") or post.get("media_url", "")
            else:
                safe_image_url = post.get("media_url") or post.get("thumbnail_url", "")

            media_base64 = ''
            if safe_image_url:
                try:
                    img_resp = requests.get(safe_image_url, timeout=10)
                    if img_resp.ok:
                        media_base64 = f"data:image/jpeg;base64,{base64.b64encode(img_resp.content).decode()}"
                except Exception:
                    pass

            # 🎯 THE FIX: Extract shortcode from permalink, try shortcode first then caption prefix
            raw_link = post.get("permalink", "")
            shortcode = raw_link.split("?")[0].rstrip("/").split("/")[-1] if raw_link else ""

            # Try matching by shortcode first, then by caption prefix
            post_boost = mapped_paid.get(shortcode)
            if not post_boost:
                caption_key = post.get("caption", "")[:30].strip().lower()
                post_boost = mapped_paid.get(caption_key, {"reach": 0, "impressions": 0, "likes": 0})

            org_likes = post.get("like_count", 0)
            org_reach = insights.get("reach", 0)
            org_imp = insights.get("impressions", 0)

            organic_reach_total += org_reach
            organic_impressions_total += org_imp
            organic_likes_total += org_likes
            total_saves += insights.get("saved", 0)
            total_comments += post.get("comments_count", 0)

            month_posts.append({
                "id": post["id"],
                "caption": post.get("caption", "")[:200],
                "media_type": media_type,
                "media_url": safe_image_url,
                "media_base64": media_base64,
                "permalink": post.get("permalink", ""),
                "timestamp": ts,
                "day": post_date.day,
                "_source": "instagram",
                # 🎯 INJECT THE COMBINED NUMBERS INTO THE REACT GRID
                "likes": org_likes + post_boost["likes"],
                "comments": post.get("comments_count", 0),
                "reach": org_reach + post_boost["reach"],
                "saves": insights.get("saved", 0),
                "impressions": org_imp + post_boost["impressions"],
                "is_boosted": True if post_boost["reach"] > 0 else False
            })

    month_posts.sort(key=lambda x: x["day"])

    # --- 4. THE GRAND MERGE FOR TOP CARDS ---
    # Reverted to previous working method: use post-level sums for organic reach
    organic_reach_for_total = organic_reach_total

    print(f"\n[MERGE DEBUG] Organic Reach: {organic_reach_for_total} | Paid Reach: {global_paid['reach']}")
    total_reach = organic_reach_for_total + global_paid["reach"]
    
    print(f"[MERGE DEBUG] Organic Impressions: {organic_impressions_total} | Paid Impressions: {global_paid['impressions']}")
    total_impressions = organic_impressions_total + global_paid["impressions"]
    
    total_likes = organic_likes_total + global_paid["likes"]
    print(f"[MERGE DEBUG] Final Merged Reach: {total_reach} | Final Merged Impressions: {total_impressions}")

    eng_rate = 0
    if total_impressions > 0:
        eng_rate = round((total_likes + total_comments + total_saves) / total_impressions * 100, 2)

    # Paid Engagement Rate
    paid_eng_rate = round(global_paid["likes"] / global_paid["impressions"] * 100, 2) if global_paid["impressions"] > 0 else 0.0

    top_post = max(month_posts, key=lambda x: x.get("impressions", 0) + x.get("likes", 0)) if month_posts else {}

    weekly = {"Wk 1": 0, "Wk 2": 0, "Wk 3": 0, "Wk 4": 0, "Wk 5": 0}
    for p in month_posts:
        d = p["day"]
        if d <= 7:    weekly["Wk 1"] += 1
        elif d <= 14: weekly["Wk 2"] += 1
        elif d <= 21: weekly["Wk 3"] += 1
        elif d <= 28: weekly["Wk 4"] += 1
        else:         weekly["Wk 5"] += 1

    type_counts = {}
    for p in month_posts:
        mt = p["media_type"]
        type_counts[mt] = type_counts.get(mt, 0) + 1

    return {
        "platform": "instagram",
        "status": "success",
        "debug_paid": debug_paid_msg,
        "bifurcation_available": bool(ad_account_id),
        "organic": {
            "total_reach": _fmt(organic_reach_for_total),
            "total_impressions": _fmt(organic_impressions_total),
            "total_likes": organic_likes_total,
            "total_saves": total_saves,
            "total_comments": total_comments,
            "engagement_rate": f"{round((organic_likes_total + total_comments + total_saves) / total_reach * 100, 2)}%" if total_reach > 0 else "0%",
        },
        "paid": {
            "total_reach": _fmt(global_paid["reach"]),
            "total_impressions": _fmt(global_paid["impressions"]),
            "total_likes": global_paid["likes"],
            "engagement_rate": f"{round(paid_eng_rate, 2)}%",
            "mapped_posts": mapped_paid,
        } if ad_account_id else {},
        "instagram_handle": handle,
        "account_name": info_res.get("name", handle),
        "followers": followers,
        "posts": month_posts,
        "active_days": sorted(set(p["day"] for p in month_posts)),
        "total_posts": len(month_posts),
        "total_reach": _fmt(total_reach),
        "total_impressions": _fmt(total_impressions),
        "total_likes": total_likes,
        "total_saves": total_saves,
        "total_comments": total_comments,
        "engagement_rate": f"{eng_rate}%",
        "top_post": {
            "caption": top_post.get("caption", "")[:120] if top_post else "",
            "media_url": top_post.get("media_url", "") if top_post else "",
            "media_base64": top_post.get("media_base64", "") if top_post else "",
            "permalink": top_post.get("permalink", "") if top_post else "",
            "impressions": _fmt(top_post.get("impressions", 0)) if top_post else "0",
            "likes": str(top_post.get("likes", 0)) if top_post else "0",
            "saves": str(top_post.get("saves", 0)) if top_post else "0",
            "comments": str(top_post.get("comments", 0)) if top_post else "0",
        },
        "weekly_posts": [{"week": k, "count": v} for k, v in weekly.items() if v > 0],
        "type_counts": type_counts,
    }


def _get_post_insights(post_id: str, token: str, media_type: str) -> dict:
    metrics = "reach,saved,views"
    try:
        res = requests.get(
            f"{BASE_URL}/{post_id}/insights",
            params={"metric": metrics, "access_token": token}
        ).json()

        if "error" in res:
            fallback_res = requests.get(
                f"{BASE_URL}/{post_id}/insights",
                params={"metric": "reach,saved", "access_token": token}
            ).json()
            if "error" in fallback_res:
                return {}
            res = fallback_res

        raw_data = {
            item["name"]: item["values"][0]["value"]
            for item in res.get("data", [])
            if item.get("values")
        }
        return {
            "reach": raw_data.get("reach", 0),
            "impressions": raw_data.get("views", raw_data.get("reach", 0)),
            "saved": raw_data.get("saved", 0)
        }
    except Exception as e:
        print(f"Request failed for {post_id}: {e}")
        return {}


def _fetch_all_paid_data(ad_account_id: str, token: str, month: int, year: int) -> dict:
    if not ad_account_id:
        return {"global": {"reach": 0, "impressions": 0, "likes": 0}, "mapped": {}}

    global_stats = {"reach": 0, "impressions": 0, "likes": 0}
    mapped_stats = {}

    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-{monthrange(year, month)[1]}"
    time_range_str = f'{{"since":"{start_date}","until":"{end_date}"}}'

    print(f"\n[PAID DEBUG] IG starting paid fetch for ad_account: {ad_account_id} | time_range: {time_range_str}")
    debug_msg = f"Paid fetch triggered for {ad_account_id} ({start_date} to {end_date}). "

    try:
        # 1. Global Totals
        res_global = requests.get(
            f"{BASE_URL}/act_{ad_account_id}/insights",
            params={
                "fields": "reach,impressions,actions",
                "breakdowns": "publisher_platform",
                "time_range": time_range_str,
                "access_token": token
            }
        ).json()
        
        print(f"[PAID DEBUG] IG Global Paid Response: {res_global}")

        if "data" in res_global and res_global["data"]:
            for g_data in res_global["data"]:
                if g_data.get("publisher_platform") == "instagram":
                    global_stats["reach"] += int(g_data.get("reach", 0))
                    global_stats["impressions"] += int(g_data.get("impressions", 0))
                    for action in g_data.get("actions", []):
                        if action.get("action_type") == "post_engagement":
                            global_stats["likes"] += int(action.get("value", 0))
            debug_msg += f"Found Instagram metrics (Reach: {global_stats['reach']}, Imp: {global_stats['impressions']}). "
        else:
            debug_msg += "No ads active in this period (API returned empty data list). "
            print("[PAID DEBUG] IG API returned empty data list, meaning NO ADS were run in this time range.")

        # 2. Per-ad breakdown for post mapping
        res_active = requests.get(
            f"{BASE_URL}/act_{ad_account_id}/insights",
            params={
                "level": "ad",
                "fields": "ad_id,reach,impressions,actions",
                "breakdowns": "publisher_platform",
                "time_range": time_range_str,
                "limit": "500",
                "access_token": token
            }
        ).json()

        for item in res_active.get("data", []):
            if item.get("publisher_platform") != "instagram":
                continue
            ad_id = item.get("ad_id")

            # Pull the creative to match by shortcode or caption prefix
            ad_res = requests.get(f"{BASE_URL}/{ad_id}", params={
                "fields": "creative{effective_instagram_permalink_url,body,instagram_permalink_url}",
                "access_token": token
            }).json()

            creative = ad_res.get("creative", {})
            permalink = (
                creative.get("effective_instagram_permalink_url")
                or creative.get("instagram_permalink_url")
                or ""
            )
            body_text = creative.get("body", "")

            match_key = ""
            if permalink:
                match_key = permalink.split("?")[0].rstrip("/").split("/")[-1]
            elif body_text:
                match_key = body_text[:30].strip().lower()

            if not match_key:
                continue

            if match_key not in mapped_stats:
                mapped_stats[match_key] = {"reach": 0, "impressions": 0, "likes": 0}

            mapped_stats[match_key]["reach"] += int(item.get("reach", 0))
            mapped_stats[match_key]["impressions"] += int(item.get("impressions", 0))

            for action in item.get("actions", []):
                if action.get("action_type") == "post_engagement":
                    mapped_stats[match_key]["likes"] += int(action.get("value", 0))

    except Exception as e:
        print(f"❌ [PAID DEBUG] IG Nuclear Mapping Failed: {e}")
        debug_msg += f"Error: {str(e)}"

    print(f"[PAID DEBUG] IG Final returned paid data -> Global: {global_stats}")
    return {"global": global_stats, "mapped": mapped_stats, "debug_msg": debug_msg}


def _fmt(n: int) -> int:
    return n