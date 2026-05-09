#!/usr/bin/env python3
"""
YOLOv8 Training Module for Road Damage Detection
Fine-tune on custom dataset - RoadScan AI
"""

import os
from pathlib import Path
from ultralytics import YOLO
import yaml
import json
import torch

class RoadDamageTrainer:
    def __init__(self, project_name='road_damage_detector'):
        """Initialize trainer"""
        self.project_name = project_name
        self.data_dir = Path('data/road_damage_dataset')
        self.models_dir = Path('trained_models')
        self.models_dir.mkdir(parents=True, exist_ok=True)
    
    def create_dataset_structure(self):
        """Create YOLO-compatible dataset structure"""
        print("\n📁 Creating dataset structure...")
        
        structure = {
            'images': ['train', 'val', 'test'],
            'labels': ['train', 'val', 'test']
        }
        
        for folder_type in structure:
            for split in structure[folder_type]:
                path = self.data_dir / folder_type / split
                path.mkdir(parents=True, exist_ok=True)
                print(f"   ✅ {path}/")
    
    def create_dataset_yaml(self):
        """
        Create dataset.yaml for YOLO training
        Update paths to your actual dataset
        """
        dataset_yaml = {
            'path': str(self.data_dir),
            'train': 'images/train',
            'val': 'images/val',
            'test': 'images/test',
            
            # Number of classes
            'nc': 6,
            
            # Class names
            'names': {
                0: 'pothole',
                1: 'crack',
                2: 'rut',
                3: 'patch',
                4: 'debris',
                5: 'intact_road'
            }
        }
        
        yaml_path = self.data_dir / 'data.yaml'
        with open(yaml_path, 'w') as f:
            yaml.dump(dataset_yaml, f, default_flow_style=False)
        
        print(f"✅ Dataset config saved: {yaml_path}")
        return yaml_path
    
    def download_sample_dataset(self):
        """
        Download sample road damage dataset from Roboflow
        Instructions for manual setup
        """
        print("\n📥 DATASET SETUP INSTRUCTIONS")
        print("="*60)
        print("""
Option 1: Download from Roboflow (Recommended)
─────────────────────────────────────────────
1. Go to https://roboflow.com
2. Search for "road damage" or "pothole detection"
3. Choose a public dataset (many available)
4. Click "Download" → select "YOLO v8" format
5. Extract to: data/road_damage_dataset/

Recommended datasets:
  • RDD2020 (Global road damage dataset)
  • Pothole Detection Dataset
  • Road Condition Detection Dataset

Option 2: Use Your Own Data
──────────────────────────
1. Place images in: data/road_damage_dataset/images/train/
2. Create annotations in: data/road_damage_dataset/labels/train/
3. Format: .txt files with YOLO format:
   <class_id> <x_center> <y_center> <width> <height>
   (coordinates normalized 0-1)

Option 3: Minimal Testing (Quick Start)
───────────────────────────────────────
Run: python yolov8_train.py --create-test-data
        """)
        print("="*60)
    
    def train_model(self, model_size='n', epochs=50, batch_size=16, img_size=640):
        """
        Train YOLOv8 model on road damage dataset
        
        Args:
            model_size: 'n', 's', 'm', 'l', 'x'
            epochs: Number of training epochs
            batch_size: Batch size for training
            img_size: Image size (square)
        """
        # Load pre-trained model
        print(f"\n🚀 Loading YOLOv8{model_size} for training...")
        model = YOLO(f'yolov8{model_size}.pt')
        
        # Create dataset yaml
        dataset_yaml = self.create_dataset_yaml()
        
        # Train
        print(f"\n🏋️  Starting training...")
        print(f"   Model: YOLOv8{model_size}")
        print(f"   Epochs: {epochs}")
        print(f"   Batch size: {batch_size}")
        print(f"   Image size: {img_size}")
        
        results = model.train(
            data=str(dataset_yaml),
            epochs=epochs,
            imgsz=img_size,
            batch=batch_size,
            patience=10,
            device=0 if torch.cuda.is_available() else 'cpu', # GPU device or 'cpu'
            project=str(self.models_dir),
            name=f'road_damage_{model_size}',
            save=True,
            pretrained=True,
            augment=True,
            mosaic=1.0,
            hsv_h=0.015,
            hsv_s=0.7,
            hsv_v=0.4,
            flipud=0.5,
            fliplr=0.5,
            degrees=10,
            translate=0.1,
            scale=0.5,
            verbose=True
        )
        
        print("\n✅ Training complete!")
        return results
    
    def evaluate_model(self, model_path):
        """Evaluate trained model on validation set"""
        print(f"\n📊 Evaluating model: {model_path}")
        
        model = YOLO(model_path)
        dataset_yaml = self.data_dir / 'data.yaml'
        
        metrics = model.val(data=str(dataset_yaml))
        
        print("\n✅ Evaluation complete!")
        return metrics
    
    def export_model(self, model_path, format='onnx'):
        """
        Export trained model to different formats
        
        Args:
            format: 'onnx', 'torchscript', 'tflite', 'pb', 'saved_model'
        """
        print(f"\n📦 Exporting model as {format.upper()}...")
        
        model = YOLO(model_path)
        export_path = model.export(format=format)
        
        print(f"✅ Model exported to: {export_path}")
        return export_path
    
    def create_test_dataset(self):
        """Create minimal test dataset for quick training"""
        print("\n🧪 Creating test dataset...")
        
        import cv2
        import numpy as np
        
        self.create_dataset_structure()
        
        # Create 5 synthetic images for train and 2 for val
        for split, count in [('train', 5), ('val', 2)]:
            for i in range(count):
                img = np.ones((416, 416, 3), dtype=np.uint8) * 200
                cv2.rectangle(img, (50, 100), (366, 350), (100, 100, 100), -1)
                
                # Add circle (pothole)
                cv2.circle(img, (150 + i*30, 200), 25, (30, 30, 30), -1)
                
                img_path = self.data_dir / f'images/{split}/test_image_{i}.jpg'
                cv2.imwrite(str(img_path), img)
                
                # Create corresponding label
                label_path = self.data_dir / f'labels/{split}/test_image_{i}.txt'
                with open(label_path, 'w') as f:
                    # Format: class_id center_x center_y width height (normalized)
                    f.write(f"0 0.35 0.45 0.15 0.15\n")  # pothole
                    f.write(f"5 0.8 0.8 0.3 0.3\n")       # intact road
        
        print(f"✅ Test dataset created with {len(list((self.data_dir / 'images/train').glob('*.jpg')))} images")


# Quick reference guide
TRAINING_GUIDE = """
╔══════════════════════════════════════════════════════════════════════╗
║           YOLOV8 TRAINING QUICK REFERENCE - ROADSCAN AI              ║
╚══════════════════════════════════════════════════════════════════════╝

1️⃣  PREPARE YOUR DATA
   ├─ Collect ~500+ road damage images
   ├─ Use tool: Roboflow, LabelImg, or CVAT for annotation
   ├─ Create labels in YOLO format
   └─ Split: 70% train, 15% val, 15% test

2️⃣  ORGANIZE DATASET
   data/road_damage_dataset/
   ├─ images/
   │  ├─ train/ (350+ images)
   │  ├─ val/   (75+ images)
   │  └─ test/  (75+ images)
   └─ labels/
      ├─ train/ (corresponding .txt files)
      ├─ val/
      └─ test/

3️⃣  ANNOTATION FORMAT (YOLO)
   Each .txt file: <class_id> <x_center> <y_center> <width> <height>
   
   Example:
   0 0.5 0.5 0.3 0.2
   1 0.2 0.3 0.1 0.15
   
   Classes:
   0 = pothole
   1 = crack
   2 = rut
   3 = patch
   4 = debris
   5 = intact_road

4️⃣  START TRAINING
   
   # Quick test (test dataset)
   python yolov8_train.py --create-test-data
   python yolov8_train.py --train-quick
   
   # Full training (your dataset)
   python yolov8_train.py --train --epochs 100

5️⃣  HYPERPARAMETERS TO TUNE
   ├─ epochs: 50-200 (more = better, if no overfitting)
   ├─ batch_size: 8-64 (larger = faster, needs more VRAM)
   ├─ img_size: 416, 512, 640 (larger = better detection, slower)
   ├─ learning_rate: 0.001-0.01
   └─ augmentation: mosaic, mixup, HSV shifts

6️⃣  MONITOR TRAINING
   ├─ TensorBoard: tensorboard --logdir runs/detect
   ├─ Weights & Biases: (optional cloud logging)
   └─ Real-time metrics in console

7️⃣  EVALUATE & EXPORT
   python yolov8_train.py --evaluate
   python yolov8_train.py --export --format onnx

8️⃣  USE TRAINED MODEL
   from ultralytics import YOLO
   model = YOLO('trained_models/road_damage_n/weights/best.pt')
   results = model('image.jpg')
   results[0].show()

─────────────────────────────────────────────────────────────────────────
COMMON ISSUES & SOLUTIONS

❌ "No GPU found"
   → Set device='cpu' in train() or run on CPU
   → Install CUDA + torch with GPU support

❌ "CUDA out of memory"
   → Reduce batch_size (8 instead of 16)
   → Reduce img_size (416 instead of 640)
   → Use smaller model ('n' instead of 'l')

❌ "Dataset not found"
   → Verify path in data.yaml matches your structure
   → Check annotation format in .txt files
   → Ensure class_ids match (0-5 for 6 classes)

❌ "Low accuracy"
   → Collect more data (aim for 500+ per class)
   → Improve annotation quality
   → Train longer (increase epochs)
   → Try larger model size ('m' or 'l')
"""


if __name__ == "__main__":
    import sys
    
    trainer = RoadDamageTrainer()
    
    print("\n" + "="*70)
    print("🏋️  YOLOV8 ROAD DAMAGE TRAINER")
    print("="*70)
    
    # Show quick guide
    print(TRAINING_GUIDE)
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if '--create-test-data' in sys.argv:
            trainer.create_test_dataset()
            trainer.create_dataset_yaml()
            print("\n✅ Test dataset ready. Next: train with --train-quick")
        
        elif '--train-quick' in sys.argv:
            trainer.train_model(model_size='n', epochs=5, batch_size=8)
        
        elif '--train' in sys.argv:
            # Optimized for CPU/Low memory: Nano model, smaller batch, smaller image
            trainer.train_model(model_size='n', epochs=50, batch_size=4, img_size=416)
    
    else:
        # Show instructions
        trainer.download_sample_dataset()
        print("\n📚 For detailed training, run:")
        print("   python yolov8_train.py --create-test-data")
        print("   python yolov8_train.py --train-quick")