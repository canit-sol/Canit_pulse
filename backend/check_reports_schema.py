import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from sqlalchemy import create_engine, inspect

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
insp = inspect(engine)

for table in ['reports', 'monthly_seo_reports']:
    if table in insp.get_table_names():
        cols = [c['name'] for c in insp.get_columns(table)]
        print(f"Table '{table}' columns: {cols}")
    else:
        print(f"Table '{table}' not found.")
