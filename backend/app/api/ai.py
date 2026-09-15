from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.deps import DBSession, CurrentUser
from app.models.report import Report
from app.models.ai_analysis import AIAnalysis
from app.models.report_status_history import ReportStatusHistory
from app.ai.factory import get_ai_service_singleton
from app.schemas.report import AIAnalysisResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])


@router.post("/analyze/{report_id}", response_model=AIAnalysisResponse)
async def analyze_report(
    report_id: int,
    current_user: CurrentUser,
    db: DBSession,
):
    # Load report
    result = await db.execute(
        select(Report).options(selectinload(Report.ai_analysis))
        .where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check permission
    if current_user.role == "citizen" and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # If already analyzed: citizens see cached result, authority can re-run
    if report.ai_analysis and current_user.role == "citizen":
        return report.ai_analysis

    # Run AI analysis
    ai_service = get_ai_service_singleton()
    try:
        analysis_result = await ai_service.analyze(
            description=report.description,
            category=report.category,
            image_path=report.image_url,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    # Store or update in DB
    if report.ai_analysis:
        # Update existing record in-place
        ai_record = report.ai_analysis
        ai_record.detected_category = analysis_result.detected_category
        ai_record.severity = analysis_result.severity
        ai_record.confidence = analysis_result.confidence
        ai_record.explanation = analysis_result.explanation
        ai_record.recommended_action = analysis_result.recommended_action
        ai_record.model_name = analysis_result.model_name
        ai_record.raw_response = analysis_result.raw_response
        ai_record.created_at = datetime.now(timezone.utc)
    else:
        ai_record = AIAnalysis(
            report_id=report_id,
            detected_category=analysis_result.detected_category,
            severity=analysis_result.severity,
            confidence=analysis_result.confidence,
            explanation=analysis_result.explanation,
            recommended_action=analysis_result.recommended_action,
            model_name=analysis_result.model_name,
            raw_response=analysis_result.raw_response,
        )
        db.add(ai_record)

    # Update report severity and priority
    report.severity = analysis_result.severity
    report.priority = analysis_result.priority
    report.updated_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(ai_record)
    return ai_record

