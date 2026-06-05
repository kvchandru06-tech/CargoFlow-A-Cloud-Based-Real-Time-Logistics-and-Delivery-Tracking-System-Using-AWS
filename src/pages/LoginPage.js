import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TruckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'agent') navigate('/agent');
      else navigate('/customer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin:    { email: 'admin@cargoflow.com',    password: 'admin123' },
      customer: { email: 'customer@cargoflow.com', password: 'customer123' },
      agent:    { email: 'agent@cargoflow.com',    password: 'agent123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-800 to-brand-900 text-white flex-col justify-center px-16">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <TruckIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">CargoFlow</span>
        </div>
        <h2 className="text-4xl font-extrabold leading-tight mb-4">
          Your logistics,<br />under control.
        </h2>
        <p className="text-blue-200 text-lg leading-relaxed">
          Real-time tracking, smart notifications, and seamless delivery management — all in one platform.
        </p>
        <div className="mt-12 space-y-4">
          {['Track shipments in real time', 'Automated agent assignment', 'PDF invoices & proof of delivery', 'AWS-powered notifications'].map(f => (
            <div key={f} className="flex items-center gap-3 text-blue-100">
              <div className="w-5 h-5 bg-green-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-800 dark:text-white">CargoFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Sign in</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Welcome back — enter your credentials to continue.</p>

          {/* Demo buttons */}
          <div className="flex gap-2 mb-6">
            {['admin', 'customer', 'agent'].map(role => (
              <button
                key={role}
                onClick={() => fillDemo(role)}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors capitalize"
              >
                Demo {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-700 dark:text-brand-400 font-medium hover:underline">
              Create one
            </Link>
          </p>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
            <Link to="/track" className="text-brand-700 dark:text-brand-400 font-medium hover:underline">
              Track a shipment without signing in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
