from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2, base64, numpy as np
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your trained model
model = YOLO("best.pt")
print("✅ Road Damage AI Loaded!")

# Test route to confirm server works
@app.get("/")
async def root():
    return {"status": "AI Server Running ✅"}

@app.websocket("/ws/detect")
async def detect(websocket: WebSocket):
    await websocket.accept()
    print("📷 Camera connected!")

    try:
        while True:
            data = await websocket.receive_text()

            try:
                # Decode frame
                img_bytes = base64.b64decode(data.split(',')[1])
                img_array = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                # Run AI detection
                results = model.predict(frame, conf=0.15, verbose=False)
                annotated = results[0].plot()

                # Build damage list
                damages = []
                for box in results[0].boxes:
                    conf = float(box.conf[0])
                    damages.append({
                        "type": model.names[int(box.cls[0])],
                        "confidence": f"{conf*100:.1f}%",
                        "severity": "🔴 Critical" if conf > 0.7
                                    else "🟡 Moderate" if conf > 0.5
                                    else "🟢 Minor"
                    })

                # Send result back
                _, buffer = cv2.imencode('.jpg', annotated)
                frame_b64 = base64.b64encode(buffer).decode('utf-8')

                await websocket.send_json({
                    "frame": f"data:image/jpeg;base64,{frame_b64}",
                    "damages": damages,
                    "total": len(damages)
                })

            except Exception as inner_e:
                print(f"Frame error: {inner_e}")
                continue

    except WebSocketDisconnect:
        print("Client disconnected normally")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "ai_service:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        ws_ping_interval=None,
        ws_ping_timeout=None
    )