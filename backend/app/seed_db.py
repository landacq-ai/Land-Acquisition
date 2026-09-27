"""
Seeds the SQLite database from the synthetic dataset CSV and scores every
project through the trained model, so the API has real data to serve on first run.

Run once: python3 -m app.seed_db
"""
import os
import sys
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app import models
from app.ml_service import get_risk_model

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "data", "land_acquisition_synthetic_dataset.csv")


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    df = pd.read_csv(CSV_PATH, keep_default_na=False, na_values=[""])
    risk_model = get_risk_model()
    db = SessionLocal()

    feature_cols = [
        "state", "district", "project_type", "land_area_hectares", "affected_families",
        "days_since_notification", "compensation_disbursed_pct", "legal_disputes_count",
        "legal_dispute_stage", "rr_progress_pct", "approvals_pending",
        "dept_response_days_avg", "possession_status", "documentation_completeness_pct",
        "historical_delay_rate_region",
    ]
    optional_cols = ["latitude", "longitude", "location_name", "segment_label"]

    count = 0
    for _, row in df.iterrows():
        record = {c: row[c] for c in feature_cols}
        result = risk_model.score(record)

        extra = {}
        for c in optional_cols:
            if c in df.columns and pd.notna(row[c]):
                extra[c] = row[c]
            else:
                extra[c] = None

        project = models.Project(
            project_id=row["project_id"],
            **record,
            **extra,
            risk_score=result["risk_score"],
            risk_category=result["risk_category"],
            top_driver_1=result["top_drivers"][0]["feature"] if len(result["top_drivers"]) > 0 else None,
            top_driver_2=result["top_drivers"][1]["feature"] if len(result["top_drivers"]) > 1 else None,
            top_driver_3=result["top_drivers"][2]["feature"] if len(result["top_drivers"]) > 2 else None,
            scored_at=datetime.utcnow(),
        )
        db.add(project)
        count += 1
        if count % 500 == 0:
            db.commit()
            print(f"  scored {count} projects...")

    db.commit()
    db.close()
    print(f"Seeded and scored {count} projects into the database.")


if __name__ == "__main__":
    seed()
