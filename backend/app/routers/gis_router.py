from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/gis", tags=["gis"])


@router.get("/projects", response_model=List[schemas.GeoPoint])
def get_geo_projects(
    min_risk: Optional[float] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Returns projects that have known coordinates, for map visualization.
    Projects without latitude/longitude (not yet geocoded) are excluded.
    """
    q = db.query(models.Project).filter(
        models.Project.latitude.isnot(None),
        models.Project.longitude.isnot(None),
    )
    if min_risk is not None:
        q = q.filter(models.Project.risk_score >= min_risk)

    rows = q.all()
    return [
        schemas.GeoPoint(
            project_id=p.project_id,
            location_name=p.location_name,
            segment_label=p.segment_label,
            latitude=p.latitude,
            longitude=p.longitude,
            risk_score=p.risk_score,
            risk_category=p.risk_category,
            project_type=p.project_type,
        )
        for p in rows
    ]
