from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse


class AIAnalysisResponse(BaseModel):
    id: int
    report_id: int
    detected_category: str
    severity: str
    confidence: float
    explanation: str
    recommended_action: str
    model_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthorityNoteResponse(BaseModel):
    id: int
    report_id: int
    author_id: int
    content: str
    created_at: datetime
    author: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class StatusHistoryResponse(BaseModel):
    id: int
    old_status: Optional[str]
    new_status: str
    note: Optional[str]
    created_at: datetime
    changer: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class ReportCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

    model_config = {"from_attributes": True}


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class ReportStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

    def validate_status(self):
        valid = {"PENDING", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"}
        if self.status not in valid:
            raise ValueError(f"Invalid status. Must be one of: {valid}")


class ReportResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    severity: Optional[str] = None
    priority: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    user: Optional[UserResponse] = None
    ai_analysis: Optional[AIAnalysisResponse] = None
    notes: Optional[list[AuthorityNoteResponse]] = []
    status_history: Optional[list[StatusHistoryResponse]] = []

    model_config = {"from_attributes": True}


class ReportListResponse(BaseModel):
    id: int
    user_id: int
    title: str
    category: str
    status: str
    severity: Optional[str] = None
    priority: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    ai_analysis: Optional[AIAnalysisResponse] = None

    model_config = {"from_attributes": True}


class AddNoteRequest(BaseModel):
    content: str
