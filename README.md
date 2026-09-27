# Land Acquisition Delay Prediction Platform

A full-stack AI-powered platform for predicting delay risk in Indian land
acquisition projects — backend API + React dashboard, both included here so
the whole thing runs on one machine.

```
land-acquisition-platform/
├── backend/     FastAPI + SQLite + trained XGBoost model
├── frontend/    React (Vite) dashboard — login, projects, GIS map, alerts, admin
└── README.md    (this file)
```

## Quick start

You need Python 3.10+ and Node.js 18+ installed.

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python3 -m app.seed_db          # loads + scores the national dataset (3,000 projects)
python3 -m app.seed_lucknow     # loads + scores the Lucknow roads pilot (129 segments, with GIS coords)

uvicorn app.main:app --reload --port 8000
```

Leave this running. API docs: `http://localhost:8000/docs`

### 2. Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Logging in

| Username | Password | Can do |
|---|---|---|
| **admin** | admin123 | Everything — create, delete, rescore projects; view the audit log |
| **viewer** | viewer123 | Read-only — browse projects, risk scores, GIS map, alerts, trends |

The backend enforces this with real role checks (not just hidden UI) — a
viewer token hitting a write endpoint gets a `403`, verified end to end.

## What you get

- **Login-gated dashboard** with two real roles (admin / viewer), JWT-based
- **Overview** — summary stats, risk trends by state/district/project type, filterable/searchable project table
- **GIS Map** — the Lucknow road-corridor pilot plotted by real coordinates, color-coded by risk, click-through to full detail
- **Alerts** — live feed of projects above a risk threshold
- **Project detail** — SHAP-driven top-3 delay drivers, recommended action, full record; admin gets rescore/delete buttons
- **New Project** (admin only) — form that creates and immediately scores a new project
- **Audit Log** (admin only) — every create/delete/rescore action, who did it, when

## Architecture note

The frontend is a static Vite build that calls the backend over HTTP
(`VITE_API_URL`, defaults to `http://localhost:8000`) — there's no server-side
coupling, so you can deploy them separately later (e.g. frontend on a CDN,
backend on a proper server with PostgreSQL) without changing any code, just
the `.env` value.

## Known gaps (by design, for now)

- **Continuous/real-time learning** is not implemented — the model is trained
  once, offline. This needs a live data-ingestion pipeline from real
  government systems before it means anything; agreed to leave this as future
  scope until that data source exists.
- **GIS coordinates** for the Lucknow pilot are approximate corridor
  midpoints, not surveyed points — fine for demoing the map, not for anything
  operational.
- **National dataset has no coordinates yet** — the map only shows Lucknow
  until real project locations are geocoded.
- Demo users are hardcoded in `backend/app/auth.py` with a hardcoded JWT
  secret — replace both with a real user store and an environment variable
  before this touches the internet.
