import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { TruckIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
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
        active: all.filter(s => ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length,
        delivered: all.filter(s => s.status === 'delivered').length,
      });
      setDeliveries(recentRes.data.shipments);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const agent = user?.agent_profile;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Agent Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Welcome back, {user?.name?.split(' ')[0]}
        </p>
      </div>

      {/* Agent profile card */}
      {agent && (
        <div className="card p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-2xl flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white text-lg">{user?.name}</p>
            <p className="text-sm text-slate-500 capitalize">{agent.vehicle_type} · {agent.vehicle_number}</p>
            {agent.current_location && <p className="text-xs text-slate-400 mt-0.5">📍 {agent.current_location}</p>}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-slate-900 dark:text-white">{agent.rating}</span>
            </div>
            <p className="text-xs text-slate-400">{agent.total_deliveries} total deliveries</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
              agent.is_available
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}>
              {agent.is_available ? 'Available' : 'Busy'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Assigned" value={stats.total} icon={TruckIcon} color="blue" />
        <StatCard title="Active" value={stats.active} icon={ClockIcon} color="orange" />
        <StatCard title="Completed" value={stats.delivered} icon={CheckCircleIcon} color="green" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent Deliveries</h3>
          <Link to="/agent/deliveries" className="text-sm text-brand-700 dark:text-brand-400 hover:underline">View all</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-16">
            <TruckIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No deliveries assigned yet</p>
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
                </tr>
              </thead>
              <tbody>
                {deliveries.map(s => (
                  <tr key={s.id} className="cursor-pointer" onClick={() => navigate(`/agent/deliveries/${s.id}`)}>
                    <td className="font-mono text-xs text-brand-700 dark:text-brand-400 font-semibold">{s.tracking_number}</td>
                    <td>{s.recipient_name}</td>
                    <td className="text-sm text-slate-400">{s.delivery_city}, {s.delivery_state}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-xs text-slate-400">
                      {s.estimated_delivery ? format(new Date(s.estimated_delivery), 'MMM d') : '—'}
                    </td>
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
