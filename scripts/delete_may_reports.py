"""
Delete May 2026 reports for Sharon Ply and Good Weight.
Usage: python scripts/delete_may_reports.py
"""

import sys
import os
from pathlib import Path

dotenv_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
if dotenv_path.exists():
    with open(dotenv_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from database import SessionLocal, Report

TARGETS = ["Sharon Ply", "Good weight"]
MONTH = "May"
YEAR = "2026"

db = SessionLocal()

from database import Client

for target in TARGETS:
    client = db.query(Client).filter(Client.name == target).first()
    if not client:
        print(f"[ERR] Client '{target}' not found.")
        continue

    reports = db.query(Report).filter(
        Report.client_id == client.id,
        Report.month == MONTH,
        Report.year == YEAR,
    ).all()

    if not reports:
        print(f"  No {MONTH} {YEAR} reports found for '{target}'.")
        continue

    for r in reports:
        print(f"  Deleting report {r.id} ({r.month} {r.year}) for '{target}'...")
        db.delete(r)

    db.commit()
    print(f"[OK] Deleted {len(reports)} report(s) for '{target}' ({MONTH} {YEAR}).")

db.close()
print("Done.")
