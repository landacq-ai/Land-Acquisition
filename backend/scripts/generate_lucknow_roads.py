# -*- coding: utf-8 -*-
"""
Generates and scores the Lucknow road-corridor pilot dataset, using the
model you just retrained in scripts/train_model.py.

Run AFTER scripts/train_model.py:

    cd backend
    python scripts/generate_lucknow_roads.py
"""
import os
import pickle
import uuid
import numpy as np
import pandas as pd
import shap

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
DATA_DIR = os.path.join(BASE_DIR, "data")

np.random.seed(11)

ROADS = [
    ("Kanpur Road Widening", "Highway", 26.802, 80.882),
    ("Sultanpur Road Corridor", "Highway", 26.780, 80.949),
    ("Ayodhya Road (Faizabad Road) Expansion", "Highway", 26.883, 81.020),
    ("Rae Bareli Road Upgrade", "Highway", 26.772, 80.903),
    ("Sitapur Road Corridor", "Highway", 26.921, 80.931),
    ("Hardoi Road Widening", "Highway", 26.901, 80.851),
    ("IIM Road Extension", "Highway", 26.868, 80.884),
    ("Shaheed Path Phase II", "Highway", 26.849, 81.001),
    ("Outer Ring Road — Lucknow", "Highway", 26.830, 80.953),
    ("Gomti Nagar Extension Road", "Urban Development", 26.862, 81.031),
    ("Ashiyana–Sultanpur Link Road", "Urban Development", 26.792, 80.928),
    ("Kursi Road Widening", "Highway", 26.930, 80.919),
    ("Deva Road Corridor", "Highway", 26.899, 80.998),
    ("Mohan Road Upgrade", "Highway", 26.748, 80.849),
    ("Chinhat–Ayodhya Road Bypass", "Highway", 26.872, 81.048),
    ("Vikas Nagar Link Road", "Urban Development", 26.899, 80.947),
    ("Alambagh–Charbagh Corridor", "Urban Development", 26.821, 80.911),
    ("Hazratganj–Aminabad Corridor Redevelopment", "Urban Development", 26.849, 80.943),
    ("Transport Nagar Link Road", "Urban Development", 26.826, 80.863),
    ("Amausi Airport Approach Road", "Highway", 26.761, 80.882),
]

with open(os.path.join(DATA_DIR, "xgboost_delay_model.pkl"), "rb") as f:
    bundle = pickle.load(f)
model = bundle["model"]
encoders = bundle["encoders"]
feature_cols = bundle["feature_cols"]

possession_opts = ["Not Started", "Partial", "Full"]

rows = []
for road_name, ptype, base_lat, base_lon in ROADS:
    n_segments = np.random.randint(5, 9)
    for seg in range(1, n_segments + 1):
        land_area = np.round(np.random.lognormal(mean=1.6, sigma=0.8), 2)
        affected_families = int(min(np.random.lognormal(mean=3.6, sigma=1.0), 2000))
        notification_days_ago = int(np.random.uniform(60, 1200))
        comp_pct = np.clip(np.random.beta(2.0, 1.9) * 100, 0, 100)
        legal_disputes = min(np.random.poisson(0.5 + land_area / 150 + affected_families / 2500), 10)
        stage = "None" if legal_disputes == 0 else np.random.choice(
            ["Filed", "Under Hearing", "Stay Order", "Resolved"], p=[0.35, 0.30, 0.15, 0.20]
        )
        rr_progress = np.clip(np.random.beta(2.1, 2.2) * 100, 0, 100)
        approvals_pending = np.random.poisson(2.3)
        dept_response_days = np.round(np.random.gamma(2.0, 14), 1)
        possession = np.random.choice(possession_opts, p=[0.22, 0.46, 0.32])
        hist_delay_rate = np.clip(np.random.normal(38, 14), 5, 80)
        doc_completeness = np.clip(np.random.beta(2.3, 1.7) * 100, 0, 100)

        lat = round(base_lat + np.random.uniform(-0.010, 0.010), 5)
        lon = round(base_lon + np.random.uniform(-0.010, 0.010), 5)

        record = {
            "state": "Uttar Pradesh",
            "district": "Lucknow",
            "project_type": ptype,
            "land_area_hectares": land_area,
            "affected_families": affected_families,
            "days_since_notification": notification_days_ago,
            "compensation_disbursed_pct": round(float(comp_pct), 1),
            "legal_disputes_count": int(legal_disputes),
            "legal_dispute_stage": stage,
            "rr_progress_pct": round(float(rr_progress), 1),
            "approvals_pending": int(approvals_pending),
            "dept_response_days_avg": float(dept_response_days),
            "possession_status": possession,
            "documentation_completeness_pct": round(float(doc_completeness), 1),
            "historical_delay_rate_region": round(float(hist_delay_rate), 1),
        }

        rows.append({
            "project_id": str(uuid.uuid4())[:8],
            "road_name": road_name,
            "segment": f"Segment {seg}",
            "latitude": lat,
            "longitude": lon,
            **record,
        })

df = pd.DataFrame(rows)


def encode_row(record, encoders, feature_cols):
    row = {}
    for col in feature_cols:
        val = record[col]
        if col in encoders:
            le = encoders[col]
            val = le.transform([val])[0] if val in le.classes_ else 0
        row[col] = val
    return pd.DataFrame([row], columns=feature_cols)


explainer = shap.TreeExplainer(model)

results = []
for _, r in df.iterrows():
    record = {c: r[c] for c in feature_cols}
    X = encode_row(record, encoders, feature_cols)
    proba = float(model.predict_proba(X)[0, 1])
    risk_score = round(proba * 100, 1)
    category = "Critical" if risk_score >= 76 else "High" if risk_score >= 51 else "Medium" if risk_score >= 26 else "Low"

    shap_vals = explainer.shap_values(X)[0]
    ranked = sorted(zip(feature_cols, shap_vals), key=lambda x: -abs(x[1]))[:3]
    drivers = [f for f, v in ranked]

    results.append({
        "risk_score": risk_score,
        "risk_category": category,
        "d1": drivers[0] if len(drivers) > 0 else None,
        "d2": drivers[1] if len(drivers) > 1 else None,
        "d3": drivers[2] if len(drivers) > 2 else None,
    })

res_df = pd.DataFrame(results)
final = pd.concat([df.reset_index(drop=True), res_df], axis=1)

# write the seed-ready CSV that seed_lucknow.py expects
seed_df = final.rename(columns={"road_name": "location_name", "segment": "segment_label"})
seed_cols = ["project_id", "state", "district", "project_type", "land_area_hectares", "affected_families",
             "days_since_notification", "compensation_disbursed_pct", "legal_disputes_count",
             "legal_dispute_stage", "rr_progress_pct", "approvals_pending", "dept_response_days_avg",
             "possession_status", "documentation_completeness_pct", "historical_delay_rate_region",
             "latitude", "longitude", "location_name", "segment_label"]
out_path = os.path.join(DATA_DIR, "lucknow_roads_seed.csv")
seed_df[seed_cols].to_csv(out_path, index=False)

print("Total Lucknow road projects:", len(final))
print(final["risk_category"].value_counts())
print("\nSaved to:", out_path)
