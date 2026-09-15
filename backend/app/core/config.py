from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "CityPulse AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "citypulse-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database - SQLite for local dev, swap to PostgreSQL URL for production
    DATABASE_URL: str = "sqlite+aiosqlite:////tmp/citypulse.db" if os.getenv("VERCEL") else "sqlite+aiosqlite:///./citypulse.db"

    # AI Provider — "ollama" uses local Ollama; set GEMINI_API_KEY to use Gemini instead
    GEMINI_API_KEY: Optional[str] = None
    AI_PROVIDER: str = "ollama"  # "auto" | "ollama" | "gemini" | "mock"

    # Ollama local AI configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_TEXT_MODEL: str = "llama3.1:latest"
    OLLAMA_VISION_MODEL: str = "llava:13b"

    # File Upload
    UPLOAD_DIR: str = "/tmp/uploads" if os.getenv("VERCEL") else "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/webp", "image/gif"]

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
