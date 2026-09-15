"""
Abstract AI service interface.
All AI providers must implement this interface.
To add a new provider (e.g., Ollama, OpenAI), create a class inheriting from BaseAIService.
"""
from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass


@dataclass
class AIAnalysisResult:
    detected_category: str
    severity: str  # LOW | MEDIUM | HIGH | CRITICAL
    confidence: float  # 0.0 - 1.0
    explanation: str
    recommended_action: str
    priority: str  # P1 | P2 | P3 | P4
    model_name: str
    raw_response: Optional[str] = None


SEVERITY_TO_PRIORITY = {
    "CRITICAL": "P1",
    "HIGH": "P2",
    "MEDIUM": "P3",
    "LOW": "P4",
}


class BaseAIService(ABC):
    @abstractmethod
    async def analyze(
        self,
        description: str,
        category: str,
        image_path: Optional[str] = None,
    ) -> AIAnalysisResult:
        """
        Analyze a pollution report.
        
        Args:
            description: Citizen's textual description of the pollution
            category: The pollution category selected by the citizen
            image_path: Optional path to uploaded image for YOLO/vision analysis
            
        Returns:
            AIAnalysisResult with all analysis fields populated
        """
        pass
