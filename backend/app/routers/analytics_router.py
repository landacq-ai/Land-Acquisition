from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/trends", response_model=List[schemas.TrendPoint])
def get_trends(
    group_by: str = Query("state", pattern="^(state|district|project_type)$"),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    col = getattr(models.Project, group_by)
    rows = (
        db.query(
            col.label("group"),
            func.count(models.Project.project_id).label("total"),
            func.sum(
                case((models.Project.risk_category.in_(["High", "Critical"]), 1), else_=0)
            ).label("high_risk"),
            func.avg(models.Project.risk_score).label("avg_risk"),
        )
        .group_by(col)
        .order_by(func.avg(models.Project.risk_score).desc())
        .all()
    )
    return [
        schemas.TrendPoint(
            group=r.group,
            total_projects=r.total,
            high_risk_count=int(r.high_risk or 0),
            avg_risk_score=round(float(r.avg_risk or 0), 1),
        )
        for r in rows
    ]


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    total = db.query(func.count(models.Project.project_id)).scalar()
    by_category = (
        db.query(models.Project.risk_category, func.count(models.Project.project_id))
        .group_by(models.Project.risk_category)
        .all()
    )
    return {
        "total_projects": total,
        "by_risk_category": {cat: count for cat, count in by_category},
    }
