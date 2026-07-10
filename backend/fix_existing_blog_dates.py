import os
import re
from datetime import datetime
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from database import SessionLocal, ClientBlog

db = SessionLocal()
try:
    client_id = "7ecdc442-68fa-4cbb-a30b-0f3bf6c7579b"
    blogs = db.query(ClientBlog).filter(ClientBlog.client_id == client_id).all()
    
    print(f"Auditing {len(blogs)} blogs for SharonPly...")
    updated_count = 0
    for b in blogs:
        url = b.url or ""
        
        # Try to extract date from url path
        match_ymd = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', url)
        match_ym = re.search(r'/(\d{4})/(\d{2})/', url)
        
        extracted_date = None
        if match_ymd:
            try:
                extracted_date = datetime(int(match_ymd.group(1)), int(match_ymd.group(2)), int(match_ymd.group(3)))
            except ValueError:
                pass
        elif match_ym:
            try:
                extracted_date = datetime(int(match_ym.group(1)), int(match_ym.group(2)), 1)
            except ValueError:
                pass
                
        if extracted_date:
            # Check if current stored date is different from extracted date
            # We compare year and month
            current_date = b.published_at
            if not current_date or (current_date.year != extracted_date.year or current_date.month != extracted_date.month):
                print(f"Updating '{b.title}':")
                print(f"  Old date: {current_date}")
                print(f"  New date: {extracted_date}")
                b.published_at = extracted_date
                updated_count += 1
                
    if updated_count > 0:
        db.commit()
        print(f"Successfully updated {updated_count} blog publication dates in database.")
    else:
        print("No blog dates needed updating.")
        
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
