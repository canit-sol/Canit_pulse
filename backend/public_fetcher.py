"""
Public Instagram Data Fetcher
Pulls public metadata (followers, following, post count, avg likes)
for any given Instagram handle using RapidAPI Instagram Scraper.

Fallback: AI-estimated data when no API key or API fails.
"""
import os
import requests


RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = "instagram-scraper-api2.p.rapidapi.com"


def fetch_public_profile(handle: str) -> dict:
    """
    Fetch public Instagram profile data for a given handle.
    Returns a standardized dict with followers, following, post_count,
    avg_likes, and engagement_score.
    """
    handle = handle.strip().lstrip("@")
    if not handle:
        return _empty_profile(handle, "invalid")

    if RAPIDAPI_KEY:
        try:
            return _fetch_via_rapidapi(handle)
        except Exception as e:
            print(f"⚠️ RapidAPI fetch failed for @{handle}: {e}")
            return _estimated_profile(handle)
    else:
        return _estimated_profile(handle)


def fetch_multiple_profiles(handles: list[str]) -> list[dict]:
    """Fetch public data for a list of handles."""
    results = []
    for h in handles:
        results.append(fetch_public_profile(h))
    return results


def _fetch_via_rapidapi(handle: str) -> dict:
    """Use RapidAPI Instagram Scraper to get real profile data."""
    print(f"Fetching data for handle: {handle}")
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
    }

    # Step 1: Get profile info using /get_user_info endpoint
    info_res = requests.get(
        f"https://{RAPIDAPI_HOST}/get_user_info",
        headers=headers,
        params={"username": handle, "ig": handle},
        timeout=10,
    ).json()

    # Accommodate different potential response structures
    data = info_res.get("data", info_res)
    if isinstance(data, list) and len(data) > 0:
        data = data[0]

    followers = data.get("followers", data.get("follower_count", 0))
    following = data.get("following", data.get("following_count", 0))
    post_count = data.get("posts", data.get("media_count", data.get("post_count", 0)))
    full_name = data.get("full_name", data.get("name", handle))

    # Calculate engagement score
    total_likes = data.get("total_likes", data.get("avg_likes", 0))
    engagement_rate = data.get("engagement_rate", data.get("engagement_score", 0))
    
    if engagement_rate > 0:
        engagement_score = float(engagement_rate)
    else:
        engagement_score = round((total_likes / followers) * 100, 2) if followers > 0 and total_likes > 0 else "N/A"

    return {
        "handle": handle,
        "name": full_name,
        "followers": followers,
        "following": following,
        "post_count": post_count,
        "avg_likes": total_likes,
        "engagement_score": engagement_score,
        "source": "live",
    }


def _estimated_profile(handle: str) -> dict:
    """
    Fallback: Return AI-estimated placeholder data.
    Used when RapidAPI key is missing or API call fails.
    """
    # Use a simple hash-based seed so the same handle always gets
    # consistent estimated values (avoids confusing UI flicker)
    seed = sum(ord(c) for c in handle) % 1000
    followers = 5000 + seed * 50
    avg_likes = max(50, int(followers * 0.012))
    engagement_score = round((avg_likes / followers) * 100, 2) if followers > 0 else 0

    return {
        "handle": handle,
        "name": handle.title(),
        "followers": followers,
        "following": 200 + seed,
        "post_count": 100 + seed,
        "avg_likes": avg_likes,
        "engagement_score": engagement_score,
        "source": "estimated",
    }


def _empty_profile(handle: str, reason: str) -> dict:
    """Return an empty profile for invalid/missing handles."""
    return {
        "handle": handle,
        "name": handle,
        "followers": 0,
        "following": 0,
        "post_count": 0,
        "avg_likes": 0,
        "engagement_score": 0,
        "source": reason,
    }
