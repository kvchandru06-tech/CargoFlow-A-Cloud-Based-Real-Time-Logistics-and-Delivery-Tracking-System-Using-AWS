import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CameraIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword && form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone };
      if (form.newPassword) payload.password = form.newPassword;
      const res = await api.put('/auth/me', payload);
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setForm(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, avatar_url: res.data.avatar_url });
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    customer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    agent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account details</p>
      </div>

      {/* Avatar section */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-3xl border-4 border-white dark:border-slate-700 shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-700 hover:bg-brand-800 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
              title="Change avatar"
            >
              <CameraIcon className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div>
            <p className="font-bold text-lg text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize mt-1 inline-block ${roleColors[user?.role]}`}>
              {user?.role}
            </span>
          </div>

          {uploading && (
            <div className="ml-auto">
              <div className="w-5 h-5 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Basic info */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                className="input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                className="input opacity-60 cursor-not-allowed"
                value={user?.email || ''}
                disabled
                title="Email cannot be changed"
              />
              <p className="text-xs text-slate-400 mt-1">Email address cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Phone
              </label>
              <input
                className="input"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+1-555-0100"
              />
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Change Password</h3>
          <p className="text-sm text-slate-400 mb-4">Leave blank to keep your current password</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                className="input"
                value={form.newPassword}
                onChange={e => set('newPassword', e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                className="input"
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        {/* Agent profile info (read-only) */}
        {user?.role === 'agent' && user?.agent_profile && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Agent Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Vehicle Type', user.agent_profile.vehicle_type],
                ['Vehicle Number', user.agent_profile.vehicle_number],
                ['License Number', user.agent_profile.license_number],
                ['Total Deliveries', user.agent_profile.total_deliveries],
                ['Rating', `⭐ ${user.agent_profile.rating} / 5.0`],
                ['Status', user.agent_profile.is_available ? '🟢 Available' : '🔴 Busy'],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium animate-fade-in">
              <CheckCircleIcon className="w-4 h-4" />
              Saved successfully
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
