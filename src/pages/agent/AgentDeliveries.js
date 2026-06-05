import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { MagnifyingGlassIcon, TruckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const STATUSES = ['', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];

export default function AgentDeliveries() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 10 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/shipments?${params}`);
      setDeliveries(res.data.shipments);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {}
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Deliveries</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{total} assigned deliveries</p>
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
        ) : deliveries.length === 0 ? (
          <div className="text-center py-16">
            <TruckIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No deliveries found</p>
          </div>
        ) : (
          <>
            <div className="table-container rounded-2xl">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Recipient</th>
                    <th>Pickup</th>
                    <th>Delivery</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Est. Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map(s => (
                    <tr key={s.id} className="cursor-pointer" onClick={() => navigate(`/agent/deliveries/${s.id}`)}>
                      <td className="font-mono text-xs text-brand-700 dark:text-brand-400 font-semibold">{s.tracking_number}</td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{s.recipient_name}</p>
                          <p className="text-xs text-slate-400">{s.recipient_phone}</p>
                        </div>
                      </td>
                      <td className="text-xs text-slate-400">{s.pickup_city}, {s.pickup_state}</td>
                      <td className="text-xs text-slate-400">{s.delivery_city}, {s.delivery_state}</td>
                      <td className="text-xs text-slate-400 capitalize">{s.package_type} · {s.weight}kg</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td className="text-xs text-slate-400">
                        {s.estimated_delivery ? format(new Date(s.estimated_delivery), 'MMM d') : '—'}
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
    </div>
  );
}
