import os
from dotenv import load_dotenv, find_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv(find_dotenv(), override=True)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE clients ADD COLUMN IF NOT EXISTS platform VARCHAR DEFAULT 'instagram';"))
        conn.commit()
        print("Successfully added 'platform' column to 'clients' table.")
except Exception as e:
    print(f"Failed to alter table: {e}")
