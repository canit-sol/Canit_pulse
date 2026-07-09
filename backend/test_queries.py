import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from database import SessionLocal, Client, Report, MonthlySEOReport, User

db = SessionLocal()
try:
    print("Testing querying clients...")
    clients = db.query(Client).all()
    print(f"Successfully queried {len(clients)} clients.")
    
    print("Testing querying reports...")
    reports = db.query(Report).all()
    print(f"Successfully queried {len(reports)} reports.")
    
    print("Testing querying monthly_seo_reports...")
    seo_reports = db.query(MonthlySEOReport).all()
    print(f"Successfully queried {len(seo_reports)} monthly SEO reports.")
    
    print("Testing querying users...")
    users = db.query(User).all()
    print(f"Successfully queried {len(users)} users.")
    
    print("All queries completed without exceptions!")
except Exception as e:
    print(f"QUERY FAILED with exception: {e}")
finally:
    db.close()
