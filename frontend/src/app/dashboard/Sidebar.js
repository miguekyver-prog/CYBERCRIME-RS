"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ children }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleFinalExit = () => {
    localStorage.removeItem('user');
    setIsSuccess(true);

    setTimeout(() => {
      router.push('/');
    }, 1200);
  };

  return (
    <div className="flex h-screen bg-slate-50">

      {/* THE CENTER BOX (Confirmation & Success) */}
      {(showConfirm || isSuccess) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-200">

            {!isSuccess ? (
              // 1. CONFIRMATION VIEW
              <>
                <div className="text-4xl mb-4">🛑</div>
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Terminate?</h3>
                <p className="text-sm text-slate-500 mt-2 mb-8">Are you sure you want to end this session?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Stay</button>
                  <button onClick={handleFinalExit} className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-100">Exit</button>
                </div>
              </>
            ) : (
              // 2. SUCCESS VIEW (Appears in the same middle box)
              <div className="py-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Success</h3>
                <p className="text-sm text-slate-500 mt-2">Session terminated. Redirecting...</p>
                <div className="mt-6 h-1 w-24 bg-slate-100 mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 animate-[progress_1.2s_ease-in-out]"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r fixed h-full flex flex-col">
        <div className="p-8 border-b">
          <div className="font-black text-sm text-slate-500 uppercase tracking-widest mb-2">Welcome</div>
          <div className="font-black text-lg text-slate-800">{user?.Full_Name || 'User'}</div>
        </div>
        <div className="p-8 border-b font-black text-xl text-slate-800 uppercase">Command</div>
        <div className="p-6 space-y-3 border-b">
          <button
            onClick={() => router.push('/report')}
            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all"
          >
            Submit Report
          </button>
          <button
            onClick={() => router.push('/dashboard/authorities')}
            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
          >
            Manage Authorities
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
          >
            Account Settings
          </button>
        </div>
        <nav className="flex-1 p-6">
          {/* Your Nav Links here */}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 rounded-2xl transition-all"
          >
            Logout Session
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-10 h-screen overflow-y-auto">{children}</main>
    </div>
  );
}