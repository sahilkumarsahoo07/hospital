import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_id = Column(UUID(as_uuid=True), ForeignKey("studies.id"), nullable=False, index=True)
    verifier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False)  # verified|rejected|reverted
    notes = Column(Text, nullable=True) # General verifier notes
    rejection_reason = Column(String, nullable=True) # specific reason
    correction_instructions = Column(Text, nullable=True) # instructions for radiologist
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    study = relationship("Study", back_populates="verifications")
    verifier = relationship("User")
