import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class StudyNote(Base):
    __tablename__ = "study_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_id = Column(UUID(as_uuid=True), ForeignKey("studies.id"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("study_notes.id"), nullable=True)  # reply
    note_type = Column(String, default="general")         # general|clinical|urgent
    content = Column(Text, nullable=False)
    is_public = Column(Boolean, default=True)             # False = private to author's org
    status = Column(String, default="open")               # open|resolved
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    study = relationship("Study", back_populates="notes")
    author = relationship("User")
