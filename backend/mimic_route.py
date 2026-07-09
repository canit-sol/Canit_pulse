import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from database import SessionLocal, Client, Competitor, Report

db = SessionLocal()
try:
    client_id = "f07953e5-601d-4f27-a2da-bfd432b5b7fc"
    client_rec = db.query(Client).filter(Client.id == client_id).first()
    
    stored_reports = db.query(
        Report.id, Report.month, Report.year, Report.ig_data, Report.ai_insight
    ).filter(
        Report.client_id == client_id
    ).order_by(Report.created_at.desc()).all()

    reports_list = []
    for r in stored_reports:
        reports_list.append({
            "id": r.id,
            "month": r.month,
            "year": r.year,
            "ig_data": r.ig_data or {},
            "ai_insight": r.ai_insight or "",
        })
        
    competitors_raw = db.query(Competitor).filter(Competitor.client_id == client_id).all()
    competitors_list = [
        {
            "id": c.id,
            "name": c.name,
            "followers": c.revenue_est or 0,
            "engagement_est": c.engagement_est or 0,
            "is_client": c.is_client or False,
            "instagram_handle": c.instagram_handle or "",
        }
        for c in competitors_raw
    ]

    seo_reports_list = []
    for rep in client_rec.seo_reports:
        seo_reports_list.append({
            "id": rep.id,
            "month": rep.month,
            "year": rep.year,
            "filename": rep.filename,
            "url": rep.url,
            "uploaded_at": rep.uploaded_at.isoformat() if rep.uploaded_at else None,
            "seo_metrics": rep.seo_metrics
        })

    print("Success! No exception raised when mimicking the route code.")
except Exception as e:
    import traceback
    print("FAILED with exception:")
    traceback.print_exc()
finally:
    db.close()
