import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import TrackingTimeline from '../components/shipments/TrackingTimeline';
import StatusBadge from '../components/ui/StatusBadge';
import { TruckIcon, MagnifyingGlassIcon, MapPinIcon, CalendarIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function TrackPage() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(trackingNumber || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (trackingNumber) {
      fetchTracking(trackingNumber);
    }
  }, [trackingNumber]);

  const fetchTracking = async (num) => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await api.get(`/tracking/${num.toUpperCase()}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Tracking number not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/track/${query.trim()}`);
    }
  };

  const steps = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
  const stepLabels = ['Order Placed', 'Confirmed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-900 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <Link to="/" className="text-xl font-bold">CargoFlow</Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Track Your Shipment</h1>
          <p className="text-blue-200 mb-8">Enter your tracking number to get real-time updates</p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value.toUpperCase())}
                placeholder="e.g. CGFABC123456"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/40 font-mono"
              />
            </div>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Track
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {loading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Fetching tracking info...</p>
          </div>
        )}

        {error && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TruckIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Not Found</h3>
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6 animate-fade-in">
            {/* Status header */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Tracking Number</p>
                  <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{data.tracking_number}</p>
                </div>
                <StatusBadge status={data.status} size="lg" />
              </div>

              {/* Progress bar */}
              {!['failed', 'cancelled'].includes(data.status) && (
                <div className="mb-2">
                  <div className="flex justify-between mb-3">
                    {steps.map((step, i) => (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                          i <= data.current_step
                            ? 'bg-brand-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}>
                          {i < data.current_step ? '✓' : i + 1}
                        </div>
                        <p className={`text-xs text-center hidden sm:block ${i <= data.current_step ? 'text-brand-700 dark:text-brand-400 font-medium' : 'text-slate-400'}`}>
                          {stepLabels[i]}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <div
                      className="absolute h-full bg-brand-700 rounded-full transition-all duration-500"
                      style={{ width: `${(data.current_step / (steps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Route</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">From</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{data.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">To</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{data.delivery_address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Package Info</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ScaleIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{data.weight} kg · {data.package_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Est. delivery: {data.estimated_delivery
                        ? format(new Date(data.estimated_delivery), 'MMM d, yyyy')
                        : 'TBD'}
                    </span>
                  </div>
                  {data.actual_delivery && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Delivered: {format(new Date(data.actual_delivery), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      data.priority === 'overnight' ? 'bg-red-100 text-red-700' :
                      data.priority === 'express' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {data.priority} priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Tracking History</h3>
              <TrackingTimeline history={data.history} />
            </div>

            <div className="text-center">
              <Link to="/login" className="text-sm text-brand-700 dark:text-brand-400 hover:underline">
                Sign in to manage your shipments →
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && !data && (
          <div className="card p-12 text-center">
            <TruckIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Enter a tracking number</h3>
            <p className="text-slate-500 dark:text-slate-400">Type your CargoFlow tracking number above to see real-time updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
