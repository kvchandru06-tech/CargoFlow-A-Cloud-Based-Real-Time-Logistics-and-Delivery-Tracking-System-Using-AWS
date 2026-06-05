import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { TruckIcon, ClockIcon, CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/shipments?per_page=100'),
      api.get('/shipments?per_page=5'),
    ]).then(([allRes, recentRes]) => {
      const all = allRes.data.shipments;
      setStats({
        total: allRes.data.total,
        active: all.filter(s =>
          ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)
        ).length,
        delivered: all.filter(s => s.status === 'delivered').length,
      });
      setShipments(recentRes.data.shipments);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Here's what's happening with your shipments
          </p>
        </div>
        <Link to="/customer/shipments/new" className="btn-primary">
          <PlusCircleIcon className="w-5 h-5" />
          New Shipment
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Shipments" value={stats.total} icon={TruckIcon} color="blue" />
        <StatCard title="In Transit"       value={stats.active} icon={ClockIcon} color="orange" />
        <StatCard title="Delivered"        value={stats.delivered} icon={CheckCircleIcon} color="green" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent Shipments</h3>
          <Link to="/customer/shipments" className="text-sm text-brand-700 dark:text-brand-400 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-16">
            <TruckIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 mb-4">No shipments yet</p>
            <Link to="/customer/shipments/new" className="btn-primary">
              Create your first shipment
            </Link>
          </div>
        ) : (
          <div className="table-container rounded-none rounded-b-2xl">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Recipient</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Est. Delivery</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => (
                  <tr
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/customer/shipments/${s.id}`)}
                  >
                    <td className="font-mono text-xs text-brand-700 dark:text-brand-400 font-semibold">
                      {s.tracking_number}
                    </td>
                    <td>{s.recipient_name}</td>
                    <td className="text-sm text-slate-400">{s.delivery_city}, {s.delivery_state}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-xs text-slate-400">
                      {s.estimated_delivery
                        ? format(new Date(s.estimated_delivery), 'MMM d, yyyy')
                        : '—'}
                    </td>
                    <td className="font-medium">${s.total_cost?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
