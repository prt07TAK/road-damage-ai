# 🛰️ DroneAI Bridge Script

This script allows you to connect a physical drone (running ArduPilot/Pixhawk) to your AI Dashboard. It runs on the drone's onboard computer (like a Raspberry Pi) and streams both camera frames and real telemetry.

## 🛠️ Prerequisites

1.  **Hardware**: 
    *   Raspberry Pi 4 / Jetson Nano.
    *   CSI or USB Camera.
    *   Pixhawk/Cube Flight Controller connected via UART.
2.  **Software**:
    *   Python 3.8+
    *   Libraries: `pip install opencv-python requests pymavlink`

## 🚀 How to Use

1.  **Configure `bridge.py`**:
    *   Change `SERVER_URL` to your computer's IP address (e.g., `http://192.168.1.5:5005/api/live/frame`).
    *   Ensure the `SESSION_ID` matches your active session in the dashboard.
    *   Set `MAVLINK_PORT` to the correct serial port (usually `/dev/ttyAMA0` on Pi).

2.  **Run the script**:
    ```bash
    python bridge.py
    ```

3.  **Monitor**:
    *   The dashboard will automatically receive the video feed and update the telemetry HUD with real data from your Pixhawk.
    *   The AI will start analyzing the frames and marking road damages in real-time on your main computer.

## 📋 Features
*   **Real GPS**: Uses the drone's actual GPS coordinates for the map.
*   **Battery Status**: Monitors drone voltage directly on the dashboard.
*   **Altitude & Speed**: Accurate flight telemetry via MAVLink.
*   **Low Latency**: Optimized JPEG compression for smooth streaming.
