import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class ReportBranding(Base):
    __tablename__ = "report_branding"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), unique=True, nullable=False, index=True)
    header_image_url = Column(String, nullable=True) # S3 or local path
    footer_image_url = Column(String, nullable=True)
    header_height_px = Column(Integer, default=150)
    footer_height_px = Column(Integer, default=100)
    watermark_image_url = Column(String, nullable=True)
    watermark_opacity = Column(Integer, default=20) # percentage
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization")
