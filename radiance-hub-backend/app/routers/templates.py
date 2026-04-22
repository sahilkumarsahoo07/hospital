from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.report_template import ReportTemplate

router = APIRouter(prefix="/templates", tags=["templates"])

ADMIN_ROLES = ["super_admin", "sub_admin"]

def serialize_template(t: ReportTemplate):
    return {
        "id": str(t.id),
        "name": t.name,
        "modality": t.modality,
        "contentHtml": t.content_html,
        "isGlobal": t.is_global,
        "authorId": str(t.author_id) if t.author_id else None,
        "createdAt": t.created_at.isoformat(),
        "updatedAt": t.updated_at.isoformat(),
    }

@router.get("")
def list_templates(modality: Optional[str] = None, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(ReportTemplate)
    if modality:
        query = query.filter(ReportTemplate.modality == modality)
    
    # Filter: either global OR authored by current user
    # Admins can see all
    roles = set(current_user.roles or [])
    if not roles.intersection(ADMIN_ROLES):
        query = query.filter((ReportTemplate.is_global == True) | (ReportTemplate.author_id == current_user.id))

    templates = query.all()
    return [serialize_template(t) for t in templates]

@router.post("")
def create_template(body: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    is_global = body.get("isGlobal", False)
    roles = set(current_user.roles or [])
    
    if is_global and not roles.intersection(ADMIN_ROLES):
        raise HTTPException(status_code=403, detail="Only admins can create global templates")

    template = ReportTemplate(
        name=body["name"],
        modality=body["modality"],
        content_html=body["contentHtml"],
        is_global=is_global,
        author_id=None if is_global else current_user.id
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return serialize_template(template)

@router.delete("/{template_id}")
def delete_template(template_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    roles = set(current_user.roles or [])
    if template.is_global and not roles.intersection(ADMIN_ROLES):
        raise HTTPException(status_code=403, detail="Only admins can delete global templates")
    elif not template.is_global and template.author_id != current_user.id and not roles.intersection(ADMIN_ROLES):
         raise HTTPException(status_code=403, detail="Not authorized to delete this template")

    db.delete(template)
    db.commit()
    return {"status": "deleted"}
