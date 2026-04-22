from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.auth import require_roles
from app.models.organization import Organization

router = APIRouter(prefix="/organizations", tags=["organizations"])

ADMIN_ROLES = ["super_admin", "sub_admin"]

def serialize_org(org: Organization):
    return {
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "type": org.type,
        "address": org.address,
        "phone": org.phone,
        "email": org.email,
        "website": org.website,
        "isActive": org.is_active,
        "reportVerificationEnabled": org.report_verification_enabled,
        "compressionEnabled": org.compression_enabled,
        "headerImageUrl": org.header_image_url,
        "footerImageUrl": org.footer_image_url,
    }

@router.get("")
def list_organizations(current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    orgs = db.query(Organization).order_by(Organization.name).all()
    return [serialize_org(o) for o in orgs]

@router.post("", status_code=201)
def create_organization(body: dict, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    if db.query(Organization).filter(Organization.slug == body["slug"]).first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    org = Organization(
        name=body["name"],
        slug=body["slug"],
        type=body.get("type", "diagnostic_centre"),
        address=body.get("address"),
        phone=body.get("phone"),
        email=body.get("email"),
        website=body.get("website"),
        is_active=body.get("isActive", True),
        report_verification_enabled=body.get("reportVerificationEnabled", True),
        compression_enabled=body.get("compressionEnabled", False),
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return serialize_org(org)

@router.get("/{org_id}")
def get_organization(org_id: str, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return serialize_org(org)

@router.put("/{org_id}")
def update_organization(org_id: str, body: dict, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if "name" in body: org.name = body["name"]
    if "type" in body: org.type = body["type"]
    if "address" in body: org.address = body["address"]
    if "phone" in body: org.phone = body["phone"]
    if "email" in body: org.email = body["email"]
    if "website" in body: org.website = body["website"]
    if "isActive" in body: org.is_active = body["isActive"]
    if "reportVerificationEnabled" in body: org.report_verification_enabled = body["reportVerificationEnabled"]
    if "compressionEnabled" in body: org.compression_enabled = body["compressionEnabled"]

    org.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(org)
    return serialize_org(org)
