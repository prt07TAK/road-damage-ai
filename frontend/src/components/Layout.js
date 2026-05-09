import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Video, Map as MapIcon, FileText, Gamepad2, Search, Bell, Hexagon, ChevronRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

export default function Layout({ user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Live Feed', path: '/live-feed', icon: <Video size={18} /> },
    { name: 'Map View', path: '/map', icon: <MapIcon size={18} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={18} /> },
    { name: 'Control', path: '/drone-control', icon: <Gamepad2 size={18} /> },
    { name: 'Upload & Detect', path: '/upload-detect', icon: <Search size={18} /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between h-20">

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-12"
          >
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:rotate-12 transition-transform duration-500">
                <Hexagon className="text-white fill-white/20" size={22} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tighter text-white">
                DRONE<span className="text-sky-400">AI</span>
              </h1>
            </Link>

            <nav className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm group ${isActive(item.path)
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {isActive(item.path) && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 z-0"
                    />
                  )}
                  <span className={`relative z-10 ${isActive(item.path) ? 'text-sky-400' : 'group-hover:text-sky-400'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="relative z-10">{item.name}</span>
                </Link>
              ))}
            </nav>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:flex items-center gap-6"
          >
            <div className="relative group w-64 xl:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-sky-400 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Quick search..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.08] transition-all"
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all group active:scale-95">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full border-2 border-[#020617] animate-pulse"></span>
              </button>

              <div className="h-8 w-px bg-white/10"></div>

              <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                <div className="text-right hidden xl:block">
                  <p className="text-xs font-bold text-white leading-tight group-hover:text-sky-400 transition-colors">{user?.name || 'Prince Shrivastav'}</p>
                  <p className="text-[9px] text-sky-400/60 font-black uppercase tracking-[0.2em] mt-0.5">Systems Commander</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 p-[1px] group-hover:scale-105 transition-transform">
                   <div className="w-full h-full rounded-[11px] bg-[#020617] flex items-center justify-center text-white font-bold uppercase text-sm">
                      {user?.name?.charAt(0) || 'P'}
                   </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
              >
                <LogOut size={18} />
              </button>
            </div>
          </motion.div>

          <div className="xl:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2.5 bg-white/5 rounded-xl border border-white/5"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden bg-black/90 backdrop-blur-3xl border-t border-white/5 absolute w-full left-0 z-50 shadow-2xl overflow-hidden"
            >
              <nav className="px-6 pt-6 pb-8 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-medium ${isActive(item.path)
                        ? 'bg-sky-400/10 border border-sky-500/20 text-sky-400'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <div className="pt-6 mt-6 border-t border-white/5">
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-4 w-full px-5 py-4 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-medium"
                  >
                    <LogOut size={20} />
                    Terminate Session
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-[1600px] mx-auto p-6 lg:p-10 w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-auto border-t border-white/5 bg-black/60 backdrop-blur-3xl pt-16 pb-8 px-10 relative z-10 overflow-hidden">
        {/* Abstract Background for Footer */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-32 bg-blue-500/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Hexagon className="text-white" size={18} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tighter">DRONE<span className="text-blue-500">AI</span></h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Revolutionizing road infrastructure monitoring through autonomous drone swarms and real-time neural analysis.
            </p>
            <div className="flex gap-4">
              <SocialLink icon={<div className="w-5 h-5 bg-white/5 rounded-md"></div>} />
              <SocialLink icon={<div className="w-5 h-5 bg-white/5 rounded-md"></div>} />
              <SocialLink icon={<div className="w-5 h-5 bg-white/5 rounded-md"></div>} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Platform_Navigation</h4>
            <ul className="space-y-3">
              {navItems.slice(0, 4).map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                    <ChevronRight size={12} /> {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Connect_Operations</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-blue-500 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Mission Control</p>
                  <a href="mailto:ops@droneai.system" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">ops@droneai.system</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 mt-0.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.18-2.18a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Emergency Support</p>
                  <a href="tel:+919151XXXX89" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">+91 9151XXXX89</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                 <MapIcon size={16} className="text-blue-500 mt-0.5" />
                 <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Headquarters</p>
                  <p className="text-sm text-gray-300">LPU Phagwara, Punjab, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">System_Vitals</h4>
            <div className="glass-panel p-4 rounded-2xl border-white/5 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400">API_UPTIME</span>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">99.98%</span>
               </div>
               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[99%] bg-emerald-500"></div>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400">NEURAL_LOAD</span>
                  <span className="text-[10px] font-mono text-blue-400 font-bold">14.2%</span>
               </div>
               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[14%] bg-blue-500"></div>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-[1600px] mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest font-mono">
            © 2026 DroneAI Systems Intelligence. Unauthorized access is strictly prohibited.
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-[9px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest">Privacy_Policy</a>
            <a href="#" className="text-[9px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest">End_User_License</a>
            <a href="#" className="text-[9px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest">Security_Audit</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialLink({ icon }) {
  return (
    <a href="#" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-500 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/30 transition-all">
      {icon}
    </a>
  );
}
