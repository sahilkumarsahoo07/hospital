from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.report_branding import ReportBranding
from app.models.organization import Organization

router = APIRouter(prefix="/organizations/{org_id}/branding", tags=["branding"])

ADMIN_ROLES = ["super_admin", "sub_admin"]

def serialize_branding(b: ReportBranding):
    return {
        "id": str(b.id),
        "organizationId": str(b.organization_id),
        "headerImageUrl": b.header_image_url,
        "footerImageUrl": b.footer_image_url,
        "headerHeightPx": b.header_height_px,
        "footerHeightPx": b.footer_height_px,
        "watermarkImageUrl": b.watermark_image_url,
        "watermarkOpacity": b.watermark_opacity,
        "isActive": b.is_active,
    }

@router.get("")
def get_branding(org_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    branding = db.query(ReportBranding).filter(ReportBranding.organization_id == org_id).first()
    if not branding:
        # Return default structure if nothing configured
        return {
            "organizationId": org_id,
            "headerImageUrl": None,
            "footerImageUrl": None,
            "headerHeightPx": 150,
            "footerHeightPx": 100,
            "watermarkImageUrl": None,
            "watermarkOpacity": 20,
            "isActive": False
        }
    return serialize_branding(branding)

@router.put("")
def update_branding(org_id: str, body: dict, current_user=Depends(require_roles(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    branding = db.query(ReportBranding).filter(ReportBranding.organization_id == org_id).first()
    if not branding:
        branding = ReportBranding(organization_id=org.id)
        db.add(branding)

    if "headerImageUrl" in body: branding.header_image_url = body["headerImageUrl"]
    if "footerImageUrl" in body: branding.footer_image_url = body["footerImageUrl"]
    if "headerHeightPx" in body: branding.header_height_px = body["headerHeightPx"]
    if "footerHeightPx" in body: branding.footer_height_px = body["footerHeightPx"]
    if "watermarkImageUrl" in body: branding.watermark_image_url = body["watermarkImageUrl"]
    if "watermarkOpacity" in body: branding.watermark_opacity = body["watermarkOpacity"]
    if "isActive" in body: branding.is_active = body["isActive"]

    branding.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(branding)
    return serialize_branding(branding)
