import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['', 'pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];

export default function AdminShipments() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [agents, setAgents] = useState([]);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusLocation, setStatusLocation] = useState('');
  const [statusDesc, setStatusDesc] = useState('');

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 15 });
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

  useEffect(() => {
    api.get('/admin/agents').then(res => setAgents(res.data.agents)).catch(() => {});
  }, []);

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    try {
      await api.put(`/shipments/${selected.id}/assign`, { agent_id: selectedAgentId });
      toast.success('Agent assigned');
      setAssignModal(false);
      fetchShipments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    try {
      await api.put(`/shipments/${selected.id}/status`, {
        status: newStatus,
        location: statusLocation,
        description: statusDesc,
      });
      toast.success('Status updated');
      setStatusModal(false);
      fetchShipments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shipments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total} total shipments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search tracking #, recipient, city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-slate-400" />
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
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <div className="table-container rounded-2xl">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Sender</th>
                  <th>Recipient</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Cost</th>
                  <th>Agent</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => (
                  <tr key={s.id} className="cursor-pointer" onClick={() => navigate(`/admin/shipments/${s.id}`)}>
                    <td className="font-mono text-xs text-brand-700 dark:text-brand-400 font-semibold">{s.tracking_number}</td>
                    <td className="text-sm">{s.sender?.name || '—'}</td>
                    <td className="text-sm">{s.recipient_name}</td>
                    <td className="text-xs text-slate-400">{s.pickup_city} → {s.delivery_city}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-sm font-medium">${s.total_cost?.toFixed(2)}</td>
                    <td className="text-xs text-slate-400">{s.agent_id ? '✓ Assigned' : '—'}</td>
                    <td className="text-xs text-slate-400">{s.created_at ? format(new Date(s.created_at), 'MMM d, yy') : '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/admin/shipments/${s.id}`)}
                          className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => { setSelected(s); setNewStatus(s.status); setStatusModal(true); }}
                          className="text-xs px-2 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-100 transition-colors"
                        >
                          Status
                        </button>
                        {!s.agent_id && (
                          <button
                            onClick={() => { setSelected(s); setSelectedAgentId(''); setAssignModal(true); }}
                            className="text-xs px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-100 transition-colors"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {shipments.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-400">No shipments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Agent Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Delivery Agent">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Assign an agent to shipment <span className="font-mono font-semibold text-brand-700">{selected?.tracking_number}</span></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select Agent</label>
            <select className="input" value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}>
              <option value="">Choose an agent...</option>
              {agents.filter(a => a.is_available).map(a => (
                <option key={a.id} value={a.id}>
                  {a.user?.name} — {a.vehicle_type} ({a.total_deliveries} deliveries, ⭐{a.rating})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssign} disabled={!selectedAgentId} className="btn-primary">Assign Agent</button>
          </div>
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Shipment Status">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Update status for <span className="font-mono font-semibold text-brand-700">{selected?.tracking_number}</span></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Status</label>
            <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {STATUSES.filter(Boolean).map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
            <input className="input" placeholder="e.g. Chicago, IL" value={statusLocation} onChange={e => setStatusLocation(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <input className="input" placeholder="Optional note..." value={statusDesc} onChange={e => setStatusDesc(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStatusModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStatusUpdate} className="btn-primary">Update Status</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
