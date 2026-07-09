import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from database import SessionLocal, Report, Client

db = SessionLocal()
try:
    print("All clients in DB:")
    clients = db.query(Client).all()
    for c in clients:
        print(f"Client: ID={c.id}, Name={c.name}")
    
    print("\nAll reports in DB (first 10):")
    reports = db.query(Report).limit(10).all()
    for r in reports:
        print(f"Report: ID={r.id}, ClientID={r.client_id}, Month={r.month}, Year={r.year}")
        
    target_id = "f07953e5-601d-4f27-a2da-bfd432b5b7fc"
    target_reports = db.query(Report).filter(Report.client_id == target_id).all()
    print(f"\nReports for client '{target_id}': {len(target_reports)} found.")
    for r in target_reports:
        print(f"  - Report: ID={r.id}, Month={r.month}, Year={r.year}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
