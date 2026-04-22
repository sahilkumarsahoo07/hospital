import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    modality = Column(String, nullable=False, index=True) # CT, MR, CR, etc.
    content_html = Column(Text, nullable=False)
    is_global = Column(Boolean, default=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # None if global
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    author = relationship("User")
