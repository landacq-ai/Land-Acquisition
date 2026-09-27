export const RISK_COLOR = {
  Critical: "var(--brick)",
  High: "var(--amber)",
  Medium: "var(--teal)",
  Low: "#6E7B5C",
};

export const FEATURE_LABELS = {
  legal_disputes_count: "Legal disputes — count",
  legal_dispute_stage: "Legal dispute stage",
  possession_status: "Possession status",
  compensation_disbursed_pct: "Compensation disbursed",
  rr_progress_pct: "Rehabilitation & resettlement progress",
  project_type: "Project category",
  affected_families: "Affected families",
  dept_response_days_avg: "Department response time",
  approvals_pending: "Approvals pending",
  land_area_hectares: "Land area",
  state: "State",
  district: "District",
  documentation_completeness_pct: "Documentation completeness",
  historical_delay_rate_region: "Regional delay history",
  days_since_notification: "Days since notification",
};

export function fmtField(key) {
  return FEATURE_LABELS[key] || key;
}

export const PROJECT_TYPES = [
  "Highway", "Railway", "Irrigation", "Industrial Corridor", "Urban Development", "Power Transmission",
];

export const DISPUTE_STAGES = ["None", "Filed", "Under Hearing", "Stay Order", "Resolved"];
export const POSSESSION_STATUSES = ["Not Started", "Partial", "Full"];
