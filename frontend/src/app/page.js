"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthRedirect } from '../../hooks/useAuth';

export default function SignupPage() {
  const router = useRouter();
  useAuthRedirect();

  const googleInitialized = useRef(false);
  const callbackRef = useRef(null);
  const initTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // ✅ Fixed: correct fallback URL instead of broken string literal
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleGoogleSignupCallback = useCallback(async (response) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      const res = await fetch(`${API_URL}/api/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Google signup successful! Redirecting...');
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setError(data.error || 'Google sign-up failed');
      }
    } catch (err) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  }, [router, API_URL]);

  useEffect(() => {
    callbackRef.current = handleGoogleSignupCallback;
  }, [handleGoogleSignupCallback]);

  useEffect(() => {
    if (googleInitialized.current) return;

    let attemptCount = 0;
    const maxAttempts = 50;

    const initializeGoogle = () => {
      attemptCount++;

      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (callbackRef.current) {
                callbackRef.current(response);
              }
            },
            auto_select: false,
            use_fedcm_for_prompt: false,
          });

          googleInitialized.current = true;
          setGoogleReady(true);
        } catch (error) {
          console.error('❌ Google initialization error:', error);
          setGoogleReady(true);
        }
      } else if (attemptCount < maxAttempts) {
        initTimeoutRef.current = setTimeout(initializeGoogle, 100);
      } else {
        setGoogleReady(true);
      }
    };

    setTimeout(initializeGoogle, 100);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!googleReady) return;
    if (!window.google?.accounts?.id) return;

    const renderBtn = () => {
      const btnElement = document.getElementById('google-signup-btn');
      if (btnElement) {
        window.google.accounts.id.renderButton(btnElement, {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          locale: 'en',
          width: btnElement.offsetWidth || 360,
        });
      }
    };

    setTimeout(renderBtn, 100);
  }, [googleReady]);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.toLowerCase());
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fullName.trim()) return setError('Full name is required');
    if (formData.fullName.trim().length < 2) return setError('Full name must be at least 2 characters');
    if (!formData.email.trim()) return setError('Email is required');
    if (!validateEmail(formData.email)) return setError('Please enter a valid email address');
    if (!formData.password) return setError('Password is required');
    if (formData.password.length < 8) return setError('Password must be at least 8 characters');
    if (formData.password.length > 128) return setError('Password must not exceed 128 characters');
    if (!formData.confirm) return setError('Please confirm your password');
    if (formData.password !== formData.confirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          contactNumber: formData.contactNumber,
          password: formData.password,
        }),
      });

      if (res.ok) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => router.push('/'), 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create account');
      }
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    'w-full border border-slate-300 rounded-xl py-3.5 px-5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400 font-medium bg-slate-50 hover:bg-white';
  const labelStyle = 'block text-sm font-semibold text-slate-800 mb-2.5';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 font-sans py-8">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4 p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">CyberSafe</h1>
          <p className="text-slate-600 font-medium text-lg">Create Your Account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-slate-100 overflow-hidden">
          <div className="px-8 py-8">

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">⚠️</span>
                  <div>
                    <p className="text-red-900 font-semibold text-sm">Error</p>
                    <p className="text-red-700 text-sm mt-0.5">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">✓</span>
                  <div>
                    <p className="text-green-900 font-semibold text-sm">Success</p>
                    <p className="text-green-700 text-sm mt-0.5">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">

              {/* Full Name */}
              <div>
                <label className={labelStyle}>Full Name</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-hover:text-blue-500 transition-colors">👤</span>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`${inputStyle} pl-12`}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelStyle}>Email Address</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-hover:text-blue-500 transition-colors">📧</span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`${inputStyle} pl-12`}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={labelStyle}>Password</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-hover:text-blue-500 transition-colors">🔐</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`${inputStyle} pl-12 pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className={labelStyle}>Confirm Password</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-hover:text-blue-500 transition-colors">🔐</span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={formData.confirm}
                    onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                    className={`${inputStyle} pl-12 pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 uppercase tracking-wider text-sm relative overflow-hidden mt-8"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⏳</span>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
              <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            </div>

            {!googleReady ? (
              <div className="w-full flex justify-center py-4">
                <div className="text-center">
                  <div className="inline-block animate-spin mb-2">
                    <span className="text-3xl">⏳</span>
                  </div>
                  <p className="text-slate-500 text-sm">Loading Google Sign-up...</p>
                </div>
              </div>
            ) : (
              <div
                id="google-signup-btn"
                className="w-full flex justify-center mb-4"
                style={{ minHeight: '44px', minWidth: '100%' }}
              ></div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
            <p className="text-center text-slate-600 text-sm font-medium">
              Already have an account?{' '}
              <Link href="/" className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8 font-medium">
          Protected by industry-leading security standards
        </p>
      </div>
    </div>
  );
}