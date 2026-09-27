# Land Acquisition Delay Prediction — Backend API

FastAPI backend that serves AI-based delay risk scores for Indian land acquisition
projects, built around the XGBoost model trained in Step 1.

## What's inside

```
backend/
├── app/
│   ├── main.py            # FastAPI app entrypoint
│   ├── database.py        # SQLite + SQLAlchemy setup
│   ├── models.py          # ORM models (Project, AuditLog)
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── ml_service.py      # Loads the trained model, computes risk score + SHAP drivers
│   ├── auth.py             # JWT auth + role-based access control
│   ├── seed_db.py          # Loads the synthetic CSV into the DB and scores every project
│   └── routers/
│       ├── auth_router.py       # POST /api/auth/login
│       ├── projects_router.py   # /api/projects (list, detail, risk, create, rescore)
│       ├── analytics_router.py  # /api/analytics/trends, /api/analytics/summary
│       ├── alerts_router.py     # /api/alerts (high-risk project feed)
│       └── audit_router.py      # /api/audit-log (admin only)
├── data/                   # synthetic dataset CSV + trained model .pkl
├── requirements.txt
└── smoke_test.py           # end-to-end test of every endpoint
```

## Setup

```bash
cd backend
pip install -r requirements.txt

# Generate the datasets and train the model against YOUR installed library
# versions (this avoids version-mismatch errors when loading a pickled
# model that was trained with different xgboost/scikit-learn versions)
python3 scripts/generate_dataset.py
python3 scripts/train_model.py
python3 scripts/generate_lucknow_roads.py

# Load both datasets into SQLite, scored by the model you just trained
python3 -m app.seed_db
python3 -m app.seed_lucknow

# Run the API
uvicorn app.main:app --reload --port 8000
```

Interactive API docs will be at `http://localhost:8000/docs`.

**Why retrain instead of using a pre-trained file?** `requirements.txt`
intentionally doesn't pin exact versions for pandas/numpy/xgboost/shap/
scikit-learn, because pinned versions from one point in time often don't
have pre-built wheels for whatever Python version you're running (this bit
us during initial testing on Python 3.13 — pip tried to compile from source
and needed a C++ compiler that wasn't installed). Unpinned versions install
cleanly on more machines, but a model pickled with one version can fail to
load with another (`XGBoostError: input stream corrupted` is the tell).
Retraining locally — which takes under a minute — guarantees the model file
matches whatever got installed on your machine.

## What's new in this version

- **`documentation_completeness_pct`** — a new model feature (incomplete title deeds,
  survey records, notification paperwork). Model was retrained with it included;
  it now shows up as a real SHAP driver on affected projects.
- **GIS coordinates** — `latitude` / `longitude` / `location_name` / `segment_label`
  fields added to the `Project` model. Populated for the Lucknow dataset (approximate
  corridor coordinates — see note below); `null` for the national dataset until
  real site coordinates are available.
- **`/api/gis/projects`** — new endpoint returning geo-tagged projects for map
  rendering, with an optional `min_risk` filter.

## Demo login credentials

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin — full control: create, delete, rescore projects, view audit log |
| viewer | viewer123 | Viewer — read-only: browse projects, risk scores, map, analytics |

**These are demo-only credentials in plaintext for local testing — replace with a
real user store and hashed passwords before deploying anywhere real.**

## Key endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Get a JWT access token |
| `/api/projects` | GET | List/filter projects (state, district, type, risk category) |
| `/api/projects/{id}` | GET | Full project record |
| `/api/projects/{id}/risk` | GET | Risk score + top 3 SHAP drivers + recommended action |
| `/api/projects` | POST | Create a new project (auto-scored on creation) |
| `/api/projects/{id}/rescore` | POST | Re-run the model on an updated project |
| `/api/alerts?threshold=75` | GET | High-risk projects feed |
| `/api/gis/projects?min_risk=0` | GET | Geo-tagged projects for map rendering (lat/lon + risk) |
| `/api/analytics/trends?group_by=state` | GET | Risk trends by state/district/type |
| `/api/analytics/summary` | GET | Total projects by risk category |
| `/api/audit-log` | GET | Action audit trail (admin only) |

## Notes on what's demo-grade vs. production-grade

- **SQLite** is used here for zero-setup local testing. Swap `DATABASE_URL` in
  `database.py` for a PostgreSQL connection string (ideally with PostGIS, per the
  blueprint) for production.
- **JWT secret** in `auth.py` is a placeholder — move it to an environment variable.
- **CORS** is wide open (`allow_origins=["*"]`) — restrict to the actual frontend
  domain before deploying.
- The ML model is the one trained on synthetic data in Step 1. Swap in a retrained
  model (same `feature_cols` + encoders format) once real project data is available.
- **GIS coordinates for Lucknow are approximate corridor midpoints**, generated for
  demo purposes — not surveyed points. Replace with actual geo-tagged segment
  coordinates (e.g. from Bhuvan/Survey of India) before relying on them for anything
  operational.
- **Continuous/real-time learning is out of scope for this version.** The model is
  trained once, offline, on the synthetic dataset. Real continuous learning needs a
  live data-ingestion pipeline (new project updates flowing in from state/NHAI
  systems) plus a scheduled retraining + validation job — noted as future scope
  until a real data feed exists to retrain against.

## Next step

Build the React dashboard frontend that consumes this API — project list, risk
map, and the SHAP-driven "why is this project at risk" view.
