import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { reportsAPI } from '../services/api';
import { FileDown, RotateCcw, Filter, ChevronRight, Search, FileText } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    damageType: '',
    severity: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getAll(filters);
      setReports(res.data.reports || []);
    } catch (error) {
      toast.error('Database Query Failed');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      damageType: '',
      severity: '',
      status: '',
      startDate: '',
      endDate: ''
    });
  };

  const exportToCSV = () => {
    if (reports.length === 0) return toast.error('No data available for export');
    const headers = ['ID', 'Location', 'Damage Type', 'Severity', 'Status', 'Date'];
    const data = reports.map(r => [r._id, `${r.location?.lat}, ${r.location?.lng}`, r.damageType, r.severity, r.status, new Date(r.timestamp).toLocaleDateString()]);
    const csv = [headers, ...data].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drone-intel-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Intelligence Archive Downloaded');
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await reportsAPI.updateStatus(id, { status: newStatus });
      toast.success('Incident Status Synchronized');
      fetchReports();
    } catch (error) {
      toast.error('Sync Protocol Failed');
    }
  };

  return (
    <div className="space-y-8 animate-enter">
      {/* Header HUD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                 <FileText size={20} className="text-indigo-400" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Intelligence_Archive</h1>
           </div>
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] ml-1">Centralized Neural Detection Logs</p>
        </div>

        <div className="flex items-center gap-3">
           <button onClick={exportToCSV} className="btn-secondary !rounded-xl">
              <FileDown size={18} /> DOWNLOAD_DATA
           </button>
        </div>
      </div>

      {/* Modern Filter HUD */}
      <div className="glass-panel rounded-[2.5rem] p-8 border-white/5">
        <div className="flex items-center gap-3 mb-6">
           <Filter size={14} className="text-sky-400" />
           <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Query Parameters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <FilterSelect name="damageType" value={filters.damageType} onChange={handleFilterChange} options={['crack', 'pothole']} label="Entity Type" />
          <FilterSelect name="severity" value={filters.severity} onChange={handleFilterChange} options={['high', 'medium', 'low']} label="Priority" />
          <FilterSelect name="status" value={filters.status} onChange={handleFilterChange} options={['reported', 'assigned', 'in-progress', 'resolved']} label="Status" />
          
          <div className="space-y-2">
             <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-2">From</label>
             <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500/50" />
          </div>
          <div className="space-y-2">
             <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-2">Until</label>
             <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500/50" />
          </div>

          <div className="flex items-end">
             <button onClick={handleResetFilters} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 flex items-center justify-center gap-2 transition-all group">
                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
             </button>
          </div>
        </div>
      </div>

      {/* Intelligence Table */}
      <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Querying Neural Core...</p>
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Identification</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Mapping</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Classification</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Priority</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Timeline</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-xs font-mono font-bold text-white uppercase tracking-tighter">ID_{report._id.slice(-6)}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                          <span className="text-sky-400">LAT:</span> {report.location?.lat?.toFixed(4)}
                          <span className="text-sky-400 ml-2">LNG:</span> {report.location?.lng?.toFixed(4)}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-sky-400 transition-colors">{report.damageType}</span>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                         report.severity === 'high' ? 'bg-rose-500/20 border-rose-500/20 text-rose-400' :
                         report.severity === 'medium' ? 'bg-amber-500/20 border-amber-500/20 text-amber-400' :
                         'bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                       }`}>
                         {report.severity}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       {new Date(report.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase text-gray-400 focus:outline-none focus:border-sky-500/50"
                          >
                            <option value="reported">REPORTED</option>
                            <option value="assigned">ASSIGNED</option>
                            <option value="in-progress">IN_PROGRESS</option>
                            <option value="resolved">RESOLVED</option>
                          </select>
                          <button className="p-2 text-gray-500 hover:text-white transition-all"><ChevronRight size={18} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 opacity-30">
            <Search size={48} className="mb-4" />
            <p className="text-lg font-black uppercase tracking-widest">No Matches in Archive</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-black text-gray-600 uppercase tracking-widest px-4">
        <span>ARCHIVE_DENSITY: {reports.length} ENTRIES</span>
        <span>Neural_Indexing: ENABLED</span>
      </div>
    </div>
  );
}

function FilterSelect({ name, value, onChange, options, label }) {
  return (
    <div className="space-y-2">
       <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-2">{label}</label>
       <select
         name={name}
         value={value}
         onChange={onChange}
         className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white appearance-none focus:outline-none focus:border-sky-500/50"
       >
         <option value="">ALL_ENTITIES</option>
         {options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
       </select>
    </div>
  );
}
