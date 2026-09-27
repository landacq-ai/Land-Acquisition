import React, { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Overview from "./pages/Overview.jsx";
import MapView from "./pages/MapView.jsx";
import Alerts from "./pages/Alerts.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import NewProject from "./pages/NewProject.jsx";
import { LayoutDashboard, Map, Bell, ScrollText, Plus, LogOut } from "lucide-react";

function Shell() {
  const { auth, logout, isAdmin } = useAuth();
  const [tab, setTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "map", label: "GIS Map", icon: Map },
    { id: "alerts", label: "Alerts", icon: Bell },
    ...(isAdmin ? [{ id: "audit", label: "Audit Log", icon: ScrollText }] : []),
    ...(isAdmin ? [{ id: "new", label: "New Project", icon: Plus }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <header style={{ background: "var(--navy)", color: "var(--paper)", borderBottom: "3px double var(--amber)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 className="ledger-head" style={{ fontSize: 21, fontWeight: 600, margin: 0 }}>
              Land Acquisition Risk Register
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#B9C2D6" }}>
              AI-powered delay prediction · national + Lucknow roads pilot
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right", fontSize: 12 }}>
              <div style={{ color: "white" }}>{auth.username}</div>
              <div style={{
                color: isAdmin ? "#E2A96B" : "#8FA07A", fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase",
              }}>{isAdmin ? "Admin — full control" : "Viewer — read only"}</div>
            </div>
            <button onClick={logout} className="btn" style={{ background: "transparent", color: "#B9C2D6", borderColor: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 6 }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", gap: 2, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: active ? "var(--paper)" : "transparent",
                  color: active ? "var(--navy)" : "#C9D0DE",
                  border: "none", padding: "10px 16px", fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 7, fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px" }}>
        {tab === "overview" && <Overview />}
        {tab === "map" && <MapView />}
        {tab === "alerts" && <Alerts />}
        {tab === "audit" && isAdmin && <AuditLog />}
        {tab === "new" && isAdmin && <NewProject onCreated={() => setTab("overview")} />}
      </main>
    </div>
  );
}

function Gate() {
  const { auth } = useAuth();
  return auth ? <Shell /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
