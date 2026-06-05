import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import TrackingTimeline from '../../components/shipments/TrackingTimeline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import {
  ArrowLeftIcon, CameraIcon,
  ScaleIcon, CalendarIcon, PhoneIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AGENT_STATUSES = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];

export default function AgentDeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchShipment = useCallback(async () => {
    try {
      const res = await api.get(`/shipments/${id}`);
      setShipment(res.data.shipment);
    } catch {
      toast.error('Delivery not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchShipment(); }, [fetchShipment]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    try {
      await api.put(`/shipments/${id}/status`, { status: newStatus, location, description });
      toast.success('Status updated');
      setStatusModal(false);
      fetchShipment();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/uploads/proof/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Proof of delivery uploaded');
      fetchShipment();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!shipment) return <div className="text-center py-16 text-slate-500">Delivery not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-slate-900 dark:text-white">{shipment.tracking_number}</h1>
              <StatusBadge status={shipment.status} size="lg" />
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {shipment.created_at ? format(new Date(shipment.created_at), 'MMMM d, yyyy') : '—'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!['delivered', 'cancelled', 'failed'].includes(shipment.status) && (
            <button
              onClick={() => { setNewStatus(shipment.status); setStatusModal(true); }}
              className="btn-primary text-sm"
            >
              Update Status
            </button>
          )}
          {shipment.status !== 'delivered' && (
            <>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleProofUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-secondary text-sm"
              >
                <CameraIcon className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Proof'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Route */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Delivery Route</h3>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-12 bg-slate-200 dark:bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Pickup From</p>
                  <p className="font-medium text-slate-900 dark:text-white">{shipment.pickup_address}</p>
                  <p className="text-sm text-slate-500">{shipment.pickup_city}, {shipment.pickup_state} {shipment.pickup_zip}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Deliver To</p>
                  <p className="font-medium text-slate-900 dark:text-white">{shipment.delivery_address}</p>
                  <p className="text-sm text-slate-500">{shipment.delivery_city}, {shipment.delivery_state} {shipment.delivery_zip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recipient contact */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recipient</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-lg">
                {shipment.recipient_name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{shipment.recipient_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <PhoneIcon className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${shipment.recipient_phone}`} className="text-sm text-brand-700 dark:text-brand-400 hover:underline">
                    {shipment.recipient_phone}
                  </a>
                </div>
                {shipment.recipient_email && (
                  <p className="text-sm text-slate-400 mt-0.5">{shipment.recipient_email}</p>
                )}
              </div>
            </div>
            {shipment.special_instructions && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Special Instructions</p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">{shipment.special_instructions}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Tracking History</h3>
            <TrackingTimeline history={shipment.tracking_history || []} />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Package</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <ScaleIcon className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 capitalize">{shipment.package_type} · {shipment.weight}kg</span>
              </div>
              {shipment.dimensions && (
                <p className="text-slate-500 text-xs pl-6">{shipment.dimensions}</p>
              )}
              {shipment.description && (
                <p className="text-slate-500 text-xs pl-6">{shipment.description}</p>
              )}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">
                  Est. {shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), 'MMM d, yyyy') : 'TBD'}
                </span>
              </div>
              <div className="mt-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                  shipment.priority === 'overnight' ? 'bg-red-100 text-red-700' :
                  shipment.priority === 'express' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {shipment.priority} priority
                </span>
              </div>
            </div>
          </div>

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
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Delivery Status">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Status</label>
            <div className="grid grid-cols-1 gap-2">
              {AGENT_STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewStatus(s)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium border text-left transition-all capitalize ${
                    newStatus === s
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Location</label>
            <input className="input" placeholder="e.g. Chicago, IL" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Note (optional)</label>
            <input className="input" placeholder="Any additional info..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStatusModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStatusUpdate} disabled={!newStatus} className="btn-primary">Update</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
