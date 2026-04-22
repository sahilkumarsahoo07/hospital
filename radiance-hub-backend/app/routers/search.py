from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.auth import get_current_user
from app.models.study import Study

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    q: Optional[str] = None,
    modality: Optional[str] = None,
    status: Optional[str] = None,
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = None,
    page: int = 1,
    pageSize: int = 20,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Study)
    if q:
        query = query.filter(or_(
            Study.study_instance_uid.ilike(f"%{q}%"),
            Study.patient_id.ilike(f"%{q}%"),
            Study.patient_name.ilike(f"%{q}%"),
            Study.accession_number.ilike(f"%{q}%"),
            Study.modality.ilike(f"%{q}%"),
            Study.body_part.ilike(f"%{q}%"),
        ))
    if modality:
        query = query.filter(Study.modality.in_(modality.split(",")))
    if status:
        query = query.filter(Study.status.in_(status.split(",")))

    total = query.count()
    studies = query.order_by(Study.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()

    roles = set(current_user.roles or [])
    is_rad_only = "radiologist" in roles and not roles.intersection({"super_admin", "sub_admin"})

    items = []
    for s in studies:
        items.append({
            "id": str(s.id),
            "studyInstanceUID": s.study_instance_uid,
            "modality": s.modality,
            "bodyPart": s.body_part,
            "studyDate": str(s.study_date),
            "status": s.status,
            "patientId": s.patient_id,
            "patientName": "Anonymous Referral Case" if is_rad_only else s.patient_name,
            "description": s.description,
        })

    return {"items": items, "total": total, "page": page, "pageSize": pageSize}
