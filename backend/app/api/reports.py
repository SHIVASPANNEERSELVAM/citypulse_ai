import os
import uuid
import shutil
import asyncio
from typing import Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Query, BackgroundTasks
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

from app.core.deps import DBSession, CurrentUser, AuthorityUser
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.report import Report
from app.models.user import User
from app.models.ai_analysis import AIAnalysis
from app.models.report_status_history import ReportStatusHistory
from app.models.authority_note import AuthorityNote
from app.schemas.report import (
    ReportResponse, ReportListResponse, ReportCreate, ReportUpdate,
    ReportStatusUpdate, AddNoteRequest
)


async def _run_ai_analysis_background(report_id: int, description: str, category: str, image_url: Optional[str]):
    """Background task: runs AI analysis and persists the result."""
    try:
        from app.ai.factory import get_ai_service_singleton
        ai_service = get_ai_service_singleton()
        result = await ai_service.analyze(
            description=description,
            category=category,
            image_path=image_url,
        )
        async with AsyncSessionLocal() as db:
            async with db.begin():
                # Re-fetch report inside the new session
                res = await db.execute(select(Report).where(Report.id == report_id))
                report = res.scalar_one_or_none()
                if not report:
                    return
                # Upsert AI analysis
                res2 = await db.execute(select(AIAnalysis).where(AIAnalysis.report_id == report_id))
                ai_record = res2.scalar_one_or_none()
                if ai_record:
                    ai_record.detected_category = result.detected_category
                    ai_record.severity = result.severity
                    ai_record.confidence = result.confidence
                    ai_record.explanation = result.explanation
                    ai_record.recommended_action = result.recommended_action
                    ai_record.model_name = result.model_name
                    ai_record.raw_response = result.raw_response
                    ai_record.created_at = datetime.now(timezone.utc)
                else:
                    db.add(AIAnalysis(
                        report_id=report_id,
                        detected_category=result.detected_category,
                        severity=result.severity,
                        confidence=result.confidence,
                        explanation=result.explanation,
                        recommended_action=result.recommended_action,
                        model_name=result.model_name,
                        raw_response=result.raw_response,
                    ))
                report.severity = result.severity
                report.priority = result.priority
                report.updated_at = datetime.now(timezone.utc)
    except Exception as exc:
        print(f"[AI Background] Analysis failed for report {report_id}: {exc}")

router = APIRouter(prefix="/api/reports", tags=["Reports"])

VALID_STATUSES = {"PENDING", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"}
VALID_CATEGORIES = {
    "Garbage Accumulation", "Illegal Dumping", "Open Burning",
    "Smoke Pollution", "Plastic Waste", "Water Pollution", "Other"
}


def get_report_query():
    return select(Report).options(
        selectinload(Report.user),
        selectinload(Report.ai_analysis),
        selectinload(Report.notes).selectinload(AuthorityNote.author),
        selectinload(Report.status_history).selectinload(ReportStatusHistory.changer),
    )


@router.post("", response_model=ReportListResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: CurrentUser = None,
    db: DBSession = None,
):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Valid: {VALID_CATEGORIES}")

    image_url = None
    if image and image.filename:
        # Validate content type
        if image.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, or GIF images are allowed")

        # Validate file size (read first 10MB + 1 byte to check)
        content = await image.read()
        max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail=f"Image must be under {settings.MAX_UPLOAD_SIZE_MB}MB")

        # Save file
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(image.filename)[1].lower() or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(content)
        image_url = f"/uploads/{filename}"

    report = Report(
        user_id=current_user.id,
        title=title,
        description=description,
        category=category,
        latitude=latitude,
        longitude=longitude,
        address=address,
        image_url=image_url,
        status="PENDING",
    )
    db.add(report)
    await db.flush()

    # Record initial status in history
    history = ReportStatusHistory(
        report_id=report.id,
        old_status=None,
        new_status="PENDING",
        changed_by=current_user.id,
    )
    db.add(history)
    await db.commit()
    await db.refresh(report)

    # The frontend explicitly calls the AI analysis endpoint, so we don't need
    # to run it in the background here to avoid duplicate processing.

    result = await db.execute(
        get_report_query().where(Report.id == report.id)
    )
    return result.scalar_one()


@router.get("", response_model=list[ReportListResponse])
async def list_reports(
    current_user: CurrentUser,
    db: DBSession,
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    query = get_report_query()

    # Citizens only see their own reports
    if current_user.role == "citizen":
        query = query.where(Report.user_id == current_user.id)

    if status:
        query = query.where(Report.status == status)
    if category:
        query = query.where(Report.category == category)
    if severity:
        query = query.where(Report.severity == severity)

    query = query.order_by(Report.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        get_report_query().where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Citizens can only view their own reports
    if current_user.role == "citizen" and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return report


@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: int,
    update_data: ReportUpdate,
    current_user: CurrentUser,
    db: DBSession,
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if current_user.role == "citizen" and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(report, field, value)
    report.updated_at = datetime.now(timezone.utc)

    await db.flush()
    result = await db.execute(get_report_query().where(Report.id == report_id))
    return result.scalar_one()


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(report_id: int, current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if current_user.role == "citizen" and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role not in ("authority", "admin") and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(report)


@router.put("/{report_id}/status", response_model=ReportResponse)
async def update_status(
    report_id: int,
    status_update: ReportStatusUpdate,
    current_user: AuthorityUser,
    db: DBSession,
):
    if status_update.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {VALID_STATUSES}")

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    old_status = report.status
    report.status = status_update.status
    report.updated_at = datetime.now(timezone.utc)

    if status_update.status == "RESOLVED":
        report.resolved_at = datetime.now(timezone.utc)

    history = ReportStatusHistory(
        report_id=report_id,
        old_status=old_status,
        new_status=status_update.status,
        changed_by=current_user.id,
        note=status_update.note,
    )
    db.add(history)
    await db.flush()

    result = await db.execute(get_report_query().where(Report.id == report_id))
    return result.scalar_one()


@router.post("/{report_id}/notes", response_model=ReportResponse)
async def add_note(
    report_id: int,
    note_data: AddNoteRequest,
    current_user: AuthorityUser,
    db: DBSession,
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    note = AuthorityNote(
        report_id=report_id,
        author_id=current_user.id,
        content=note_data.content,
    )
    db.add(note)
    await db.flush()

    result = await db.execute(get_report_query().where(Report.id == report_id))
    return result.scalar_one()
