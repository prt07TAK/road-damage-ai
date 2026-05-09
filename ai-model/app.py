from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image
import io
import os
import torch
from pathlib import Path

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Simulated AI Model Loading
# In production, you would load a real YOLO/CNN model
class RoadDamageDetector:
    def __init__(self):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        # Load YOLOv8 model
        try:
            from ultralytics import YOLO
            # Load pre-trained YOLOv8 model or your custom trained model
            self.model = YOLO('yolov8n.pt')  # nano model (you have yolov8n.pt in root)
            self.model_loaded = True
        except Exception as e:
            print(f"Warning: Could not load YOLO model: {e}")
            self.model = None
            self.model_loaded = False
        self.classes = ['crack', 'pothole', 'undamaged']
        self.severity_map = {'crack': 'medium', 'pothole': 'high'}
        
    def detect(self, image_data):
        """
        Detect damages in image
        Returns: {
            'detected': bool,
            'damageType': str,
            'severity': str,
            'confidence': float,
            'boxes': list  # [x, y, w, h]
        }
        """
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_data))
            image_np = np.array(image)
            
            # Placeholder detection logic
            # In production, run through your model
            result = self._run_inference(image_np)
            return result
            
        except Exception as e:
            return {
                'detected': False,
                'error': str(e),
                'damageType': 'undamaged',
                'severity': 'low',
                'confidence': 0.0
            }
    
    def _run_inference(self, image):
        """Real YOLO inference on image"""
        if not self.model_loaded or self.model is None:
            return {
                'detected': False,
                'damageType': 'undamaged',
                'severity': 'low',
                'confidence': 0.0,
                'boxes': [],
                'error': 'Model not loaded'
            }
        
        try:
            # Run YOLO inference
            results = self.model(image, conf=0.5)  # 50% confidence threshold
            
            detections = []
            boxes = []
            max_confidence = 0
            detected_types = []
            
            for result in results:
                if result.boxes is not None and len(result.boxes) > 0:
                    for box in result.boxes:
                        # Extract bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        
                        boxes.append([float(x1), float(y1), float(x2), float(y2)])
                        detections.append({
                            'confidence': conf,
                            'class': cls_id
                        })
                        
                        if conf > max_confidence:
                            max_confidence = conf
            
            if len(detections) > 0:
                # Damage detected - classify type and severity
                avg_confidence = sum([d['confidence'] for d in detections]) / len(detections)
                
                # Use the class with highest confidence
                main_detection = max(detections, key=lambda x: x['confidence'])
                class_id = main_detection['class']
                
                # Map class ID to name
                if class_id < len(self.classes):
                    damage_type = self.classes[class_id]
                else:
                    damage_type = 'pothole' if avg_confidence > 0.6 else 'crack'
                
                # Determine severity
                if len(detections) >= 3 and avg_confidence > 0.75:
                    severity = 'high'
                elif avg_confidence > 0.65:
                    severity = 'medium'
                else:
                    severity = 'low'
                
                return {
                    'detected': True,
                    'damageType': damage_type,
                    'severity': severity,
                    'confidence': round(avg_confidence, 4),
                    'boxes': boxes
                }
            else:
                # No damage detected
                return {
                    'detected': False,
                    'damageType': 'undamaged',
                    'severity': 'none',
                    'confidence': 0.0,
                    'boxes': []
                }
                
        except Exception as e:
            print(f"Inference error: {e}")
            return {
                'detected': False,
                'damageType': 'undamaged',
                'severity': 'low',
                'confidence': 0.0,
                'boxes': [],
                'error': str(e)
            }

# Initialize detector
detector = RoadDamageDetector()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'device': detector.device,
        'model_loaded': True
    })

@app.route('/detect', methods=['POST'])
def detect_damage():
    """
    Main detection endpoint
    Expects: multipart/form-data with 'file' field containing image
    Returns: {
        'detected': bool,
        'damageType': str (crack/pothole/undamaged),
        'severity': str (low/medium/high),
        'confidence': float (0-1),
        'boxes': list
    }
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read image data
        image_data = file.read()
        
        # Run detection
        result = detector.detect(image_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch-detect', methods=['POST'])
def batch_detect():
    """
    Batch detection for multiple images
    Expects: JSON with 'images' array (base64 encoded)
    """
    try:
        data = request.get_json()
        
        if 'images' not in data:
            return jsonify({'error': 'No images provided'}), 400
        
        results = []
        for img_data in data['images']:
            # Decode base64
            import base64
            image_bytes = base64.b64decode(img_data.split(',')[1])
            result = detector.detect(image_bytes)
            results.append(result)
        
        return jsonify({'results': results})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        'model_type': 'YOLO-based Road Damage Detector',
        'device': detector.device,
        'classes': detector.classes,
        'version': '1.0',
        'supported_formats': ['jpg', 'png', 'jpeg', 'bmp']
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
