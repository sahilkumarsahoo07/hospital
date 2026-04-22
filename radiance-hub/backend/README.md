# Aspire Reporting Hub — Python Backend

A [FastAPI](https://fastapi.tiangolo.com/) backend for the Aspire teleradiology reporting platform, using PostgreSQL as the database.

## Folder Structure

```
Hospital/
├── radiance-hub/           ← React/TanStack Frontend  (port 8080)
└── radiance-hub-backend/   ← Python FastAPI Backend   (port 8000)  ← you are here
```

## Prerequisites

- Python 3.11+
- PostgreSQL installed and running locally
- `psql` command available in your PATH (or pgAdmin)

## Quick Start

### 1. Create the Database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE aspire_db;
```

### 2. Update `.env`
Edit `.env` and set your PostgreSQL password:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/aspire_db
```
*(Default is `postgres` as the password)*

### 3. Run the Backend
**Option A — One-click (Windows):**
```
Double-click start.bat
```

**Option B — Manual:**
```powershell
# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install packages
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload --port 8000
```

### 4. Verify Its Running
- Open: http://localhost:8000/docs
- You should see the Swagger API documentation.

## Seed Credentials

The backend auto-creates these accounts on first startup:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@aspire.local | admin123 |
| Radiologist | rad@aspire.local | rad123 |
| Hospital | hospital@aspire.local | hospital123 |
| Sub Admin | subadmin@aspire.local | subadmin123 |

## API Reference

All endpoints are prefixed with `/api`. See `/docs` for the full Swagger UI.

| Slice | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Users | `GET /api/users`, `POST /api/users/{id}/approve|reject|suspend` |
| CMS | `GET /api/cms/landing`, `PUT /api/cms/landing` |
| Studies | Full CRUD + workflow transitions |
| Reports | Draft, submit, versioned history |
| Billing | Rate cards, billing lines, CSV export |
| PACS | Endpoints, ingestion, logs, health |
| Search | `GET /api/search` |
| Analytics | System, radiologists, hospitals, billing |
