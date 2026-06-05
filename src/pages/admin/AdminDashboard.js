import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import {
  TruckIcon, UsersIcon, CheckCircleIcon, ClockIcon,
  CurrencyDollarIcon, UserGroupIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement
);

const PRIORITY_COLORS = { standard: '#3b82f6', express: '#f97316', overnight: '#ef4444' };
const STATUS_COLORS = {
  pending: '#eab308', confirmed: '#3b82f6', picked_up: '#6366f1',
  in_transit: '#a855f7', out_for_delivery: '#f97316', delivered: '#22c55e',
  failed: '#ef4444', cancelled: '#94a3b8',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center text-slate-500 py-16">Failed to load dashboard.</div>
  );

  const { stats, status_distribution, daily_shipments, priority_distribution, recent_shipments, top_agents } = data;

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const legendColor = { color: tickColor, boxWidth: 12, font: { size: 11 } };

  // Bar chart — daily shipments
  const barData = {
    labels: daily_shipments.map(d => format(new Date(d.date + 'T00:00:00'), 'MMM d')),
    datasets: [{
      label: 'Shipments',
      data: daily_shipments.map(d => d.count),
      backgroundColor: isDark ? 'rgba(96,165,250,0.7)' : 'rgba(29,78,216,0.7)',
      borderRadius: 6,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: tickColor }, grid: { color: gridColor } },
      x: { grid: { display: false }, ticks: { color: tickColor } },
    },
  };

  // Doughnut — status distribution
  const statusDoughnut = {
    labels: status_distribution.map(s => s.status.replace(/_/g, ' ')),
    datasets: [{
      data: status_distribution.map(s => s.count),
      backgroundColor: status_distribution.map(s => STATUS_COLORS[s.status] || '#94a3b8'),
      borderWidth: 0,
    }],
  };

  // Doughnut — priority distribution
  const priorityDoughnut = {
    labels: priority_distribution.map(p => p.priority),
    datasets: [{
      data: priority_distribution.map(p => p.count),
      backgroundColor: priority_distribution.map(p => PRIORITY_COLORS[p.priority] || '#94a3b8'),
      borderWidth: 0,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: legendColor } },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overview of all operations</p>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Shipments"   value={stats.total_shipments}                          icon={TruckIcon}         color="blue"   />
        <StatCard title="Active Deliveries" value={stats.active_deliveries}                        icon={ClockIcon}         color="orange" />
        <StatCard title="Delivered Today"   value={stats.delivered_today}                          icon={CheckCircleIcon}   color="green"  />
        <StatCard title="Total Revenue"     value={`$${stats.total_revenue.toLocaleString()}`}     icon={CurrencyDollarIcon} color="purple" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Customers"  value={stats.total_customers}   icon={UsersIcon}     color="indigo" />
        <StatCard title="Agents"     value={stats.total_agents}      icon={UserGroupIcon} color="blue"   />
        <StatCard title="Pending"    value={stats.pending_shipments} icon={ChartBarIcon}  color="orange" />
      </div>

      {/* Charts row 1 — bar + status doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Shipments — Last 7 Days</h3>
          {daily_shipments.length > 0
            ? <Bar data={barData} options={barOptions} />
            : <div className="flex items-center justify-center h-40 text-slate-400">No data yet</div>
          }
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Status Distribution</h3>
          {status_distribution.length > 0
            ? <Doughnut data={statusDoughnut} options={doughnutOptions} />
            : <div className="flex items-center justify-center h-40 text-slate-400">No data</div>
          }
        </div>
      </div>

      {/* Charts row 2 — priority + top agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Priority Breakdown</h3>
          {priority_distribution.length > 0 ? (
            <>
              <Doughnut data={priorityDoughnut} options={doughnutOptions} />
              <div className="mt-4 space-y-2">
                {priority_distribution.map(p => (
                  <div key={p.priority} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PRIORITY_COLORS[p.priority] || '#94a3b8' }} />
                      <span className="capitalize text-slate-600 dark:text-slate-300">{p.priority}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400">No data</div>
          )}
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Delivery Agents</h3>
          {top_agents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No agents yet</p>
          ) : (
            <div className="space-y-3">
              {top_agents.map((agent, i) => (
                <div key={agent.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    i === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300' :
                    i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{agent.user?.name}</p>
                    <p className="text-xs text-slate-400">{agent.vehicle_type} · {agent.total_deliveries} deliveries</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{agent.rating}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      agent.is_available
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {agent.is_available ? 'Available' : 'Busy'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent shipments */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent Shipments</h3>
          <Link to="/admin/shipments" className="text-sm text-brand-700 dark:text-brand-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="table-container rounded-none rounded-b-2xl">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Route</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent_shipments.map(s => (
                <tr
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => navigate('/admin/shipments')}
                >
                  <td className="font-mono text-xs text-brand-700 dark:text-brand-400 font-semibold">
                    {s.tracking_number}
                  </td>
                  <td className="text-sm">{s.sender?.name || '—'}</td>
                  <td className="text-sm">{s.recipient_name}</td>
                  <td className="text-xs text-slate-400">{s.pickup_city} → {s.delivery_city}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="font-medium text-sm">${s.total_cost?.toFixed(2)}</td>
                  <td className="text-xs text-slate-400">
                    {s.created_at ? format(new Date(s.created_at), 'MMM d') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
