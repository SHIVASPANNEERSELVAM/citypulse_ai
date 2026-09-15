"""Quick test of the Gemini AI service."""
import asyncio
import sys
sys.path.insert(0, '.')

async def main():
    from app.ai.gemini_service import GeminiService
    svc = GeminiService()
    result = await svc.analyze(
        description="Large garbage pile near the park entrance, approximately 3 meters high, attracting flies.",
        category="Garbage Accumulation",
    )
    print(f"Model: {result.model_name}")
    print(f"Category: {result.detected_category}")
    print(f"Severity: {result.severity}")
    print(f"Priority: {result.priority}")
    print(f"Confidence: {result.confidence}")
    print(f"Explanation: {result.explanation}")
    print(f"Action: {result.recommended_action}")

asyncio.run(main())
