from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectBase(BaseModel):
    state: str
    district: str
    project_type: str
    land_area_hectares: float
    affected_families: int
    days_since_notification: int
    compensation_disbursed_pct: float
    legal_disputes_count: int
    legal_dispute_stage: str
    rr_progress_pct: float
    approvals_pending: int
    dept_response_days_avg: float
    possession_status: str
    documentation_completeness_pct: float
    historical_delay_rate_region: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    segment_label: Optional[str] = None


class ProjectCreate(ProjectBase):
    project_id: Optional[str] = None


class ProjectOut(ProjectBase):
    project_id: str
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None
    top_driver_1: Optional[str] = None
    top_driver_2: Optional[str] = None
    top_driver_3: Optional[str] = None
    scored_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RiskDriver(BaseModel):
    feature: str
    shap_impact: float
    direction: str  # "increases risk" / "decreases risk"


class RiskExplanation(BaseModel):
    project_id: str
    risk_score: float
    risk_category: str
    top_drivers: List[RiskDriver]
    recommended_action: str


class TrendPoint(BaseModel):
    group: str
    total_projects: int
    high_risk_count: int
    avg_risk_score: float


class GeoPoint(BaseModel):
    project_id: str
    location_name: Optional[str] = None
    segment_label: Optional[str] = None
    latitude: float
    longitude: float
    risk_score: float
    risk_category: str
    project_type: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
