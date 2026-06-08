import sys
sys.path.append('backend')
from database import engine, text
conn = engine.connect()
rows = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'client_blogs'")).fetchall()
for r in rows:
    print(r)
conn.close()
