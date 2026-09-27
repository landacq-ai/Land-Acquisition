from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def list_alerts(
    threshold: float = 75.0,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Projects at or above the risk threshold — the platform's live 'needs attention' feed."""
    rows = (
        db.query(models.Project)
        .filter(models.Project.risk_score >= threshold)
        .order_by(models.Project.risk_score.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "project_id": p.project_id,
            "state": p.state,
            "district": p.district,
            "project_type": p.project_type,
            "risk_score": p.risk_score,
            "risk_category": p.risk_category,
            "top_driver": p.top_driver_1,
            "location_name": p.location_name,
            "segment_label": p.segment_label,
        }
        for p in rows
    ]
