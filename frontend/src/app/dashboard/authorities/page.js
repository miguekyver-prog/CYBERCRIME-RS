'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '../../../hooks/useAuth';

function Toast({ toasts }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-start gap-3 px-5 py-4 rounded-xl shadow-xl max-w-sm w-full pointer-events-auto
            border text-sm font-medium
            ${toast.type === 'success'
              ? 'bg-white border-emerald-200 text-slate-800'
              : toast.type === 'error'
              ? 'bg-white border-red-200 text-slate-800'
              : 'bg-white border-amber-200 text-slate-800'}
          `}
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

export default function AuthoritiesPage() {
  useProtectedRoute(); // Redirect to login if not authenticated
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [formData, setFormData] = useState({
    agencyName: '',
    email: '',
    contactPerson: '',
    phone: ''
  });
  const router = useRouter();

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.toLowerCase());
  };

  const validateAgencyName = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { valid: false, message: 'Agency name is required' };
    if (trimmed.length < 3) return { valid: false, message: 'Agency name must be at least 3 characters' };
    if (trimmed.length > 255) return { valid: false, message: 'Agency name must not exceed 255 characters' };
    if (!/^[a-zA-Z0-9\s\-.,()&/]+$/.test(trimmed)) return { valid: false, message: 'Agency name contains invalid characters' };
    return { valid: true };
  };

  const validateContactPerson = (contact) => {
    if (!contact.trim()) return { valid: true };
    if (contact.trim().length > 255) return { valid: false, message: 'Contact person name must not exceed 255 characters' };
    if (!/^[a-zA-Z\s\-.,()]+$/.test(contact.trim())) return { valid: false, message: 'Contact person name contains invalid characters' };
    return { valid: true };
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return { valid: true };
    if (phone.trim().length > 20) return { valid: false, message: 'Phone number must not exceed 20 characters' };
    if (!/^[0-9\s+\-()]+$/.test(phone.trim())) return { valid: false, message: 'Invalid phone number format' };
    return { valid: true };
  };

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const fetchAuthorities = async () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        const res = await fetch(`http://localhost:3001/api/authority?userId=${parsedUser.UserID}`);
        if (res.ok) {
          const data = await res.json();
          setAuthorities(data);
        } else {
          showToast('Failed to fetch authorities', 'error');
        }
      } else {
        showToast('User not found', 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorities();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate agency name
    const nameValidation = validateAgencyName(formData.agencyName);
    if (!nameValidation.valid) {
      showToast(nameValidation.message, 'error');
      return;
    }

    // Validate email
    if (!formData.email.trim()) {
      showToast('Email is required', 'error');
      return;
    }
    if (!validateEmail(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Validate contact person
    const contactValidation = validateContactPerson(formData.contactPerson);
    if (!contactValidation.valid) {
      showToast(contactValidation.message, 'error');
      return;
    }

    // Validate phone
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.valid) {
      showToast(phoneValidation.message, 'error');
      return;
    }

    try {
      const url = editingId ? `http://localhost:3001/api/authority/${editingId}` : 'http://localhost:3001/api/authority';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        userId: user?.UserID
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingId ? 'Authority updated successfully' : 'Authority added successfully', 'success');
        setFormData({ agencyName: '', email: '', contactPerson: '', phone: '' });
        setEditingId(null);
        setShowForm(false);
        fetchAuthorities();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to save authority', 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    }
  };

  const handleEdit = (authority) => {
    setFormData({
      agencyName: authority.Agency_Name,
      email: authority.Email,
      contactPerson: authority.Contact_Person || '',
      phone: authority.Phone || ''
    });
    setEditingId(authority.AuthorityID);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    setDeleteModal({ show: false, id: null });
    try {
      const res = await fetch(`http://localhost:3001/api/authority/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.UserID })
      });
      if (res.ok) {
        showToast('Authority deleted successfully', 'success');
        fetchAuthorities();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to delete authority', 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    }
  };

  const openDeleteModal = (id) => {
    setDeleteModal({ show: true, id });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, id: null });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ agencyName: '', email: '', contactPerson: '', phone: '' });
  };

  return (
    <>
      <Toast toasts={toasts} />

      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center justify-center w-11 h-11 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  ←
                </button>
                <div>
                  <h1 className="text-3xl font-bold uppercase tracking-tight">Manage Authorities</h1>
                  <p className="text-slate-500 font-medium">Add and manage reporting authorities</p>
                </div>
              </div>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  + Add Authority
                </button>
              )}
            </div>
          </header>

          {showForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 mb-8">
              <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Authority' : 'Add New Authority'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Agency Name *</label>
                    <input
                      type="text"
                      name="agencyName"
                      value={formData.agencyName}
                      onChange={handleFormChange}
                      placeholder="e.g., NBI Cybercrime Division"
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-slate-500">Min 3, Max 255 characters</p>
                      <p className="text-xs text-slate-500">{formData.agencyName.length}/255</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="contact@authority.gov"
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">Must be a valid email address</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleFormChange}
                      placeholder="e.g., John Doe"
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-slate-500">Optional field</p>
                      <p className="text-xs text-slate-500">{formData.contactPerson.length}/255</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="e.g., +63-2-1234-5678"
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-slate-500">Optional field</p>
                      <p className="text-xs text-slate-500">{formData.phone.length}/20</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                  >
                    {editingId ? 'Update Authority' : 'Add Authority'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading authorities...</p>
            </div>
          ) : authorities.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-600 mb-4">No authorities found</p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Add First Authority
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Agency Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Email</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Contact Person</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Phone</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authorities.map((authority) => (
                    <tr key={authority.AuthorityID} className="border-b border-slate-200 hover:bg-slate-50 transition-all">
                      <td className="py-4 px-6 font-medium text-slate-900">{authority.Agency_Name}</td>
                      <td className="py-4 px-6 text-slate-700">{authority.Email}</td>
                      <td className="py-4 px-6 text-slate-600">{authority.Contact_Person || '—'}</td>
                      <td className="py-4 px-6 text-slate-600">{authority.Phone || '—'}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEdit(authority)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(authority.AuthorityID)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-300 scale-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-in bounce duration-500">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Delete Authority?</h3>
              <p className="text-slate-600 text-sm mb-8">This action cannot be undone. The authority will be permanently removed.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-slate-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteModal.id)}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-red-600 transition-all duration-200 shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
