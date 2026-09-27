const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `Request failed (${status})`);
    this.status = status;
  }
}

async function request(path, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = new URLSearchParams(form);
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (body) {
    payload = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });

  if (!res.ok) {
    let detail;
    try {
      const j = await res.json();
      detail = j.detail;
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (username, password) =>
    request("/api/auth/login", { method: "POST", form: { username, password } }),

  listProjects: (token, params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return request(`/api/projects${qs ? `?${qs}` : ""}`, { token });
  },
  getProject: (token, id) => request(`/api/projects/${id}`, { token }),
  getProjectRisk: (token, id) => request(`/api/projects/${id}/risk`, { token }),
  createProject: (token, project) => request("/api/projects", { method: "POST", token, body: project }),
  deleteProject: (token, id) => request(`/api/projects/${id}`, { method: "DELETE", token }),
  rescoreProject: (token, id) => request(`/api/projects/${id}/rescore`, { method: "POST", token }),

  getAlerts: (token, threshold = 75) => request(`/api/alerts?threshold=${threshold}`, { token }),
  getGeoProjects: (token, minRisk = 0) => request(`/api/gis/projects?min_risk=${minRisk}`, { token }),
  getTrends: (token, groupBy = "state") => request(`/api/analytics/trends?group_by=${groupBy}`, { token }),
  getSummary: (token) => request("/api/analytics/summary", { token }),
  getAuditLog: (token) => request("/api/audit-log", { token }),
  health: () => request("/api/health"),
};

export { ApiError, API_URL };
