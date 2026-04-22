from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user
from app.models.study import Study
from app.models.report import Report
from app.schemas.report import ReportOut, ReportBundleOut, ReportSaveBody

router = APIRouter(tags=["reports"])


def report_to_out(r: Report) -> ReportOut:
    return ReportOut(
        id=r.id,
        studyId=r.study_id,
        status=r.status,
        contentHtml=r.content_html,
        contentText=r.content_text,
        version=r.version,
        authorId=r.author_id,
        authorName=r.author.full_name if r.author else "Unknown",
        createdAt=r.created_at,
        updatedAt=r.updated_at,
        submittedAt=r.submitted_at,
        finalizedAt=r.finalized_at,
    )


@router.get("/studies/{study_id}/report", response_model=ReportBundleOut)
def get_report(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    draft = db.query(Report).filter(Report.study_id == study_id, Report.status == "DRAFT").first()
    latest = (
        db.query(Report)
        .filter(Report.study_id == study_id, Report.status.in_(["SUBMITTED", "FINALIZED"]))
        .order_by(Report.version.desc())
        .first()
    )
    return ReportBundleOut(
        draft=report_to_out(draft) if draft else None,
        latest=report_to_out(latest) if latest else None,
    )


@router.put("/studies/{study_id}/report", response_model=ReportOut)
def save_draft(study_id: str, body: ReportSaveBody, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    draft = db.query(Report).filter(Report.study_id == study_id, Report.status == "DRAFT").first()
    if not draft:
        draft = Report(study_id=study_id, author_id=current_user.id, status="DRAFT", version=0)
        db.add(draft)
    draft.content_html = body.contentHtml
    draft.content_text = body.contentText
    draft.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(draft)
    return report_to_out(draft)


@router.post("/studies/{study_id}/report/submit", response_model=ReportOut)
def submit_report(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    draft = db.query(Report).filter(Report.study_id == study_id, Report.status == "DRAFT").first()
    if not draft:
        raise HTTPException(status_code=404, detail="No draft report found")
    latest_version = (
        db.query(Report)
        .filter(Report.study_id == study_id, Report.status == "SUBMITTED")
        .order_by(Report.version.desc())
        .first()
    )
    draft.version = (latest_version.version + 1) if latest_version else 1
    draft.status = "SUBMITTED"
    draft.submitted_at = datetime.now(timezone.utc)
    draft.updated_at = datetime.now(timezone.utc)
    study = db.query(Study).filter(Study.id == study_id).first()
    if study:
        study.status = "SUBMITTED"
        study.report_version = draft.version
        study.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(draft)
    return report_to_out(draft)


@router.get("/studies/{study_id}/report/versions", response_model=list[ReportOut])
def get_versions(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    reports = (
        db.query(Report)
        .filter(Report.study_id == study_id, Report.status.in_(["SUBMITTED", "FINALIZED"]))
        .order_by(Report.version.desc())
        .all()
    )
    return [report_to_out(r) for r in reports]
