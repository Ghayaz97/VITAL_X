from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import settings
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise database tables before serving any requests."""
    init_db()
    yield


app = FastAPI(title="VITAL-X API", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.cors_origins.split(",") if x.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def root_health():
    """Bare healthcheck endpoint for Docker & health probes."""
    return {"status": "ok", "service": "vital-x-api", "version": "0.3.0"}


app.include_router(router)
