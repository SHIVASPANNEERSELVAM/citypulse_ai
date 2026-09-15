"""
Gemini AI Service — activated when GEMINI_API_KEY is set in .env
Uses the new google.genai SDK (google-genai package).
"""
import json
import re
import os
import asyncio
from typing import Optional
from PIL import Image
from google import genai
from google.genai import types
from app.ai.base import BaseAIService, AIAnalysisResult, SEVERITY_TO_PRIORITY
from app.core.config import settings


GEMINI_PROMPT_TEMPLATE = """
You are an AI assistant for CityPulse, an urban pollution monitoring platform.
Analyze the following pollution report submitted by a citizen.

Pollution Category (selected by citizen): {category}
Citizen Description: {description}

If an image is attached, carefully analyze the visual evidence to confirm or refine the category and severity.

Based on this information, provide a structured pollution analysis in valid JSON format only.
Do not include any text before or after the JSON.

Required JSON structure:
{{
  "detected_category": "string (confirm or refine the citizen's category)",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "confidence": <float between 0.0 and 1.0>,
  "explanation": "string (2-3 sentences explaining the pollution situation and risks)",
  "recommended_action": "string (specific, actionable recommendation for authorities)"
}}

Guidelines:
- Be factual and professional
- Base severity on public health risk, environmental impact, and scale
- If description is vague, set confidence lower (0.5-0.7)
- Never claim certainty about what you cannot verify from text alone
"""


class GeminiService(BaseAIService):
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-3.6-flash"

    async def analyze(
        self,
        description: str,
        category: str,
        image_path: Optional[str] = None,
    ) -> AIAnalysisResult:
        prompt = GEMINI_PROMPT_TEMPLATE.format(
            category=category,
            description=description,
        )

        contents = [prompt]

        if image_path:
            try:
                filename = os.path.basename(image_path)
                local_path = os.path.join(settings.UPLOAD_DIR, filename)
                if os.path.exists(local_path):
                    img = Image.open(local_path)
                    contents.append(img)
            except Exception as e:
                print(f"Warning: Failed to load image for AI analysis: {e}")

        def _call_gemini():
            return self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )

        response = await asyncio.to_thread(_call_gemini)
        raw_text = response.text.strip()

        # Extract JSON from response
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if not json_match:
            raise ValueError(f"Gemini returned non-JSON response: {raw_text[:200]}")

        data = json.loads(json_match.group())

        severity = data.get("severity", "MEDIUM").upper()
        if severity not in SEVERITY_TO_PRIORITY:
            severity = "MEDIUM"

        return AIAnalysisResult(
            detected_category=data.get("detected_category", category),
            severity=severity,
            confidence=float(data.get("confidence", 0.75)),
            explanation=data.get("explanation", "Analysis completed."),
            recommended_action=data.get("recommended_action", "Dispatch inspection team."),
            priority=SEVERITY_TO_PRIORITY[severity],
            model_name=self.model_name,
            raw_response=raw_text,
        )
