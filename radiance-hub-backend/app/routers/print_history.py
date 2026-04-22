from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.auth import get_current_user
from app.models.study import Study
from app.models.print_history import PrintHistory

router = APIRouter(prefix="/studies/{study_id}/print-history", tags=["print-history"])

def serialize_history(h: PrintHistory):
    return {
        "id": str(h.id),
        "studyId": str(h.study_id),
        "reportId": str(h.report_id),
        "userId": str(h.user_id) if h.user_id else None,
        "userName": h.user.full_name if h.user else "Public / QR Code",
        "printType": h.print_type,
        "ipAddress": h.ip_address,
        "createdAt": h.created_at.isoformat(),
    }

@router.get("")
def get_print_history(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(PrintHistory).filter(PrintHistory.study_id == study_id).order_by(PrintHistory.created_at.desc()).all()
    return [serialize_history(h) for h in history]

@router.post("")
def record_print(study_id: str, body: dict, request: Request, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    client_ip = request.client.host if request.client else None
    
    # We would normally determine report_id by the active/latest report.
    # For now, just require it from the client or derive it if missing.
    report_id_str = body.get("reportId")
    
    if not report_id_str:
        raise HTTPException(status_code=400, detail="reportId is required")

    history = PrintHistory(
        study_id=study.id,
        report_id=uuid.UUID(report_id_str),
        user_id=current_user.id,
        print_type=body.get("printType", "pdf_download"),
        ip_address=client_ip
    )
    db.add(history)
    
    study.print_count += 1
    db.commit()
    db.refresh(history)
    return serialize_history(history)
