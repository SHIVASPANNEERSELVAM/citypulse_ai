import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
from app.api import auth, reports, ai, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize DB tables
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown: nothing to clean up for SQLite


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Urban Pollution Monitoring and Citizen Engagement Platform",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(analytics.router)


@app.get("/health")
async def health_check():
    from app.ai.factory import get_ai_service_singleton
    ai_service = get_ai_service_singleton()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ai_provider": type(ai_service).__name__,
        "database": "SQLite (local)",
    }
