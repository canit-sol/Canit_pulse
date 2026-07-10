import os
import json
import requests
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from database import SessionLocal, Report, supabase
from instagram import _upload_post_thumbnail

db = SessionLocal()
try:
    client_id = "e43ee24b-1d87-4570-8337-ecd6f348855b"
    reports = db.query(Report).filter(Report.client_id == client_id).all()
    
    for report in reports:
        print(f"\nProcessing report for {report.month} {report.year}...")
        ig_data = report.ig_data or {}
        if isinstance(ig_data, str):
            ig_data = json.loads(ig_data)
        
        # Check platforms structure
        changed = False
        platforms = ig_data.get("platforms", {})
        instagram = platforms.get("instagram", {}) if platforms else ig_data.get("instagram", {})
        
        posts = instagram.get("posts", [])
        if not posts and not platforms:
            posts = ig_data.get("posts", [])
            
        print(f"Found {len(posts)} posts.")
        for post in posts:
            post_id = post.get("id")
            media_url = post.get("media_url")
            media_base64 = post.get("media_base64")
            
            # If cached url is missing or None, try to cache it
            if not media_base64:
                print(f"Caching thumbnail for post {post_id}...")
                cached_url = _upload_post_thumbnail(post_id, media_url)
                if cached_url:
                    post["media_base64"] = cached_url
                    changed = True
                    print(f"  -> Cached successfully: {cached_url}")
                else:
                    print("  -> Failed to cache (likely expired CDN url)")
        
        if changed:
            # Save back to database
            if "platforms" in ig_data:
                ig_data["platforms"]["instagram"]["posts"] = posts
            if "instagram" in ig_data:
                ig_data["instagram"]["posts"] = posts
            else:
                ig_data["posts"] = posts
                
            report.ig_data = ig_data
            db.commit()
            print("Successfully updated database report record.")
            
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
