import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { MagnifyingGlassIcon, PlusCircleIcon, TruckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['', 'pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];

export default function CustomerShipments() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null); // { id, tracking_number }

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 10 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/shipments?${params}`);
      setShipments(res.data.shipments);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await api.delete(`/shipments/${cancelTarget.id}`);
      toast.success('Shipment cancelled');
      setCancelTarget(null);
      fetchShipments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot cancel this shipment');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Shipments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total} total</p>
        </div>
        <Link to="/customer/shipments/new" className="btn-primary">
          <PlusCircleIcon className="w-5 h-5" />
          New Shipment
        </Link>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search tracking #, recipient..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input w-44"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All Statuses'}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-16">
            <TruckIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 mb-4">No shipments found</p>
            <Link to="/customer/shipments/new" className="btn-primary">Create a shipment</Link>
          </div>
        ) : (
          <>
            <div className="table-container rounded-t-none rounded-2xl">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Recipient</th>
                    <th>Route</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Est. Delivery</th>
                    <th>Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map(s => (
                    <tr key={s.id} className="cursor-pointer" onClick={() => navigate(`/customer/shipments/${s.id}`)}>
                      <td className="font-mono text-xs text-brand-700 dark:text-brand-400 font-semibold">{s.tracking_number}</td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{s.recipient_name}</p>
                          <p className="text-xs text-slate-400">{s.recipient_phone}</p>
                        </div>
                      </td>
                      <td className="text-xs text-slate-400">{s.pickup_city} → {s.delivery_city}</td>
                      <td className="text-xs text-slate-400 capitalize">{s.package_type} · {s.weight}kg</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td className="text-xs text-slate-400">
                        {s.estimated_delivery ? format(new Date(s.estimated_delivery), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="font-medium text-sm">${s.total_cost?.toFixed(2)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Link
                            to={`/customer/shipments/${s.id}`}
                            className="text-xs px-2 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-100 transition-colors"
                          >
                            View
                          </Link>
                          {!['delivered', 'cancelled'].includes(s.status) && (
                            <button
                              onClick={e => { e.stopPropagation(); setCancelTarget({ id: s.id, tracking_number: s.tracking_number }); }}
                              className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-500">Page {page} of {pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Shipment?"
        message={`Cancel shipment ${cancelTarget?.tracking_number}? This cannot be undone.`}
        confirmLabel="Yes, Cancel"
        danger
      />
    </div>
  );
}
