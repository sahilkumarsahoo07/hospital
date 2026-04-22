import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    patient_uid = Column(String, nullable=False, index=True)   # e.g. MRN / DICOM PatientID
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)                     # M|F|O
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    clinical_history = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization")
    studies = relationship("Study", back_populates="patient_record",
                           foreign_keys="Study.patient_record_id")
