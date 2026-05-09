import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Crosshair, MapPin, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { statsAPI, reportsAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendsRes, reportsRes] = await Promise.all([
          statsAPI.getSummary(),
          statsAPI.getTrends(),
          reportsAPI.getAll({ limit: 5 })
        ]);

        setStats(statsRes.data);
        setTrends(trendsRes.data || []);
        setRecentReports(reportsRes.data.reports || []);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/20 animate-pulse"></div>
          <div className="absolute inset-4 rounded-xl border-t-2 border-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  const pieData = stats?.damageTypeBreakdown ? Object.entries(stats.damageTypeBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })) : [];

  const severityData = stats?.severityBreakdown ? [
    { name: 'High', value: stats.severityBreakdown.high },
    { name: 'Medium', value: stats.severityBreakdown.medium },
    { name: 'Low', value: stats.severityBreakdown.low },
  ] : [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative group overflow-hidden rounded-[2.5rem]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent z-0"></div>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
        
        <div className="glass-panel p-10 lg:p-14 relative z-10 border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5 pulse-glow">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  System Operational
                </span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-tight">
                Autonomous <span className="text-gradient-blue">Road Intelligence</span>
              </h1>
              <p className="text-gray-400 mt-6 text-lg font-medium leading-relaxed max-w-2xl">
                Real-time drone telemetry and AI-driven damage classification. Our neural networks are currently scanning road infrastructure with <span className="text-white">98.4% precision</span>.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 shrink-0">
               <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col items-center justify-center text-center">
                  <Zap size={24} className="text-blue-400 mb-2" />
                  <p className="text-2xl font-black text-white">0.4s</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Inference</p>
               </div>
               <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col items-center justify-center text-center">
                  <TrendingUp size={24} className="text-emerald-400 mb-2" />
                  <p className="text-2xl font-black text-white">12.5k</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Analyzed</p>
               </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Inspections', value: stats?.totalSessions || 0, icon: <Crosshair size={22} />, color: 'blue', trend: '+12.4%' },
          { title: 'Damages Logged', value: stats?.totalReports || 0, icon: <AlertTriangle size={22} />, color: 'red', trend: '+2.1%' },
          { title: 'Critical Alerts', value: stats?.severityBreakdown?.high || 0, icon: <Activity size={22} />, color: 'orange', trend: 'Attention' },
          { title: 'Resolved Points', value: stats?.statusBreakdown?.resolved || 0, icon: <CheckCircle2 size={22} />, color: 'emerald', trend: '84.2%' }
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * index, ease: [0.16, 1, 0.3, 1] }}
          >
            <StatCard {...item} />
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Detection Trends */}
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-10 flex flex-col border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Detection Activity</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">AI Classification trends over the last 30 days</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary !py-2 !px-4 !text-xs !rounded-xl">1W</button>
              <button className="btn-secondary !py-2 !px-4 !text-xs !rounded-xl !bg-white/10 !border-white/20">1M</button>
            </div>
          </div>
          
          <div className="flex-1 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" tick={{fontSize: 10, fontWeight: 600}} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#4b5563" tick={{fontSize: 10, fontWeight: 600}} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(3, 7, 18, 0.9)', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '16px', 
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="glass-card rounded-[2.5rem] p-10 flex flex-col border-white/5">
          <h2 className="text-xl font-black text-white tracking-tight mb-2 text-center">Threat Level</h2>
          <p className="text-xs text-gray-500 font-medium mb-10 text-center uppercase tracking-widest">Severity Distribution</p>
          
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%" cy="50%"
                  innerRadius={80} outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#F43F5E" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(3, 7, 18, 0.9)', borderRadius: '12px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <p className="text-4xl font-black text-white">{stats?.totalReports || 0}</p>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Events</p>
            </div>
          </div>
          
          <div className="mt-8 space-y-3">
             <LegendItem color="bg-rose-500" label="Critical" value={stats?.severityBreakdown?.high || 0} />
             <LegendItem color="bg-amber-500" label="Elevated" value={stats?.severityBreakdown?.medium || 0} />
             <LegendItem color="bg-emerald-500" label="Nominal" value={stats?.severityBreakdown?.low || 0} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5">
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Recent Anomalies</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Live Intelligence Feed</p>
          </div>
          <button className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-bold transition-all group">
            FULL ARCHIVE <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="divide-y divide-white/5 px-6">
          {recentReports.length > 0 ? (
            recentReports.map((report) => (
              <RecentItem key={report._id} report={report} />
            ))
          ) : (
            <div className="py-20 text-center opacity-40">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-gray-500" />
              <p className="text-lg font-bold">No threats detected in recent scans</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }) {
  const colorMap = {
    blue: 'from-blue-500/20 to-indigo-600/5 text-blue-400 shadow-blue-500/10',
    red: 'from-rose-500/20 to-rose-900/5 text-rose-400 shadow-rose-500/10',
    orange: 'from-amber-500/20 to-orange-600/5 text-amber-400 shadow-amber-500/10',
    emerald: 'from-emerald-500/20 to-teal-600/5 text-emerald-400 shadow-emerald-500/10'
  };

  return (
    <div className="glass-card p-8 rounded-[2.5rem] border-white/5 group hover:border-blue-500/30 shimmer">
      <div className="flex items-start justify-between mb-6">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
          {icon}
        </div>
        <div className="text-right">
          <span className={`px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black tracking-widest ${color === 'red' || color === 'orange' ? 'text-rose-400' : 'text-emerald-400'} glow-text-blue`}>
            {trend}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-4xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors">{value}</h3>
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_10px_currentColor]`}></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black text-white font-mono">{value}</span>
    </div>
  );
}

function RecentItem({ report }) {
  const isHigh = report.severity === 'high';
  const isMedium = report.severity === 'medium';

  return (
    <div className="py-6 flex items-center justify-between group cursor-pointer px-4 hover:bg-white/[0.02] rounded-2xl transition-all">
      <div className="flex items-center gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
          isHigh ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20' :
          isMedium ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20'
        }`}>
          <AlertTriangle size={24} className={isHigh ? 'animate-pulse' : ''} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl font-black text-white tracking-tight capitalize group-hover:text-blue-400 transition-colors">{report.damageType}</span>
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase border ${
              isHigh ? 'bg-rose-500/20 border-rose-500/20 text-rose-400' :
              isMedium ? 'bg-amber-500/20 border-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
            }`}>
              {report.severity}
            </span>
          </div>
          <div className="flex items-center text-[10px] text-gray-500 font-bold gap-4 uppercase tracking-tighter">
            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-400" /> {report.location?.lat?.toFixed(5)}, {report.location?.lng?.toFixed(5)}</span>
            <span className="flex items-center gap-1.5"><Zap size={12} className="text-purple-400" /> CONFIDENCE: {((report.confidence || 0) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
      <div className="text-right font-mono">
        <p className="text-sm font-bold text-gray-300">
          {new Date(report.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">
          {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
