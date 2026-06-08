from database import SessionLocal, User, Client, engine
from sqlalchemy import text

db = SessionLocal()

# 1. Add missing columns
with engine.connect() as conn:
    for col_def in [
        "is_active VARCHAR",
        "ig_access_token VARCHAR",
        "ig_user_id VARCHAR"
    ]:
        try:
            conn.execute(text(f"ALTER TABLE clients ADD COLUMN {col_def}"))
            conn.commit()
            print(f"Added: {col_def}")
        except Exception as e:
            print(f"Skip: {col_def} — {e}")

# 2. Set all clients active
with engine.connect() as conn:
    conn.execute(text("UPDATE clients SET is_active = 'true' WHERE is_active IS NULL"))
    conn.commit()
    print("All clients set active")

# 3. Remove old admin accounts
for email in ["admin@bentoreports.com", "jaishree@canit.in"]:
    u = db.query(User).filter(User.email == email).first()
    if u:
        db.delete(u)
        print(f"Deleted user: {email}")

db.commit()

# 4. Final state
print("\n=== USERS ===")
for u in db.query(User).all():
    print(f"{u.email} | role={u.role} | client_id={u.client_id}")

print("\n=== CLIENTS ===")
for c in db.query(Client).all():
    print(f"{c.id[:8]} | {c.name} | {c.instagram_handle}")

db.close()
print("\nDone.")
