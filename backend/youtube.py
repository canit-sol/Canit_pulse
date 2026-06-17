import requests
import re
import calendar
from datetime import datetime
def get_month_date_range(month_name: str, year_str: str) -> tuple:
    # Resolve year
    try:
        year = int(year_str)
    except Exception:
        year = datetime.now().year
        
    # Map month name to number
    mapping = {
        "January": 1, "February": 2, "March": 3, "April": 4,
        "May": 5, "June": 6, "July": 7, "August": 8,
        "September": 9, "October": 10, "November": 11, "December": 12
    }
    month = mapping.get(month_name, 1)
    
    # Get last day of the month
    last_day = calendar.monthrange(year, month)[1]
    
    start_str = f"{year:04d}-{month:02d}-01T00:00:00Z"
    end_str = f"{year:04d}-{month:02d}-{last_day:02d}T23:59:59Z"
    return start_str, end_str

def month_to_num(month_name: str) -> str:
    mapping = {
        "January": "01", "February": "02", "March": "03", "April": "04",
        "May": "05", "June": "06", "July": "07", "August": "08",
        "September": "09", "October": "10", "November": "11", "December": "12"
    }
    return mapping.get(month_name, "01")

def parse_duration_to_seconds(duration: str) -> int:
    pattern = re.compile(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?')
    match = pattern.match(duration)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds

def get_client_youtube_stats(channel_id: str, api_key: str, month: str = None, year: str = None) -> dict:
    if channel_id:
        channel_id = channel_id.strip()
    if not channel_id:
        return {
            "platform": "youtube",
            "status": "not_connected",
            "error": "No YouTube Channel ID connected."
        }

    now = datetime.now()
    target_month_name = month or now.strftime("%B")
    target_year = year or str(now.year)
    target_month_num = month_to_num(target_month_name)

    # Resolve API key dynamically if not provided
    if not api_key:
        import os
        from database import get_config
        api_key = get_config("youtube_api_key", "")
        if not api_key:
            api_key = get_config("YOUTUBE_API_KEY", "")
        if not api_key:
            api_key = os.getenv("YOUTUBE_API_KEY", "")
        if api_key:
            api_key = api_key.strip()

    # If no API key is configured, return error dictionary
    if not api_key:
        print("No YouTube API Key configured.")
        return {
            "platform": "youtube",
            "status": "error",
            "error": "No YouTube API Key configured."
        }

    try:
        # 1. Fetch channel details using statistics part as requested
        channel_url = f"https://www.googleapis.com/youtube/v3/channels?part=statistics&id={channel_id}&key={api_key}"
        res = requests.get(channel_url, timeout=10)
        
        # Print raw API response to terminal
        print("Raw YouTube API Response:", res.text)
        
        if res.status_code != 200:
            print(f"YouTube Channel API returned {res.status_code}")
            return {
                "platform": "youtube",
                "status": "error",
                "error": f"YouTube API returned status {res.status_code}"
            }
            
        channel_data = res.json()
        items = channel_data.get("items", [])
        if not items:
            print("No YouTube channel items found.")
            return {
                "platform": "youtube",
                "status": "error",
                "error": "YouTube channel not found."
            }

        chan = items[0]
        stats = chan.get("statistics", {})
        subscriberCount = int(stats.get("subscriberCount") or 0)
        viewCount = int(stats.get("viewCount") or 0)
        videoCount = int(stats.get("videoCount") or 0)

        # 2. Fetch videos published in the selected month/year
        start_date, end_date = get_month_date_range(target_month_name, target_year)
        search_url = "https://www.googleapis.com/youtube/v3/search"
        search_params = {
            "part": "snippet",
            "channelId": channel_id,
            "type": "video",
            "publishedAfter": start_date,
            "publishedBefore": end_date,
            "maxResults": 50,
            "key": api_key
        }
        
        videos_list = []
        search_res = requests.get(search_url, params=search_params, timeout=10)
        if search_res.status_code == 200:
            search_data = search_res.json()
            search_items = search_data.get("items", [])
            video_ids = [item.get("id", {}).get("videoId") for item in search_items if item.get("id", {}).get("videoId")]
            
            if video_ids:
                # Fetch detailed statistics for the retrieved video IDs
                ids_str = ",".join(video_ids)
                videos_url = "https://www.googleapis.com/youtube/v3/videos"
                videos_params = {
                    "part": "statistics,snippet",
                    "id": ids_str,
                    "key": api_key
                }
                videos_res = requests.get(videos_url, params=videos_params, timeout=10)
                if videos_res.status_code == 200:
                    videos_data = videos_res.json()
                    for v_item in videos_data.get("items", []):
                        v_id = v_item.get("id")
                        v_snippet = v_item.get("snippet", {})
                        v_stats = v_item.get("statistics", {})
                        
                        # Get thumbnail url
                        thumbnails = v_snippet.get("thumbnails", {})
                        thumb_url = ""
                        for sz in ["standard", "high", "medium", "default"]:
                            if sz in thumbnails and thumbnails[sz].get("url"):
                                thumb_url = thumbnails[sz]["url"]
                                break
                                
                        videos_list.append({
                            "id": v_id,
                            "title": v_snippet.get("title", "Untitled Video"),
                            "published_at": v_snippet.get("publishedAt", ""),
                            "thumbnail": thumb_url,
                            "views": int(v_stats.get("viewCount") or 0),
                            "likes": int(v_stats.get("likeCount") or 0),
                            "comments": int(v_stats.get("commentCount") or 0),
                        })
                    
                    # Sort by views descending
                    videos_list.sort(key=lambda x: x["views"], reverse=True)
            else:
                print(f"No video IDs returned for dates {start_date} to {end_date}.")
        else:
            print(f"YouTube Search API returned status {search_res.status_code}: {search_res.text}")

        return {
            "platform": "youtube",
            "status": "success",
            "channel_id": channel_id,
            "channel_name": "YouTube Channel",
            "subscribers": subscriberCount,
            "total_views": viewCount,
            "total_videos": videoCount,
            "subscriberCount": subscriberCount,
            "viewCount": viewCount,
            "videoCount": videoCount,
            "videos": videos_list
        }

    except Exception as e:
        print(f"Error fetching YouTube stats: {e}")
        return {
            "platform": "youtube",
            "status": "error",
            "error": str(e)
        }
