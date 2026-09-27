# Running the Land Acquisition Platform Locally — Complete Setup Guide

This assumes your machine currently has nothing installed for this project. Follow
it top to bottom once; after that, starting the app takes 30 seconds (see the
"Every time after the first" section at the end).

---

## 1. Software you need (install these first)

| Software | Version | Why | Check if installed |
|---|---|---|---|
| **Python** | 3.10, 3.11, or 3.12 | Runs the backend (FastAPI + ML model) | `python3 --version` |
| **Node.js** | 18 or newer (includes npm) | Runs the frontend (React) | `node --version` |
| **A terminal** | — | Windows: PowerShell or Command Prompt. Mac/Linux: Terminal | already on your machine |
| **A way to unzip** | — | Windows/Mac have this built in | — |

You do **not** need to install PostgreSQL, Docker, or anything else — the backend
uses a self-contained SQLite database file.

### Installing Python

**Windows:**
1. Go to https://www.python.org/downloads/
2. Download the latest Python 3.12 installer
3. Run it — **important:** tick the box "Add Python to PATH" at the bottom of the first screen before clicking Install
4. Open PowerShell and run `python --version` to confirm (on Windows the command is `python`, not `python3`)

**Mac:**
1. Easiest way — install [Homebrew](https://brew.sh) if you don't have it, then:
   ```bash
   brew install python@3.12
   ```
2. Or download the installer from https://www.python.org/downloads/
3. Confirm with `python3 --version` in Terminal

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip
python3 --version
```

### Installing Node.js

**All platforms — easiest way:**
1. Go to https://nodejs.org
2. Download the **LTS** version (not "Current")
3. Run the installer, accept defaults
4. Confirm in your terminal:
   ```bash
   node --version    # should print v18.x.x or higher
   npm --version      # should print 9.x.x or higher
   ```

---

## 2. Unzip the project

Unzip `land-acquisition-platform.zip` anywhere convenient — e.g. your Desktop or
Documents folder. You should end up with a folder like:

```
land-acquisition-platform/
├── backend/
├── frontend/
└── README.md
```

Open a terminal and navigate into that folder:

```bash
cd path/to/land-acquisition-platform
```

(On Windows, you can also just open the folder in File Explorer, click the address
bar, type `powershell`, and hit Enter — that opens a terminal already inside the
folder.)

---

## 3. Set up the backend (one-time)

```bash
cd backend

# create an isolated Python environment just for this project
python3 -m venv venv          # Windows: python -m venv venv

# activate it
source venv/bin/activate      # Windows PowerShell: venv\Scripts\Activate.ps1
                               # Windows Command Prompt: venv\Scripts\activate.bat
```

You'll know it worked because your terminal prompt now starts with `(venv)`.

```bash
# install everything the backend needs (~2-3 minutes, downloads ML libraries)
pip install -r requirements.txt

# generate the datasets and train the model against the library versions
# that actually got installed on your machine (~30-60 seconds)
python scripts/generate_dataset.py       # Windows: python (not python3)
python scripts/train_model.py
python scripts/generate_lucknow_roads.py

# build the database and score all projects with the model you just trained
python -m app.seed_db
python -m app.seed_lucknow
```

You should see output ending in `Seeded 129 Lucknow road projects...`. If you do,
the backend is ready.

**Why the training step?** `requirements.txt` doesn't pin exact versions for the
ML libraries (pandas, numpy, xgboost, shap, scikit-learn) — a pinned version
from one point in time often has no pre-built installer for whatever Python
version you're running, which forces pip to compile from source and usually
fails without a C++ compiler installed. Leaving them unpinned fixes that, but
means the model has to be trained fresh against whatever versions land on your
machine — otherwise loading a model saved with a different xgboost version
throws `XGBoostError: input stream corrupted`. The training step takes under a
minute and avoids this entirely.

**Windows PowerShell users:** if `venv\Scripts\Activate.ps1` gives a "running
scripts is disabled" error, run this once, then try activating again:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 4. Set up the frontend (one-time)

Open a **second terminal window** (keep this separate from the backend one) and
navigate to the project folder again:

```bash
cd path/to/land-acquisition-platform/frontend
npm install
```

This downloads React and the other frontend packages (~1-2 minutes).

---

## 5. Run it

**Terminal 1 (backend)** — if not already active:
```bash
cd path/to/land-acquisition-platform/backend
source venv/bin/activate      # Windows: venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```
Leave this running. You should see `Uvicorn running on http://127.0.0.1:8000`.

**Terminal 2 (frontend):**
```bash
cd path/to/land-acquisition-platform/frontend
npm run dev
```
You should see something like `Local: http://localhost:5173/`.

**Now open your browser** to:
```
http://localhost:5173
```

Log in with:
- `admin` / `admin123` — full control
- `viewer` / `viewer123` — read-only

---

## 6. How to know it's working

- Backend check: open `http://localhost:8000/api/health` in a browser — you should see `{"status":"ok",...}`
- Backend API docs: `http://localhost:8000/docs` — a full interactive explorer
- Frontend: `http://localhost:5173` should show the login screen, then the dashboard with real numbers (3,129 total projects) after logging in

---

## 7. Stopping / restarting

- To stop either server: click into that terminal and press `Ctrl + C`
- Both terminals need to be running at the same time for the app to work — the frontend calls the backend over the network

---

## Every time after the first setup

You don't need to repeat `pip install` or `npm install` or the seed scripts again
— only do this:

**Terminal 1:**
```bash
cd path/to/land-acquisition-platform/backend
source venv/bin/activate        # Windows: venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2:**
```bash
cd path/to/land-acquisition-platform/frontend
npm run dev
```

Then open `http://localhost:5173`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `python3: command not found` | Use `python` instead (common on Windows) |
| `pip install` fails on a package | Make sure you activated the venv first (`(venv)` should show in prompt) |
| `Port 8000 already in use` | Something else is using it — run `uvicorn app.main:app --reload --port 8001` instead and update `frontend/.env` (see below) |
| `Port 5173 already in use` | Vite will automatically offer the next free port (5174) — just use whatever URL it prints |
| Frontend loads but shows "Error loading data" | The backend isn't running, or is on a different port than the frontend expects — see below |
| `npm install` fails / very slow | Delete the `frontend/node_modules` folder and `package-lock.json`, then run `npm install` again |
| `XGBoostError: input stream corrupted` when running `seed_db` | The model file doesn't match your installed xgboost version. Re-run the three training scripts (`generate_dataset.py`, `train_model.py`, `generate_lucknow_roads.py`) to regenerate it against your actual installed versions, then re-run the seed scripts |
| `pandas`/`numpy`/etc. try to build from source and fail (mentions `vswhere.exe` or "Microsoft Visual Studio") | Your Python version is too new for a pinned package version. Check `python --version` — if it's very recent (e.g. 3.13+), this is common. `requirements.txt` in this project already ships unpinned for this reason; if you edited it back to pinned versions, remove the pins again |
| Login says "Incorrect username or password" | Double check you typed `admin123` / `viewer123` exactly — case sensitive |

### If your backend runs on a different port

Create a file `frontend/.env` (copy from `frontend/.env.example`) with:
```
VITE_API_URL=http://localhost:8001
```
(replace 8001 with whatever port your backend is actually on), then restart
`npm run dev`.

---

## What's actually running

- **Backend** (`localhost:8000`): a FastAPI Python server, with a SQLite database
  file at `backend/data/land_acquisition.db`, serving the trained XGBoost model
- **Frontend** (`localhost:5173`): a React app served by Vite's dev server, calling
  the backend over HTTP

Both only run on your machine — nothing is deployed to the internet. Closing
either terminal stops that part of the app.
