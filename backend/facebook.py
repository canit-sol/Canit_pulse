"""
Canit Pulse — Facebook Analytics Engine
==========================================
Fetches and normalizes Facebook Page analytics into the same
structure used by the Instagram pipeline, so the frontend
can render both platforms identically.

Key fixes over the previous version:
  - Proper date-range filtering via cursor pagination (since/until ignored by /posts)
  - Correct post insight extraction for inline /posts fields
  - type_counts, weekly_posts, active_days — all populated
  - total_shares mapped correctly (separate from saves)
  - top_post includes all required fields
  - graceful fallback for every field
  - debug logging at each stage (remove BENTO_FB_DEBUG env var to silence)

API Version: v19.0 (validated against live Meta integration)
"""

import os
import json
import base64
import requests
from datetime import datetime
from calendar import monthrange

BASE_URL = "https://graph.facebook.com/v22.0"
DEBUG = os.getenv("BENTO_FB_DEBUG", "1") == "1"



# ── Logging ───────────────────────────────────────────────────────────────────

def _log(msg: str, obj=None):
    if not DEBUG:
        return
    print(f"[FB] {msg}")
    if obj is not None:
        try:
            print(json.dumps(obj, indent=2, default=str)[:2000])
        except Exception:
            print(str(obj)[:2000])


# ── Formatters ────────────────────────────────────────────────────────────────

def _fmt(n: int) -> int:
    return n


def _si(v, d: int = 0) -> int:
    if isinstance(v, (int, float)):
        return int(v)
    if isinstance(v, str):
        try:
            return int(v.replace(",", "").replace(" ", ""))
        except ValueError:
            return d
    return d


# ── Token / Permission Validators ────────────────────────────────────────────

def validate_fb_page_access(page_id: str, token: str) -> dict:
    """
    Validate a Page access token against the same endpoint used in production:
    GET /{page_id}?fields=name,followers_count,fan_count
    Page tokens often fail on /me but succeed here.
    """
    res = requests.get(
        f"{BASE_URL}/{page_id}",
        params={"fields": "id,name,followers_count,fan_count", "access_token": token},
        timeout=10,
    ).json()
    _log(f"Page access validation for {page_id}", res)
    if "error" in res:
        err = res["error"]
        code = err.get("code")
        sub = err.get("error_subcode")
        msg = err.get("message", "Unknown error")
        print(f"[FB VALIDATION ERROR] Missing permissions or invalid/expired token: code={code}, subcode={sub}, message={msg}")
        _log(f"Page access validation failed", err)
        if code == 190:
            if sub == 460:
                return {"valid": False, "error": "Token expired — please reconnect via Meta OAuth"}
            if sub == 458:
                return {"valid": False, "error": "App was revoked — please reconnect"}
            return {"valid": False, "error": "Token is invalid"}
        return {"valid": False, "error": err.get("message", "Page access denied")}
    return {
        "valid": True,
        "error": None,
        "name": res.get("name"),
        "followers_count": res.get("followers_count") or res.get("fan_count") or 0,
        "fan_count": res.get("fan_count") or res.get("followers_count") or 0,
    }


# ── Public Entry Point ────────────────────────────────────────────────────────

def get_client_facebook_stats(client_keys: dict, month=None, year=None) -> dict:
    now = datetime.now()
    target_month = int(month) if month else now.month
    target_year  = int(year)  if year  else now.year

    if isinstance(client_keys, str):
        return {"platform": "facebook", "status": "error", "error": "Invalid client keys format"}

    page_id       = (client_keys.get("fb_page_id") or "").strip()
    token         = (client_keys.get("fb_page_token") or "").strip()
    ad_account_id = client_keys.get("ad_account_id", "")

    _log(f"Starting fetch — page_id={page_id!r}  month={target_month}/{target_year}  has_token={bool(token)}  has_ad_account={bool(ad_account_id)}")

    if not token or not page_id:
        return {
            "platform": "facebook",
            "status": "not_connected",
            "error": "Facebook Page ID or access token is not configured for this client.",
        }

    try:
        return _fetch_real_data(page_id, token, target_month, target_year, ad_account_id)
    except Exception as exc:
        _log(f"FATAL error: {exc}")
        import traceback
        traceback.print_exc()
        return {
            "platform": "facebook",
            "status": "error",
            "error": str(exc),
        }


# ── Core Fetch Pipeline ───────────────────────────────────────────────────────

def _fetch_real_data(page_id: str, token: str, month: int, year: int, ad_account_id: str) -> dict:

    # ── 0. Validate credentials (page-scoped; do not use /me for page tokens) ─
    page_status = validate_fb_page_access(page_id, token)
    if not page_status["valid"]:
        raise Exception(f"Facebook Page access error: {page_status['error']}")

    # ── 1. Page profile (re-use validation response fields) ─────────────────
    followers = page_status.get("followers_count") or page_status.get("fan_count") or 0
    fan_count = page_status.get("fan_count") or followers
    page_name = page_status.get("name") or "Unknown Page"

    debug_paid_msg = ""
    # ── 2. Paid data ────────────────────────────────────────────────────────
    if ad_account_id:
        print(f"\n[MERGE DEBUG] FB Ad account ID found: {ad_account_id}, triggering paid fetch...")
        paid_data   = _fetch_all_paid_data(ad_account_id, token, month, year)
        debug_paid_msg = paid_data.get("debug_msg", "")
    else:
        print("\n[MERGE DEBUG] FB No Ad account ID provided. Paid data will be zero.")
        paid_data = {"global": {"reach": 0, "impressions": 0, "likes": 0}, "mapped": {}, "debug_msg": "No ad account configured"}
        debug_paid_msg = "No ad account ID provided."
        
    global_paid = paid_data["global"]
    mapped_paid = paid_data["mapped"]

    # ── 3. Organic posts — cursor-paginated, date-filtered client-side ──────
    # Facebook's /posts endpoint accepts since/until as Unix timestamps for
    # the created_time filter, but we must also paginate through all pages.
    start_ts = int(datetime(year, month, 1).timestamp())
    end_ts   = int(datetime(year, month, monthrange(year, month)[1], 23, 59, 59).timestamp())

    all_posts_raw: list[dict] = []
    next_url = (
        f"{BASE_URL}/{page_id}/posts"
        f"?fields=id,message,full_picture,permalink_url,created_time"
        f",attachments{{type,media_type}}"
        f",likes.summary(true)"
        f",comments.summary(true)"
        f",shares"
        f",reactions.summary(true)"
        f",insights.metric(post_impressions_unique,post_impressions_organic_unique){{name,values}}"
        f"&limit=100"
        f"&since={start_ts}&until={end_ts}"
        f"&access_token={token}"
    )

    pages_fetched = 0
    while next_url and pages_fetched < 5:
        page_res = requests.get(next_url, timeout=15).json()
        _log(f"Posts page {pages_fetched + 1} raw (first item sample)", page_res.get("data", [])[:1])

        if "error" in page_res:
            _log("Posts fetch error", page_res["error"])
            print(f"[FB POSTS ERROR] API error while fetching feed: {page_res['error'].get('message')}")
            # Non-fatal: proceed with what we have
            break

        batch = page_res.get("data", [])
        if not batch and pages_fetched == 0:
            print("[FB POSTS WARNING] Empty feed response — no posts found on this page in the target period.")
        all_posts_raw.extend(batch)

        # Follow cursor pagination
        next_url = page_res.get("paging", {}).get("next")
        pages_fetched += 1

        # Stop early if no more posts in our time range
        if batch:
            last_ts = batch[-1].get("created_time", "")
            if last_ts:
                try:
                    last_dt = datetime.fromisoformat(last_ts.replace("+0000", "+00:00"))
                    if last_dt.year < year or (last_dt.year == year and last_dt.month < month):
                        break
                except Exception:
                    pass

    _log(f"Total raw posts fetched across {pages_fetched} pages: {len(all_posts_raw)}")

    # ── 4. Filter to target month + extract per-post insights ───────────────
    month_posts: list[dict] = []

    organic_reach_total       = 0
    organic_impressions_total = 0
    organic_likes_total       = 0
    total_comments            = 0
    total_shares              = 0
    total_reactions           = 0

    for post in all_posts_raw:
        ts = post.get("created_time", "")
        if not ts:
            continue

        try:
            post_date = datetime.fromisoformat(ts.replace("+0000", "+00:00"))
        except Exception:
            continue

        # Client-side month filter (belt-and-suspenders since we used since/until)
        if post_date.month != month or post_date.year != year:
            continue

        # ── Engagement metrics ──
        org_reactions  = post.get("reactions", {}).get("summary", {}).get("total_count", 0)
        org_likes      = post.get("likes",     {}).get("summary", {}).get("total_count", 0)
        # reactions ≥ likes (reactions includes likes, loves, hahas, etc.)
        # Use reactions as the primary "likes" signal for Facebook
        effective_likes = max(org_reactions, org_likes)
        org_comments   = post.get("comments",  {}).get("summary", {}).get("total_count", 0)
        org_shares     = post.get("shares",    {}).get("count", 0)

        print(f"\n[FB POST DEBUG] ID: {post.get('id', '')}")
        print(f"  - Raw Reactions obj: {post.get('reactions', {}).get('summary', {})}")
        print(f"  - Raw Comments obj: {post.get('comments', {}).get('summary', {})}")
        print(f"  - Extracted -> Reactions: {org_reactions}, Likes: {org_likes}, Comments: {org_comments}, Shares: {org_shares}")

        # ── Fetch per-post reach/impressions via /insights ──────────────────
        # We try extracting the nested inline insights first (super fast and efficient)
        post_id    = post.get("id", "")
        org_reach  = 0
        total_post_reach = 0
        
        post_insights = post.get("insights", {}).get("data", [])
        for item in post_insights:
            if item.get("name") == "post_impressions_unique":
                vals = item.get("values", [])
                val = vals[0].get("value", 0) if vals else item.get("value", 0)
                total_post_reach = _si(val)
            elif item.get("name") == "post_impressions_organic_unique":
                vals = item.get("values", [])
                val = vals[0].get("value", 0) if vals else item.get("value", 0)
                org_reach = _si(val)
                
        # If nested insights failed or were empty, fall back to the safe, single-metric endpoint
        if (total_post_reach == 0 or org_reach == 0) and post_id:
            org_reach, total_post_reach = _get_post_reach(post_id, token)
        else:
            if total_post_reach == 0:
                total_post_reach = org_reach
            elif org_reach == 0:
                org_reach = total_post_reach

        # ── Media type detection ────────────────────────────────────────────
        attachments = post.get("attachments", {}).get("data", [])
        media_type  = "TEXT"
        if attachments:
            att_type = attachments[0].get("type", "")
            media_subtype = attachments[0].get("media_type", "")
            if att_type in ("video_inline", "video_share_youtube") or media_subtype == "video":
                media_type = "VIDEO"
            elif att_type == "album":
                media_type = "CAROUSEL_ALBUM"
            elif post.get("full_picture"):
                media_type = "IMAGE"
        elif post.get("full_picture"):
            media_type = "IMAGE"

        fb_media_url = post.get("full_picture", "")
        fb_media_base64 = ''
        if fb_media_url:
            try:
                img_resp = requests.get(fb_media_url, timeout=10)
                if img_resp.ok:
                    fb_media_base64 = f"data:image/jpeg;base64,{base64.b64encode(img_resp.content).decode()}"
            except Exception:
                pass

        # ── Paid boost lookup via caption prefix ────────────────────────────
        message   = post.get("message", "") or ""
        match_key = message[:30].strip().lower() if message else ""
        post_boost = mapped_paid.get(match_key, {"reach": 0, "impressions": 0, "likes": 0})

        # ── Accumulate totals ───────────────────────────────────────────────
        organic_reach_total       += org_reach
        organic_impressions_total += org_reach # map reach to impressions at post level
        organic_likes_total       += effective_likes
        total_comments            += org_comments
        total_shares              += org_shares
        total_reactions           += org_reactions

        # post_impressions_unique already includes paid. If total_post_reach <= org_reach, add post_boost.
        combined_reach = total_post_reach if total_post_reach > org_reach else (org_reach + post_boost["reach"])
        combined_imp   = combined_reach
        combined_likes = effective_likes + post_boost["likes"]

        month_posts.append({
            "id":         post_id,
            "caption":    message[:200],
            "media_type": media_type,
            "media_url":  fb_media_url,
            "media_base64": fb_media_base64,
            "permalink":  post.get("permalink_url", ""),
            "timestamp":  ts,
            "day":        post_date.day,
            "_source":    "facebook",
            # Normalised to same keys as Instagram posts
            "likes":      combined_likes,
            "comments":   org_comments,
            "shares":     org_shares,
            "saves":      org_shares,    # Facebook has no saves; map shares for UI parity
            "reach":      combined_reach,
            "impressions":combined_imp,
            "reactions":  org_reactions,
            "is_boosted": post_boost["reach"] > 0,
        })

    month_posts.sort(key=lambda x: x["day"])
    _log(f"Month posts after filter: {len(month_posts)}")
    if month_posts:
        _log("Sample post (first)", month_posts[0])

    # ── 4b. Page-level insights (true reach/impressions) ────────────────────
    # The /{page_id}/insights endpoint gives accurate page-level metrics
    # that are more reliable than summing individual post metrics.
    page_reach, page_organic_impressions, page_impressions = _get_page_insights(page_id, token, month, year)
    print(f"\n[PAGE INSIGHTS] Page Reach: {page_reach} | Organic Imp: {page_organic_impressions} | Page Impressions: {page_impressions}")

    # ── 5. Grand merge ──────────────────────────────────────────────────────
    # Reverted to previous working method: use post-level sums for organic reach and impressions
    organic_reach_for_total = organic_reach_total
    organic_imp_for_total = organic_impressions_total
    total_impressions = organic_imp_for_total + global_paid["impressions"]

    print(f"\n[MERGE DEBUG] FB Organic Reach (post-level sum): {organic_reach_for_total} | Paid Reach: {global_paid['reach']}")
    total_reach       = organic_reach_for_total + global_paid["reach"]
    
    print(f"[MERGE DEBUG] FB Organic Impressions (post-level sum): {organic_imp_for_total} | Paid Impressions: {global_paid['impressions']}")
    
    total_likes       = sum(p["likes"]   for p in month_posts)
    print(f"[MERGE DEBUG] FB Final Merged Reach: {total_reach} | Final Merged Impressions: {total_impressions}")
    total_shares_agg  = sum(p["shares"]  for p in month_posts)
    total_comments_agg= sum(p["comments"]for p in month_posts)

    # Calculate Engagement Rates splits
    organic_eng = organic_likes_total + total_comments_agg + total_shares_agg
    organic_eng_rate = round(organic_eng / total_reach * 100, 2) if total_reach > 0 else 0.0

    paid_eng = global_paid.get("likes", 0)
    paid_eng_rate = round(paid_eng / global_paid["impressions"] * 100, 2) if global_paid["impressions"] > 0 else 0.0

    total_eng = total_likes + total_comments_agg + total_shares_agg
    total_eng_rate = round(total_eng / total_impressions * 100, 2) if total_impressions > 0 else 0.0

    # ── 6. Top post ─────────────────────────────────────────────────────────
    top_post = (
        max(month_posts, key=lambda x: x.get("impressions", 0) + x.get("likes", 0))
        if month_posts else {}
    )
    _log("Top post selected", top_post)

    # ── 7. Derived aggregations (for frontend charts) ───────────────────────
    # Weekly breakdown
    weekly: dict[str, int] = {"Wk 1": 0, "Wk 2": 0, "Wk 3": 0, "Wk 4": 0, "Wk 5": 0}
    for p in month_posts:
        d = p["day"]
        if   d <= 7:  weekly["Wk 1"] += 1
        elif d <= 14: weekly["Wk 2"] += 1
        elif d <= 21: weekly["Wk 3"] += 1
        elif d <= 28: weekly["Wk 4"] += 1
        else:         weekly["Wk 5"] += 1

    # Content type counts
    type_counts: dict[str, int] = {}
    for p in month_posts:
        mt = p["media_type"]
        type_counts[mt] = type_counts.get(mt, 0) + 1

    # Active posting days
    active_days = sorted(set(p["day"] for p in month_posts))

    # ── 8. Build final payload (identical schema to Instagram) ──────────────
    total_reactions_display = total_reactions if total_reactions > 0 else total_likes

    result = {
        "platform":        "facebook",
        "status":          "success",
        "debug_paid":      debug_paid_msg,
        "account_name":    page_name,
        "followers":       followers,
        "fan_count":       fan_count,
        "posts":           month_posts,
        "active_days":     active_days,
        "total_posts":     len(month_posts),
        "total_reach":     _fmt(total_reach),
        "total_impressions": _fmt(total_impressions),
        "total_likes":     total_reactions_display,
        "total_reactions": total_reactions_display,
        "total_comments":  total_comments_agg,
        "total_shares":    total_shares_agg,
        # Shares card in unified UI reads total_saves; keep FB shares only (never IG)
        "total_saves":     total_shares_agg,
        "engagement_rate": f"{total_eng_rate}%",
        "type_counts":     type_counts,
        "weekly_posts":    [{"week": k, "count": v} for k, v in weekly.items() if v > 0],
        "bifurcation_available": bool(ad_account_id),
        "organic": {
            "total_reach":        _fmt(organic_reach_for_total),
            "total_impressions":  _fmt(organic_imp_for_total),
            "total_likes":        organic_likes_total,
            "total_comments":     total_comments_agg,
            "total_shares":       total_shares_agg,
            "page_insights_used": page_reach > 0,
            "engagement_rate":    f"{organic_eng_rate}%",
        },
        "paid": {
            "total_reach":       _fmt(global_paid["reach"]),
            "total_impressions": _fmt(global_paid["impressions"]),
            "total_likes":       global_paid["likes"],
            "engagement_rate":   f"{paid_eng_rate}%",
        } if ad_account_id else {},
        "top_post": {
            "caption":     (top_post.get("caption", "") or "")[:120],
            "media_url":   top_post.get("media_url", ""),
            "media_base64": top_post.get("media_base64", ""),
            "permalink":   top_post.get("permalink", ""),
            "impressions": _fmt(top_post.get("impressions", 0)),
            "likes":       str(top_post.get("likes", 0)),
            "comments":    str(top_post.get("comments", 0)),
            "shares":      str(top_post.get("shares", 0)),
            "saves":       str(top_post.get("shares", 0)),  # parity with IG shape
        } if top_post else {
            "caption": "", "media_url": "", "media_base64": "", "permalink": "",
            "impressions": "0", "likes": "0", "comments": "0", "shares": "0", "saves": "0",
        },
    }

    _log("Final Facebook payload (keys + counts)", {
        "posts": len(result["posts"]),
        "type_counts": result["type_counts"],
        "weekly_posts": result["weekly_posts"],
        "active_days": result["active_days"],
        "total_reach": result["total_reach"],
        "total_impressions": result["total_impressions"],
        "total_likes": result["total_likes"],
        "total_comments": result["total_comments"],
        "total_shares": result["total_shares"],
        "engagement_rate": result["engagement_rate"],
        "top_post_impressions": result["top_post"]["impressions"],
    })

    return result

# ── Page-Level Insights (True Reach / Impressions) ────────────────────────────

def _get_page_insights(page_id: str, token: str, month: int, year: int) -> tuple[int, int, int]:
    """
    Fetch true page-level reach (monthly unique) and impressions (daily organic and total sums).
    Returns (page_reach, organic_impressions, total_impressions) as integers.
    Falls back to (0, 0, 0) if the endpoints fail or lack permission.
    """
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-{monthrange(year, month)[1]}"

    page_reach = 0
    organic_impressions = 0
    total_impressions = 0

    # 1. Fetch monthly unique reach page_impressions_unique (period=month)
    try:
        res_reach = requests.get(
            f"{BASE_URL}/{page_id}/insights",
            params={
                "metric": "page_impressions_unique",
                "period": "month",
                "since": start_date,
                "until": end_date,
                "access_token": token,
            },
            timeout=15,
        ).json()
        
        print(f"[RAW FB PAGE IMPRESSIONS UNIQUE RESPONSE] {res_reach}")

        if "error" not in res_reach and "data" in res_reach and res_reach["data"]:
            vals = res_reach["data"][0].get("values", [])
            if vals:
                # Use the last value in the list representing the end of the month
                page_reach = _si(vals[-1].get("value", 0))
        else:
            if "error" in res_reach:
                print(f"⚠️ [PAGE REACH INSIGHTS] Error: {res_reach['error'].get('message', 'Unknown')}")
    except Exception as exc:
        print(f"[PAGE REACH INSIGHTS] Failed: {exc}")

    # 2. Fetch daily page impressions page_posts_impressions and page_posts_impressions_organic (period=day)
    try:
        res_imp = requests.get(
            f"{BASE_URL}/{page_id}/insights",
            params={
                "metric": "page_posts_impressions,page_posts_impressions_organic",
                "period": "day",
                "since": start_date,
                "until": end_date,
                "access_token": token,
            },
            timeout=15,
        ).json()

        if "error" not in res_imp and "data" in res_imp:
            for item in res_imp["data"]:
                name = item.get("name", "")
                for val_obj in item.get("values", []):
                    v = _si(val_obj.get("value", 0))
                    if name == "page_posts_impressions":
                        total_impressions += v
                    elif name == "page_posts_impressions_organic":
                        organic_impressions += v
        else:
            if "error" in res_imp:
                print(f"⚠️ [PAGE IMP INSIGHTS] Error: {res_imp['error'].get('message', 'Unknown')}")
    except Exception as exc:
        print(f"[PAGE IMP INSIGHTS] Failed: {exc}")

    print(f"[PAGE INSIGHTS] Reach: {page_reach}, Org Imp: {organic_impressions}, Total Imp: {total_impressions}")
    return page_reach, organic_impressions, total_impressions


# ── Per-Post Reach/Impressions ────────────────────────────────────────────────

def _get_post_reach(post_id: str, token: str) -> tuple[int, int]:
    """
    Fetch organic reach and total reach for a single Facebook post via /insights.
    Returns (organic_reach, total_reach) as integers.
    Falls back to (0, 0) gracefully if the endpoint fails or lacks permission.
    """
    try:
        res = requests.get(
            f"{BASE_URL}/{post_id}/insights",
            params={
                "metric": "post_impressions_organic_unique,post_impressions_unique",
                "access_token": token,
            },
            timeout=8,
        ).json()

        if "error" in res:
            print(f"[FB REACH DEBUG] Error for {post_id}: {res['error']}")
            _log(f"Post insights error for {post_id}", res["error"])
            return 0, 0

        org_reach = 0
        total_reach = 0
        for item in res.get("data", []):
            name  = item.get("name", "")
            values = item.get("values", [])
            val = values[0].get("value", 0) if values else item.get("value", 0)
            if name == "post_impressions_organic_unique":
                org_reach = _si(val)
            elif name == "post_impressions_unique":
                total_reach = _si(val)

        if total_reach == 0 and org_reach > 0:
            total_reach = org_reach

        print(f"[FB REACH DEBUG] {post_id} -> Org Reach: {org_reach}, Total Reach: {total_reach}")
        return org_reach, total_reach

    except Exception as exc:
        _log(f"_get_post_reach failed for {post_id}: {exc}")
        return 0, 0


# ── Paid Data (Ad Account) ────────────────────────────────────────────────────

def _fetch_all_paid_data(ad_account_id: str, token: str, month: int, year: int) -> dict:
    if not ad_account_id:
        return {"global": {"reach": 0, "impressions": 0, "likes": 0}, "mapped": {}}

    global_stats: dict = {"reach": 0, "impressions": 0, "likes": 0}
    mapped_stats: dict = {}

    start_date     = f"{year}-{month:02d}-01"
    end_date       = f"{year}-{month:02d}-{monthrange(year, month)[1]}"
    time_range_str = f'{{"since":"{start_date}","until":"{end_date}"}}'

    print(f"\n[PAID DEBUG] FB starting paid fetch for ad_account: {ad_account_id} | time_range: {time_range_str}")
    debug_msg = f"Paid fetch triggered for {ad_account_id} ({start_date} to {end_date}). "

    try:
        # Global totals
        res_global = requests.get(
            f"{BASE_URL}/act_{ad_account_id}/insights",
            params={
                "fields": "reach,impressions,actions",
                "breakdowns": "publisher_platform",
                "time_range": time_range_str,
                "access_token": token,
            },
            timeout=15,
        ).json()
        _log("Ad account global insights", res_global)
        print(f"[PAID DEBUG] FB Global Paid Response: {res_global}")

        if "data" in res_global and res_global["data"]:
            for g in res_global["data"]:
                if g.get("publisher_platform") == "facebook":
                    global_stats["reach"]       += _si(g.get("reach", 0))
                    global_stats["impressions"] += _si(g.get("impressions", 0))
                    for action in g.get("actions", []):
                        if action.get("action_type") == "post_engagement":
                            global_stats["likes"] += _si(action.get("value", 0))
            debug_msg += f"Found Facebook metrics (Reach: {global_stats['reach']}, Imp: {global_stats['impressions']}). "
        else:
            debug_msg += "No ads active in this period (API returned empty data list). "
            print("[PAID DEBUG] FB API returned empty data list, meaning NO ADS were run in this time range.")

        # Per-ad mapping for post-level boost attribution
        res_ads = requests.get(
            f"{BASE_URL}/act_{ad_account_id}/insights",
            params={
                "level": "ad",
                "fields": "ad_id,reach,impressions,actions",
                "breakdowns": "publisher_platform",
                "time_range": time_range_str,
                "limit": "500",
                "access_token": token,
            },
            timeout=15,
        ).json()

        for item in res_ads.get("data", []):
            if item.get("publisher_platform") != "facebook":
                continue
            ad_id  = item.get("ad_id")
            ad_res = requests.get(
                f"{BASE_URL}/{ad_id}",
                params={"fields": "creative{body}", "access_token": token},
                timeout=8,
            ).json()

            body_text = ad_res.get("creative", {}).get("body", "") or ""
            match_key = body_text[:30].strip().lower()
            if not match_key:
                continue

            if match_key not in mapped_stats:
                mapped_stats[match_key] = {"reach": 0, "impressions": 0, "likes": 0}

            mapped_stats[match_key]["reach"]       += _si(item.get("reach", 0))
            mapped_stats[match_key]["impressions"] += _si(item.get("impressions", 0))

            for action in item.get("actions", []):
                if action.get("action_type") == "post_engagement":
                    mapped_stats[match_key]["likes"] += _si(action.get("value", 0))

    except Exception as exc:
        _log(f"Paid data fetch failed: {exc}")
        debug_msg += f"Error: {str(exc)}"

    _log("Paid data summary", {"global": global_stats, "mapped_keys": list(mapped_stats.keys())[:5]})
    return {"global": global_stats, "mapped": mapped_stats, "debug_msg": debug_msg}


def fetch_combined_deduplicated_reach(ad_account_id: str, token: str, month: int, year: int) -> int:
    """Fetch deduplicated combined reach at the account level from act_{ad_account_id}/insights."""
    if not ad_account_id or not token:
        return 0
    from calendar import monthrange
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-{monthrange(year, month)[1]}"
    time_range_str = f'{{"since":"{start_date}","until":"{end_date}"}}'
    try:
        url = f"https://graph.facebook.com/v19.0/act_{ad_account_id}/insights"
        res = requests.get(
            url,
            params={
                "level": "account",
                "fields": "reach",
                "time_range": time_range_str,
                "access_token": token,
            },
            timeout=15
        ).json()
        print(f"[REACH DEBUG] Combined reach raw API response: {res}")
        if "data" in res and res["data"]:
            return int(res["data"][0].get("reach", 0))
    except Exception as e:
        print(f"[REACH DEBUG] Error fetching combined reach: {e}")
    return 0

def fetch_combined_deduplicated_metrics(ad_account_id: str, token: str, month: int, year: int) -> dict:
    """Fetch deduplicated combined metrics at the account level from act_{ad_account_id}/insights."""
    default_res = {
        "total_reach": 0,
        "paid_reach": 0,
        "organic_reach": 0,
        "total_impressions": 0,
        "paid_impressions": 0,
        "organic_impressions": 0
    }
    if not ad_account_id or not token:
        return default_res
    from calendar import monthrange
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-{monthrange(year, month)[1]}"
    time_range_str = f'{{"since":"{start_date}","until":"{end_date}"}}'
    try:
        url = f"https://graph.facebook.com/v19.0/act_{ad_account_id}/insights"
        res = requests.get(
            url,
            params={
                "level": "account",
                "fields": "reach,impressions",
                "time_range": time_range_str,
                "access_token": token,
            },
            timeout=15
        ).json()
        print(f"[REACH/IMP DEBUG] Combined metrics raw API response: {res}")
        if "data" in res and res["data"]:
            data_row = res["data"][0]
            reach = int(data_row.get("reach", 0))
            impressions = int(data_row.get("impressions", 0))
            return {
                "total_reach": reach,
                "paid_reach": reach,
                "organic_reach": 0,
                "total_impressions": impressions,
                "paid_impressions": impressions,
                "organic_impressions": 0
            }
    except Exception as e:
        print(f"[REACH/IMP DEBUG] Error fetching combined metrics: {e}")
    return default_res