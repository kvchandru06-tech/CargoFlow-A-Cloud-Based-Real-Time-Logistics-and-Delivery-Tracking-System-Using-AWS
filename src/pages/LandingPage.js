import React from 'react';
import { Link } from 'react-router-dom';
import {
  TruckIcon, ShieldCheckIcon, BoltIcon, GlobeAltIcon,
  ChartBarIcon, BellIcon, ArrowRightIcon, CheckIcon,
} from '@heroicons/react/24/outline';

const features = [
  { icon: TruckIcon,       title: 'Real-Time Tracking',    desc: 'Track every shipment live with detailed status updates and delivery timelines.' },
  { icon: ShieldCheckIcon, title: 'Secure & Reliable',     desc: 'Enterprise-grade security with JWT auth and encrypted data storage.' },
  { icon: BoltIcon,        title: 'Lightning Fast',        desc: 'Express and overnight delivery options with automated agent assignment.' },
  { icon: GlobeAltIcon,    title: 'Nationwide Coverage',   desc: 'Delivery network spanning all major US cities and regions.' },
  { icon: ChartBarIcon,    title: 'Analytics Dashboard',   desc: 'Comprehensive reports and insights for admins and business owners.' },
  { icon: BellIcon,        title: 'Smart Notifications',   desc: 'Instant email and SMS alerts powered by AWS SNS on every status change.' },
];

const plans = [
  { name: 'Standard', price: 'From $5', days: '3–5 days', features: ['Package tracking', 'Email notifications', 'PDF invoice', 'Basic support'] },
  { name: 'Express',  price: 'From $12', days: '1–2 days', features: ['Everything in Standard', 'Priority handling', 'SMS alerts', 'Dedicated agent'], highlight: true },
  { name: 'Overnight', price: 'From $25', days: 'Next day', features: ['Everything in Express', 'Overnight guarantee', 'Insurance included', '24/7 support'] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-brand-800 dark:text-white">CargoFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/track" className="text-sm text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-400 font-medium transition-colors">
              Track Shipment
            </Link>
            <Link to="/login" className="btn-secondary text-sm py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-slate-900 text-white py-24 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Powered by AWS Cloud Infrastructure
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Logistics Made <span className="text-orange-400">Simple</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Ship, track, and manage deliveries in real time. CargoFlow connects senders, agents, and recipients on one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl">
              Start Shipping <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link to="/track" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all">
              Track a Package
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Track */}
      <section className="bg-slate-50 dark:bg-slate-800 py-10 px-4 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 font-medium uppercase tracking-wide">Quick Track</p>
          <form
            onSubmit={e => { e.preventDefault(); const v = e.target.tracking.value.trim(); if (v) window.location.href = `/track/${v}`; }}
            className="flex gap-2"
          >
            <input
              name="tracking"
              placeholder="Enter tracking number (e.g. CGFABC123456)"
              className="input flex-1"
            />
            <button type="submit" className="btn-primary px-6">Track</button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Everything you need to ship smarter</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Built for businesses of all sizes — from solo sellers to enterprise logistics teams.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-brand-700 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Simple, transparent pricing</h2>
            <p className="text-slate-500 dark:text-slate-400">No hidden fees. Pay only for what you ship.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`card p-8 relative ${plan.highlight ? 'ring-2 ring-brand-700 shadow-lg' : ''}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-700 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-3xl font-extrabold text-brand-700 dark:text-brand-400 mb-1">{plan.price}</p>
                <p className="text-sm text-slate-400 mb-6">{plan.days} delivery</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${plan.highlight ? 'btn-primary justify-center' : 'btn-secondary justify-center'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-brand-800 to-brand-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to streamline your deliveries?</h2>
        <p className="text-blue-200 mb-8 max-w-xl mx-auto">Join thousands of businesses using CargoFlow to manage their logistics end-to-end.</p>
        <Link to="/register" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all shadow-lg">
          Create Free Account <ArrowRightIcon className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
            <TruckIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">CargoFlow</span>
        </div>
        <p>© {new Date().getFullYear()} CargoFlow. Built with React, Flask & AWS.</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          <Link to="/track" className="hover:text-white transition-colors">Track</Link>
        </div>
      </footer>
    </div>
  );
}
