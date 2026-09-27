import React, { useEffect, useState } from "react";
import { X, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { RISK_COLOR, fmtField } from "../constants.js";

export default function ProjectDetail({ project, onClose, onChanged }) {
  const { auth, isAdmin } = useAuth();
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!project) return;
    setLoading(true);
    api.getProjectRisk(auth.token, project.project_id)
      .then(setRisk)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [project]);

  if (!project) return null;

  async function handleRescore() {
    setBusy(true);
    try {
      await api.rescoreProject(auth.token, project.project_id);
      const updated = await api.getProjectRisk(auth.token, project.project_id);
      setRisk(updated);
      onChanged && onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete project ${project.project_id}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteProject(auth.token, project.project_id);
      onChanged && onChanged();
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  const title = project.location_name || `${project.district}, ${project.state}`;
  const subtitle = project.segment_label || project.project_type;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,25,41,0.45)", zIndex: 40, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 420, maxWidth: "92vw", background: "var(--paper)", height: "100%", overflowY: "auto", borderLeft: "1px solid var(--line)", boxShadow: "-6px 0 24px rgba(0,0,0,0.15)" }}>
        <div style={{ background: "var(--navy)", color: "white", padding: "18px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#8E9AB5" }}>Project {project.project_id}</div>
              <h3 className="ledger-head" style={{ fontSize: 18, margin: "3px 0 0", fontWeight: 600, lineHeight: 1.3 }}>{title}</h3>
              <div style={{ fontSize: 12.5, color: "#B9C2D6", marginTop: 2 }}>{subtitle}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#B9C2D6", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div style={{ marginTop: 16, fontSize: 13, color: "#B9C2D6" }}>Scoring…</div>
          ) : risk ? (
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="ledger-head" style={{ fontSize: 36, fontWeight: 700, color: RISK_COLOR[risk.risk_category] }}>
                {risk.risk_score}
              </span>
              <span style={{ fontSize: 13, color: "#B9C2D6" }}>/ 100 risk score</span>
              <span className="badge" style={{ marginLeft: "auto", background: RISK_COLOR[risk.risk_category] }}>{risk.risk_category}</span>
            </div>
          ) : null}
        </div>

        <div style={{ padding: "20px 22px" }}>
          {err && <div style={{ background: "#FBEDEC", color: "var(--brick)", fontSize: 12.5, padding: "8px 10px", marginBottom: 14 }}>{err}</div>}

          {risk && (
            <>
              <h4 style={{ fontSize: 12, letterSpacing: 0.3, color: "var(--muted)", margin: "0 0 10px" }}>Top delay drivers</h4>
              {risk.top_drivers.map((d, i) => (
                <div key={d.feature} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                    <span>{fmtField(d.feature)}</span>
                    <span style={{ color: "var(--muted)" }}>{d.direction === "increases risk" ? "↑" : "↓"} #{i + 1}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--paper-dark)" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Math.abs(d.shap_impact) * 60)}%`, background: i === 0 ? "var(--brick)" : i === 1 ? "var(--amber)" : "var(--teal)" }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16, padding: "12px 14px", background: "#FBF6E9", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: 0.3, marginBottom: 4 }}>Recommended action</div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{risk.recommended_action}</div>
              </div>
            </>
          )}

          <h4 style={{ fontSize: 12, letterSpacing: 0.3, color: "var(--muted)", margin: "22px 0 10px" }}>Project record</h4>
          <div style={{ fontSize: 13 }}>
            {[
              ["State / District", `${project.district}, ${project.state}`],
              ["Land area", `${project.land_area_hectares} hectares`],
              ["Affected families", project.affected_families],
              ["Days since notification", project.days_since_notification],
              ["Compensation disbursed", `${project.compensation_disbursed_pct}%`],
              ["Legal disputes", `${project.legal_disputes_count} (${project.legal_dispute_stage})`],
              ["R&R progress", `${project.rr_progress_pct}%`],
              ["Documentation completeness", `${project.documentation_completeness_pct}%`],
              ["Approvals pending", project.approvals_pending],
              ["Dept. response time (avg)", `${project.dept_response_days_avg} days`],
              ["Possession status", project.possession_status],
              ["Regional delay history", `${project.historical_delay_rate_region}%`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: "var(--muted)" }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: "right" }}>{val}</span>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={handleRescore} disabled={busy} className="btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <RefreshCw size={13} /> Rescore
              </button>
              <button onClick={handleDelete} disabled={busy} className="btn btn-danger" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
