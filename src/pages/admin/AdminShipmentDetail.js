import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import TrackingTimeline from '../../components/shipments/TrackingTimeline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import {
  ArrowLeftIcon, DocumentArrowDownIcon, UserIcon,
  ScaleIcon, CalendarIcon, TruckIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = [
  'pending','confirmed','picked_up','in_transit',
  'out_for_delivery','delivered','failed','cancelled',
];

export default function AdminShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusLocation, setStatusLocation] = useState('');
  const [statusDesc, setStatusDesc] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const fetchShipment = useCallback(async () => {
    try {
      const res = await api.get(`/shipments/${id}`);
      setShipment(res.data.shipment);
    } catch {
      toast.error('Shipment not found');
      navigate('/admin/shipments');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchShipment();
    api.get('/admin/agents').then(r => setAgents(r.data.agents)).catch(() => {});
  }, [fetchShipment]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    try {
      await api.put(`/shipments/${id}/status`, {
        status: newStatus, location: statusLocation, description: statusDesc,
      });
      toast.success('Status updated');
      setStatusModal(false);
      setStatusLocation(''); setStatusDesc('');
      fetchShipment();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    try {
      await api.put(`/shipments/${id}/assign`, { agent_id: selectedAgentId });
      toast.success('Agent assigned');
      setAssignModal(false);
      fetchShipment();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    }
  };

  const downloadInvoice = async () => {
    try {
      const res = await api.get(`/shipments/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${shipment.tracking_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!shipment) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/shipments')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {shipment.tracking_number}
              </h1>
              <StatusBadge status={shipment.status} size="lg" />
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Created {shipment.created_at ? format(new Date(shipment.created_at), 'MMMM d, yyyy · h:mm a') : '—'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadInvoice} className="btn-secondary text-sm">
            <DocumentArrowDownIcon className="w-4 h-4" />
            Invoice
          </button>
          {!shipment.agent_id && (
            <button onClick={() => { setSelectedAgentId(''); setAssignModal(true); }} className="btn-orange text-sm">
              <UserIcon className="w-4 h-4" />
              Assign Agent
            </button>
          )}
          {!['delivered','cancelled'].includes(shipment.status) && (
            <button onClick={() => { setNewStatus(shipment.status); setStatusModal(true); }} className="btn-primary text-sm">
              Update Status
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Parties */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Parties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Sender</p>
                <p className="font-semibold text-slate-900 dark:text-white">{shipment.sender?.name || '—'}</p>
                <p className="text-slate-500 text-xs mt-0.5">{shipment.sender?.email}</p>
                <p className="text-slate-500 text-xs">{shipment.sender?.phone}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Recipient</p>
                <p className="font-semibold text-slate-900 dark:text-white">{shipment.recipient_name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{shipment.recipient_email || '—'}</p>
                <p className="text-slate-500 text-xs">{shipment.recipient_phone}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Agent</p>
                {shipment.agent_id ? (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white">Assigned</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ Active</p>
                  </>
                ) : (
                  <p className="text-slate-400 text-sm">Not assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Route</h3>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200 dark:ring-green-900" />
                <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 dark:ring-red-900" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Pickup</p>
                  <p className="font-medium text-slate-900 dark:text-white">{shipment.pickup_address}</p>
                  <p className="text-sm text-slate-500">
                    {[shipment.pickup_city, shipment.pickup_state, shipment.pickup_zip].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Delivery</p>
                  <p className="font-medium text-slate-900 dark:text-white">{shipment.delivery_address}</p>
                  <p className="text-sm text-slate-500">
                    {[shipment.delivery_city, shipment.delivery_state, shipment.delivery_zip].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking timeline */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Tracking History</h3>
            <TrackingTimeline history={shipment.tracking_history || []} />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Package */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Package</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <ScaleIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 capitalize">
                  {shipment.package_type} · {shipment.weight} kg
                </span>
              </div>
              {shipment.dimensions && (
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">{shipment.dimensions}</span>
                </div>
              )}
              {shipment.description && (
                <p className="text-slate-500 text-xs pl-6">{shipment.description}</p>
              )}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">
                  Est. {shipment.estimated_delivery
                    ? format(new Date(shipment.estimated_delivery), 'MMM d, yyyy')
                    : 'TBD'}
                </span>
              </div>
              {shipment.actual_delivery && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Delivered {format(new Date(shipment.actual_delivery), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              <div className="pt-1">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                  shipment.priority === 'overnight' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  shipment.priority === 'express'   ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {shipment.priority} priority
                </span>
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Cost</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Shipping</span><span>${shipment.shipping_cost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Insurance</span><span>${shipment.insurance_cost?.toFixed(2)}</span>
              </div>
              {shipment.declared_value > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Declared value</span><span>${shipment.declared_value?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-700">
                <span>Total</span><span>${shipment.total_cost?.toFixed(2)}</span>
              </div>
              <div className="pt-1 flex gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                  shipment.payment_status === 'paid'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {shipment.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Proof of delivery */}
          {shipment.proof_of_delivery_url && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Proof of Delivery</h3>
              <a
                href={shipment.proof_of_delivery_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm w-full justify-center"
              >
                View Proof
              </a>
            </div>
          )}

          {/* Special instructions */}
          {shipment.special_instructions && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Special Instructions</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {shipment.special_instructions}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Shipment Status">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Updating <span className="font-mono font-semibold text-brand-700">{shipment.tracking_number}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Status</label>
            <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
            <input className="input" placeholder="e.g. Chicago, IL" value={statusLocation} onChange={e => setStatusLocation(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Note</label>
            <input className="input" placeholder="Optional description..." value={statusDesc} onChange={e => setStatusDesc(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStatusModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStatusUpdate} className="btn-primary">Update Status</button>
          </div>
        </div>
      </Modal>

      {/* Assign Agent Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Delivery Agent">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Assign an agent to <span className="font-mono font-semibold text-brand-700">{shipment.tracking_number}</span>
          </p>
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
            <button onClick={handleAssign} disabled={!selectedAgentId} className="btn-primary disabled:opacity-40">
              Assign Agent
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
