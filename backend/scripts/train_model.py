# -*- coding: utf-8 -*-
"""
Trains the XGBoost delay-prediction model on YOUR installed library versions,
so the saved .pkl is compatible with your environment (fixes 'input stream
corrupted' errors when the pickle was made with a different xgboost version).

Run from anywhere — paths are relative to this script's location.

    cd backend
    python scripts/generate_dataset.py   (if you haven't already)
    python scripts/train_model.py
"""
import os
import pickle
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import roc_auc_score, precision_recall_fscore_support
import xgboost as xgb
import shap

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
DATA_DIR = os.path.join(BASE_DIR, "data")

df = pd.read_csv(os.path.join(DATA_DIR, "land_acquisition_synthetic_dataset.csv"), keep_default_na=False, na_values=[""])

cat_cols = ["state", "district", "project_type", "legal_dispute_stage", "possession_status"]
encoders = {}
df_enc = df.copy()
for c in cat_cols:
    le = LabelEncoder()
    df_enc[c] = le.fit_transform(df[c])
    encoders[c] = le

feature_cols = [
    "state", "district", "project_type", "land_area_hectares", "affected_families",
    "days_since_notification", "compensation_disbursed_pct", "legal_disputes_count",
    "legal_dispute_stage", "rr_progress_pct", "approvals_pending",
    "dept_response_days_avg", "possession_status", "documentation_completeness_pct",
    "historical_delay_rate_region",
]
X = df_enc[feature_cols]
y = df_enc["delayed"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# baseline for comparison
rf = RandomForestClassifier(n_estimators=300, max_depth=8, random_state=42, class_weight="balanced")
rf.fit(X_train, y_train)
rf_auc = roc_auc_score(y_test, rf.predict_proba(X_test)[:, 1])

# the model actually used for live scoring
xgb_model = xgb.XGBClassifier(
    n_estimators=300, max_depth=5, learning_rate=0.05,
    subsample=0.9, colsample_bytree=0.9, eval_metric="logloss", random_state=42,
)
xgb_model.fit(X_train, y_train)
xgb_proba = xgb_model.predict_proba(X_test)[:, 1]
xgb_pred = xgb_model.predict(X_test)
xgb_auc = roc_auc_score(y_test, xgb_proba)
prec, rec, f1, _ = precision_recall_fscore_support(y_test, xgb_pred, average="binary")

print("=== Model comparison ===")
print(f"random_forest  AUC={rf_auc:.3f}")
print(f"xgboost        AUC={xgb_auc:.3f}  precision={prec:.3f}  recall={rec:.3f}  f1={f1:.3f}")

# sanity-check SHAP works with the installed version before saving
explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test.iloc[:5])
print("SHAP check OK — explainer works with your installed xgboost/shap versions.")

# save the model bundle the API actually loads
bundle_path = os.path.join(DATA_DIR, "xgboost_delay_model.pkl")
with open(bundle_path, "wb") as f:
    pickle.dump({"model": xgb_model, "encoders": encoders, "feature_cols": feature_cols}, f)

print("\nSaved retrained model to:", bundle_path)
print("This .pkl is now compatible with your installed xgboost/scikit-learn/shap versions.")
