"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
              ? 'bg-white border-emerald-200 text-slate-800'
              : toast.type === 'error'
              ? 'bg-white border-red-200 text-slate-800'
              : 'bg-white border-amber-200 text-slate-800'}
          `}
          style={{ animation: 'slideIn 0.3s ease forwards' }}
        >
          <span className="text-lg mt-0.5 shrink-0">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className={`text-xs font-bold uppercase tracking-widest ${
              toast.type === 'success' ? 'text-emerald-600'
              : toast.type === 'error' ? 'text-red-500'
              : 'text-amber-500'
            }`}>
              {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notice'}
            </span>
            <span className="text-slate-700 leading-snug">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FileNewReport() {
  useProtectedRoute();
  const [formData, setFormData] = useState({
    fullName: '', email: '', reportType: '', incidentDate: '',
    amount: '', description: '', suspiciousInfo: '', contactInfo: '', forwardToAuthority: '', isAnonymous: false
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [authoritiesLoading, setAuthoritiesLoading] = useState(true);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const loadAuthorities = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/authority?userId=${user.UserID}`);
          const data = await response.json();
          if (Array.isArray(data)) {
            setAuthorities(data);
          }
        } catch (error) {
          console.error('Failed to load authorities:', error);
        }
      }
      setAuthoritiesLoading(false);
    };
    loadAuthorities();
  }, []);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const validateAmount = (amount) => {
    if (!amount.trim()) return true;
    const amountRegex = /^[0-9]{1,15}(\.[0-9]{1,2})?$/;
    return amountRegex.test(amount.trim().replace(/[₱,]/g, ''));
  };

  const validateContactInfo = (contact) => {
    if (!contact.trim()) return true;
    const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[0-9\s+\-()]*$/;
    const isValidEmail = emailRegex.test(contact.toLowerCase());
    const isValidPhone = phoneRegex.test(contact) && contact.replace(/\D/g, '').length >= 7;
    return isValidEmail || isValidPhone;
  };

  const validateUrl = (urlString) => {
    if (!urlString.trim()) return true;
    const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    try {
      new URL(urlString);
      return true;
    } catch {
      return emailRegex.test(urlString.toLowerCase());
    }
  };

  const validateEmail = (email) => {
    if (!email.trim()) return false;
    const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.toLowerCase());
  };

  const validateFullName = (name) => {
    if (!name.trim()) return false;
    return name.trim().length >= 2 && name.trim().length <= 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.isAnonymous) {
      if (!formData.fullName) { showToast("Please enter your full name.", 'error'); return; }
      if (!validateFullName(formData.fullName)) { showToast("Full name must be between 2 and 100 characters.", 'error'); return; }
      if (!formData.email) { showToast("Please enter your email address.", 'error'); return; }
      if (!validateEmail(formData.email)) { showToast("Please enter a valid email address.", 'error'); return; }
    }

    if (!formData.reportType) { showToast("Please select a report type.", 'error'); return; }
    if (!formData.incidentDate) { showToast("Please enter the incident date.", 'error'); return; }

    const incidentDate = new Date(formData.incidentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (incidentDate > today) { showToast("Incident date cannot be in the future.", 'error'); return; }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (incidentDate < oneYearAgo) { showToast("Incident date cannot be more than 1 year in the past.", 'error'); return; }

    const financialCrimes = ['Investment Scam', 'Other'];
    if (financialCrimes.includes(formData.reportType) && !formData.amount.trim()) {
      showToast(`Amount is required for ${formData.reportType} reports.`, 'error'); return;
    }

    if (formData.amount && !validateAmount(formData.amount)) { showToast("Please enter a valid amount (e.g., 1000 or 1000.50).", 'error'); return; }
    if (!formData.description.trim()) { showToast("Description is required.", 'error'); return; }
    if (formData.description.trim().length < 10) { showToast("Description must be at least 10 characters.", 'error'); return; }
    if (formData.description.trim().length > 5000) { showToast("Description must not exceed 5000 characters.", 'error'); return; }
    if (formData.suspiciousInfo && !validateUrl(formData.suspiciousInfo)) { showToast("Please enter a valid email or URL.", 'error'); return; }
    if (formData.contactInfo && !validateContactInfo(formData.contactInfo)) { showToast("Please enter a valid email or phone number for contact information.", 'error'); return; }
    if (!formData.suspiciousInfo && !formData.contactInfo && !file) { showToast("Please provide at least one piece of evidence (URL, contact info, or file).", 'error'); return; }
    if (file && file.size > 10 * 1024 * 1024) { showToast("File size must not exceed 10MB.", 'error'); return; }

    setLoading(true);

    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      showToast("Please log in to submit a report.", 'notice');
      router.push('/');
      setLoading(false);
      return;
    }
    const user = JSON.parse(savedUser);

    const data = new FormData();
    data.append('userId', user.UserID || user.id);
    data.append('isAnonymous', formData.isAnonymous);
    data.append('title', formData.reportType);
    data.append('category', formData.reportType);
    data.append('description', `Date: ${formData.incidentDate} | Amt: ${formData.amount} | Target: ${formData.suspiciousInfo} | Details: ${formData.description}`);
    data.append('authorityId', formData.forwardToAuthority);
    if (!formData.isAnonymous) {
      data.append('fullName', formData.fullName.trim());
      data.append('reporterEmail', formData.email.trim());
    }
    if (file) data.append('evidence', file);

    try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/report`, { 
  method: 'POST', 
  body: data
});
      if (res.ok) {
        const reportResponse = await res.json();
        const reportId = reportResponse.id || reportResponse.reportId;

        if (formData.forwardToAuthority && reportId) {
          try {
            const forwardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fix`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reportId,
                authorityId: parseInt(formData.forwardToAuthority),
                userId: user.UserID || user.id
              })
            });
            if (forwardRes.ok) {
              showToast("Report filed and forwarded successfully! Redirecting to dashboard…", 'success');
            } else {
              showToast("Report filed! Forwarding to authority failed, but report is saved.", 'notice');
            }
          } catch (forwardError) {
            console.error('Forward error:', forwardError);
            showToast("Report filed! Forwarding to authority failed, but report is saved.", 'notice');
          }
        } else {
          showToast("Report filed successfully! Redirecting to dashboard…", 'success');
        }

        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        const errorText = await res.json();
        showToast("Submission failed: " + errorText.error, 'error');
      }
    } catch (err) {
  console.error('Fetch error:', err);
  showToast("Error: " + err.message, 'error');
} finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Toast toasts={toasts} />

      <div className="min-h-screen bg-white text-slate-900 p-8 md:p-16 max-w-7xl mx-auto font-sans">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center justify-center w-11 h-11 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
              aria-label="Back to dashboard"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tight">File a New Report</h1>
              <p className="text-slate-500 font-medium">Submit details about fraudulent activity</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 mb-10 pb-10 border-b border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Full Name *</label>
              <input required type="text" placeholder="John Doe" className="w-full border border-slate-200 rounded-md p-3 text-sm" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Email Address *</label>
              <input required type="email" placeholder="your.email@example.com" className="w-full border border-slate-200 rounded-md p-3 text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Report Details</h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Report Type</label>
                <select required className="w-full border border-slate-200 rounded-md p-3 text-sm" onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}>
                  <option value="">Select</option>
                  <option value="Phishing">Phishing</option>
                  <option value="Malware">Malware</option>
                  <option value="Hacking">Hacking</option>
                  <option value="Identity Theft">Identity Theft</option>
                  <option value="Investment Scam">Investment Scam</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Date of Incident</label>
                <input type="date" required className="w-full border border-slate-200 rounded-md p-3 text-sm" onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Amount (if applicable)</label>
                <input type="text" placeholder="₱0.00" className="w-full border border-slate-200 rounded-md p-3 text-sm" onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Description</label>
                <textarea required placeholder="Describe what happened..." className="w-full border border-slate-200 rounded-md p-4 h-36 text-sm resize-none" onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Evidence</h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Suspicious Email/URL</label>
                <input type="text" placeholder="https://suspicious-site.com" className="w-full border border-slate-200 rounded-md p-3 text-sm" onChange={(e) => setFormData({ ...formData, suspiciousInfo: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Contact Information</label>
                <input type="text" placeholder="Email or phone used by scammer" className="w-full border border-slate-200 rounded-md p-3 text-sm" onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Forward To Authority</label>
                <select className="w-full border border-slate-200 rounded-md p-3 text-sm" value={formData.forwardToAuthority} onChange={(e) => setFormData({ ...formData, forwardToAuthority: e.target.value })}>
                  <option value="">No - Keep Private</option>
                  {authorities.map((auth) => (
                    <option key={auth.AuthorityID} value={auth.AuthorityID}>
                      {auth.Agency_Name} ({auth.Email})
                    </option>
                  ))}
                </select>
                {formData.forwardToAuthority && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ This report will be forwarded to the selected authority</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Upload Evidence</label>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-slate-200 rounded-md p-10 flex flex-col items-center justify-center bg-white hover:bg-slate-50 cursor-pointer min-h-[180px]"
                >
                  <span className="text-3xl text-slate-400 mb-2">📤</span>
                  <p className="text-xs font-bold text-slate-600">Click to upload files</p>
                  {file && <p className="mt-3 text-blue-600 text-xs font-bold uppercase">{file.name}</p>}
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-md p-4 flex items-center gap-3">
                <span className="text-orange-500 text-lg">⚠️</span>
                <p className="text-[10px] font-bold text-orange-800 uppercase tracking-tight">Do not include sensitive personal information in uploads</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-md mt-16 hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg shadow-blue-200 disabled:opacity-60"
          >
            {loading ? "Processing..." : "Submit Report"}
          </button>
        </form>
      </div>
    </>
  );
}