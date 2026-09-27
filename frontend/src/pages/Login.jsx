import React, { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { Lock } from "lucide-react";

export default function Login() {
  const { login, error, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    login(username, password);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--navy-deep)",
    }}>
      <div style={{ width: 380, maxWidth: "92vw" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%", background: "var(--amber)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
          }}>
            <Lock size={20} color="white" />
          </div>
          <h1 className="ledger-head" style={{ color: "white", fontSize: 22, fontWeight: 600, margin: 0 }}>
            Land Acquisition Risk Register
          </h1>
          <p style={{ color: "#8E9AB5", fontSize: 13, marginTop: 4 }}>Sign in to the monitoring desk</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "var(--paper)", padding: 24, border: "1px solid var(--line)" }}>
          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin or viewer"
            autoFocus
            style={{ width: "100%", padding: "9px 10px", fontSize: 14, border: "1px solid var(--line)", marginBottom: 14 }}
          />

          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: "100%", padding: "9px 10px", fontSize: 14, border: "1px solid var(--line)", marginBottom: 18 }}
          />

          {error && (
            <div style={{ background: "#FBEDEC", color: "var(--brick)", fontSize: 12.5, padding: "8px 10px", marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "10px 0", fontSize: 14 }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 11.5, color: "var(--muted)" }}>
            <div style={{ marginBottom: 4 }}><b>Demo credentials</b></div>
            <div>Admin — full control: <code>admin</code> / <code>admin123</code></div>
            <div>Viewer — read only: <code>viewer</code> / <code>viewer123</code></div>
          </div>
        </form>
      </div>
    </div>
  );
}
