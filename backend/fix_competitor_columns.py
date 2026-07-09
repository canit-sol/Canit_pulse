import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from sqlalchemy import create_engine, text, inspect

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
insp = inspect(engine)

if 'competitors' in insp.get_table_names():
    cols = [c['name'] for c in insp.get_columns('competitors')]
    print(f"Current columns in competitors: {cols}")
    with engine.connect() as conn:
        if 'style_summary' not in cols:
            conn.execute(text("ALTER TABLE competitors ADD COLUMN style_summary TEXT;"))
            print("Added style_summary to competitors table.")
        if 'posts_count' not in cols:
            conn.execute(text("ALTER TABLE competitors ADD COLUMN posts_count INTEGER DEFAULT 0;"))
            print("Added posts_count to competitors table.")
        if 'recent_likes' not in cols:
            conn.execute(text("ALTER TABLE competitors ADD COLUMN recent_likes INTEGER DEFAULT 0;"))
            print("Added recent_likes to competitors table.")
        conn.commit()
    print("Database columns fixed.")
else:
    print("competitors table not found.")
