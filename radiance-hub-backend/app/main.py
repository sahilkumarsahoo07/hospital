from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, SessionLocal, Base
from app.seed import seed_database

# Import all models so Alembic/SQLAlchemy picks them up
from app.models import *  # noqa

from app.routers import (
    auth, users, cms, studies, reports, comments, billing, pacs, search, analytics,
    organizations, patients, notes, attachments, audit, locks, verification,
    templates, branding, sharing, follow_ups, print_history, realtime
)

app = FastAPI(
    title="Aspire Reporting Hub API",
    description="Backend for the Aspire teleradiology workflow platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the frontend (port 8080 or 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api prefix
app.include_router(auth, prefix="/api")
app.include_router(users, prefix="/api")
app.include_router(cms, prefix="/api")
app.include_router(studies, prefix="/api")
app.include_router(reports, prefix="/api")
app.include_router(comments, prefix="/api")
app.include_router(billing, prefix="/api")
app.include_router(pacs, prefix="/api")
app.include_router(search, prefix="/api")
app.include_router(analytics, prefix="/api")
app.include_router(organizations, prefix="/api")
app.include_router(patients, prefix="/api")
app.include_router(notes, prefix="/api")
app.include_router(attachments, prefix="/api")
app.include_router(audit, prefix="/api")
app.include_router(locks, prefix="/api")
app.include_router(verification, prefix="/api")
app.include_router(templates, prefix="/api")
app.include_router(branding, prefix="/api")
app.include_router(sharing, prefix="/api")
app.include_router(follow_ups, prefix="/api")
app.include_router(print_history, prefix="/api")

# Mount WebSocket router
app.include_router(realtime, prefix="/api")


@app.on_event("startup")
def startup():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Seed initial data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Aspire Reporting Hub API", "docs": "/docs", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
