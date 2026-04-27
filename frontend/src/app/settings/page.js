"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProtectedRoute } from '../../hooks/useAuth';

export default function AccountSettings() {
  useProtectedRoute(); // Redirect to login if not authenticated
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emailNotifications: true,
    statusUpdates: true,
    twoFactor: false,
    publicProfile: false
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }

    const user = JSON.parse(savedUser);
    setUserId(user.UserID || user.id);
    setFormData({
      firstName: user.Full_Name?.split(' ')[0] || user.full_name?.split(' ')[0] || '',
      lastName: user.Full_Name?.split(' ').slice(1).join(' ') || user.full_name?.split(' ').slice(1).join(' ') || '',
      email: user.Email || user.email || '',
      phone: user.Contact_Number || user.contact_number || '',
      emailNotifications: JSON.parse(localStorage.getItem('emailNotifications') ?? 'true'),
      statusUpdates: JSON.parse(localStorage.getItem('statusUpdates') ?? 'true'),
      twoFactor: JSON.parse(localStorage.getItem('twoFactor') ?? 'false'),
      publicProfile: JSON.parse(localStorage.getItem('publicProfile') ?? 'false')
    });
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleDownloadData = () => {
    const payload = {
      profile: formData,
      preferences: {
        emailNotifications: formData.emailNotifications,
        statusUpdates: formData.statusUpdates,
        twoFactor: formData.twoFactor,
        publicProfile: formData.publicProfile
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'account-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.toLowerCase());
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9\s+\-()]*$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
  };

  const handleSave = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    setMessage('');

    if (!formData.firstName.trim()) {
      setError('First name is required.');
      setLoading(false);
      return;
    }

    if (formData.firstName.trim().length < 2) {
      setError('First name must be at least 2 characters.');
      setLoading(false);
      return;
    }

    if (formData.lastName.trim().length > 0 && formData.lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters.');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (formData.phone.trim() && !validatePhone(formData.phone)) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    if (showPasswordForm) {
      if (!passwordData.currentPassword) {
        setError('Please enter your current password to change your password.');
        setLoading(false);
        return;
      }

      if (!passwordData.newPassword) {
        setError('Please enter a new password.');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('New password must be at least 8 characters.');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword.length > 128) {
        setError('New password must not exceed 128 characters.');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword === passwordData.currentPassword) {
        setError('New password must be different from current password.');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New password and confirmation do not match.');
        setLoading(false);
        return;
      }
    }

    try {
        const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: showPasswordForm ? passwordData.newPassword : undefined,
          currentPassword: showPasswordForm ? passwordData.currentPassword : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to save settings');
      } else {
        setMessage('Your settings were saved successfully.');
        const updatedUser = data.user || {
          UserID: userId,
          Full_Name: `${formData.firstName} ${formData.lastName}`.trim(),
          Email: formData.email,
          Contact_Number: formData.phone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('emailNotifications', JSON.stringify(formData.emailNotifications));
        localStorage.setItem('statusUpdates', JSON.stringify(formData.statusUpdates));
        localStorage.setItem('twoFactor', JSON.stringify(formData.twoFactor));
        localStorage.setItem('publicProfile', JSON.stringify(formData.publicProfile));
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      }
    } catch {
      setError('Unable to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading your account...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-10 font-sans">
      <div className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Link href="/dashboard" className="inline-flex items-center justify-center w-10 h-10 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all" aria-label="Back to dashboard">
            ←
          </Link>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">ACCOUNT SETTINGS</h1>
        </div>
        <p className="text-sm text-slate-500">Manage your profile and preferences</p>
      </div>

      <div className="space-y-12 ml-8">
        {message && <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800">{message}</div>}
        {error && <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-rose-700">{error}</div>}

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-blue-500">
            <span className="text-lg">👤</span>
            <h2 className="text-sm font-bold text-slate-700">Profile Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">First Name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-600">Phone Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-blue-500">
            <span className="text-lg">🔔</span>
            <h2 className="text-sm font-bold text-slate-700">Notifications</h2>
          </div>
          <div className="space-y-4">
            <ToggleItem
              label="Email Notifications"
              sub="Receive updates about your reports"
              checked={formData.emailNotifications}
              onClick={() => handleToggle('emailNotifications')}
            />
            <ToggleItem
              label="Report Status Updates"
              sub="Get notified when report status changes"
              checked={formData.statusUpdates}
              onClick={() => handleToggle('statusUpdates')}
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-blue-500">
            <span className="text-lg">🛡️</span>
            <h2 className="text-sm font-bold text-slate-700">Security</h2>
          </div>
          <div className="space-y-4">
            <ToggleItem
              label="Two-Factor Authentication"
              sub="Add an extra layer of security"
              checked={formData.twoFactor}
              onClick={() => handleToggle('twoFactor')}
            />
            <button
              type="button"
              onClick={() => setShowPasswordForm(prev => !prev)}
              className="text-blue-600 text-sm font-semibold hover:underline"
            >
              {showPasswordForm ? 'Hide Password Fields' : 'Change Password'}
            </button>
          </div>

          {showPasswordForm && (
            <div className="space-y-4 border border-slate-200 rounded-2xl p-6 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Current Password"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="New Password"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm Password"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-blue-500">
            <span className="text-lg">👁️</span>
            <h2 className="text-sm font-bold text-slate-700">Privacy</h2>
          </div>
          <div className="space-y-4">
            <ToggleItem
              label="Public Profile"
              sub="Make your profile visible to others"
              checked={formData.publicProfile}
              onClick={() => handleToggle('publicProfile')}
            />
            <button
              type="button"
              onClick={handleDownloadData}
              className="text-blue-600 text-sm font-semibold hover:underline"
            >
              Download My Data
            </button>
          </div>
        </section>

        <div className="flex gap-4 pt-10">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="px-10 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ label, sub, checked, onClick }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 font-medium">{sub}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`w-10 h-5 rounded-full relative transition-all ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}