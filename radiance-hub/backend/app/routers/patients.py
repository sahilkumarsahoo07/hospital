from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from app.database import get_db
from app.auth import get_current_user
from app.models.patient import Patient

router = APIRouter(prefix="/patients", tags=["patients"])

def serialize_patient(p: Patient):
    return {
        "id": str(p.id),
        "organizationId": str(p.organization_id) if p.organization_id else None,
        "patientUid": p.patient_uid,
        "name": p.name,
        "age": p.age,
        "gender": p.gender,
        "phone": p.phone,
        "email": p.email,
        "dateOfBirth": str(p.date_of_birth) if p.date_of_birth else None,
        "clinicalHistory": p.clinical_history,
        "createdAt": p.created_at.isoformat(),
        "updatedAt": p.updated_at.isoformat(),
    }

@router.get("")
def list_patients(
    q: Optional[str] = None,
    orgId: Optional[str] = None,
    page: int = 1,
    pageSize: int = 50,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)):

    query = db.query(Patient)
    if orgId:
        query = query.filter(Patient.organization_id == orgId)
    if q:
        query = query.filter(Patient.name.ilike(f"%{q}%") | Patient.patient_uid.ilike(f"%{q}%"))

    total = query.count()
    patients = query.order_by(Patient.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()

    return {
        "items": [serialize_patient(p) for p in patients],
        "total": total, "page": page, "pageSize": pageSize
    }

@router.get("/{patient_id}")
def get_patient(patient_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return serialize_patient(patient)

@router.put("/{patient_id}")
def update_patient(patient_id: str, body: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if "name" in body: patient.name = body["name"]
    if "age" in body: patient.age = body["age"]
    if "gender" in body: patient.gender = body["gender"]
    if "phone" in body: patient.phone = body["phone"]
    if "email" in body: patient.email = body["email"]
    if "clinicalHistory" in body: patient.clinical_history = body["clinicalHistory"]

    patient.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)
    return serialize_patient(patient)
