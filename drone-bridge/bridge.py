import cv2
import requests
import time
import json
from pymavlink import mavutil

# --- CONFIGURATION ---
# The URL of your main computer running the AI Dashboard
SERVER_URL = "http://YOUR_COMPUTER_IP:5005/api/live/frame"

# Get this from the 'Control' page of your dashboard
SESSION_ID = "YOUR_ACTIVE_SESSION_ID"

# Serial port for Pixhawk/Flight Controller (e.g., '/dev/ttyAMA0' for Pi, 'COM3' for Windows)
MAVLINK_PORT = "/dev/ttyAMA0"
MAVLINK_BAUD = 57600

# Camera settings
CAMERA_INDEX = 0
FRAME_DELAY = 0.5 # Seconds between frames

def connect_mavlink():
    """Establishes connection to the Flight Controller via MAVLink."""
    try:
        print(f"📡 Connecting to Flight Controller on {MAVLINK_PORT}...")
        master = mavutil.mavlink_connection(MAVLINK_PORT, baud=MAVLINK_BAUD)
        master.wait_heartbeat()
        print("✅ Heartbeat received from Drone!")
        return master
    except Exception as e:
        print(f"⚠️ MAVLink Connection Failed: {e}")
        return None

def get_telemetry(master):
    """Fetches real-time telemetry from the drone."""
    telemetry = {
        "lat": 0.0,
        "lng": 0.0,
        "alt": 0.0,
        "battery": 0,
        "speed": 0.0
    }
    
    if not master:
        return telemetry

    try:
        # Request GPS data
        gps_msg = master.recv_match(type='GLOBAL_POSITION_INT', blocking=False)
        if gps_msg:
            telemetry["lat"] = gps_msg.lat / 1.0e7
            telemetry["lng"] = gps_msg.lon / 1.0e7
            telemetry["alt"] = gps_msg.relative_alt / 1000.0 # Convert mm to meters

        # Request Battery & Speed
        vfr_msg = master.recv_match(type='VFR_HUD', blocking=False)
        if vfr_msg:
            telemetry["speed"] = vfr_msg.groundspeed
            
        sys_msg = master.recv_match(type='SYS_STATUS', blocking=False)
        if sys_msg:
            telemetry["battery"] = sys_msg.battery_remaining
            
    except Exception as e:
        print(f"❌ Error reading MAVLink: {e}")
        
    return telemetry

def run_bridge():
    # Initialize Camera
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("❌ Could not open camera.")
        return

    # Initialize Drone Connection
    drone = connect_mavlink()

    print("🚀 Bridge Operational. Streaming to Dashboard...")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("⚠️ Camera frame capture failed.")
                continue

            # Fetch real telemetry
            tel = get_telemetry(drone)

            # 1. Encode frame as JPEG
            _, img_encoded = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            
            # 2. Prepare Payload
            payload = {
                "sessionId": SESSION_ID,
                "latitude": str(tel["lat"]),
                "longitude": str(tel["lng"]),
                "altitude": str(tel["alt"]),
                "battery": str(tel["battery"]),
                "speed": str(tel["speed"])
            }

            # 3. Send to Dashboard
            try:
                files = {'frame': ('drone_view.jpg', img_encoded.tobytes(), 'image/jpeg')}
                response = requests.post(SERVER_URL, data=payload, files=files, timeout=2)
                
                status = "✅ ONLINE" if response.status_code == 200 else f"⚠️ ERR {response.status_code}"
                print(f"[{status}] Lat: {tel['lat']:.5f} | Lng: {tel['lng']:.5f} | Bat: {tel['battery']}%", end="\r")
            
            except Exception as e:
                print(f"❌ Server Connection Lost: {e}")

            time.sleep(FRAME_DELAY)

    except KeyboardInterrupt:
        print("\n🛑 Stopping Bridge...")
    finally:
        cap.release()
        if drone:
            drone.close()

if __name__ == "__main__":
    run_bridge()
