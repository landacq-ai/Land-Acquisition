import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Search, X, ChevronRight } from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { RISK_COLOR, fmtField, PROJECT_TYPES } from "../constants.js";
import ProjectDetail from "../components/ProjectDetail.jsx";

export default function Overview() {
  const { auth } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [groupBy, setGroupBy] = useState("state");
  const [riskFilter, setRiskFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const pageSize = 12;

  function loadAll() {
    setLoading(true);
    setErr(null);
    Promise.all([
      api.getSummary(auth.token),
      api.getTrends(auth.token, groupBy),
      api.listProjects(auth.token, { limit: 500, risk_category: riskFilter, project_type: typeFilter }),
    ])
      .then(([s, t, p]) => {
        setSummary(s);
        setTrends(t);
        setProjects(p);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, [groupBy, riskFilter, typeFilter]);

  const filtered = useMemo(() => {
    if (!query) return projects;
    const q = query.toLowerCase();
    return projects.filter((p) =>
      p.project_id.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      (p.location_name || "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const maxPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);

  if (err) return <div style={{ color: "var(--brick)", padding: 20 }}>Error loading data: {err}. Is the backend running at the configured API URL?</div>;

  return (
    <div>
      {/* SUMMARY STRIP */}
      {summary && (
        <div style={{ display: "flex", border: "1px solid var(--line)", background: "white", marginBottom: 24 }}>
          {[
            ["Total projects", summary.total_projects, "var(--ink)"],
            ["Critical", summary.by_risk_category?.Critical || 0, "var(--brick)"],
            ["High", summary.by_risk_category?.High || 0, "var(--amber)"],
            ["Medium", summary.by_risk_category?.Medium || 0, "var(--teal)"],
            ["Low", summary.by_risk_category?.Low || 0, "#6E7B5C"],
          ].map(([label, val, color], i) => (
            <div key={label} style={{ flex: 1, padding: "14px 18px", borderLeft: i === 0 ? "none" : "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>{label}</div>
              <div className="ledger-head" style={{ fontSize: 22, fontWeight: 600, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* TRENDS CHART */}
      <section style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <h2 className="ledger-head" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Average risk by {groupBy}</h2>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} style={{ padding: "5px 8px", fontSize: 12.5, border: "1px solid var(--line)" }}>
            <option value="state">By state</option>
            <option value="district">By district</option>
            <option value="project_type">By project type</option>
          </select>
        </div>
        <div style={{ background: "white", border: "1px solid var(--line)", padding: "14px 18px 6px" }}>
          <ResponsiveContainer width="100%" height={Math.min(420, Math.max(160, trends.length * 34))}>
            <BarChart data={trends} layout="vertical" margin={{ left: 10, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="var(--line)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
              <YAxis type="category" dataKey="group" width={150} tick={{ fontSize: 11, fill: "var(--ink)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
              <Tooltip formatter={(v) => [v + " / 100", "Avg risk"]} contentStyle={{ fontSize: 12, border: "1px solid var(--line)", borderRadius: 0 }} />
              <Bar dataKey="avg_risk_score" radius={[0, 2, 2, 0]} barSize={14}>
                {trends.map((d, i) => (
                  <Cell key={i} fill={d.avg_risk_score >= 76 ? "var(--brick)" : d.avg_risk_score >= 51 ? "var(--amber)" : "var(--teal)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* FILTER BAR */}
      <section style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--muted)" }} />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search project ID, district, state, road…"
              style={{ width: "100%", padding: "8px 10px 8px 30px", fontSize: 13, border: "1px solid var(--line)", background: "white" }}
            />
          </div>
          <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }} style={{ padding: "8px 10px", fontSize: 13, border: "1px solid var(--line)", background: "white" }}>
            <option value="">All risk categories</option>
            <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} style={{ padding: "8px 10px", fontSize: 13, border: "1px solid var(--line)", background: "white" }}>
            <option value="">All project types</option>
            {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          {(riskFilter || typeFilter || query) && (
            <button onClick={() => { setRiskFilter(""); setTypeFilter(""); setQuery(""); setPage(0); }} style={{ fontSize: 12.5, color: "var(--brick)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <X size={13} /> Clear filters
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          {loading ? "Loading…" : `Showing ${filtered.length === 0 ? 0 : page * pageSize + 1}–${Math.min(filtered.length, (page + 1) * pageSize)} of ${filtered.length} matching projects`}
        </div>
      </section>

      {/* TABLE */}
      <section style={{ border: "1px solid var(--line)", background: "white" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1.2fr 0.8fr 0.9fr 1.5fr 26px", background: "var(--paper-dark)", fontSize: 11, color: "var(--muted)", padding: "8px 14px", borderBottom: "1px solid var(--line)" }}>
          <div>ID</div><div>Location</div><div>Category</div><div>Risk</div><div>Status</div><div>Top driver</div><div />
        </div>
        {pageRows.map((p, i) => (
          <div key={p.project_id} className="row-hover fade-in" onClick={() => setSelected(p)} style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1.2fr 0.8fr 0.9fr 1.5fr 26px", padding: "10px 14px", fontSize: 13, alignItems: "center", borderBottom: i === pageRows.length - 1 ? "none" : "1px solid var(--line)" }}>
            <div style={{ fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>{p.project_id}</div>
            <div>{p.location_name ? `${p.location_name}` : `${p.district}, `}{!p.location_name && <span style={{ color: "var(--muted)" }}>{p.state}</span>}</div>
            <div>{p.project_type}</div>
            <div style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: RISK_COLOR[p.risk_category] }}>{p.risk_score}</div>
            <div><span className="badge" style={{ background: RISK_COLOR[p.risk_category] }}>{p.risk_category}</span></div>
            <div style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtField(p.top_driver_1)}</div>
            <div><ChevronRight size={15} color="var(--muted)" /></div>
          </div>
        ))}
        {!loading && pageRows.length === 0 && (
          <div style={{ padding: "40px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No projects match these filters.</div>
        )}
      </section>

      {filtered.length > pageSize && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 12.5, color: "var(--muted)" }}>
          <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="btn" style={{ opacity: page === 0 ? 0.4 : 1 }}>Previous</button>
          <span>Page {page + 1} of {maxPage + 1}</span>
          <button disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))} className="btn" style={{ opacity: page >= maxPage ? 0.4 : 1 }}>Next</button>
        </div>
      )}

      {selected && <ProjectDetail project={selected} onClose={() => setSelected(null)} onChanged={loadAll} />}
    </div>
  );
}
