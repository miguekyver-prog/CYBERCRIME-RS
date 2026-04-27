"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '../../../hooks/useAuth';

export default function FileNewReport() {
  useProtectedRoute(); // Redirect to login if not authenticated
  const [formData, setFormData] = useState({ 
    reportType: '', 
    incidentDate: '',
    amount: '',
    description: '',
    suspiciousInfo: '',
    contactInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      alert("Please log in to submit a report.");
      router.push('/');
      return;
    }
    const user = JSON.parse(savedUser);

    try {
      const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.UserID || user.id,
          category: formData.reportType,
          description: formData.description + " | Date: " + formData.incidentDate
        }),
      });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch {
      alert("Database error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 md:p-12 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <header className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tight">File a New Report</h1>
        <p className="text-slate-500 font-medium">Submit details about fraudulent activity</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-12">
          
          {/* LEFT: REPORT DETAILS */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Report Details</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Report Type</label>
              <select required className="border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, reportType: e.target.value})}>
                <option value="">Select</option>
                <option value="Phishing">Phishing</option>
                <option value="Malware">Malware</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Date of Incident</label>
              <input type="date" required className="border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, incidentDate: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Amount (if applicable)</label>
              <input type="text" placeholder="₱0.00" className="border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, amount: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <textarea required placeholder="Describe what happened..." className="border border-slate-200 rounded-lg p-4 h-32 outline-none focus:border-blue-500 resize-none" onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          {/* RIGHT: EVIDENCE */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Evidence</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Suspicious Email/URL</label>
              <input type="text" placeholder="https://suspicious-site.com" className="border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, suspiciousInfo: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Contact Information</label>
              <input type="text" placeholder="Email or phone used by scammer" className="border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, contactInfo: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Upload Evidence</label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <span className="text-3xl mb-2">📤</span>
                <p className="text-xs font-bold text-slate-600">Click to upload files</p>
                <p className="text-[10px] text-slate-400">Screenshots, emails, documents</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <span className="text-amber-500">⚠️</span>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Do not include sensitive personal information in uploads</p>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-lg hover:bg-blue-700 transition-all uppercase tracking-widest text-sm"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}