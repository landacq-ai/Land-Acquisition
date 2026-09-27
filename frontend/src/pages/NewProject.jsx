import React, { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { RISK_COLOR, fmtField, PROJECT_TYPES, DISPUTE_STAGES, POSSESSION_STATUSES } from "../constants.js";

const initial = {
  state: "Uttar Pradesh",
  district: "",
  project_type: "Highway",
  land_area_hectares: 5,
  affected_families: 50,
  days_since_notification: 180,
  compensation_disbursed_pct: 50,
  legal_disputes_count: 0,
  legal_dispute_stage: "None",
  rr_progress_pct: 50,
  approvals_pending: 2,
  dept_response_days_avg: 20,
  possession_status: "Partial",
  documentation_completeness_pct: 70,
  historical_delay_rate_region: 35,
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid var(--line)", background: "white" };

export default function NewProject({ onCreated }) {
  const { auth } = useAuth();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const created = await api.createProject(auth.token, {
        ...form,
        land_area_hectares: Number(form.land_area_hectares),
        affected_families: Number(form.affected_families),
        days_since_notification: Number(form.days_since_notification),
        compensation_disbursed_pct: Number(form.compensation_disbursed_pct),
        legal_disputes_count: Number(form.legal_disputes_count),
        rr_progress_pct: Number(form.rr_progress_pct),
        approvals_pending: Number(form.approvals_pending),
        dept_response_days_avg: Number(form.dept_response_days_avg),
        documentation_completeness_pct: Number(form.documentation_completeness_pct),
        historical_delay_rate_region: Number(form.historical_delay_rate_region),
      });
      setResult(created);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div style={{ maxWidth: 480 }}>
        <h2 className="ledger-head" style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Project created</h2>
        <div style={{ background: "white", border: "1px solid var(--line)", padding: 20, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Project {result.project_id}</div>
          <div style={{ fontSize: 15, fontWeight: 600, margin: "4px 0 14px" }}>{result.district}, {result.state} — {result.project_type}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="ledger-head" style={{ fontSize: 32, fontWeight: 700, color: RISK_COLOR[result.risk_category] }}>{result.risk_score}</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>/ 100 risk score</span>
            <span className="badge" style={{ marginLeft: "auto", background: RISK_COLOR[result.risk_category] }}>{result.risk_category}</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted)" }}>
            Top driver: {fmtField(result.top_driver_1)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={() => { setResult(null); setForm(initial); }}>Create another</button>
          <button className="btn btn-primary" onClick={onCreated}>Go to overview</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 className="ledger-head" style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>New project</h2>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 16px" }}>
        Submitted projects are scored immediately by the trained model on save.
      </p>

      <form onSubmit={handleSubmit} style={{ background: "white", border: "1px solid var(--line)", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="State">
            <input style={inputStyle} value={form.state} onChange={(e) => set("state", e.target.value)} required />
          </Field>
          <Field label="District">
            <input style={inputStyle} value={form.district} onChange={(e) => set("district", e.target.value)} required />
          </Field>

          <Field label="Project type">
            <select style={inputStyle} value={form.project_type} onChange={(e) => set("project_type", e.target.value)}>
              {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Possession status">
            <select style={inputStyle} value={form.possession_status} onChange={(e) => set("possession_status", e.target.value)}>
              {POSSESSION_STATUSES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Land area (hectares)">
            <input type="number" step="0.1" style={inputStyle} value={form.land_area_hectares} onChange={(e) => set("land_area_hectares", e.target.value)} />
          </Field>
          <Field label="Affected families">
            <input type="number" style={inputStyle} value={form.affected_families} onChange={(e) => set("affected_families", e.target.value)} />
          </Field>

          <Field label="Days since notification">
            <input type="number" style={inputStyle} value={form.days_since_notification} onChange={(e) => set("days_since_notification", e.target.value)} />
          </Field>
          <Field label="Compensation disbursed (%)">
            <input type="number" min="0" max="100" style={inputStyle} value={form.compensation_disbursed_pct} onChange={(e) => set("compensation_disbursed_pct", e.target.value)} />
          </Field>

          <Field label="Legal disputes — count">
            <input type="number" min="0" style={inputStyle} value={form.legal_disputes_count} onChange={(e) => set("legal_disputes_count", e.target.value)} />
          </Field>
          <Field label="Legal dispute stage">
            <select style={inputStyle} value={form.legal_dispute_stage} onChange={(e) => set("legal_dispute_stage", e.target.value)}>
              {DISPUTE_STAGES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="R&R progress (%)">
            <input type="number" min="0" max="100" style={inputStyle} value={form.rr_progress_pct} onChange={(e) => set("rr_progress_pct", e.target.value)} />
          </Field>
          <Field label="Documentation completeness (%)">
            <input type="number" min="0" max="100" style={inputStyle} value={form.documentation_completeness_pct} onChange={(e) => set("documentation_completeness_pct", e.target.value)} />
          </Field>

          <Field label="Approvals pending">
            <input type="number" min="0" style={inputStyle} value={form.approvals_pending} onChange={(e) => set("approvals_pending", e.target.value)} />
          </Field>
          <Field label="Dept. response time (avg days)">
            <input type="number" step="0.1" style={inputStyle} value={form.dept_response_days_avg} onChange={(e) => set("dept_response_days_avg", e.target.value)} />
          </Field>

          <Field label="Regional historical delay rate (%)">
            <input type="number" min="0" max="100" style={inputStyle} value={form.historical_delay_rate_region} onChange={(e) => set("historical_delay_rate_region", e.target.value)} />
          </Field>
        </div>

        {err && <div style={{ background: "#FBEDEC", color: "var(--brick)", fontSize: 12.5, padding: "8px 10px", marginTop: 6 }}>{err}</div>}

        <button type="submit" disabled={busy} className="btn btn-primary" style={{ marginTop: 16, padding: "10px 20px" }}>
          {busy ? "Scoring…" : "Create & score project"}
        </button>
      </form>
    </div>
  );
}
