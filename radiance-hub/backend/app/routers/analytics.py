from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.study import Study
from app.models.report import Report
from app.models.user import User
from app.models.billing import BillingLine

router = APIRouter(prefix="/analytics", tags=["analytics"])
ADMIN_ROLES = ["super_admin", "sub_admin"]


@router.get("/system")
def system_analytics(current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    total = db.query(Study).count()
    free_pool = db.query(Study).filter(Study.status == "FREE_POOL").count()
    in_reporting = db.query(Study).filter(Study.status == "IN_REPORTING").count()
    submitted = db.query(Study).filter(Study.status == "SUBMITTED").count()

    # Avg TAT (creation to FINALIZED) — approximate from all finalized studies
    finalized = db.query(Study).filter(Study.status == "FINALIZED").all()
    if finalized:
        tats = [(s.updated_at - s.created_at).total_seconds() / 3600 for s in finalized]
        avg_tat = round(sum(tats) / len(tats), 2)
    else:
        avg_tat = 0.0

    # Daily volume - last 14 days
    daily_volume = []
    for i in range(13, -1, -1):
        day = datetime.now(timezone.utc).date() - timedelta(days=i)
        count = db.query(Study).filter(
            Study.created_at >= datetime.combine(day, datetime.min.time()),
            Study.created_at < datetime.combine(day + timedelta(days=1), datetime.min.time()),
        ).count()
        daily_volume.append({"date": str(day), "count": count})

    # By status
    statuses = ["FREE_POOL", "ASSIGNED", "IN_REPORTING", "SUBMITTED", "FINALIZED"]
    by_status = [{"status": s, "count": db.query(Study).filter(Study.status == s).count()} for s in statuses]

    return {
        "totalStudies": total, "freePool": free_pool, "inReporting": in_reporting,
        "submitted": submitted, "avgTatHours": avg_tat,
        "dailyVolume": daily_volume, "byStatus": by_status,
    }


@router.get("/radiologists")
def radiologist_analytics(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    roles = set(current_user.roles or [])
    is_admin = bool(roles.intersection(ADMIN_ROLES))

    if is_admin:
        rads = db.query(User).filter(User.roles.any("radiologist")).all()
    else:
        rads = [current_user]

    now = datetime.now(timezone.utc)
    result = []
    for rad in rads:
        # Currently assigned or working on
        in_progress = db.query(Study).filter(
            Study.assignee_id == rad.id, 
            Study.status.in_(["assigned_to_doctor", "doctor_opened_report", "report_in_progress", "report_drafted"])
        ).count()
        
        # Finished within 24h
        submitted_24h = db.query(Study).filter(
            Study.assignee_id == rad.id, Study.status == "verification_pending",
            Study.updated_at >= now - timedelta(hours=24)).count()
            
        finalized_24h = db.query(Study).filter(
            Study.assignee_id == rad.id, Study.status.in_(["report_finalized", "report_completed"]),
            Study.updated_at >= now - timedelta(hours=24)).count()
            
        finalized_30d = db.query(Study).filter(
            Study.assignee_id == rad.id, Study.status.in_(["report_finalized", "report_completed"]),
            Study.updated_at >= now - timedelta(days=30)).count()

        # Rejection Rate (Verification rejects)
        all_studies = db.query(Study).filter(Study.assignee_id == rad.id).all()
        rejections = sum(1 for s in all_studies if s.revert_count > 0)
        rejection_rate = (rejections / len(all_studies) * 100) if len(all_studies) > 0 else 0.0

        # Modality mix
        modality_count = defaultdict(int)
        for s in all_studies:
            modality_count[s.modality] += 1
        by_modality = [{"modality": m, "count": c} for m, c in sorted(modality_count.items(), key=lambda x: -x[1])]

        result.append({
            "radiologistId": str(rad.id), "radiologistName": rad.full_name,
            "inProgress": in_progress, "submitted24h": submitted_24h,
            "finalized24h": finalized_24h, "finalized30d": finalized_30d,
            "rejectionRatePercentage": round(rejection_rate, 1),
            "avgReportingMinutes": 0, "byModality": by_modality,
        })
    return result


@router.get("/hospitals")
def hospital_analytics(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    roles = set(current_user.roles or [])
    is_admin = bool(roles.intersection(ADMIN_ROLES))

    now = datetime.now(timezone.utc)
    if is_admin:
        hospitals = db.query(User).filter(
            or_(User.roles.any("hospital"), User.roles.any("diagnostic_centre"))).all()
    else:
        hospitals = [current_user]

    result = []
    for h in hospitals:
        total = db.query(Study).filter(Study.referring_hospital == h.organization).count()
        awaiting = db.query(Study).filter(Study.referring_hospital == h.organization,
                                          Study.status.in_(["FREE_POOL", "ASSIGNED", "IN_REPORTING"])).count()
        finalized_30d = db.query(Study).filter(Study.referring_hospital == h.organization,
                                               Study.status == "FINALIZED",
                                               Study.updated_at >= now - timedelta(days=30)).count()
        result.append({
            "hospitalId": str(h.id), "hospitalName": h.organization or h.full_name,
            "uploadVolume": total, "awaitingReport": awaiting,
            "finalized30d": finalized_30d, "avgTatHours": 0,
        })
    return result


@router.get("/billing")
def billing_analytics(current_user=Depends(require_roles("super_admin")), db: Session = Depends(get_db)):
    lines = db.query(BillingLine).all()
    by_currency_payout: dict = {}
    by_currency_invoice: dict = {}
    outstanding = 0.0

    for line in lines:
        if line.kind == "PAYOUT":
            by_currency_payout[line.currency] = by_currency_payout.get(line.currency, 0) + line.amount
        else:
            by_currency_invoice[line.currency] = by_currency_invoice.get(line.currency, 0) + line.amount
        if line.status == "PENDING":
            outstanding += line.amount

    return {
        "payoutsByCurrency": by_currency_payout,
        "invoicesByCurrency": by_currency_invoice,
        "outstandingAmount": outstanding,
        "topRadiologists": [],
        "topClients": [],
    }
