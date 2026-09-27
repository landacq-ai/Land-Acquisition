import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..ml_service import get_risk_model
from ..auth import get_current_user, require_role
from .audit_router import log_action

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _record_to_dict(p: models.Project) -> dict:
    return {c: getattr(p, c) for c in schemas.ProjectBase.model_fields.keys()}


@router.get("", response_model=List[schemas.ProjectOut])
def list_projects(
    state: Optional[str] = None,
    district: Optional[str] = None,
    project_type: Optional[str] = None,
    risk_category: Optional[str] = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    q = db.query(models.Project)
    if state:
        q = q.filter(models.Project.state == state)
    if district:
        q = q.filter(models.Project.district == district)
    if project_type:
        q = q.filter(models.Project.project_type == project_type)
    if risk_category:
        q = q.filter(models.Project.risk_category == risk_category)
    return q.order_by(models.Project.risk_score.desc()).offset(offset).limit(limit).all()


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    p = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


@router.get("/{project_id}/risk", response_model=schemas.RiskExplanation)
def get_project_risk(project_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    p = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    risk_model = get_risk_model()
    result = risk_model.score(_record_to_dict(p))
    return {
        "project_id": project_id,
        "risk_score": result["risk_score"],
        "risk_category": result["risk_category"],
        "top_drivers": result["top_drivers"],
        "recommended_action": result["recommended_action"],
    }


@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin")),
):
    pid = project.project_id or str(uuid.uuid4())[:8]
    data = project.model_dump()
    data["project_id"] = pid

    risk_model = get_risk_model()
    result = risk_model.score({k: v for k, v in data.items() if k != "project_id"})

    db_project = models.Project(
        **{k: v for k, v in data.items()},
        risk_score=result["risk_score"],
        risk_category=result["risk_category"],
        top_driver_1=result["top_drivers"][0]["feature"] if len(result["top_drivers"]) > 0 else None,
        top_driver_2=result["top_drivers"][1]["feature"] if len(result["top_drivers"]) > 1 else None,
        top_driver_3=result["top_drivers"][2]["feature"] if len(result["top_drivers"]) > 2 else None,
        scored_at=datetime.utcnow(),
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    log_action(db, user["username"], "create_project", pid)
    return db_project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin")),
):
    p = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(p)
    db.commit()
    log_action(db, user["username"], "delete_project", project_id)
    return None


@router.post("/{project_id}/rescore", response_model=schemas.ProjectOut)
def rescore_project(project_id: str, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    p = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    risk_model = get_risk_model()
    result = risk_model.score(_record_to_dict(p))
    p.risk_score = result["risk_score"]
    p.risk_category = result["risk_category"]
    p.top_driver_1 = result["top_drivers"][0]["feature"] if len(result["top_drivers"]) > 0 else None
    p.top_driver_2 = result["top_drivers"][1]["feature"] if len(result["top_drivers"]) > 1 else None
    p.top_driver_3 = result["top_drivers"][2]["feature"] if len(result["top_drivers"]) > 2 else None
    p.scored_at = datetime.utcnow()
    db.commit()
    db.refresh(p)
    log_action(db, user["username"], "rescore_project", project_id)
    return p
