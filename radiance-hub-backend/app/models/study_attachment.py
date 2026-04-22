import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class StudyAttachment(Base):
    __tablename__ = "study_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_id = Column(UUID(as_uuid=True), ForeignKey("studies.id"), nullable=False, index=True)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf|docx|image/jpeg
    file_size_bytes = Column(Integer, nullable=False)
    storage_url = Column(String, nullable=False)  # S3 URL or local path
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    study = relationship("Study", back_populates="attachments")
    uploader = relationship("User")
