from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..auth import require_role

router = APIRouter(prefix="/api/audit-log", tags=["audit"])


def log_action(db: Session, actor: str, action: str, target: str):
    entry = models.AuditLog(actor=actor, action=action, target=target)
    db.add(entry)
    db.commit()


@router.get("")
def get_audit_log(
    limit: int = 100,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin")),
):
    rows = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {"id": r.id, "actor": r.actor, "action": r.action, "target": r.target, "timestamp": r.timestamp}
        for r in rows
    ]
