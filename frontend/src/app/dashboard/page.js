"use client";
import { useEffect, useState } from 'react';
import { useProtectedRoute } from '../../hooks/useAuth';

function Toast({ toasts }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-start gap-3 px-5 py-4 rounded-xl shadow-xl max-w-sm w-full pointer-events-auto
            border text-sm font-medium animate-slide-in
            ${toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-slate-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-300 text-slate-800'
              : 'bg-blue-50 border-blue-300 text-slate-800'}
          `}
          style={{ animation: 'slideIn 0.4s ease-out forwards' }}
        >
          <span className="text-lg mt-0.5 shrink-0">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <div className="flex flex-col gap-0.5 flex-1">
            <span className={`text-xs font-bold uppercase tracking-widest ${
              toast.type === 'success' ? 'text-emerald-600'
              : toast.type === 'error' ? 'text-red-600'
              : 'text-blue-600'
            }`}>
              {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Info'}
            </span>
            <span className="text-slate-700 leading-snug">{toast.message}</span>
          </div>
          <div className={`w-1 h-12 rounded-full animate-pulse ${
            toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`} />
        </div>
      ))}

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(400px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .animate-bounce { animation: bounce 0.6s infinite; }
      `}</style>
    </div>
  );
}

function DeleteModal({ isOpen, reportId, onConfirm, onCancel, isLoading }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Report #{reportId}</h3>
        <p className="text-slate-600 mb-6">Are you sure you want to delete this report? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reportId)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>🗑️ Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  useProtectedRoute();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reportId: null });
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      setError('');
      setReports([]);

      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      const userId = parsedUser.UserID;

      if (userId !== null && userId !== undefined) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports?userId=${userId}`);
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          const data = await response.json();
          if (Array.isArray(data)) {
            setReports(data);
          }
        } catch (err) {
          console.error('Failed to fetch reports:', err);
          setError('Failed to load reports. Please refresh the page.');
        }
      }

      setLoading(false);
    };

    initDashboard();
  }, []);

  const handleDeleteReport = async (reportId) => {
    setDeleting(reportId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.UserID })
      });

      if (response.ok) {
        setReports(reports.filter(r => r.id !== reportId));
        setDeleteModal({ isOpen: false, reportId: null });
        showToast(`Report #${reportId} deleted successfully`, 'success', 3000);
      } else {
        const err = await response.json();
        showToast(`Error: ${err.error || 'Failed to delete report'}`, 'error', 3500);
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete report', 'error', 3000);
    } finally {
      setDeleting(null);
    }
  };

  const totalReports = reports.length;
  const forwarded = reports.filter(r => r.status === 'forwarded' || r.Status === 'Forwarded').length;
  const inProgress = reports.filter(r => r.status !== 'forwarded' && r.Status !== 'Forwarded').length;

  if (loading) return <div className="p-20 text-center font-sans">Syncing reports...</div>;
  if (!user) return <div className="p-20 text-center font-sans text-red-500 font-bold">Please log in to see your reports.</div>;

  return (
    <>
      <Toast toasts={toasts} />
      <DeleteModal
        isOpen={deleteModal.isOpen}
        reportId={deleteModal.reportId}
        onConfirm={handleDeleteReport}
        onCancel={() => setDeleteModal({ isOpen: false, reportId: null })}
        isLoading={deleting === deleteModal.reportId}
      />
      <div className="min-h-screen bg-slate-50 p-8 font-sans">
        <div className="max-w-5xl mx-auto">

          <header className="mb-10">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">REPORT TRACKING</h1>
            <p className="text-slate-500 text-sm">Showing reports for: <span className="text-blue-600 font-bold">{user.Full_Name || user.full_name || "Current User"}</span></p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex justify-between items-center shadow-sm">
              <p className="text-slate-600 text-sm font-semibold">Total Reports</p>
              <span className="text-4xl font-extrabold text-blue-600">{totalReports}</span>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex justify-between items-center shadow-sm">
              <p className="text-slate-600 text-sm font-semibold">Forwarded</p>
              <span className="text-4xl font-extrabold text-green-600">{forwarded}</span>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex justify-between items-center shadow-sm">
              <p className="text-slate-600 text-sm font-semibold">In Progress</p>
              <span className="text-4xl font-extrabold text-orange-600">{inProgress}</span>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Reports</h2>

          <div className="space-y-4">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xl">🎯</div>
                    <div>
                      <h3 className="font-bold text-slate-900">Report #{report.id}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{report.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase ${
                      (report.status === 'forwarded' || report.Status === 'Forwarded')
                        ? 'bg-green-100 text-green-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {report.status || report.Status || 'PENDING'}
                    </span>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, reportId: report.id })}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400 italic">
                No reports found for this account. Submit a report to see it here.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}