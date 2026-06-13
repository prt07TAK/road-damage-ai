import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { authAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, User as UserIcon, ChevronRight, Hexagon } from 'lucide-react';

export default function LoginPage({ setIsAuthenticated, setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'engineer',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await authAPI.login({ email: formData.email, password: formData.password });
      } else {
        response = await authAPI.register(formData);
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      setUser(response.data.user);
      toast.success(isLogin ? 'Mission Control Authorized' : 'New Operator Registered');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication sequence failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const response = await authAPI.firebaseAuth({ 
        email: user.email, 
        name: user.displayName,
        googleId: user.uid 
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      setUser(response.data.user);
      toast.success('Neural Link Verified');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Google Auth Protocol Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] flex items-center justify-center p-6">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: '-5s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-3xl"
      >
        {/* Left Side: Branding/Visual */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600/20 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 animate-scan"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Hexagon className="text-white" size={28} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter">DRONE<span className="text-blue-500">AI</span></h1>
            </div>
            
            <h2 className="text-5xl font-black text-white tracking-tight leading-[1.1] mb-6">
              The future of <span className="text-gradient-blue">infrastructure</span> starts here.
            </h2>
            <p className="text-gray-400 text-lg font-medium max-w-sm">
              Deploy autonomous neural networks to analyze and protect our global road networks.
            </p>
          </div>

          <div className="relative z-10 flex gap-8">
             <div className="flex flex-col">
                <span className="text-3xl font-black text-white">99.8%</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Accuracy</span>
             </div>
             <div className="flex flex-col">
                <span className="text-3xl font-black text-white">2.4ms</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Latency</span>
             </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-10 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-black text-white tracking-tight mb-2">
              {isLogin ? 'Welcome Back' : 'Join the Fleet'}
            </h3>
            <p className="text-gray-500 font-medium text-sm italic">
              {isLogin ? 'Authorize your session to begin mission control.' : 'Register a new profile for field operations.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Full Operator Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Specialized Role</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-all"
                      >
                        <option value="engineer">Field Engineer</option>
                        <option value="operator">Drone Operator</option>
                        <option value="admin">Systems Admin</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Email Protocol</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                  placeholder="name@agency.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Access Cipher</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Authorize Access' : 'Register Operator'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Neural link</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-4 bg-white hover:bg-gray-100 text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
          </form>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-gray-400 hover:text-blue-400 transition-colors"
            >
              {isLogin ? "DON'T HAVE AN ACCOUNT? REQUEST ACCESS" : 'ALREADY REGISTERED? LOG IN'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
