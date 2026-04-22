from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.cms import LandingCms
from app.schemas.misc import LandingCmsOut, LandingCmsUpdate

router = APIRouter(prefix="/cms", tags=["cms"])


def get_or_create_cms(db: Session) -> LandingCms:
    cms = db.query(LandingCms).filter(LandingCms.id == 1).first()
    if not cms:
        cms = LandingCms(id=1)
        db.add(cms)
        db.commit()
        db.refresh(cms)
    return cms


def cms_to_out(cms: LandingCms) -> LandingCmsOut:
    return LandingCmsOut(
        brand={"name": cms.brand_name, "tagline": cms.brand_tagline},
        hero={
            "headline": cms.hero_headline,
            "subheadline": cms.hero_subheadline,
            "ctaLabel": cms.hero_cta_label,
            "ctaHref": cms.hero_cta_href,
        },
        nav=cms.nav or [],
        contact={"email": cms.contact_email, "phone": cms.contact_phone, "address": cms.contact_address},
        footer={"copyright": cms.footer_copyright, "links": cms.footer_links or []},
        version=cms.version,
        updatedAt=cms.updated_at,
    )


@router.get("/landing", response_model=LandingCmsOut)
def get_landing(db: Session = Depends(get_db)):
    return cms_to_out(get_or_create_cms(db))


@router.put("/landing", response_model=LandingCmsOut)
def update_landing(
    body: LandingCmsUpdate,
    current_user=Depends(require_roles("super_admin")),
    db: Session = Depends(get_db),
):
    cms = get_or_create_cms(db)
    if body.brand:
        cms.brand_name = body.brand.get("name", cms.brand_name)
        cms.brand_tagline = body.brand.get("tagline", cms.brand_tagline)
    if body.hero:
        cms.hero_headline = body.hero.get("headline", cms.hero_headline)
        cms.hero_subheadline = body.hero.get("subheadline", cms.hero_subheadline)
        cms.hero_cta_label = body.hero.get("ctaLabel", cms.hero_cta_label)
        cms.hero_cta_href = body.hero.get("ctaHref", cms.hero_cta_href)
    if body.nav is not None:
        cms.nav = body.nav
    if body.contact:
        cms.contact_email = body.contact.get("email", cms.contact_email)
        cms.contact_phone = body.contact.get("phone", cms.contact_phone)
        cms.contact_address = body.contact.get("address", cms.contact_address)
    if body.footer:
        cms.footer_copyright = body.footer.get("copyright", cms.footer_copyright)
        cms.footer_links = body.footer.get("links", cms.footer_links)
    cms.version += 1
    cms.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cms)
    return cms_to_out(cms)
