import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class PrintHistory(Base):
    __tablename__ = "print_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_id = Column(UUID(as_uuid=True), ForeignKey("studies.id"), nullable=False, index=True)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # None if via public QR code
    print_type = Column(String, nullable=False) # pdf_download|docx_download|physical_print
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    study = relationship("Study")
    report = relationship("Report")
    user = relationship("User")
