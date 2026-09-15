"""
YOLO Image Analysis Stub
------------------------
This is a placeholder for future YOLO-based pollution detection from uploaded images.
When a real YOLO model becomes available:
1. Replace the body of `analyze_image` with real YOLO inference
2. No other code needs to change — the factory and AI service will pick it up automatically

Current behavior: returns None (no image analysis), allowing text-only analysis to proceed.
"""
from typing import Optional


class YOLOStub:
    """
    Development stub for YOLO image analysis.
    Replace with real implementation when model is available.
    """
    
    MODEL_AVAILABLE = False

    async def analyze_image(self, image_path: str) -> Optional[dict]:
        """
        Analyze pollution image using YOLO object detection.
        
        Args:
            image_path: Path to the uploaded image file
            
        Returns:
            dict with detected objects and confidence, or None if model unavailable
        """
        if not self.MODEL_AVAILABLE:
            return None

        # PLACEHOLDER: Replace with real YOLO inference
        # from ultralytics import YOLO
        # model = YOLO('yolov8-pollution.pt')
        # results = model(image_path)
        # return self._parse_results(results)
        return None


# Global instance
yolo_stub = YOLOStub()
