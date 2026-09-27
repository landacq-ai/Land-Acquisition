from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func
from .database import Base


class Project(Base):
    __tablename__ = "projects"

    project_id = Column(String, primary_key=True, index=True)
    state = Column(String, index=True)
    district = Column(String, index=True)
    project_type = Column(String, index=True)
    land_area_hectares = Column(Float)
    affected_families = Column(Integer)
    days_since_notification = Column(Integer)
    compensation_disbursed_pct = Column(Float)
    legal_disputes_count = Column(Integer)
    legal_dispute_stage = Column(String)
    rr_progress_pct = Column(Float)
    approvals_pending = Column(Integer)
    dept_response_days_avg = Column(Float)
    possession_status = Column(String)
    documentation_completeness_pct = Column(Float)
    historical_delay_rate_region = Column(Float)

    # optional GIS coordinates — populated for projects with known site locations
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # optional descriptive fields — useful for city/corridor-scoped datasets (e.g. named roads)
    location_name = Column(String, nullable=True)
    segment_label = Column(String, nullable=True)

    # cached prediction (refreshed by the ML service)
    risk_score = Column(Float, default=None)
    risk_category = Column(String, default=None)
    top_driver_1 = Column(String, default=None)
    top_driver_2 = Column(String, default=None)
    top_driver_3 = Column(String, default=None)
    scored_at = Column(DateTime, default=None)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor = Column(String)
    action = Column(String)
    target = Column(String)
    timestamp = Column(DateTime, server_default=func.now())
