from fastapi import APIRouter, Query
from sqlalchemy import select, func, and_, case
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.core.deps import DBSession, AuthorityUser
from app.models.report import Report
from app.models.ai_analysis import AIAnalysis

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_overview(current_user: AuthorityUser, db: DBSession):
    # Total reports
    total = await db.scalar(select(func.count(Report.id)))
    
    # Pending
    pending = await db.scalar(
        select(func.count(Report.id)).where(Report.status == "PENDING")
    )
    
    # High/Critical
    high_critical = await db.scalar(
        select(func.count(Report.id)).where(Report.severity.in_(["HIGH", "CRITICAL"]))
    )
    
    # Resolved
    resolved = await db.scalar(
        select(func.count(Report.id)).where(Report.status == "RESOLVED")
    )
    
    # In Progress
    in_progress = await db.scalar(
        select(func.count(Report.id)).where(Report.status == "IN_PROGRESS")
    )
    
    # Average resolution time in hours (for resolved reports)
    result = await db.execute(
        select(Report.created_at, Report.resolved_at).where(
            and_(Report.status == "RESOLVED", Report.resolved_at.isnot(None))
        )
    )
    rows = result.all()
    avg_resolution_hours = None
    if rows:
        total_hours = sum(
            (r.resolved_at - r.created_at).total_seconds() / 3600
            for r in rows
            if r.resolved_at and r.created_at
        )
        avg_resolution_hours = round(total_hours / len(rows), 1)
    
    return {
        "total_reports": total or 0,
        "pending_reports": pending or 0,
        "high_critical_reports": high_critical or 0,
        "resolved_reports": resolved or 0,
        "in_progress_reports": in_progress or 0,
        "avg_resolution_hours": avg_resolution_hours,
    }


@router.get("/categories")
async def get_categories(current_user: AuthorityUser, db: DBSession):
    result = await db.execute(
        select(Report.category, func.count(Report.id).label("count"))
        .group_by(Report.category)
        .order_by(func.count(Report.id).desc())
    )
    rows = result.all()
    return [{"category": r.category, "count": r.count} for r in rows]


@router.get("/severity")
async def get_severity(current_user: AuthorityUser, db: DBSession):
    result = await db.execute(
        select(Report.severity, func.count(Report.id).label("count"))
        .where(Report.severity.isnot(None))
        .group_by(Report.severity)
    )
    rows = result.all()
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    return sorted(
        [{"severity": r.severity, "count": r.count} for r in rows],
        key=lambda x: severity_order.get(x["severity"], 99)
    )


@router.get("/trends")
async def get_trends(
    current_user: AuthorityUser,
    db: DBSession,
    days: int = Query(30, ge=7, le=365),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(Report.created_at, Report.status, Report.severity)
        .where(Report.created_at >= since)
        .order_by(Report.created_at)
    )
    rows = result.all()

    # Group by date
    from collections import defaultdict
    daily = defaultdict(lambda: {"date": "", "total": 0, "resolved": 0, "high_critical": 0})
    for row in rows:
        date_str = row.created_at.strftime("%Y-%m-%d")
        daily[date_str]["date"] = date_str
        daily[date_str]["total"] += 1
        if row.status == "RESOLVED":
            daily[date_str]["resolved"] += 1
        if row.severity in ("HIGH", "CRITICAL"):
            daily[date_str]["high_critical"] += 1

    return sorted(daily.values(), key=lambda x: x["date"])


@router.get("/hotspots")
async def get_hotspots(current_user: AuthorityUser, db: DBSession, limit: int = Query(20)):
    result = await db.execute(
        select(
            Report.id,
            Report.latitude,
            Report.longitude,
            Report.category,
            Report.severity,
            Report.status,
            Report.priority,
            Report.title,
            Report.created_at,
        )
        .where(
            and_(Report.latitude.isnot(None), Report.longitude.isnot(None))
        )
        .order_by(Report.created_at.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        {
            "id": r.id,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "category": r.category,
            "severity": r.severity,
            "status": r.status,
            "priority": r.priority,
            "title": r.title,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/status-distribution")
async def get_status_distribution(current_user: AuthorityUser, db: DBSession):
    result = await db.execute(
        select(Report.status, func.count(Report.id).label("count"))
        .group_by(Report.status)
    )
    rows = result.all()
    return [{"status": r.status, "count": r.count} for r in rows]
