"""
Adds the Lucknow road-corridor dataset (with GIS coordinates) into the existing database,
alongside the national dataset. Run AFTER app.seed_db.

Run: python3 -m app.seed_lucknow
"""
import os
import sys
from datetime import datetime
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models
from app.ml_service import get_risk_model

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "data", "lucknow_roads_seed.csv")

FEATURE_COLS = [
    "state", "district", "project_type", "land_area_hectares", "affected_families",
    "days_since_notification", "compensation_disbursed_pct", "legal_disputes_count",
    "legal_dispute_stage", "rr_progress_pct", "approvals_pending",
    "dept_response_days_avg", "possession_status", "documentation_completeness_pct",
    "historical_delay_rate_region",
]


def seed():
    df = pd.read_csv(CSV_PATH, keep_default_na=False, na_values=[""])
    risk_model = get_risk_model()
    db = SessionLocal()

    count = 0
    for _, row in df.iterrows():
        record = {c: row[c] for c in FEATURE_COLS}
        result = risk_model.score(record)

        project = models.Project(
            project_id=row["project_id"],
            **record,
            latitude=row["latitude"],
            longitude=row["longitude"],
            location_name=row["location_name"],
            segment_label=row["segment_label"],
            risk_score=result["risk_score"],
            risk_category=result["risk_category"],
            top_driver_1=result["top_drivers"][0]["feature"] if len(result["top_drivers"]) > 0 else None,
            top_driver_2=result["top_drivers"][1]["feature"] if len(result["top_drivers"]) > 1 else None,
            top_driver_3=result["top_drivers"][2]["feature"] if len(result["top_drivers"]) > 2 else None,
            scored_at=datetime.utcnow(),
        )
        db.merge(project)  # merge so re-running this script updates rather than duplicates
        count += 1

    db.commit()
    db.close()
    print(f"Seeded {count} Lucknow road projects (with GIS coordinates) into the database.")


if __name__ == "__main__":
    seed()
