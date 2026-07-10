import os
import json
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from database import SessionLocal, Report

db = SessionLocal()
try:
    client_id = "e43ee24b-1d87-4570-8337-ecd6f348855b"
    report = db.query(Report).filter(
        Report.client_id == client_id,
        Report.month == "May",
        Report.year == "2026"
    ).first()
    
    if report:
        print("Found report!")
        ig_data = report.ig_data or {}
        if isinstance(ig_data, str):
            ig_data = json.loads(ig_data)
        
        # Look at posts
        posts = ig_data.get("instagram", {}).get("posts", [])
        if not posts:
            posts = ig_data.get("platforms", {}).get("instagram", {}).get("posts", [])
            
        print(f"Number of posts: {len(posts)}")
        for idx, p in enumerate(posts[:5]):
            print(f"\nPost {idx + 1}:")
            print(f"  id: {p.get('id')}")
            print(f"  media_url: {p.get('media_url')}")
            print(f"  media_base64: {p.get('media_base64')}")
    else:
        print("Report not found for May 2026")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
