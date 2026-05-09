import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LiveFeed from './pages/LiveFeed';
import MapView from './pages/MapView';
import Reports from './pages/Reports';
import DroneControl from './pages/DroneControl';
import SessionDetail from './pages/SessionDetail';
import UploadDetect from './pages/UploadDetect';
import socketService from './services/socket';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const cursorRef = useRef(null);

  useEffect(() => {
    // Custom Cursor Logic
    const moveCursor = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleHover = (e) => {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        cursorRef.current?.classList.add('cursor-hover');
      } else {
        cursorRef.current?.classList.remove('cursor-hover');
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleHover);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      socketService.connect();
    }
    
    setLoading(false);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleHover);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    socketService.disconnect();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#020617]">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div id="custom-cursor" ref={cursorRef} className="hidden lg:block"></div>
      
      {/* Extreme Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] animate-float" style={{ animationDuration: '15s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] animate-float" style={{ animationDuration: '20s', animationDelay: '-5s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[120px] animate-float" style={{ animationDuration: '18s', animationDelay: '-10s' }}></div>
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '16px',
          }
        }}
      />

      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/" />} 
        />
        
        {isAuthenticated ? (
          <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
            <Route index element={<Dashboard />} />
            <Route path="live-feed" element={<LiveFeed />} />
            <Route path="map" element={<MapView />} />
            <Route path="reports" element={<Reports />} />
            <Route path="drone-control" element={<DroneControl />} />
            <Route path="session/:id" element={<SessionDetail />} />
            <Route path="upload-detect" element={<UploadDetect />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
