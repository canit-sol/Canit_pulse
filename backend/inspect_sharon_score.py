import os
import json
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from database import SessionLocal, Report

db = SessionLocal()
try:
    client_id = "7ecdc442-68fa-4cbb-a30b-0f3bf6c7579b"
    report = db.query(Report).filter(
        Report.client_id == client_id,
        Report.month == "July",
        Report.year == "2026"
    ).first()
    
    if report:
        print("Found SharonPly July report!")
        ig_data = report.ig_data or {}
        if isinstance(ig_data, str):
            ig_data = json.loads(ig_data)
        
        # Print brand health score
        intel = ig_data.get("intelligence_data", {})
        bh = intel.get("brand_health", {})
        print(f"Brand Health Score: {bh.get('score')}")
        print(f"Brand Health Label: {bh.get('label')}")
    else:
        print("Report not found for SharonPly July 2026")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
