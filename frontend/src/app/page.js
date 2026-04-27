"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthRedirect } from '../hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  useAuthRedirect();

  const googleInitialized = useRef(false);
  const callbackRef = useRef(null);
  const initTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // ✅ FIX 3: Use environment variable for API URL instead of hard-coded localhost
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleGoogleLoginCallback = useCallback(async (response) => {
    console.log('🔐 Google login callback triggered');
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      console.log('📤 Sending token to backend...');
      const res = await fetch(`${API_URL}/api/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('✅ Google login successful:', data.user);
        setSuccess('Google login successful! Redirecting...');
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        console.error('❌ Backend error:', data.error);
        setError(data.error || 'Google login failed');
      }
    } catch (err) {
      console.error('❌ Google login error:', err);
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  }, [router, API_URL]);

  useEffect(() => {
    callbackRef.current = handleGoogleLoginCallback;
  }, [handleGoogleLoginCallback]);

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData((current) => ({ ...current, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Initialize Google Sign-In
  useEffect(() => {
    if (googleInitialized.current) return;

    let attemptCount = 0;
    const maxAttempts = 50;

    const initializeGoogle = () => {
      attemptCount++;

      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          console.log('🔄 Initializing Google Sign-In...');

          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: (response) => {
              console.log('📨 Google callback triggered, credential exists:', !!response.credential);
              if (callbackRef.current) {
                callbackRef.current(response);
              } else {
                console.error('❌ Callback ref is null');
              }
            },
            auto_select: false,
            use_fedcm_for_prompt: false,
          });

          googleInitialized.current = true;
          setGoogleReady(true); // ✅ Set ready first, then render button after DOM updates
          console.log('✅ Google Sign-In initialized successfully');
        } catch (error) {
          console.error('❌ Google initialization error:', error);
          setGoogleReady(true);
        }
      } else if (attemptCount < maxAttempts) {
        initTimeoutRef.current = setTimeout(initializeGoogle, 100);
      } else {
        console.warn('⚠️ Google initialization timeout - Google script may not be loaded');
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

  // ✅ FIX: Render Google button AFTER googleReady is true and DOM element exists
  useEffect(() => {
    if (!googleReady) return;
    if (!window.google?.accounts?.id) return;

    const renderBtn = () => {
      const btnElement = document.getElementById('google-login-btn');
      if (btnElement) {
        console.log('🎨 Rendering Google button, width:', btnElement.offsetWidth);
        window.google.accounts.id.renderButton(btnElement, {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          locale: 'en',
          width: btnElement.offsetWidth || 360,
        });
      }
    };

    // Small delay to ensure DOM has painted the button container
    setTimeout(renderBtn, 100);
  }, [googleReady]);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.toLowerCase());
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email.trim()) return setError('Email is required');
    if (!validateEmail(formData.email)) return setError('Please enter a valid email address');
    if (!formData.password.trim()) return setError('Password is required');
    if (formData.password.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Login successful! Redirecting to dashboard...');
        localStorage.setItem('user', JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = formData.email || window.prompt('Enter your email to reset password');
    if (!email) return;

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Reset link sent to your email');
      } else {
        setError(data.error || 'Unable to send reset link');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">CyberSafe</h1>
          <p className="text-slate-600 font-medium text-lg">Secure Crime Reporting</p>
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

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className={labelStyle}>Email Address</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-hover:text-blue-500 transition-colors">
                    📧
                  </span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className={`${inputStyle} pl-12`}
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Password</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-hover:text-blue-500 transition-colors">
                    🔐
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className={`${inputStyle} pl-12 pr-12`}
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2.5 font-medium text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-300 cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-all"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 uppercase tracking-wider text-sm relative overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⏳</span>
                    Logging in...
                  </span>
                ) : (
                  'Log In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
              <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            </div>

            {/* ✅ FIX 1: Only one Google button - the official rendered one */}
            {!googleReady ? (
              <div className="w-full flex justify-center py-4">
                <div className="text-center">
                  <div className="inline-block animate-spin mb-2">
                    <span className="text-3xl">⏳</span>
                  </div>
                  <p className="text-slate-500 text-sm">Loading Google Sign-in...</p>
                </div>
              </div>
            ) : (
              <div id="google-login-btn" className="w-full flex justify-center mb-4" style={{ minHeight: '44px', minWidth: '100%' }}></div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
            <p className="text-center text-slate-600 text-sm font-medium">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
              >
                Sign up
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