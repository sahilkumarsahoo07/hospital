from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime, timezone
import io, csv

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.billing import RateCard, RateRule, BillingLine
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])
ADMIN_ROLES = ["super_admin", "sub_admin"]


def build_rate_card_out(rc: RateCard):
    return {
        "id": str(rc.id), "ownerId": str(rc.owner_id),
        "ownerName": rc.owner.full_name if rc.owner else "", "ownerRole": (rc.owner.roles or [""])[0],
        "currency": rc.currency, "defaultAmount": rc.default_amount, "active": rc.active,
        "effectiveFrom": rc.effective_from.isoformat(), "effectiveTo": rc.effective_to.isoformat() if rc.effective_to else None,
        "createdAt": rc.created_at.isoformat(), "updatedAt": rc.updated_at.isoformat(),
        "rules": [{"id": str(r.id), "modality": r.modality, "bodyPart": r.body_part, "amount": r.amount} for r in rc.rules],
    }


@router.get("/rate-cards")
def list_rate_cards(ownerRole: Optional[str] = None, ownerId: Optional[str] = None, active: Optional[bool] = None,
                    current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    q = db.query(RateCard)
    if active is not None:
        q = q.filter(RateCard.active == active)
    if ownerId:
        q = q.filter(RateCard.owner_id == ownerId)
    return [build_rate_card_out(rc) for rc in q.all()]


@router.get("/rate-cards/{card_id}")
def get_rate_card(card_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    rc = db.query(RateCard).filter(RateCard.id == card_id).first()
    if not rc:
        raise HTTPException(404, "Rate card not found")
    return build_rate_card_out(rc)


@router.get("/my-rate-card")
def my_rate_card(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    rc = db.query(RateCard).filter(RateCard.owner_id == current_user.id, RateCard.active == True).first()
    if not rc:
        raise HTTPException(404, "No active rate card found")
    return build_rate_card_out(rc)


@router.post("/rate-cards", status_code=201)
def create_rate_card(body: dict, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    rc = RateCard(owner_id=body.get("ownerId"), currency=body.get("currency", "INR"),
                  default_amount=body.get("defaultAmount"), active=body.get("active", True))
    db.add(rc)
    db.flush()
    for rule in body.get("rules", []):
        db.add(RateRule(rate_card_id=rc.id, modality=rule["modality"], body_part=rule.get("bodyPart"), amount=rule["amount"]))
    db.commit()
    db.refresh(rc)
    return build_rate_card_out(rc)


@router.put("/rate-cards/{card_id}")
def update_rate_card(card_id: str, body: dict, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    rc = db.query(RateCard).filter(RateCard.id == card_id).first()
    if not rc:
        raise HTTPException(404, "Rate card not found")
    if "currency" in body: rc.currency = body["currency"]
    if "defaultAmount" in body: rc.default_amount = body["defaultAmount"]
    if "active" in body: rc.active = body["active"]
    if "rules" in body:
        for old_rule in rc.rules:
            db.delete(old_rule)
        for rule in body["rules"]:
            db.add(RateRule(rate_card_id=rc.id, modality=rule["modality"], body_part=rule.get("bodyPart"), amount=rule["amount"]))
    rc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rc)
    return build_rate_card_out(rc)


@router.delete("/rate-cards/{card_id}", status_code=204)
def delete_rate_card(card_id: str, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    rc = db.query(RateCard).filter(RateCard.id == card_id).first()
    if not rc:
        raise HTTPException(404, "Rate card not found")
    rc.active = False
    db.commit()


def line_to_dict(line: BillingLine):
    return {
        "id": str(line.id), "kind": line.kind, "studyId": str(line.study_id),
        "studyInstanceUID": line.study_instance_uid, "modality": line.modality,
        "bodyPart": line.body_part, "partyId": str(line.party_id),
        "partyName": line.party.full_name if line.party else "",
        "partyRole": (line.party.roles or [""])[0] if line.party else "",
        "rateCardId": str(line.rate_card_id) if line.rate_card_id else None,
        "reportVersion": line.report_version, "amount": line.amount, "currency": line.currency,
        "status": line.status, "warning": line.warning,
        "createdAt": line.created_at.isoformat(), "lockedAt": line.locked_at.isoformat() if line.locked_at else None,
        "paidAt": line.paid_at.isoformat() if line.paid_at else None,
    }


@router.get("/lines")
def list_lines(kind: Optional[str] = None, partyId: Optional[str] = None, studyId: Optional[str] = None,
               status: Optional[str] = None, from_: Optional[str] = Query(None, alias="from"),
               to: Optional[str] = None, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    roles = set(current_user.roles or [])
    q = db.query(BillingLine)
    if "super_admin" not in roles and "sub_admin" not in roles:
        q = q.filter(BillingLine.party_id == current_user.id)
    if kind:
        q = q.filter(BillingLine.kind == kind)
    if partyId:
        q = q.filter(BillingLine.party_id == partyId)
    if studyId:
        q = q.filter(BillingLine.study_id == studyId)
    if status:
        q = q.filter(BillingLine.status.in_(status.split(",")))
    lines = q.order_by(BillingLine.created_at.desc()).all()
    subtotals: dict = {}
    for l in lines:
        subtotals[l.currency] = subtotals.get(l.currency, 0) + l.amount
    return {"items": [line_to_dict(l) for l in lines], "total": len(lines), "subtotalsByCurrency": subtotals}


@router.post("/lines/{line_id}/mark-paid")
def mark_paid(line_id: str, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    line = db.query(BillingLine).filter(BillingLine.id == line_id).first()
    if not line:
        raise HTTPException(404, "Line not found")
    line.status = "PAID"
    line.paid_at = datetime.now(timezone.utc)
    db.commit()
    return line_to_dict(line)


@router.post("/recalculate/{study_id}")
def recalculate(study_id: str, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    lines = db.query(BillingLine).filter(BillingLine.study_id == study_id).all()
    return [line_to_dict(l) for l in lines]
