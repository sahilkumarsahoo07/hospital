import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Date, Integer, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

# Full 14-state PACS workflow
WORKFLOW_STATES = [
    "new_study_received",
    "pending_assignment",
    "assigned_to_doctor",
    "doctor_opened_report",
    "report_in_progress",
    "report_drafted",
    "report_finalized",
    "verification_pending",
    "report_verified",
    "report_rejected",
    "revert_to_radiologist",
    "report_completed",
    "final_report_downloaded",
    "archived",
    # Legacy / API-contract states (kept for backward compat)
    "FREE_POOL", "ASSIGNED", "IN_REPORTING", "SUBMITTED", "FINALIZED",
]

PRIORITY_LEVELS = ["NORMAL", "STAT", "PRIORITY", "MLC", "EMERGENCY"]


class Study(Base):
    __tablename__ = "studies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Organization context ──
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)

    # ── DICOM / Imaging ──
    study_instance_uid = Column(String, unique=True, nullable=False, index=True)
    accession_number = Column(String, nullable=True)
    modality = Column(String, nullable=False)
    body_part = Column(String, nullable=True)
    study_date = Column(Date, nullable=False)
    description = Column(String, nullable=True)

    # ── Patient (inline DICOM fields for quick lookup) ──
    patient_id = Column(String, nullable=False)
    patient_name = Column(String, nullable=True)
    patient_sex = Column(String, nullable=True)
    patient_birth_date = Column(Date, nullable=True)

    # ── Patient record FK (separate Patient table) ──
    patient_record_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=True)

    # ── Workflow ──
    status = Column(String, default="pending_assignment")
    priority = Column(String, default="NORMAL")           # NORMAL|STAT|PRIORITY|MLC|EMERGENCY
    due_date = Column(DateTime(timezone=True), nullable=True)

    # ── Assignment ──
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verifier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    typist_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assignor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # ── Referral info (nulled out for radiologists = anonymization) ──
    referring_hospital = Column(String, nullable=True)
    referring_centre = Column(String, nullable=True)
    pacs_source_name = Column(String, nullable=True)

    # ── Report ──
    report_version = Column(Integer, nullable=True)

    # ── Counters (denormalized for worklist perf) ──
    note_count = Column(Integer, default=0)
    attachment_count = Column(Integer, default=0)
    print_count = Column(Integer, default=0)
    revert_count = Column(Integer, default=0)

    # ── Flags ──
    has_follow_up = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)

    # ── Soft delete ──
    is_deleted = Column(Boolean, default=False)
    deleted_reason = Column(String, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # ── Relationships ──
    organization = relationship("Organization")
    assignee = relationship("User", foreign_keys=[assignee_id])
    verifier = relationship("User", foreign_keys=[verifier_id])
    typist = relationship("User", foreign_keys=[typist_id])
    assignor = relationship("User", foreign_keys=[assignor_id])
    patient_record = relationship("Patient", back_populates="studies", foreign_keys=[patient_record_id])
    reports = relationship("Report", back_populates="study", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="study", cascade="all, delete-orphan")
    notes = relationship("StudyNote", back_populates="study", cascade="all, delete-orphan")
    attachments = relationship("StudyAttachment", back_populates="study", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="study", cascade="all, delete-orphan")
    verifications = relationship("VerificationRecord", back_populates="study", cascade="all, delete-orphan")
