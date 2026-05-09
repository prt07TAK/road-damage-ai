import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function UploadDetect() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('location', JSON.stringify({ lat: 28.6139, lng: 77.2090 })); // Default Delhi for demo
    formData.append('damageType', 'Analyzing...');
    formData.append('severity', 'Analyzing...');

    try {
      toast.loading('Analyzing road image...', { id: 'upload' });
      const response = await reportsAPI.create(formData);
      setResult(response.data);
      toast.success('Detection complete!', { id: 'upload' });
    } catch (err) {
      toast.error('Detection failed. Is the AI server running?', { id: 'upload' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Manual <span className="text-purple-500">Analysis</span>
        </h1>
        <p className="text-dark-400 mt-2 text-lg">Upload images for instant AI road damage detection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Card */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 space-y-6">
          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-dark-600 group-hover:border-purple-500/50 rounded-2xl p-12 text-center transition-all bg-dark-800/30">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-lg text-white font-medium">Select Image</p>
              <p className="text-dark-500 mt-1">Drag and drop or click to browse</p>
            </div>
          </div>

          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-white/10 aspect-video relative">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium">Change Image</p>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Run AI Detection
              </>
            )}
          </button>
        </div>

        {/* Result Card */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 min-h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="p-2 bg-green-500/10 rounded-lg">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Analysis Results
          </h3>

          {result ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
                  <p className="text-[10px] text-dark-500 uppercase font-bold tracking-widest mb-1">Damage Type</p>
                  <p className="text-xl font-bold text-white capitalize">{result.damageType}</p>
                </div>
                <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
                  <p className="text-[10px] text-dark-500 uppercase font-bold tracking-widest mb-1">Severity</p>
                  <p className={`text-xl font-bold capitalize ${
                    result.severity === 'high' ? 'text-red-400' :
                    result.severity === 'medium' ? 'text-orange-400' :
                    'text-green-400'
                  }`}>
                    {result.severity}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
                <p className="text-[10px] text-dark-500 uppercase font-bold tracking-widest mb-2">Confidence Level</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${(result.confidence || 0) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-lg font-bold text-blue-400">{((result.confidence || 0) * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-dark-400 text-sm italic">
                  Report generated at {new Date(result.timestamp).toLocaleString()}
                </p>
                <button 
                  onClick={() => window.location.href = '/reports'}
                  className="mt-6 w-full py-2 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
                >
                  View in Full Reports Library →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-30 space-y-4 py-12">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p>Upload an image to see AI analysis results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
