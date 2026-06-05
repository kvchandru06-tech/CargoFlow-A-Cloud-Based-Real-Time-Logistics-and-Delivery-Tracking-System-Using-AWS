import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import TrackingTimeline from '../../components/shipments/TrackingTimeline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmModal from '../../components/ui/ConfirmModal';
import {
  ArrowLeftIcon, DocumentArrowDownIcon,
  ScaleIcon, CalendarIcon, TruckIcon, UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    api.get(`/shipments/${id}`)
      .then(res => setShipment(res.data.shipment))
      .catch(() => toast.error('Shipment not found'))
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleCancel = async () => {
    try {
      await api.delete(`/shipments/${id}`);
      toast.success('Shipment cancelled');
      navigate('/customer/shipments');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot cancel this shipment');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  if (!shipment) return (
    <div className="text-center py-16">
      <TruckIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p className="text-slate-500 mb-4">Shipment not found</p>
      <Link to="/customer/shipments" className="btn-primary">Back to Shipments</Link>
    </div>
  );

  const canCancel = !['delivered', 'cancelled', 'failed'].includes(shipment.status);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Go back"
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
              Created {shipment.created_at ? format(new Date(shipment.created_at), 'MMMM d, yyyy') : '—'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadInvoice} className="btn-secondary text-sm">
            <DocumentArrowDownIcon className="w-4 h-4" />
            Invoice PDF
          </button>
          {canCancel && (
            <button onClick={() => setConfirmCancel(true)} className="btn-danger text-sm">
              Cancel Shipment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
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

          {/* Recipient */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recipient</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-1">Name</p>
                <p className="font-medium text-slate-900 dark:text-white">{shipment.recipient_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Phone</p>
                <p className="font-medium text-slate-900 dark:text-white">{shipment.recipient_phone}</p>
              </div>
              {shipment.recipient_email && (
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs mb-1">Email</p>
                  <p className="font-medium text-slate-900 dark:text-white">{shipment.recipient_email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tracking timeline */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Tracking History</h3>
            <TrackingTimeline history={shipment.tracking_history || []} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Package */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Package Details</h3>
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
                <p className="text-slate-500 dark:text-slate-400 text-xs pl-6">{shipment.description}</p>
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
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Cost Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Shipping</span>
                <span>${shipment.shipping_cost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Insurance</span>
                <span>${shipment.insurance_cost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-700">
                <span>Total</span>
                <span>${shipment.total_cost?.toFixed(2)}</span>
              </div>
              <div className="pt-1">
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

          {/* Assigned agent */}
          {shipment.agent_id && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Delivery Agent</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Agent Assigned</p>
                  <p className="text-xs text-slate-400">Your shipment is in good hands</p>
                </div>
              </div>
            </div>
          )}

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

      {/* Cancel confirmation */}
      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Shipment?"
        message={`This will cancel shipment ${shipment.tracking_number}. This action cannot be undone.`}
        confirmLabel="Yes, Cancel"
        danger
      />
    </div>
  );
}
