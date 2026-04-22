import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class PacsEndpoint(Base):
    __tablename__ = "pacs_endpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, default="orthanc")    # orthanc|dicomweb|dimse
    base_url = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    ingested_24h = Column(Integer, default=0)
    rejected_24h = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class IngestionEvent(Base):
    __tablename__ = "ingestion_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    endpoint_id = Column(UUID(as_uuid=True), nullable=False)
    study_id = Column(UUID(as_uuid=True), nullable=True)
    study_instance_uid = Column(String, nullable=True)
    status = Column(String, default="ingested")   # ingested|rejected|pending
    anonymized = Column(Boolean, default=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    endpoint_id = Column(UUID(as_uuid=True), nullable=False)
    level = Column(String, default="info")        # info|warn|error
    op = Column(String, nullable=True)            # c-find|qido|poll|auth|...
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
