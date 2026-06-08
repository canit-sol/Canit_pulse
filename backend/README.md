# 🍱 Canit Pulse v2 — Full Stack Setup

## What's new in v2
- ✅ Client login system (JWT auth)
- ✅ Admin dashboard to manage clients + generate reports
- ✅ Personalized client portal — each client sees only their reports
- ✅ PostgreSQL — reports survive server restarts
- ✅ Create client logins directly from the admin panel

---

## 📁 File Structure

```
bento-v2/
├── backend/
│   ├── main.py              ← FastAPI app + page routes
│   ├── database.py          ← PostgreSQL models (User, Client, Report)
│   ├── auth.py              ← JWT tokens + password hashing
│   ├── routes.py            ← All API endpoints
│   ├── parser.py            ← PDF/DOCX/TXT text extractor
│   ├── ai_extractor.py      ← Groq AI data extraction
│   └── report_generator.py  ← Bento HTML builder
├── frontend/templates/
│   ├── login.html           ← Shared login page
│   ├── admin.html           ← SPOC admin dashboard
│   └── portal.html          ← Client portal
├── requirements.txt
├── .env.example
└── README.md
```

---

## ⚡ Setup (Step by Step)

### Step 1 — Install PostgreSQL
Download from https://www.postgresql.org/download/windows/
- Remember the password you set for the `postgres` user
- Default port is 5432 (keep it)

### Step 2 — Create the database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE bentoreports;
```

### Step 3 — Copy files from v1
Copy these files from your old bento-report folder into `bento-v2/backend/`:
- `parser.py`
- `ai_extractor.py`
- `report_generator.py`

### Step 4 — Install dependencies
```powershell
cd bento-v2
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 5 — Configure environment
```powershell
copy .env.example .env
```
Edit `.env` and set:
- `GROQ_API_KEY` — your Groq key
- `DATABASE_URL` — change `yourpassword` to your PostgreSQL password
- `SECRET_KEY` — change to any random string
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your login credentials

### Step 6 — Run
```powershell
cd backend
uvicorn main:app --reload --port 8000
```

On first run it will:
1. Create all database tables automatically
2. Create your admin account
3. Print the login details

---

## 🌐 Pages

| URL | Who uses it |
|-----|-------------|
| `http://localhost:8000/` | Login page (everyone) |
| `http://localhost:8000/admin` | SPOC admin dashboard |
| `http://localhost:8000/portal` | Client portal |
| `http://localhost:8000/report/{id}` | Individual report |

---

## 👤 How to add a client

1. Log in as admin → go to **Clients** tab
2. Click **+ New Client** → fill in name, industry, brand colour
3. Click **+ Login** on the client card → create their email + password
4. Share those credentials with your client
5. Go to **Generate Report** → select client → upload notes → generate

---

## 🔄 Workflow

```
Admin logs in
    ↓
Creates client (e.g. "Sharon Ply")
    ↓
Creates login for client (email + password)
    ↓
Uploads monthly notes → generates bento report
    ↓
Client logs in → sees their portal with all reports
    ↓
Client clicks any report → views full bento page
```
