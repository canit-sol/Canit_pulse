import os
import sys
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

# Ensure stdout can handle UTF-8 print statements on Windows to avoid charmap errors
sys.stdout.reconfigure(encoding='utf-8')

from database import SessionLocal, Client, Report
from main import refresh_report_for_month
from auth import AuthIdentity

db = SessionLocal()
try:
    client_id = "e43ee24b-1d87-4570-8337-ecd6f348855b"
    
    # Mock admin user identity
    admin_identity = AuthIdentity(
        id="system",
        email="system@canitpulse.com",
        name="System",
        role="super_admin",
        client_id=None,
        is_active=True
    )
    
    print("Triggering report refresh for May 2026...")
    res = refresh_report_for_month(
        client_id=client_id,
        current_user=admin_identity,
        db=db,
        month="May",
        year="2026"
    )
    print("Refresh result:")
    print(res)
except Exception as e:
    import traceback
    print("Refresh failed:")
    traceback.print_exc()
finally:
    db.close()
