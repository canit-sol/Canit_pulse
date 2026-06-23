"""Connects to Supabase Postgres via DATABASE_URL and reports storage usage."""
import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL not found in .env")


def _pretty(n):
    if n is None:
        return "0 bytes"
    for unit in ("bytes", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # -- 1. Table sizes --
    rows = conn.execute(text("""
        SELECT
            relname AS table_name,
            n_live_tup AS row_estimate,
            pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
            pg_total_relation_size(relid) AS total_bytes
        FROM pg_stat_user_tables
        ORDER BY total_bytes DESC
    """)).fetchall()

    print("-" * 65)
    print("  DATABASE TABLES — Size & Row Count")
    print("-" * 65)
    total_db = 0
    for r in rows:
        total_db += r.total_bytes
        print(f"  {r.table_name:<32s} {str(r.row_estimate or 0):>8s} rows  {r.total_size:>10s}")
    print("-" * 65)
    print(f"  {'TOTAL':<32s} {'':>8s}  {_pretty(total_db):>10s}")
    print()

    # -- 2. Storage bucket sizes (including empty buckets) --
    rows2 = conn.execute(text("""
        SELECT
            b.id AS bucket_id,
            COUNT(o.id) AS file_count,
            pg_size_pretty(COALESCE(SUM((o.metadata->>'size')::bigint), 0)) AS total_size,
            COALESCE(SUM((o.metadata->>'size')::bigint), 0) AS total_bytes
        FROM storage.buckets b
        LEFT JOIN storage.objects o ON o.bucket_id = b.id
        GROUP BY b.id
        ORDER BY total_bytes DESC
    """)).fetchall()

    print("-" * 65)
    print("  STORAGE BUCKETS — File Count & Size")
    print("-" * 65)
    total_storage = 0
    for r in rows2:
        total_storage += r.total_bytes or 0
        print(f"  {r.bucket_id:<32s} {str(r.file_count):>6s} files  {r.total_size:>10s}")
    print("-" * 65)
    print(f"  {'TOTAL':<32s} {'':>6s}  {_pretty(total_storage):>10s}")
    print()

    # -- 3. Database total (all databases) --
    total_db_all = conn.execute(text(
        "SELECT pg_size_pretty(pg_database_size(current_database()))"
    )).scalar()
    print(f"  Database total (incl. indexes & system): {total_db_all}")
    print()
