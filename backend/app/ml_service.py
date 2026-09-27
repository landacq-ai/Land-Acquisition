import pickle
import os
import numpy as np
import pandas as pd
import shap

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "data", "xgboost_delay_model.pkl")

RECOMMENDATIONS = {
    "legal_disputes_count": "Fast-track legal dispute resolution; assign dedicated counsel review.",
    "legal_dispute_stage": "Escalate stayed/under-hearing cases for expedited court hearing dates.",
    "possession_status": "Prioritize field team follow-up to move possession from partial to full.",
    "compensation_disbursed_pct": "Release pending compensation tranches; audit disbursement bottlenecks.",
    "rr_progress_pct": "Accelerate rehabilitation & resettlement site readiness and family relocation.",
    "project_type": "Apply category-specific playbook based on historical patterns for this project type.",
    "affected_families": "Deploy additional grievance-redressal staff given the scale of affected families.",
    "dept_response_days_avg": "Flag to department head — turnaround time on approvals is a bottleneck.",
    "approvals_pending": "Consolidate pending approvals into a single expedited review meeting.",
    "land_area_hectares": "Review survey completeness given the scale of land involved.",
    "state": "Compare against best-performing districts in the same state for playbook ideas.",
    "historical_delay_rate_region": "Apply lessons from past delayed projects in this region proactively.",
    "days_since_notification": "Review whether project has stalled relative to its notification age.",
    "district": "Coordinate with district collector's office for local bottleneck review.",
    "documentation_completeness_pct": "Audit missing title deeds, survey records, and notification paperwork; assign a documentation task force.",
}


class RiskModel:
    def __init__(self):
        with open(MODEL_PATH, "rb") as f:
            bundle = pickle.load(f)
        self.model = bundle["model"]
        self.encoders = bundle["encoders"]
        self.feature_cols = bundle["feature_cols"]
        self.explainer = shap.TreeExplainer(self.model)

    def _encode(self, record: dict) -> pd.DataFrame:
        row = {}
        for col in self.feature_cols:
            val = record[col]
            if col in self.encoders:
                le = self.encoders[col]
                if val in le.classes_:
                    val = le.transform([val])[0]
                else:
                    val = 0  # unseen category fallback
            row[col] = val
        return pd.DataFrame([row], columns=self.feature_cols)

    @staticmethod
    def _categorize(score_0_100: float) -> str:
        if score_0_100 >= 76:
            return "Critical"
        if score_0_100 >= 51:
            return "High"
        if score_0_100 >= 26:
            return "Medium"
        return "Low"

    def score(self, record: dict) -> dict:
        X = self._encode(record)
        proba = float(self.model.predict_proba(X)[0, 1])
        risk_score = round(proba * 100, 1)
        category = self._categorize(risk_score)

        shap_vals = self.explainer.shap_values(X)[0]
        ranked = sorted(zip(self.feature_cols, shap_vals), key=lambda x: -abs(x[1]))[:3]

        drivers = []
        for feat, val in ranked:
            drivers.append({
                "feature": feat,
                "shap_impact": round(float(val), 4),
                "direction": "increases risk" if val > 0 else "decreases risk",
            })

        top_feature = ranked[0][0]
        recommendation = RECOMMENDATIONS.get(top_feature, "Review project details for corrective action.")

        return {
            "risk_score": risk_score,
            "risk_category": category,
            "top_drivers": drivers,
            "recommended_action": recommendation,
        }


_risk_model_instance = None


def get_risk_model() -> RiskModel:
    global _risk_model_instance
    if _risk_model_instance is None:
        _risk_model_instance = RiskModel()
    return _risk_model_instance
