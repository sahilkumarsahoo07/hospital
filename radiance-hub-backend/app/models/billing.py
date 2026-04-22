import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class RateCard(Base):
    __tablename__ = "rate_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    currency = Column(String, default="INR")
    default_amount = Column(Float, nullable=True)
    active = Column(Boolean, default=True)
    effective_from = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    effective_to = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User")
    rules = relationship("RateRule", back_populates="rate_card", cascade="all, delete-orphan")


class RateRule(Base):
    __tablename__ = "rate_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rate_card_id = Column(UUID(as_uuid=True), ForeignKey("rate_cards.id"), nullable=False)
    modality = Column(String, nullable=False)
    body_part = Column(String, nullable=True)
    amount = Column(Float, nullable=False)

    rate_card = relationship("RateCard", back_populates="rules")


class BillingLine(Base):
    __tablename__ = "billing_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind = Column(String, nullable=False)           # PAYOUT|INVOICE
    study_id = Column(UUID(as_uuid=True), ForeignKey("studies.id"), nullable=False)
    study_instance_uid = Column(String, nullable=False)
    modality = Column(String, nullable=False)
    body_part = Column(String, nullable=True)
    party_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rate_card_id = Column(UUID(as_uuid=True), ForeignKey("rate_cards.id"), nullable=True)
    report_version = Column(Integer, default=1)
    amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String, default="INR")
    status = Column(String, default="PENDING")      # PENDING|LOCKED|VOID|SUPERSEDED|PAID
    warning = Column(String, nullable=True)         # MISSING_RULE
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    locked_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    party = relationship("User")
    study = relationship("Study")
