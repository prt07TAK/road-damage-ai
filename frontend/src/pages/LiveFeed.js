import React, { useRef, useState, useEffect } from 'react';

export default function LiveFeed() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [resultFrame, setResultFrame] = useState(null);
  const [damages, setDamages] = useState([]);
  const [totalDetected, setTotalDetected] = useState(0);

  const startCamera = async () => {
  try {
    // Connect to Python AI with error handling
    const ws = new WebSocket('wss://road-damage-ai.onrender.com/ws/detect');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ AI Connected!');
      setIsConnected(true);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket Error:', error);
      alert('Cannot connect to AI server! Make sure python ai_service.py is running on port 8000');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setResultFrame(data.frame);
      setDamages(data.damages);
      setTotalDetected(prev => prev + data.total);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
    };

    // Start camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
    setCameraOn(true);

    // Wait for WebSocket to connect before sending frames
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const frame = canvas.toDataURL('image/jpeg', 0.7);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(frame);
        } else {
          console.log('WebSocket state:', wsRef.current?.readyState);
        }
      }, 300);
    }, 1000); // wait 1 second for WS to connect

  } catch (err) {
    console.error('Error:', err);
    alert(`Error: ${err.message}`);
  }
};

  const stopCamera = () => {
    clearInterval(intervalRef.current);
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
    setCameraOn(false);
    setIsConnected(false);
    setResultFrame(null);
    setDamages([]);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-400">
          🚗 Live Road Damage Detection
        </h1>
        <p className="text-gray-400 mt-1">
          Real-time AI detection using YOLO26
        </p>
      </div>

      {/* Status Bar */}
      <div className="flex gap-4 mb-6">
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isConnected ? '🟢 AI Connected' : '🔴 AI Disconnected'}
        </span>
        <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
          📊 Total Detected: {totalDetected}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={startCamera}
          disabled={cameraOn}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
                     disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
        >
          📷 Start Detection
        </button>
        <button
          onClick={stopCamera}
          disabled={!cameraOn}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 
                     disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
        >
          ⏹ Stop
        </button>
      </div>

      {/* Video Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Live Camera */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-gray-400 text-sm mb-3 font-medium">
            📹 LIVE CAMERA
          </h3>
          <video
            ref={videoRef}
            muted
            className="w-full rounded-xl bg-black"
            style={{ minHeight: '240px' }}
          />
        </div>

        {/* AI Output */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-gray-400 text-sm mb-3 font-medium">
            🤖 AI DETECTION OUTPUT
          </h3>
          {resultFrame ? (
            <img
              src={resultFrame}
              alt="AI Detection"
              className="w-full rounded-xl"
            />
          ) : (
            <div className="w-full flex items-center justify-center rounded-xl bg-black/40 border border-white/5"
                 style={{ minHeight: '240px' }}>
              <p className="text-gray-600">
                {cameraOn ? 'Processing...' : 'Start camera to see AI output'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Damage Results */}
      {damages.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            ⚠️ Detected Damage ({damages.length})
          </h3>
          <div className="space-y-3">
            {damages.map((d, i) => (
              <div key={i}
                className="flex items-center justify-between bg-white/5 
                           rounded-xl px-4 py-3 border border-white/10">
                <span className="font-medium">🔍 {d.type}</span>
                <span className="text-gray-300">{d.severity}</span>
                <span className="text-blue-400 font-mono">{d.confidence}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cameraOn && damages.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
          <p className="text-green-400 text-lg">✅ No damage detected — Road looks good!</p>
        </div>
      )}
    </div>
  );
}