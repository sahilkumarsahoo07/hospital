from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, JSON
from app.database import Base


class LandingCms(Base):
    __tablename__ = "landing_cms"

    id = Column(Integer, primary_key=True, default=1)
    brand_name = Column(String, default="Aspire Reporting Hub")
    brand_tagline = Column(String, default="Reporting, refined.")
    hero_headline = Column(String, default="Quality\nin every read.")
    hero_subheadline = Column(String, default="A modern reporting hub built for clinicians.")
    hero_cta_label = Column(String, default="Sign in")
    hero_cta_href = Column(String, default="/login")
    nav = Column(JSON, default=lambda: [
        {"label": "Platform", "href": "#platform"},
        {"label": "Studio", "href": "#studio"},
        {"label": "Contact", "href": "#contact"},
    ])
    contact_email = Column(String, default="hello@aspirereporting.health")
    contact_phone = Column(String, default="")
    contact_address = Column(String, default="")
    footer_copyright = Column(String, default=f"© {datetime.now().year} Aspire Reporting Hub")
    footer_links = Column(JSON, default=list)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
