import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("la_auth");
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth) localStorage.setItem("la_auth", JSON.stringify(auth));
    else localStorage.removeItem("la_auth");
  }, [auth]);

  async function login(username, password) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(username, password);
      setAuth({ token: res.access_token, role: res.role, username });
      return true;
    } catch (e) {
      setError(e.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAuth(null);
  }

  const isAdmin = auth?.role === "admin";

  return (
    <AuthContext.Provider value={{ auth, login, logout, error, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
