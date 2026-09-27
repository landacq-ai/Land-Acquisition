import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { RISK_COLOR, fmtField } from "../constants.js";
import ProjectDetail from "../components/ProjectDetail.jsx";
import { AlertTriangle } from "lucide-react";

export default function Alerts() {
  const { auth } = useAuth();
  const [threshold, setThreshold] = useState(75);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  function load() {
    setLoading(true);
    api.getAlerts(auth.token, threshold)
      .then(setAlerts)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [threshold]);

  async function openDetail(pid) {
    setSelectedId(pid);
    try {
      const full = await api.getProject(auth.token, pid);
      setSelectedProject(full);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 className="ledger-head" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Alerts — needs attention</h2>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 0" }}>
            Projects at or above the risk threshold. This is a live feed, not a sent notification — hook up email/SMS dispatch here for production use.
          </p>
        </div>
        <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ padding: "6px 10px", fontSize: 12.5, border: "1px solid var(--line)", background: "white" }}>
          <option value={51}>High and above (≥51)</option>
          <option value={75}>High-critical (≥75)</option>
          <option value={90}>Critical only (≥90)</option>
        </select>
      </div>

      {err && <div style={{ color: "var(--brick)", padding: 10 }}>{err}</div>}

      <div style={{ border: "1px solid var(--line)", background: "white" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>No projects above this threshold. Good sign.</div>
        ) : (
          alerts.map((a, i) => (
            <div
              key={a.project_id}
              onClick={() => openDetail(a.project_id)}
              className="row-hover"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: i === alerts.length - 1 ? "none" : "1px solid var(--line)" }}
            >
              <AlertTriangle size={16} color={RISK_COLOR[a.risk_category]} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                  {a.location_name || `${a.district}, ${a.state}`}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {a.project_type} · driven by {fmtField(a.top_driver)}
                </div>
              </div>
              <div style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: RISK_COLOR[a.risk_category] }}>{a.risk_score}</div>
              <span className="badge" style={{ background: RISK_COLOR[a.risk_category] }}>{a.risk_category}</span>
            </div>
          ))
        )}
      </div>

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onClose={() => { setSelectedId(null); setSelectedProject(null); }}
          onChanged={load}
        />
      )}
    </div>
  );
}
