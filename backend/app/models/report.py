from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)
    severity = Column(String(50), nullable=True)
    priority = Column(String(10), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="reports", foreign_keys=[user_id])
    assignee = relationship("User", foreign_keys=[assigned_to])
    ai_analysis = relationship("AIAnalysis", back_populates="report", uselist=False)
    status_history = relationship("ReportStatusHistory", back_populates="report", order_by="ReportStatusHistory.created_at")
    notes = relationship("AuthorityNote", back_populates="report", order_by="AuthorityNote.created_at")
