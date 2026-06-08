"""
Run this ONCE to add instagram_handle column to your existing clients table.
Usage: python migrate.py
"""
from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE clients ADD COLUMN instagram_handle VARCHAR;"))
            conn.commit()
            print("✓ Added instagram_handle column to clients table.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("ℹ instagram_handle column already exists. Nothing to do.")
            else:
                print(f"✗ Migration error: {e}")

if __name__ == "__main__":
    migrate()
