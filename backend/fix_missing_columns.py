import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from sqlalchemy import create_engine, text, inspect

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL not found in .env")

engine = create_engine(DATABASE_URL)
insp = inspect(engine)

if 'clients' in insp.get_table_names():
    cols = [c['name'] for c in insp.get_columns('clients')]
    with engine.connect() as conn:
        # Check purpose
        if 'purpose' not in cols:
            conn.execute(text("ALTER TABLE clients ADD COLUMN purpose VARCHAR;"))
            print("Added missing 'purpose' column to clients table.")
        # Check social_media_count
        if 'social_media_count' not in cols:
            conn.execute(text("ALTER TABLE clients ADD COLUMN social_media_count INTEGER DEFAULT 0;"))
            print("Added missing 'social_media_count' column to clients table.")
        # Check completed_creatives
        if 'completed_creatives' not in cols:
            conn.execute(text("ALTER TABLE clients ADD COLUMN completed_creatives INTEGER DEFAULT 0;"))
            print("Added missing 'completed_creatives' column to clients table.")
        conn.commit()
    print("Database check completed successfully.")
else:
    print("clients table not found.")
