import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("== Health check ==")
r = client.get("/api/health")
print(r.status_code, r.json())

print("\n== Login (admin) ==")
r = client.post("/api/auth/login", data={"username": "admin", "password": "admin123"})
print(r.status_code, r.json())
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("\n== List projects (top risk, limit 3) ==")
r = client.get("/api/projects?limit=3", headers=headers)
print(r.status_code)
for p in r.json():
    print(" ", p["project_id"], p["state"], p["risk_category"], p["risk_score"])

first_id = r.json()[0]["project_id"]

print(f"\n== Get project {first_id} ==")
r = client.get(f"/api/projects/{first_id}", headers=headers)
print(r.status_code, r.json()["project_type"], r.json()["risk_score"])

print(f"\n== Risk explanation for {first_id} ==")
r = client.get(f"/api/projects/{first_id}/risk", headers=headers)
print(r.status_code)
import json
print(json.dumps(r.json(), indent=2))

print("\n== Alerts (risk >= 85) ==")
r = client.get("/api/alerts?threshold=85", headers=headers)
print(r.status_code, "count:", len(r.json()))
print(r.json()[:2])

print("\n== Analytics trends by state (top 5) ==")
r = client.get("/api/analytics/trends?group_by=state", headers=headers)
print(r.status_code)
for t in r.json()[:5]:
    print(" ", t)

print("\n== Analytics summary ==")
r = client.get("/api/analytics/summary", headers=headers)
print(r.status_code, r.json())

print("\n== Audit log (admin only) ==")
r = client.get("/api/audit-log", headers=headers)
print(r.status_code, r.json())

print("\n== Audit log with non-admin (should 403) ==")
r = client.post("/api/auth/login", data={"username": "analyst", "password": "analyst123"})
analyst_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
r = client.get("/api/audit-log", headers=analyst_headers)
print(r.status_code, r.json())

print("\n== No-auth request (should 401) ==")
r = client.get("/api/projects")
print(r.status_code, r.json())

print("\nAll smoke tests completed.")
