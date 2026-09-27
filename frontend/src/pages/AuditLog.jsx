import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";

export default function AuditLog() {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.getAuditLog(auth.token)
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="ledger-head" style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Audit log</h2>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px" }}>
        Every create, delete, and rescore action — admin visibility only.
      </p>

      {err && <div style={{ color: "var(--brick)", padding: 10 }}>{err}</div>}

      <div style={{ border: "1px solid var(--line)", background: "white" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.4fr 1.6fr", background: "var(--paper-dark)", fontSize: 11, color: "var(--muted)", padding: "8px 14px", borderBottom: "1px solid var(--line)" }}>
          <div>ID</div><div>Actor</div><div>Action</div><div>Timestamp</div>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--muted)" }}>No actions logged yet.</div>
        ) : (
          rows.map((r, i) => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.4fr 1.6fr", padding: "9px 14px", fontSize: 13, borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--line)" }}>
              <div style={{ color: "var(--muted)" }}>#{r.id}</div>
              <div>{r.actor}</div>
              <div>{r.action} <span style={{ color: "var(--muted)" }}>· {r.target}</span></div>
              <div style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{new Date(r.timestamp).toLocaleString("en-IN")}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
