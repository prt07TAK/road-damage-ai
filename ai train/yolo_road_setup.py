#!/usr/bin/env python3
"""
YOLOv8 Setup for Broken/Damaged Road Detection
RoadScan AI Project - Makers Conclave
"""

import subprocess
import sys
import os
from pathlib import Path

def check_python_version():
    """Verify Python 3.8+"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher required")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} detected")

def install_dependencies():
    """Install required packages"""
    packages = [
        "ultralytics>=8.0.0",      # YOLOv8
        "opencv-python",            # Image processing
        "numpy",                     # Numerical computing
        "pillow",                    # Image handling
        "torch",                     # PyTorch (deep learning)
        "torchvision",              # Vision utilities
    ]
    
    print("\n🔧 Installing dependencies...")
    for package in packages:
        print(f"   Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", package])
    
    print("✅ All dependencies installed")

def create_directory_structure():
    """Create project directories"""
    dirs = [
        "data/input_images",
        "data/annotated_output",
        "models",
        "results",
        "trained_models",
    ]
    
    print("\n📁 Creating directory structure...")
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"   ✅ {dir_path}/")

def verify_installation():
    """Verify YOLOv8 installation"""
    print("\n🧪 Verifying YOLOv8 installation...")
    try:
        from ultralytics import YOLO
        print("✅ YOLOv8 imported successfully")
        
        # Test model loading
        print("   Downloading YOLOv8n model (first time only, ~35MB)...")
        model = YOLO('yolov8n.pt')
        print("✅ YOLOv8n model loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Installation failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🚁 YOLOv8 SETUP FOR ROADSCAN AI - ROAD DAMAGE DETECTION")
    print("=" * 60)
    
    check_python_version()
    install_dependencies()
    create_directory_structure()
    
    if verify_installation():
        print("\n" + "=" * 60)
        print("🎉 SETUP COMPLETE!")
        print("=" * 60)
        print("\n📋 Next steps:")
        print("   1. Run: python yolov8_road_detector.py")
        print("   2. Place road images in: data/input_images/")
        print("   3. Results will be in: data/annotated_output/")
    else:
        print("\n❌ Setup failed. Check errors above.")
        sys.exit(1)