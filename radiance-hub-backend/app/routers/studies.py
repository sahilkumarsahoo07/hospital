from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime, timezone, date
import uuid

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.study import Study
from app.models.user import User
from app.models.billing import RateCard, RateRule, BillingLine
from app.schemas.study import StudyOut, StudyListResponse, TransitionBody, AssignBody, PatientOut, AssigneeOut

router = APIRouter(prefix="/studies", tags=["studies"])

ADMIN_ROLES = ["super_admin", "sub_admin"]

# Workflow state machine: {from_status: [(to_status, allowed_roles)]}
TRANSITIONS = {
    "FREE_POOL": [("ASSIGNED", ["super_admin", "sub_admin", "radiologist"])],
    "ASSIGNED": [
        ("IN_REPORTING", ["radiologist", "super_admin", "sub_admin"]),
        ("FREE_POOL", ["radiologist", "super_admin", "sub_admin"]),
    ],
    "IN_REPORTING": [
        ("SUBMITTED", ["radiologist", "super_admin", "sub_admin"]),
        ("FREE_POOL", ["radiologist", "super_admin", "sub_admin"]),
    ],
    "SUBMITTED": [
        ("IN_REPORTING", ["super_admin", "sub_admin", "radiologist"]),
        ("FINALIZED", ["super_admin", "sub_admin"]),
    ],
}


def is_radiologist_only(user: User) -> bool:
    roles = set(user.roles or [])
    return "radiologist" in roles and not roles.intersection({"super_admin", "sub_admin", "hospital", "diagnostic_centre"})


def serialize_study(study: Study, current_user: User) -> StudyOut:
    anon = is_radiologist_only(current_user)
    patient = PatientOut(
        id=study.patient_id,
        name=None if anon else study.patient_name,
        sex=study.patient_sex,
        birthDate=str(study.patient_birth_date) if study.patient_birth_date else None,
    )
    assignee = None
    if study.assignee:
        assignee = AssigneeOut(id=study.assignee.id, fullName=study.assignee.full_name)
    return StudyOut(
        id=study.id,
        studyInstanceUID=study.study_instance_uid,
        accessionNumber=study.accession_number,
        modality=study.modality,
        bodyPart=study.body_part,
        studyDate=str(study.study_date),
        description=study.description,
        patient=patient,
        status=study.status,
        assignee=assignee,
        referringHospital=None if anon else study.referring_hospital,
        referringCentre=None if anon else study.referring_centre,
        pacsSourceName=None if anon else study.pacs_source_name,
        reportVersion=study.report_version,
        updatedAt=study.updated_at,
        createdAt=study.created_at,
    )


@router.get("", response_model=StudyListResponse)
def list_studies(
    status: Optional[str] = None,
    modality: Optional[str] = None,
    bodyPart: Optional[str] = None,
    assigneeId: Optional[str] = None,
    mine: Optional[bool] = None,
    q: Optional[str] = None,
    page: int = 1,
    pageSize: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Study)
    if status:
        statuses = status.split(",")
        query = query.filter(Study.status.in_(statuses))
    if modality:
        mods = modality.split(",")
        query = query.filter(Study.modality.in_(mods))
    if bodyPart:
        query = query.filter(Study.body_part.ilike(f"%{bodyPart}%"))
    if assigneeId:
        query = query.filter(Study.assignee_id == assigneeId)
    if mine:
        query = query.filter(Study.assignee_id == current_user.id)
    if q:
        query = query.filter(or_(
            Study.study_instance_uid.ilike(f"%{q}%"),
            Study.patient_id.ilike(f"%{q}%"),
            Study.accession_number.ilike(f"%{q}%"),
        ))
    total = query.count()
    studies = query.order_by(Study.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    return StudyListResponse(
        items=[serialize_study(s, current_user) for s in studies],
        total=total,
        page=page,
        pageSize=pageSize,
    )


@router.get("/free-pool", response_model=StudyListResponse)
def free_pool(
    modality: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Study).filter(Study.status == "FREE_POOL")
    if modality:
        query = query.filter(Study.modality.in_(modality.split(",")))
    studies = query.order_by(Study.created_at.desc()).all()
    return StudyListResponse(items=[serialize_study(s, current_user) for s in studies], total=len(studies), page=1, pageSize=len(studies) or 50)


@router.get("/{study_id}", response_model=StudyOut)
def get_study(study_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return serialize_study(study, current_user)


@router.post("/{study_id}/transition", response_model=StudyOut)
def transition_study(
    study_id: str,
    body: TransitionBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    allowed = TRANSITIONS.get(study.status, [])
    valid_transition = next((t for t in allowed if t[0] == body.to), None)
    if not valid_transition:
        raise HTTPException(status_code=400, detail=f"Cannot transition from {study.status} to {body.to}")
    user_roles = set(current_user.roles or [])
    if not user_roles.intersection(valid_transition[1]):
        raise HTTPException(status_code=403, detail="Role not allowed for this transition")

    study.status = body.to
    study.updated_at = datetime.now(timezone.utc)
    if body.to == "ASSIGNED" and body.assigneeId:
        study.assignee_id = body.assigneeId
    elif body.to == "ASSIGNED" and "radiologist" in user_roles:
        study.assignee_id = current_user.id
    elif body.to == "FREE_POOL":
        study.assignee_id = None

    db.commit()
    db.refresh(study)
    return serialize_study(study, current_user)


@router.post("/{study_id}/claim", response_model=StudyOut)
def claim_study(study_id: str, current_user: User = Depends(require_roles("radiologist")), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study or study.status != "FREE_POOL":
        raise HTTPException(status_code=400, detail="Study not available to claim")
    study.status = "ASSIGNED"
    study.assignee_id = current_user.id
    study.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(study)
    return serialize_study(study, current_user)


@router.post("/{study_id}/assign", response_model=StudyOut)
def assign_study(study_id: str, body: AssignBody, current_user: User = Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    study.status = "ASSIGNED"
    study.assignee_id = body.assigneeId
    study.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(study)
    return serialize_study(study, current_user)


@router.post("/{study_id}/release", response_model=StudyOut)
def release_study(study_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study or study.status not in ("ASSIGNED", "IN_REPORTING"):
        raise HTTPException(status_code=400, detail="Cannot release study in current status")
    study.status = "FREE_POOL"
    study.assignee_id = None
    study.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(study)
    return serialize_study(study, current_user)


@router.post("/{study_id}/open", response_model=StudyOut)
def open_study(study_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study or study.status != "ASSIGNED":
        raise HTTPException(status_code=400, detail="Study must be ASSIGNED to open")
    study.status = "IN_REPORTING"
    study.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(study)
    return serialize_study(study, current_user)


@router.post("/{study_id}/finalize", response_model=StudyOut)
def finalize_study(study_id: str, current_user: User = Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study or study.status != "SUBMITTED":
        raise HTTPException(status_code=400, detail="Study must be SUBMITTED to finalize")
    study.status = "FINALIZED"
    study.updated_at = datetime.now(timezone.utc)
    # Lock billing lines
    lines = db.query(BillingLine).filter(BillingLine.study_id == study.id, BillingLine.status == "PENDING").all()
    for line in lines:
        line.status = "LOCKED"
        line.locked_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(study)
    return serialize_study(study, current_user)


@router.get("/{study_id}/viewer-url")
def viewer_url(study_id: str, current_user: User = Depends(get_current_user)):
    return {"url": f"http://localhost:8042/ohif?study={study_id}", "expiresAt": "2099-12-31T00:00:00Z"}
