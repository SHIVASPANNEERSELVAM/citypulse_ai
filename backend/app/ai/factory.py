"""
AI Service Factory
------------------
Automatically selects the appropriate AI provider:
  - AI_PROVIDER="ollama"  → uses OllamaService (local Ollama, default)
  - AI_PROVIDER="gemini"  → uses GeminiService (requires GEMINI_API_KEY)
  - AI_PROVIDER="mock"    → uses MockAIService (dev/testing only)
  - AI_PROVIDER="auto"    → gemini if key set, else ollama, else mock

To add a new provider:
1. Create a new service class inheriting BaseAIService
2. Add a case to get_ai_service()
"""
from app.ai.base import BaseAIService
from app.core.config import settings


def get_ai_service() -> BaseAIService:
    provider = settings.AI_PROVIDER

    # Auto-detect: gemini if key set, else ollama, else mock
    if provider == "auto":
        if settings.GEMINI_API_KEY:
            provider = "gemini"
        else:
            # Try ollama first; fall back to mock only if base URL is unreachable
            provider = "ollama"

    if provider == "ollama":
        from app.ai.ollama_service import OllamaService
        return OllamaService()

    if provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise ValueError("AI_PROVIDER=gemini but GEMINI_API_KEY is not set")
        from app.ai.gemini_service import GeminiService
        return GeminiService()

    if provider == "mock":
        from app.ai.mock_service import MockAIService
        return MockAIService()

    raise ValueError(f"Unknown AI provider: {provider}. Valid options: auto, ollama, gemini, mock")


# Singleton instance
_ai_service: BaseAIService | None = None


def get_ai_service_singleton() -> BaseAIService:
    global _ai_service
    if _ai_service is None:
        _ai_service = get_ai_service()
    return _ai_service


def reset_ai_service_singleton() -> None:
    """Call this to force re-initialization (e.g., after changing config in tests)."""
    global _ai_service
    _ai_service = None

