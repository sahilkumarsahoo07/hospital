import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class StudyShare(Base):
    __tablename__ = "study_shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_id = Column(UUID(as_uuid=True), ForeignKey("studies.id"), nullable=False, index=True)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True) # Optional password protection
    expires_at = Column(DateTime(timezone=True), nullable=True)
    max_uses = Column(Integer, nullable=True)
    current_uses = Column(Integer, default=0)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    study = relationship("Study")
    creator = relationship("User")
