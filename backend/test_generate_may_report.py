"""
Test script: Generate May 2026 Instagram report for a given client.
Produces two HTML files mirroring the client dashboard + PDF download format.

Usage:
    python test_generate_may_report.py <client_id>
    python test_generate_may_report.py list          # list available clients
"""

import sys
import os
import json
from datetime import datetime

# ── Bootstrap environment ────────────────────────────────────────────────
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from database import SessionLocal, Client
from instagram import get_client_instagram_stats
from report_generator_v3 import generate_report_html
from pdf_generator import generate_pdf_html

MONTH_NAME = "May"
MONTH_NUM  = "5"
YEAR       = "2026"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "test_output")

os.makedirs(OUT_DIR, exist_ok=True)


def list_clients():
    db = SessionLocal()
    try:
        clients = db.query(Client).all()
        print(f"\n{'ID':<40} {'NAME':<25} {'INSTAGRAM':<20}")
        print("-" * 85)
        for c in clients:
            ig = c.instagram_handle or "—"
            print(f"{c.id:<40} {c.name:<25} {ig:<20}")
    finally:
        db.close()


def generate_may_report(client_id: str):
    db = SessionLocal()
    try:
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            print(f"Client not found: {client_id}")
            sys.exit(1)

        print(f"\n=== Generating {MONTH_NAME} {YEAR} report for {client.name} ===")

        # 1. Build client_keys — same as routes_v3.py
        client_keys = {
            "ig_access_token": client.ig_access_token,
            "ig_account_id": client.ig_user_id,
            "ad_account_id": client.ad_account_id,
            "instagram_handle": client.instagram_handle or "",
            "fb_page_id": client.fb_page_id,
            "fb_page_token": client.fb_page_token,
            "x_user_id": client.x_user_id,
            "x_token": client.x_token,
            "client_id": client.id,
        }

        # 2. Fetch Instagram data (this now includes media_base64)
        print("Fetching Instagram stats for May 2026...")
        instagram_data = get_client_instagram_stats(client_keys, month=MONTH_NUM, year=YEAR)
        status = instagram_data.get("status", "unknown")
        print(f"Status: {status}")
        posts = instagram_data.get("posts", [])
        total = instagram_data.get("total_posts", 0)
        print(f"Posts: {total} returned, {len(posts)} in array")
        if posts:
            sample = posts[0]
            has_b64 = bool(sample.get("media_base64"))
            print(f"media_base64 on first post: {'YES' if has_b64 else 'NO'} ({len(sample.get('media_base64', ''))} chars)")
            print(f"media_url: {sample.get('media_url', '')[:80]}...")

        if not posts:
            print("ERROR: No posts returned. Cannot proceed.")
            sys.exit(1)

        # 3. Build report_data — matches routes_v3.py generate_report endpoint
        report_data = {
            "client_name": client.name,
            "month": MONTH_NAME,
            "year": YEAR,
            "report_id": f"test_{client_id}_{MONTH_NAME}_{YEAR}",
        }

        # 4. Generate synopsis (simplified — AI-free)
        synopsis = f"Instagram performance snapshot for {client.name} in {MONTH_NAME} {YEAR}. "
        synopsis += f"Published {total} posts reaching {instagram_data.get('total_reach', 'N/A')} "
        synopsis += f"with an engagement rate of {instagram_data.get('engagement_rate', 'N/A')}."

        # 5. Generate dashboard-style HTML (report_generator_v3 format)
        print("\nGenerating dashboard-style HTML...")
        dashboard_html = generate_report_html(
            report_data, instagram_data, synopsis, client.brand_color or "#c8922a"
        )
        dash_path = os.path.join(OUT_DIR, f"{client.name.replace(' ', '_')}_{MONTH_NAME}_{YEAR}_dashboard.html")
        with open(dash_path, "w", encoding="utf-8") as f:
            f.write(dashboard_html)
        print(f"Saved: {dash_path}")

        # 6. Generate full PDF-style HTML (pdf_generator format)
        print("Generating PDF-style HTML...")
        pdf_html = generate_pdf_html(
            report_data=report_data,
            instagram_data=instagram_data,
            synopsis=synopsis,
            seo_data={},
            facebook_data={},
            brand_color=client.brand_color or "#c8922a",
            client_logo_url=client.client_logo_url or ""
        )
        pdf_path = os.path.join(OUT_DIR, f"{client.name.replace(' ', '_')}_{MONTH_NAME}_{YEAR}_full_report.html")
        with open(pdf_path, "w", encoding="utf-8") as f:
            f.write(pdf_html)
        print(f"Saved: {pdf_path}")

        # 7. Summary
        print("\n=== Report Summary ===")
        print(f"Client:         {client.name}")
        print(f"Period:         {MONTH_NAME} {YEAR}")
        print(f"Posts:          {total}")
        print(f"Status:         {status}")
        print(f"Base64 images:  {'Yes' if posts and posts[0].get('media_base64') else 'No'}")
        print(f"\nOpen the HTML files in a browser to verify images are loading.")
        print(f"  Dashboard: {dash_path}")
        print(f"  Full:      {pdf_path}")

    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_generate_may_report.py <client_id>")
        print("       python test_generate_may_report.py list")
        sys.exit(1)

    if sys.argv[1] == "list":
        list_clients()
    else:
        generate_may_report(sys.argv[1])
