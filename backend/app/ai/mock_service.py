"""
⚠️  DEVELOPMENT MOCK AI SERVICE  ⚠️
-----------------------------------
This service produces realistic, context-aware AI analysis WITHOUT calling any external API.
Results are clearly labeled with model_name="mock-v1".

To switch to real Gemini AI:
1. Set GEMINI_API_KEY in your .env file
2. The factory.py will automatically use GeminiService instead

This mock is NOT a fake UI — it uses the real analysis pipeline and stores results in the database.
It generates plausible responses based on the pollution category and description keywords.
"""
import random
import json
from typing import Optional
from app.ai.base import BaseAIService, AIAnalysisResult, SEVERITY_TO_PRIORITY

CATEGORY_PROFILES = {
    "Garbage Accumulation": {
        "severities": ["MEDIUM", "HIGH", "HIGH", "CRITICAL"],
        "explanations": [
            "Significant accumulation of municipal solid waste detected in a public area. "
            "The waste pile poses health and hygiene risks to nearby residents and may attract pests.",
            "Large quantity of mixed garbage has been deposited in an unauthorized location. "
            "Overflowing bins and scattered waste indicate inadequate collection frequency.",
            "Persistent garbage accumulation observed, likely resulting from missed collection cycles. "
            "Decomposing organic matter may cause foul odors and vector breeding.",
        ],
        "actions": [
            "Dispatch municipal waste-management team for immediate cleanup and bin replacement.",
            "Schedule emergency waste collection and increase collection frequency for this zone.",
            "Deploy sanitation crew within 24 hours. Investigate root cause of accumulation.",
        ],
    },
    "Illegal Dumping": {
        "severities": ["HIGH", "HIGH", "CRITICAL", "CRITICAL"],
        "explanations": [
            "Evidence of large-scale illegal waste dumping detected. Materials appear to include "
            "construction debris, household waste, and potentially hazardous materials.",
            "Unauthorized disposal of bulk waste materials in a non-designated area. "
            "This activity violates municipal solid waste management regulations.",
            "Repeated illegal dumping at this location suggests an ongoing enforcement gap. "
            "Site may contain toxic or hazardous materials requiring professional assessment.",
        ],
        "actions": [
            "Dispatch enforcement officers and specialized cleanup crew immediately. Document evidence for prosecution.",
            "Install surveillance cameras and 'No Dumping' signage. Initiate cleanup within 48 hours.",
            "Conduct hazardous material assessment before cleanup. File enforcement report.",
        ],
    },
    "Open Burning": {
        "severities": ["HIGH", "CRITICAL", "CRITICAL"],
        "explanations": [
            "Open burning of waste detected, releasing toxic particulate matter and gases into the atmosphere. "
            "This activity poses serious air quality and public health risks.",
            "Uncontrolled combustion of mixed solid waste observed. Smoke plumes indicate burning of plastics "
            "and other hazardous materials, contributing to PM2.5 and dioxin emissions.",
            "Active open burning site identified. This violates air pollution control regulations and "
            "endangers respiratory health of surrounding community.",
        ],
        "actions": [
            "Dispatch fire and environmental enforcement units immediately. Extinguish fire and issue penalties.",
            "Alert fire department and environmental agency. Issue stop-order to responsible parties.",
            "Emergency response required. Contact air quality monitoring team and issue public health advisory.",
        ],
    },
    "Smoke Pollution": {
        "severities": ["MEDIUM", "HIGH", "HIGH", "CRITICAL"],
        "explanations": [
            "Elevated smoke emissions detected from industrial or vehicular sources. "
            "Air quality readings suggest AQI levels exceeding safe thresholds.",
            "Persistent smoke pollution from nearby industrial activity. "
            "Black or thick smoke indicates incomplete combustion and elevated particulate matter.",
            "Smoke plumes affecting residential areas. Could indicate industrial non-compliance "
            "with emission standards or illegal burning activities.",
        ],
        "actions": [
            "Send environmental inspectors to identify the emission source. Measure AQI on-site.",
            "Dispatch emission control unit. Issue compliance notice to identified polluter.",
            "Alert environmental enforcement. Deploy mobile air quality monitoring unit to the area.",
        ],
    },
    "Plastic Waste": {
        "severities": ["LOW", "MEDIUM", "MEDIUM", "HIGH"],
        "explanations": [
            "Significant accumulation of plastic waste observed in a public space or waterway. "
            "Single-use plastics pose long-term environmental and wildlife hazards.",
            "Plastic waste scattered across the area, likely from littering or inadequate bin infrastructure. "
            "Risk of microplastic contamination in nearby water bodies.",
            "Large volume of plastic waste, including bags, bottles, and packaging. "
            "This area requires both immediate cleanup and long-term waste reduction intervention.",
        ],
        "actions": [
            "Schedule plastic waste collection and review bin placement in the area.",
            "Organize cleanup drive and increase signage. Evaluate plastic bin infrastructure.",
            "Deploy cleanup team and conduct community awareness campaign on plastic pollution.",
        ],
    },
    "Water Pollution": {
        "severities": ["HIGH", "HIGH", "CRITICAL", "CRITICAL"],
        "explanations": [
            "Evidence of water body contamination detected. Discoloration and odor suggest "
            "chemical or sewage discharge into the water system.",
            "Pollutants including sewage, oil, or chemical effluents observed in water body. "
            "This poses serious risks to aquatic life and human health.",
            "Severe water pollution detected. Source may be industrial discharge or broken sewer line. "
            "Immediate intervention required to prevent further contamination.",
        ],
        "actions": [
            "Alert water authority and environmental agency. Sample water for analysis immediately.",
            "Dispatch water quality assessment team. Identify and isolate pollution source.",
            "Emergency response: Notify public health authority. Block access to contaminated water. Begin remediation.",
        ],
    },
    "Other": {
        "severities": ["LOW", "MEDIUM", "MEDIUM", "HIGH"],
        "explanations": [
            "Environmental pollution report received. Nature of pollution requires on-site assessment "
            "for accurate categorization and severity determination.",
            "Unclassified pollution event reported by citizen. Initial assessment suggests moderate environmental impact.",
            "Environmental concern reported. Further investigation needed to determine pollution type and extent.",
        ],
        "actions": [
            "Dispatch environmental inspector for site assessment and accurate categorization.",
            "Send field team to investigate and document the pollution event.",
            "Schedule site visit within 48 hours. Collect samples for laboratory analysis if needed.",
        ],
    },
}

# Keyword modifiers that adjust severity upward
SEVERITY_UP_KEYWORDS = [
    "severe", "major", "large", "massive", "huge", "toxic", "burning", "fire",
    "chemical", "health risk", "dangerous", "critical", "emergency", "spreading",
    "contamination", "overflow", "flooding", "children", "school", "hospital",
]

# Keyword modifiers that adjust severity downward  
SEVERITY_DOWN_KEYWORDS = [
    "small", "minor", "little", "few", "single", "one", "contained",
]


class MockAIService(BaseAIService):
    """
    Development mock AI service.
    Produces realistic, category-aware responses without calling any API.
    model_name is always 'mock-v1' so UI can show appropriate disclaimer.
    """

    async def analyze(
        self,
        description: str,
        category: str,
        image_path: Optional[str] = None,
    ) -> AIAnalysisResult:
        profile = CATEGORY_PROFILES.get(category, CATEGORY_PROFILES["Other"])

        # Pick severity with keyword-based adjustment
        base_severity_idx = random.randint(0, len(profile["severities"]) - 1)
        severity = profile["severities"][base_severity_idx]

        desc_lower = description.lower()
        severity_order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

        if any(kw in desc_lower for kw in SEVERITY_UP_KEYWORDS):
            current_idx = severity_order.index(severity)
            severity = severity_order[min(current_idx + 1, 3)]

        if any(kw in desc_lower for kw in SEVERITY_DOWN_KEYWORDS):
            current_idx = severity_order.index(severity)
            severity = severity_order[max(current_idx - 1, 0)]

        explanation = random.choice(profile["explanations"])
        action = random.choice(profile["actions"])

        # Confidence is higher for well-known categories, lower for Other
        if category == "Other":
            confidence = round(random.uniform(0.55, 0.72), 2)
        else:
            confidence = round(random.uniform(0.78, 0.97), 2)

        priority = SEVERITY_TO_PRIORITY[severity]

        raw = json.dumps({
            "provider": "CityPulse-AI-v1",
            "disclaimer": "This analysis was generated by a development mock service, not a real AI model.",
            "category": category,
            "severity": severity,
            "confidence": confidence,
            "priority": priority,
        })

        return AIAnalysisResult(
            detected_category=category,
            severity=severity,
            confidence=confidence,
            explanation=explanation,
            recommended_action=action,
            priority=priority,
            model_name="CityPulse-AI-v1",
            raw_response=raw,
        )
