import os
import uuid
from datetime import datetime
from dotenv import load_dotenv, find_dotenv

# MUST LOAD ENV BEFORE EVERYTHING ELSE
load_dotenv(find_dotenv(), override=True)

from sqlalchemy import create_engine, Column, String, Text, DateTime, Boolean, ForeignKey, JSON, Integer, text, inspect, Date, Float

from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from supabase import create_client, Client

# 1. SUPABASE SDK SETUP
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("CRITICAL ERROR: SUPABASE_URL or SUPABASE_KEY is missing from the environment. Check your .env file!")
    
supabase: Client = create_client(url or "", key or "")

# 2. SQLALCHEMY DATABASE SETUP
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Ensure the 'platform' column exists on the clients table. This runs on app start.
def _ensure_platform_column():
    insp = inspect(engine)
    if 'clients' in insp.get_table_names():
        cols = [c['name'] for c in insp.get_columns('clients')]
        if 'platform' not in cols:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE clients ADD COLUMN platform VARCHAR DEFAULT 'instagram';"))
                conn.commit()
                print("Added missing 'platform' column to clients table.")
    else:
        print("WARNING: 'clients' table not found; cannot add platform column.")

_ensure_platform_column()

def _ensure_competitor_handle_column():
    insp = inspect(engine)
    if 'competitors' in insp.get_table_names():
        cols = [c['name'] for c in insp.get_columns('competitors')]
        if 'instagram_handle' not in cols:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE competitors ADD COLUMN instagram_handle VARCHAR;"))
                conn.commit()
                print("Added missing 'instagram_handle' column to competitors table.")

_ensure_competitor_handle_column()

def _ensure_website_url_column():
    insp = inspect(engine)
    if 'clients' in insp.get_table_names():
        cols = [c['name'] for c in insp.get_columns('clients')]
        if 'website_url' not in cols:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE clients ADD COLUMN website_url VARCHAR;"))
                conn.commit()
                print("Added missing 'website_url' column to clients table.")

_ensure_website_url_column()

def _ensure_client_logo_url_column():
    insp = inspect(engine)
    if 'clients' in insp.get_table_names():
        cols = [c['name'] for c in insp.get_columns('clients')]
        if 'client_logo_url' not in cols:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE clients ADD COLUMN client_logo_url VARCHAR;"))
                conn.commit()
                print("Added missing 'client_logo_url' column to clients table.")

_ensure_client_logo_url_column()

def _ensure_seo_columns():
    insp = inspect(engine)
    if 'clients' in insp.get_table_names():
        cols = [c['name'] for c in insp.get_columns('clients')]
        with engine.connect() as conn:
            if 'seo_pdf_filename' not in cols:
                conn.execute(text("ALTER TABLE clients ADD COLUMN seo_pdf_filename VARCHAR;"))
                print("Added missing 'seo_pdf_filename' column to clients table.")
            if 'seo_pdf_uploaded_at' not in cols:
                conn.execute(text("ALTER TABLE clients ADD COLUMN seo_pdf_uploaded_at TIMESTAMP;"))
                print("Added missing 'seo_pdf_uploaded_at' column to clients table.")
            if 'seo_metrics' not in cols:
                conn.execute(text("ALTER TABLE clients ADD COLUMN seo_metrics JSON;"))
                print("Added missing 'seo_metrics' column to clients table.")
            if 'seo_pdf_url' not in cols:
                conn.execute(text("ALTER TABLE clients ADD COLUMN seo_pdf_url VARCHAR;"))
                print("Added missing 'seo_pdf_url' column to clients table.")
            conn.commit()
            
    if 'monthly_seo_reports' in insp.get_table_names():
        cols_seo = [c['name'] for c in insp.get_columns('monthly_seo_reports')]
        if 'seo_metrics' not in cols_seo:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE monthly_seo_reports ADD COLUMN seo_metrics JSON;"))
                conn.commit()
                print("Added missing 'seo_metrics' column to monthly_seo_reports table.")

_ensure_seo_columns()

def _ensure_youtube_column():
    insp = inspect(engine)
    if 'clients' in insp.get_table_names():
        cols = [c['name'] for c in insp.get_columns('clients')]
        if 'youtube_channel_id' not in cols:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE clients ADD COLUMN youtube_channel_id VARCHAR;"))
                conn.commit()
                print("Added missing 'youtube_channel_id' column to clients table.")

        # Migrate data from old yt_channel_id → youtube_channel_id, then drop the old column
        cols = [c['name'] for c in insp.get_columns('clients')]
        if 'yt_channel_id' in cols:
            with engine.connect() as conn:
                conn.execute(text(
                    "UPDATE clients SET youtube_channel_id = yt_channel_id "
                    "WHERE yt_channel_id IS NOT NULL AND yt_channel_id != '' "
                    "AND (youtube_channel_id IS NULL OR youtube_channel_id = '')"
                ))
                conn.execute(text("ALTER TABLE clients DROP COLUMN yt_channel_id;"))
                conn.commit()
                print("Migrated data from 'yt_channel_id' → 'youtube_channel_id' and dropped old column.")

_ensure_youtube_column()


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# 3. MODELS

class User(Base):
    __tablename__ = "users"
    id           = Column(String, primary_key=True)
    email        = Column(String, unique=True, nullable=True, index=True)
    name         = Column(String, nullable=False)
    hashed_pw    = Column(String, nullable=False)
    role         = Column(String, default="client") 
    client_id    = Column(String, ForeignKey("clients.id"), nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    is_active    = Column(Boolean, default=True)
    username     = Column(String, unique=True, nullable=True)
    client = relationship("Client", back_populates="users")

class Client(Base):
    """Brands/Companies managed by the admin."""
    __tablename__ = "clients"
    __table_args__ = {'extend_existing': True}
    
    id               = Column(String, primary_key=True, index=True)
    name             = Column(String, nullable=False)
    industry         = Column(String)
    instagram_handle = Column(String)
    website_url      = Column(String, nullable=True)
    brand_color      = Column(String, default="#113a87")
    status           = Column(String, default="pending")
    
    # SEO PDF Reports
    seo_pdf_filename    = Column(String, nullable=True)
    seo_pdf_uploaded_at = Column(DateTime, nullable=True)
    seo_metrics         = Column(JSON, nullable=True)
    seo_pdf_url         = Column(String, nullable=True)
    client_logo_url     = Column(String, nullable=True)
    
    # Multi-Platform Token Management (Dynamic Slots)
    ig_access_token  = Column(String, nullable=True)
    ad_account_id    = Column(String, nullable=True)
    ig_user_id       = Column(String, nullable=True)
    fb_page_id       = Column(String, nullable=True)   
    fb_page_token    = Column(String, nullable=True)   
    x_user_id        = Column(String, nullable=True)    
    x_token          = Column(String, nullable=True)    
    youtube_channel_id = Column(String, nullable=True)
    platform         = Column(String, default="instagram")
    
    # Creative Tracker & Brand Management
    purpose                = Column(String, nullable=True)
    social_media_count     = Column(Integer, default=0)
    completed_creatives    = Column(Integer, default=0)
    
    reports     = relationship("Report", back_populates="client")
    users       = relationship("User", back_populates="client")
    competitors = relationship("Competitor", back_populates="client", cascade="all, delete-orphan")
    blogs       = relationship("ClientBlog", back_populates="client", cascade="all, delete-orphan")
    seo_reports = relationship("MonthlySEOReport", back_populates="client", cascade="all, delete-orphan")

class Competitor(Base):
    __tablename__ = "competitors"
    id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id      = Column(String, ForeignKey("clients.id"), nullable=False)
    name           = Column(String, nullable=False)
    revenue_est    = Column(Integer, default=0)    
    engagement_est    = Column(Integer, default=0) 
    is_client         = Column(Boolean, default=False)
    instagram_handle  = Column(String, nullable=True)
    client = relationship("Client", back_populates="competitors")

class Report(Base):
    __tablename__ = "reports"
    __table_args__ = {'extend_existing': True}
    id           = Column(String, primary_key=True, index=True)
    client_id    = Column(String, ForeignKey("clients.id"), nullable=False)
    month        = Column(String, nullable=False) 
    year         = Column(String, nullable=False)
    ig_data      = Column("raw_data", JSON, nullable=True)    
    ai_insight   = Column(Text, nullable=True)    
    html_content = Column(Text, nullable=True)    
    created_at   = Column(DateTime, default=datetime.utcnow)
    client = relationship("Client", back_populates="reports")

class SystemConfig(Base):
    """Lightweight key-value store for global platform settings."""
    __tablename__ = "system_config"
    __table_args__ = {'extend_existing': True}
    key   = Column(String, primary_key=True)
    value = Column(String, nullable=False)

class ContentCalendar(Base):
    __tablename__ = "content_calendar"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String, nullable=False)
    scheduled_date = Column(Date, nullable=False)
    post_type = Column(String, nullable=False, default='post')
    created_at = Column(DateTime, default=datetime.utcnow)

class ClientBlog(Base):
    """Automatically ingested website blogs for the client."""
    __tablename__ = "client_blogs"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    title = Column(Text, nullable=True)
    excerpt = Column(Text, nullable=True)
    url = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    client = relationship("Client", back_populates="blogs")

class IndustryBenchmark(Base):
    """Industry-level benchmark averages for the radar chart."""
    __tablename__ = "industry_benchmarks"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    industry = Column(String, nullable=False, unique=True)
    engagement_rate = Column(Float, default=50.0)
    frequency = Column(Float, default=50.0)
    reach_score = Column(Float, default=50.0)
    content_quality = Column(Float, default=50.0)
    growth = Column(Float, default=50.0)
    updated_at = Column(DateTime, default=datetime.utcnow)

class AnalyticsSnapshot(Base):
    """Historical snapshot of key analytics metrics, saved automatically after each report generation."""
    __tablename__ = "analytics_snapshots"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String, nullable=False, index=True)
    report_id = Column(String, nullable=True)
    month = Column(String, nullable=True)
    year = Column(String, nullable=True)
    platform = Column(String, default="instagram")
    followers = Column(Integer, default=0)
    total_reach = Column(Integer, default=0)
    total_impressions = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    total_likes = Column(Integer, default=0)
    total_comments = Column(Integer, default=0)
    total_saves = Column(Integer, default=0)
    post_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class ClientAccess(Base):
    __tablename__ = "client_access"
    id                  = Column(String, primary_key=True)
    client_id           = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    username            = Column(String, unique=True, nullable=False, index=True)
    password_hash       = Column(String, nullable=False)
    created_at          = Column(DateTime, default=datetime.utcnow)
    last_login          = Column(DateTime, nullable=True)
    is_active           = Column(Boolean, default=True)
    report_access_scope = Column(String, default="client")

    client = relationship("Client")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id          = Column(String, primary_key=True)
    user_id     = Column(String, nullable=False, index=True)
    token       = Column(String, unique=True, nullable=False, index=True)
    expires_at  = Column(DateTime, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)
    is_revoked  = Column(Boolean, default=False)

class LoginRateLimit(Base):
    __tablename__ = "login_rate_limits"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    ip_address    = Column(String, nullable=False, index=True)
    username      = Column(String, nullable=False, index=True)
    attempts      = Column(Integer, default=0)
    lockout_until = Column(DateTime, nullable=True)

class AccessAuditLog(Base):
    __tablename__ = "access_audit_logs"
    id         = Column(String, primary_key=True)
    timestamp  = Column(DateTime, default=datetime.utcnow)
    action     = Column(String, nullable=False)
    admin_id   = Column(String, nullable=True)
    client_id  = Column(String, nullable=True)
    ip_address = Column(String, nullable=False)
    metadata_json = Column("metadata", JSON, nullable=True)

class Deliverable(Base):
    __tablename__ = "deliverables"
    id           = Column(String, primary_key=True)
    client_id    = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    month        = Column(String, nullable=False)    # e.g. "June"
    year         = Column(String, nullable=False)     # e.g. "2026"
    title        = Column(String, nullable=False)
    platform     = Column(String, default="General")  # Instagram / Facebook / Blogs & SEO / General
    status       = Column(String, default="todo")     # todo / in_progress / done
    internal_notes = Column(String, default="")
    assigned_to  = Column(String, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MonthlySEOReport(Base):
    __tablename__ = "monthly_seo_reports"
    id           = Column(String, primary_key=True)
    client_id    = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    month        = Column(String, nullable=False)     # e.g. "January" or "June"
    year         = Column(String, nullable=False)      # e.g. "2026"
    filename     = Column(String, nullable=False)
    url          = Column(String, nullable=False)
    uploaded_at  = Column(DateTime, default=datetime.utcnow)
    seo_metrics  = Column(JSON, nullable=True)

    client       = relationship("Client", back_populates="seo_reports")

# 4. HELPERS
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_config(key: str, default: str = "") -> str:
    """Read a value from the system_config table."""
    db = SessionLocal()
    try:
        row = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        return row.value if row else default
    finally:
        db.close()

def set_config(key: str, value: str):
    """Write a value to the system_config table (upsert)."""
    db = SessionLocal()
    try:
        row = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if row:
            row.value = value
        else:
            db.add(SystemConfig(key=key, value=value))
        db.commit()
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'content_calendar' AND column_name = 'post_type'
            """))
            if not result.fetchone():
                conn.execute(text("ALTER TABLE content_calendar ADD COLUMN post_type VARCHAR(20) DEFAULT 'post';"))
                conn.commit()

            # Initialize public SELECT/INSERT/UPDATE policies for storage buckets if they do not exist
            policy_sql = """
            DO $$
            BEGIN
              -- post-thumbnails
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Access for post-thumbnails'
              ) THEN
                CREATE POLICY "Public Access for post-thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'post-thumbnails');
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Insert for post-thumbnails'
              ) THEN
                CREATE POLICY "Public Insert for post-thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-thumbnails');
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Update for post-thumbnails'
              ) THEN
                CREATE POLICY "Public Update for post-thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'post-thumbnails');
              END IF;
              
              -- client-logos
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Access for client-logos'
              ) THEN
                CREATE POLICY "Public Access for client-logos" ON storage.objects FOR SELECT USING (bucket_id = 'client-logos');
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Insert for client-logos'
              ) THEN
                CREATE POLICY "Public Insert for client-logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'client-logos');
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Update for client-logos'
              ) THEN
                CREATE POLICY "Public Update for client-logos" ON storage.objects FOR UPDATE USING (bucket_id = 'client-logos');
              END IF;
              
              -- seo-reports
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Access for seo-reports'
              ) THEN
                CREATE POLICY "Public Access for seo-reports" ON storage.objects FOR SELECT USING (bucket_id = 'seo-reports');
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Insert for seo-reports'
              ) THEN
                CREATE POLICY "Public Insert for seo-reports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'seo-reports');
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' 
                  AND tablename = 'objects' 
                  AND policyname = 'Public Update for seo-reports'
              ) THEN
                CREATE POLICY "Public Update for seo-reports" ON storage.objects FOR UPDATE USING (bucket_id = 'seo-reports');
              END IF;
            END
            $$;
            """
            conn.execute(text(policy_sql))
            conn.commit()
            print("Supabase Storage Policies initialized.")
    except Exception as e:
        print("Schema / Storage Policy update notice (non-fatal):", e)
    print("Database tables initialized in Supabase.")

def seed_admin(email, password, name="Admin"):
    from auth import hash_password
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            admin = User(id=str(uuid.uuid4()), email=email, name=name, hashed_pw=hash_password(password), role="admin")
            db.add(admin)
        else:
            existing.hashed_pw = hash_password(password)
        db.commit()
    finally:
        db.close()