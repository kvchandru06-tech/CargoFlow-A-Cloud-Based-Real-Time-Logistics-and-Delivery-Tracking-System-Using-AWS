import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import {
  TruckIcon, CheckCircleIcon, ExclamationCircleIcon,
  CurrencyDollarIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement
);

const PERIODS = [
  { label: 'Last 7 days',  value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

const PRIORITY_COLORS = {
  standard:  '#3b82f6',
  express:   '#f97316',
  overnight: '#ef4444',
};

export default function AdminReports() {
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/reports?period=${period}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const tickColor  = isDark ? '#94a3b8' : '#64748b';
  const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const revenueChart = data ? {
    labels: data.daily_revenue.map(d =>
      format(new Date(d.date + 'T00:00:00'), period === '7' ? 'EEE' : 'MMM d')
    ),
    datasets: [
      {
        label: 'Revenue ($)',
        data: data.daily_revenue.map(d => d.revenue),
        backgroundColor: isDark ? 'rgba(96,165,250,0.25)' : 'rgba(29,78,216,0.15)',
        borderColor:     isDark ? '#60a5fa' : '#1d4ed8',
        borderWidth: 2,
        borderRadius: 4,
        type: 'bar',
        yAxisID: 'y',
      },
      {
        label: 'Shipments',
        data: data.daily_revenue.map(d => d.count),
        borderColor: '#f97316',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#f97316',
        type: 'line',
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  } : null;

  const revenueOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: tickColor, boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: ctx =>
            ctx.dataset.label === 'Revenue ($)'
              ? ` $${ctx.parsed.y.toFixed(2)}`
              : ` ${ctx.parsed.y} shipments`,
        },
      },
    },
    scales: {
      x:  { grid: { display: false }, ticks: { color: tickColor } },
      y:  {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: tickColor, callback: v => `$${v}` },
        title: { display: true, text: 'Revenue ($)', color: tickColor, font: { size: 11 } },
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        grid: { display: false },
        ticks: { color: tickColor, stepSize: 1 },
        title: { display: true, text: 'Shipments', color: tickColor, font: { size: 11 } },
      },
    },
  };

  const priorityChart = data ? {
    labels: data.priority_breakdown.map(p => p.priority),
    datasets: [{
      data: data.priority_breakdown.map(p => p.count),
      backgroundColor: data.priority_breakdown.map(p => PRIORITY_COLORS[p.priority] || '#94a3b8'),
      borderWidth: 0,
    }],
  } : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Performance metrics and analytics</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${
                period === p.value
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Shipments"        value={data.total_shipments}                          icon={TruckIcon}             color="blue"   />
            <StatCard title="Delivered"              value={data.delivered}                                icon={CheckCircleIcon}       color="green"  />
            <StatCard title="Failed"                 value={data.failed}                                   icon={ExclamationCircleIcon} color="red"    />
            <StatCard title="Total Revenue"          value={`$${data.total_revenue.toLocaleString()}`}     icon={CurrencyDollarIcon}    color="purple" />
            <StatCard title="Avg. Revenue/Shipment"  value={`$${data.avg_revenue_per_shipment}`}           icon={ChartBarIcon}          color="indigo" />

            {/* Delivery rate card */}
            <div className="card p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Delivery Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.delivery_rate}%</p>
                <div className="mt-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(data.delivery_rate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue + shipments trend */}
            <div className="card p-6 lg:col-span-2">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Revenue & Shipments — Last {data.period_days} Days
              </h3>
              {revenueChart && data.daily_revenue.length > 0 ? (
                <Bar data={revenueChart} options={revenueOptions} />
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-400">
                  No data for this period
                </div>
              )}
            </div>

            {/* Priority breakdown */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Priority Breakdown</h3>
              {priorityChart && data.priority_breakdown.length > 0 ? (
                <>
                  <Doughnut
                    data={priorityChart}
                    options={{
                      responsive: true,
                      cutout: '65%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { color: tickColor, boxWidth: 12, font: { size: 11 } },
                        },
                      },
                    }}
                  />
                  <div className="mt-4 space-y-2">
                    {data.priority_breakdown.map(p => (
                      <div key={p.priority} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PRIORITY_COLORS[p.priority] || '#94a3b8' }}
                          />
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
          </div>

          {/* Summary table */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Summary — Last {data.period_days} Days
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {[
                    ['Total Shipments',       data.total_shipments],
                    ['Successfully Delivered', `${data.delivered} (${data.delivery_rate}%)`],
                    ['Failed Deliveries',      data.failed],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="py-3 text-slate-500 dark:text-slate-400 font-medium">{label}</td>
                      <td className="py-3 text-slate-900 dark:text-white font-semibold text-right">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {[
                    ['Total Revenue',              `$${data.total_revenue.toLocaleString()}`],
                    ['Avg. Revenue / Shipment',    `$${data.avg_revenue_per_shipment}`],
                    ['Period',                     `Last ${data.period_days} days`],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="py-3 text-slate-500 dark:text-slate-400 font-medium">{label}</td>
                      <td className="py-3 text-slate-900 dark:text-white font-semibold text-right">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-slate-500 py-16">Failed to load reports</div>
      )}
    </div>
  );
}
