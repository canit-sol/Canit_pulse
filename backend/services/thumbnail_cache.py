import os
import requests
from database import supabase
def cache_thumbnail_to_storage(client_id: str, post_id: str, media_url: str) -> str:
    """
    Downloads the thumbnail from media_url and uploads it strictly to Supabase Storage.
    Returns the public Supabase URL. If upload fails, returns the original media_url.
    """
    if not media_url:
        return ""
    
    # 1. Download image bytes
    try:
        resp = requests.get(media_url, timeout=15)
        if resp.status_code != 200:
            print(f"[Thumbnail Cache] Failed to download from {media_url}: status={resp.status_code}")
            return media_url
        content = resp.content
    except Exception as e:
        print(f"[Thumbnail Cache] Error downloading from {media_url}: {e}")
        return media_url

    bucket_name = "post-thumbnails"
    file_path = f"{client_id}/{post_id}.jpg"
    
    # 2. Upload to Supabase Storage
    try:
        # Create bucket if it doesn't exist (silent if it does)
        try:
            supabase.storage.create_bucket(bucket_name, options={"public": True})
        except Exception:
            pass
            
        supabase.storage.from_(bucket_name).upload(
            path=file_path,
            file=content,
            file_options={"content-type": "image/jpeg", "x-upsert": "true"}
        )
        supabase_url_path = supabase.storage.from_(bucket_name).get_public_url(file_path)
        print(f"[Thumbnail Cache] Successfully uploaded post thumbnail to Supabase storage: {supabase_url_path}")
        return supabase_url_path
    except Exception as storage_err:
        print(f"[Thumbnail Cache] Supabase Storage upload failed: {storage_err}")
        return media_url

def cache_platform_thumbnails(client_id: str, platform_data: dict):
    """
    Iterates over all posts in platform_data and caches their thumbnails.
    Also updates the top_post thumbnail if it is configured.
    """
    if not platform_data or platform_data.get("status") != "success":
        return

    posts = platform_data.get("posts", [])
    if not posts:
        return

    # Cache posts thumbnails
    for post in posts:
        post_id = post.get("id")
        media_url = post.get("media_url")
        if post_id and media_url:
            cached_url = cache_thumbnail_to_storage(client_id, post_id, media_url)
            post["media_url"] = cached_url

    # Update top_post thumbnail if it exists
    top_post = platform_data.get("top_post")
    if top_post and top_post.get("permalink"):
        for post in posts:
            if post.get("permalink") == top_post.get("permalink"):
                top_post["media_url"] = post.get("media_url")
                break
