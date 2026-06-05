import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TruckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer',
    vehicle_type: 'bike', vehicle_number: '', license_number: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created successfully!');
      if (user.role === 'agent') navigate('/agent');
      else navigate('/customer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
            <TruckIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-brand-800 dark:text-white">CargoFlow</span>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create account</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Join CargoFlow to start shipping today.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['customer', 'agent'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('role', r)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                      form.role === r
                        ? 'bg-brand-700 text-white border-brand-700'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {r === 'customer' ? '📦 Customer' : '🚚 Delivery Agent'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input className="input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                <input className="input" placeholder="+1-555-0100" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Agent-specific fields */}
            {form.role === 'agent' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3 border border-slate-200 dark:border-slate-600">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Agent Details</p>
                <div className="grid grid-cols-3 gap-2">
                  {['bike', 'van', 'truck'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set('vehicle_type', v)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                        form.vehicle_type === v
                          ? 'bg-brand-700 text-white border-brand-700'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {v === 'bike' ? '🏍️' : v === 'van' ? '🚐' : '🚛'} {v}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Vehicle Number</label>
                    <input className="input text-sm" placeholder="VAN-001" value={form.vehicle_number} onChange={e => set('vehicle_number', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">License Number</label>
                    <input className="input text-sm" placeholder="DL-12345" value={form.license_number} onChange={e => set('license_number', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-700 dark:text-brand-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
