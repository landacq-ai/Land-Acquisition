# -*- coding: utf-8 -*-
"""
Generates the synthetic national land-acquisition dataset.
Run from anywhere — paths are relative to this script's location.

    cd backend
    python scripts/generate_dataset.py
"""
import numpy as np
import pandas as pd
import uuid
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

np.random.seed(42)
N = 3000

states_districts = {
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Meerut", "Agra"],
    "Maharashtra": ["Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Belagavi"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
}
states = list(states_districts.keys())

project_types = ["Highway", "Railway", "Irrigation", "Industrial Corridor", "Urban Development", "Power Transmission"]
project_type_base_risk = {
    "Highway": 0.10, "Railway": 0.08, "Irrigation": 0.05,
    "Industrial Corridor": 0.15, "Urban Development": 0.18, "Power Transmission": 0.02,
}

dispute_stages = ["None", "Filed", "Under Hearing", "Stay Order", "Resolved"]
dispute_stage_risk = {"None": 0.0, "Filed": 0.10, "Under Hearing": 0.20, "Stay Order": 0.35, "Resolved": -0.05}

possession_status_opts = ["Not Started", "Partial", "Full"]

rows = []
for i in range(N):
    state = np.random.choice(states)
    district = np.random.choice(states_districts[state])
    ptype = np.random.choice(project_types)

    land_area = np.round(np.random.lognormal(mean=2.5, sigma=1.0), 2)
    affected_families = int(np.random.lognormal(mean=4.0, sigma=1.1))
    affected_families = min(affected_families, 5000)

    notification_days_ago = int(np.random.uniform(30, 1500))
    comp_pct = np.clip(np.random.beta(2.2, 1.8) * 100, 0, 100)

    legal_disputes = np.random.poisson(0.6 + (land_area / 200) + (affected_families / 3000))
    legal_disputes = min(legal_disputes, 12)

    if legal_disputes == 0:
        stage = "None"
    else:
        stage = np.random.choice(["Filed", "Under Hearing", "Stay Order", "Resolved"], p=[0.35, 0.30, 0.15, 0.20])

    rr_progress = np.clip(np.random.beta(2, 2.3) * 100, 0, 100)
    approvals_pending = np.random.poisson(2.5)
    dept_response_days = np.round(np.random.gamma(shape=2.0, scale=15), 1)
    possession = np.random.choice(possession_status_opts, p=[0.25, 0.45, 0.30])
    hist_delay_rate = np.clip(np.random.normal(loc=35, scale=15), 5, 80)
    doc_completeness = np.clip(np.random.beta(2.3, 1.7) * 100, 0, 100)

    risk = 0.06
    risk += project_type_base_risk[ptype]
    risk += dispute_stage_risk[stage] * 1.6
    risk += 0.22 * (legal_disputes / 12)
    risk += 0.26 * (1 - comp_pct / 100)
    risk += 0.22 * (1 - rr_progress / 100)
    risk += 0.14 * min(approvals_pending / 8, 1)
    risk += 0.16 * min(dept_response_days / 90, 1)
    risk += 0.10 * (hist_delay_rate / 100)
    risk += 0.14 * (1 - doc_completeness / 100)
    risk -= 0.20 if possession == "Full" else (0.06 if possession == "Partial" else 0)
    risk += np.random.normal(0, 0.045)
    risk = np.clip(risk, 0.02, 0.97)

    delayed = np.random.binomial(1, risk)

    rows.append({
        "project_id": str(uuid.uuid4())[:8],
        "state": state,
        "district": district,
        "project_type": ptype,
        "land_area_hectares": land_area,
        "affected_families": affected_families,
        "days_since_notification": notification_days_ago,
        "compensation_disbursed_pct": np.round(comp_pct, 1),
        "legal_disputes_count": legal_disputes,
        "legal_dispute_stage": stage,
        "rr_progress_pct": np.round(rr_progress, 1),
        "approvals_pending": approvals_pending,
        "dept_response_days_avg": dept_response_days,
        "possession_status": possession,
        "documentation_completeness_pct": np.round(doc_completeness, 1),
        "historical_delay_rate_region": np.round(hist_delay_rate, 1),
        "delayed": delayed,
    })

df = pd.DataFrame(rows)
out_path = os.path.join(DATA_DIR, "land_acquisition_synthetic_dataset.csv")
df.to_csv(out_path, index=False)
print("Rows:", len(df))
print("Delay rate:", round(df["delayed"].mean(), 3))
print("Saved to:", out_path)
