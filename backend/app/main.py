from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth_router, projects_router, analytics_router, alerts_router, audit_router, gis_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Land Acquisition Delay Prediction API",
    description="AI-powered risk scoring and monitoring API for Indian land acquisition projects.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to the actual frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(projects_router.router)
app.include_router(analytics_router.router)
app.include_router(alerts_router.router)
app.include_router(audit_router.router)
app.include_router(gis_router.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "land-acquisition-delay-api"}
