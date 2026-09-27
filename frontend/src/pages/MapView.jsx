import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { RISK_COLOR } from "../constants.js";
import ProjectDetail from "../components/ProjectDetail.jsx";

// Lucknow bounding box used to project lat/lon onto the schematic map
const BOUNDS = { lonMin: 80.828, lonMax: 81.062, latMin: 26.728, latMax: 26.948 };
function project(lat, lon, w, h) {
  const x = ((lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin)) * w;
  const y = h - ((lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * h;
  return [x, y];
}

export default function MapView() {
  const { auth } = useAuth();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [minRisk, setMinRisk] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  function load() {
    setLoading(true);
    api.getGeoProjects(auth.token, minRisk)
      .then(setPoints)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [minRisk]);

  async function openDetail(pid) {
    setSelectedId(pid);
    try {
      const full = await api.getProject(auth.token, pid);
      setSelectedProject(full);
    } catch (e) {
      setErr(e.message);
    }
  }

  const W = 700, H = 500;
  const hovered = points.find((p) => p.project_id === hoveredId);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 className="ledger-head" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>GIS view — geo-tagged projects</h2>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 0" }}>
            Currently shows the Lucknow road-corridor pilot ({points.length} geo-tagged points). National projects will appear here once real coordinates are added.
          </p>
        </div>
        <select value={minRisk} onChange={(e) => setMinRisk(Number(e.target.value))} style={{ padding: "6px 10px", fontSize: 12.5, border: "1px solid var(--line)", background: "white" }}>
          <option value={0}>All risk levels</option>
          <option value={26}>Medium and above</option>
          <option value={51}>High and above</option>
          <option value={76}>Critical only</option>
        </select>
      </div>

      {err && <div style={{ color: "var(--brick)", padding: 10 }}>{err}</div>}

      <div style={{ background: "white", border: "1px solid var(--line)", padding: 14 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>Loading map…</div>
        ) : points.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>No geo-tagged projects match this filter.</div>
        ) : (
          <div style={{ position: "relative" }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", background: "var(--paper)" }}>
              {[0.2, 0.4, 0.6, 0.8].map((f) => (
                <line key={"v" + f} x1={W * f} y1={0} x2={W * f} y2={H} stroke="var(--line)" strokeWidth={0.5} strokeDasharray="2,4" />
              ))}
              {[0.2, 0.4, 0.6, 0.8].map((f) => (
                <line key={"h" + f} x1={0} y1={H * f} x2={W} y2={H * f} stroke="var(--line)" strokeWidth={0.5} strokeDasharray="2,4" />
              ))}
              <rect x={0.5} y={0.5} width={W - 1} height={H - 1} fill="none" stroke="var(--line)" strokeWidth={1} />

              <g transform={`translate(${W - 34}, 26)`}>
                <line x1={0} y1={10} x2={0} y2={-10} stroke="var(--muted)" strokeWidth={1.2} />
                <polygon points="0,-14 -4,-6 4,-6" fill="var(--muted)" />
                <text x={0} y={24} textAnchor="middle" fontSize={10} fill="var(--muted)">N</text>
              </g>

              {points.map((p) => {
                const [x, y] = project(p.latitude, p.longitude, W, H);
                const isSel = selectedId === p.project_id;
                const isHover = hoveredId === p.project_id;
                const r = isSel ? 8 : isHover ? 7 : 5;
                return (
                  <circle
                    key={p.project_id}
                    cx={x} cy={y} r={r}
                    fill={RISK_COLOR[p.risk_category]}
                    stroke={isSel ? "var(--navy)" : "white"}
                    strokeWidth={isSel ? 2 : 1}
                    opacity={0.9}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredId(p.project_id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => openDetail(p.project_id)}
                  />
                );
              })}
            </svg>

            {hovered && (
              <div style={{ position: "absolute", left: 10, bottom: 10, background: "var(--navy)", color: "white", padding: "8px 12px", fontSize: 12, maxWidth: 240, pointerEvents: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                <div style={{ fontWeight: 600 }}>{hovered.location_name}</div>
                <div style={{ color: "#B9C2D6", fontSize: 11 }}>{hovered.segment_label}</div>
                <div style={{ marginTop: 4 }}>Risk {hovered.risk_score} / 100 — {hovered.risk_category}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: "var(--muted)", flexWrap: "wrap" }}>
          {["Critical", "High", "Medium", "Low"].map((cat) => (
            <span key={cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: RISK_COLOR[cat], display: "inline-block" }} />
              {cat}
            </span>
          ))}
        </div>
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
