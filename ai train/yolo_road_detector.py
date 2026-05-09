#!/usr/bin/env python3
"""
YOLOv8 Road Damage Detection Engine
RoadScan AI - Drone-based Road Monitoring
"""

import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO
import json
from datetime import datetime
import os

class RoadDamageDetector:
    def __init__(self, model_size='n', confidence=0.5):
        """
        Initialize Road Damage Detector
        
        Args:
            model_size: 'n' (nano), 's' (small), 'm' (medium), 'l' (large), 'x' (xlarge)
            confidence: Detection confidence threshold (0.0-1.0)
        """
        print(f"🚀 Loading YOLOv8{model_size} model...")
        import os
        model_path = f'yolov8{model_size}.pt'
        if not os.path.exists(model_path) and os.path.exists(os.path.join('..', model_path)):
            model_path = os.path.join('..', model_path)
            
        self.model = YOLO(model_path)
        self.confidence = confidence
        self.device = 'cuda' if self._has_gpu() else 'cpu'
        print(f"✅ Model loaded on {self.device.upper()}")
        
        # Class mapping for road conditions
        self.road_classes = {
            0: 'Intact Road',
            1: 'Pothole',
            2: 'Crack',
            3: 'Rutting',
            4: 'Patch',
            5: 'Debris',
        }
    
    def _has_gpu(self):
        """Check if CUDA GPU is available"""
        try:
            return cv2.cuda.getCudaEnabledDeviceCount() > 0
        except:
            return False
    
    def detect_road_damage(self, image_path, save_annotated=True):
        """
        Detect road damage in an image
        
        Args:
            image_path: Path to input image
            save_annotated: Whether to save annotated result
            
        Returns:
            Dictionary with detection results
        """
        # Load image
        image = cv2.imread(str(image_path))
        if image is None:
            return {"error": f"Could not load image: {image_path}"}
        
        height, width = image.shape[:2]
        
        # Run inference
        results = self.model(image, conf=self.confidence)
        
        # Extract detections
        detections = []
        damage_count = 0
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                
                # Determine damage type
                damage_type = self._classify_damage(x1, y1, x2, y2, image)
                
                detection = {
                    "type": damage_type,
                    "confidence": round(confidence, 3),
                    "location": {
                        "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                        "center": [(x1+x2)//2, (y1+y2)//2]
                    },
                    "area_pixels": (x2-x1) * (y2-y1),
                    "area_percentage": round(((x2-x1) * (y2-y1)) / (height * width) * 100, 2)
                }
                detections.append(detection)
                damage_count += 1
        
        # Save annotated image
        annotated_path = None
        if save_annotated and len(detections) > 0:
            annotated_image = results[0].plot()
            annotated_path = self._save_annotated_image(image_path, annotated_image)
        
        return {
            "image_path": str(image_path),
            "image_size": {"width": width, "height": height},
            "damage_detected": damage_count > 0,
            "damage_count": damage_count,
            "detections": detections,
            "severity": self._calculate_severity(detections),
            "annotated_image": annotated_path,
            "timestamp": datetime.now().isoformat()
        }
    
    def _classify_damage(self, x1, y1, x2, y2, image):
        """
        Classify type of road damage based on region analysis
        
        Returns: 'pothole', 'crack', 'rut', 'debris', 'patch', 'intact'
        """
        # Extract region of interest
        roi = image[y1:y2, x1:x2]
        
        # Convert to grayscale and analyze
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Calculate local statistics
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Simple classification based on features
        if variance > 500:
            return "pothole"
        elif edge_density > 0.15:
            return "crack"
        elif variance > 200:
            return "rut"
        else:
            return "intact"
    
    def _calculate_severity(self, detections):
        """Calculate overall severity score (0-100)"""
        if not detections:
            return 0
        
        # Score based on number and confidence of detections
        severity = min(100, len(detections) * 10 + 
                      sum(d['confidence'] for d in detections) * 5)
        return round(severity, 1)
    
    def _save_annotated_image(self, input_path, annotated_image):
        """Save annotated detection image"""
        output_dir = Path("data/annotated_output")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        input_name = Path(input_path).stem
        output_path = output_dir / f"{input_name}_detected.jpg"
        
        cv2.imwrite(str(output_path), annotated_image)
        return str(output_path)
    
    def batch_detect(self, image_dir='data/input_images'):
        """
        Process multiple images from a directory
        
        Args:
            image_dir: Directory containing images
            
        Returns:
            List of detection results
        """
        image_dir = Path(image_dir)
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        
        image_files = []
        for ext in image_extensions:
            image_files.extend(image_dir.glob(f'*{ext}'))
            image_files.extend(image_dir.glob(f'*{ext.upper()}'))
        
        if not image_files:
            print(f"⚠️  No images found in {image_dir}")
            return []
        
        print(f"\n🔍 Processing {len(image_files)} images...")
        results = []
        
        for idx, image_path in enumerate(image_files, 1):
            print(f"   [{idx}/{len(image_files)}] Processing {image_path.name}...", end=" ")
            result = self.detect_road_damage(str(image_path))
            results.append(result)
            print(f"✅ ({result['damage_count']} damages detected)")
        
        return results
    
    def generate_report(self, results, output_file='results/detection_report.json'):
        """
        Generate JSON report of detections
        
        Args:
            results: List of detection results
            output_file: Path to save report
        """
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        summary = {
            "total_images": len(results),
            "images_with_damage": sum(1 for r in results if r['damage_detected']),
            "total_damages_detected": sum(r['damage_count'] for r in results),
            "average_severity": round(np.mean([r['severity'] for r in results]), 2),
            "detections": results
        }
        
        with open(output_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Report saved to: {output_path}")
        return summary
    
    def print_summary(self, results):
        """Print summary statistics"""
        if not results:
            print("No results to summarize")
            return
        
        print("\n" + "="*60)
        print("📊 ROAD DAMAGE DETECTION SUMMARY")
        print("="*60)
        print(f"Total images processed: {len(results)}")
        print(f"Images with damage detected: {sum(1 for r in results if r['damage_detected'])}")
        print(f"Total damages detected: {sum(r['damage_count'] for r in results)}")
        
        all_damages = []
        for r in results:
            for detection in r.get('detections', []):
                all_damages.append(detection['type'])
        
        if all_damages:
            print("\nDamage types found:")
            from collections import Counter
            damage_counts = Counter(all_damages)
            for damage_type, count in damage_counts.most_common():
                print(f"   • {damage_type}: {count}")
        
        avg_severity = np.mean([r['severity'] for r in results])
        print(f"\nAverage severity: {avg_severity:.1f}/100")
        print("="*60 + "\n")


def demo_with_sample_image():
    """Create and process a sample road image for demonstration"""
    print("\n" + "="*60)
    print("🎨 CREATING SAMPLE ROAD IMAGE FOR DEMO")
    print("="*60)
    
    # Create synthetic road image
    img = np.ones((480, 640, 3), dtype=np.uint8) * 200
    
    # Draw road surface
    cv2.rectangle(img, (50, 100), (590, 400), (100, 100, 100), -1)
    
    # Draw lane markings
    for y in range(100, 400, 40):
        cv2.line(img, (320, y), (320, y+20), (255, 255, 255), 2)
    
    # Add some damage areas
    # Pothole 1
    cv2.circle(img, (200, 200), 30, (30, 30, 30), -1)
    cv2.circle(img, (200, 200), 30, (50, 50, 50), 2)
    
    # Crack
    points = np.array([[300, 150], [320, 180], [315, 210], [335, 240]], np.int32)
    cv2.polylines(img, [points], False, (80, 80, 80), 3)
    
    # Pothole 2
    cv2.circle(img, (450, 300), 25, (20, 20, 20), -1)
    cv2.circle(img, (450, 300), 25, (60, 60, 60), 2)
    
    # Save sample image
    Path("data/input_images").mkdir(parents=True, exist_ok=True)
    sample_path = "data/input_images/sample_road.jpg"
    cv2.imwrite(sample_path, img)
    
    print(f"✅ Sample road image created: {sample_path}")
    return sample_path


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚁 ROADSCAN AI - ROAD DAMAGE DETECTION ENGINE")
    print("="*60)
    
    # Initialize detector
    detector = RoadDamageDetector(model_size='n', confidence=0.5)
    
    # Create sample image for demo
    sample_path = demo_with_sample_image()
    
    # Detect damage in sample image
    print("\n🔍 Running detection on sample image...")
    result = detector.detect_road_damage(sample_path)
    
    print(f"\n✅ Detection complete!")
    print(f"   Damages detected: {result['damage_count']}")
    print(f"   Severity score: {result['severity']}/100")
    if result['annotated_image']:
        print(f"   Annotated image: {result['annotated_image']}")
    
    # Process batch if more images exist
    print("\n📁 Scanning for batch processing...")
    results = detector.batch_detect()
    
    if results:
        detector.print_summary(results)
        detector.generate_report(results)
    
    print("\n💡 Next steps:")
    print("   1. Add your drone road images to: data/input_images/")
    print("   2. Run: python yolov8_road_detector.py")
    print("   3. Check annotated results in: data/annotated_output/")
    print("   4. View detailed report: results/detection_report.json")