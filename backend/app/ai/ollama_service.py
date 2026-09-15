"""
Ollama AI Service — uses local Ollama server (http://localhost:11434)

Vision model  : llava:13b  — used when the report includes an image
Text model    : llama3.1   — used for text-only reports

No external API keys required. Ollama must be running locally.
"""
import json
import re
import base64
import os
from typing import Optional
import httpx
from app.ai.base import BaseAIService, AIAnalysisResult, SEVERITY_TO_PRIORITY
from app.core.config import settings


ANALYSIS_PROMPT = """You are an AI assistant for CityPulse, an urban pollution monitoring platform.
Analyze the following pollution report submitted by a citizen.

Pollution Category (selected by citizen): {category}
Citizen Description: {description}

{image_instruction}

Based on this information, provide a structured pollution analysis in valid JSON format only.
Do not include any text before or after the JSON block.

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
- If the description is vague, set confidence lower (0.5-0.7)
- Never claim certainty about what you cannot verify from text alone
- Return ONLY the JSON object, no markdown fences, no extra text
"""


def _encode_image_base64(image_path: str) -> Optional[str]:
    """Load an image from the uploads dir and return its base64-encoded content."""
    try:
        filename = os.path.basename(image_path)
        local_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(local_path):
            return None
        with open(local_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        print(f"Warning: Could not encode image for Ollama: {e}")
        return None


def _extract_json(text: str) -> dict:
    """Extract the first JSON object from the model's response."""
    # Strip markdown fences if present
    text = re.sub(r"```(?:json)?", "", text).strip()

    # Find the outermost { ... }
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in Ollama response: {text[:300]}")

    return json.loads(match.group())


class OllamaService(BaseAIService):
    """
    Production-ready local AI service backed by Ollama.

    - Uses llava:13b (multimodal) for reports with images.
    - Falls back to llama3.1 for text-only reports.
    - Calls the Ollama HTTP API directly with httpx (async).
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.text_model = settings.OLLAMA_TEXT_MODEL
        self.vision_model = settings.OLLAMA_VISION_MODEL
        # Long timeout — llava:13b may take 20-40s on first load
        self.timeout = httpx.Timeout(120.0)

    async def _call_ollama(
        self,
        model: str,
        prompt: str,
        images: Optional[list[str]] = None,
    ) -> str:
        """Send a generate request to the Ollama API and return the response text."""
        payload: dict = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "format": "json",  # Instruct Ollama to return JSON where supported
            "options": {
                "temperature": 0.2,   # Low temperature for factual, consistent output
                "num_predict": 512,
            },
        }
        if images:
            payload["images"] = images  # base64-encoded strings

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

    async def analyze(
        self,
        description: str,
        category: str,
        image_path: Optional[str] = None,
    ) -> AIAnalysisResult:
        # Decide model and image encoding
        image_b64: Optional[str] = None
        if image_path:
            image_b64 = _encode_image_base64(image_path)

        use_vision = image_b64 is not None
        model = self.vision_model if use_vision else self.text_model

        image_instruction = (
            "An image has been attached to this report. "
            "Carefully analyze the visual evidence to confirm or refine the category and severity."
            if use_vision
            else "No image was provided. Base your analysis solely on the text description."
        )

        prompt = ANALYSIS_PROMPT.format(
            category=category,
            description=description,
            image_instruction=image_instruction,
        )

        raw_text = await self._call_ollama(
            model=model,
            prompt=prompt,
            images=[image_b64] if use_vision else None,
        )

        try:
            data = _extract_json(raw_text)
        except (ValueError, json.JSONDecodeError) as e:
            raise ValueError(f"Ollama returned invalid JSON: {e}\nRaw: {raw_text[:400]}")

        severity = data.get("severity", "MEDIUM").upper()
        if severity not in SEVERITY_TO_PRIORITY:
            severity = "MEDIUM"

        confidence = float(data.get("confidence", 0.75))
        confidence = max(0.0, min(1.0, confidence))  # clamp to [0, 1]

        return AIAnalysisResult(
            detected_category=data.get("detected_category", category),
            severity=severity,
            confidence=confidence,
            explanation=data.get("explanation", "Analysis completed."),
            recommended_action=data.get("recommended_action", "Dispatch inspection team."),
            priority=SEVERITY_TO_PRIORITY[severity],
            model_name=model,
            raw_response=raw_text,
        )
