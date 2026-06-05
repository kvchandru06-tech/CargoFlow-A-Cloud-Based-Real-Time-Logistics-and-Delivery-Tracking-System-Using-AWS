import React from 'react';

const STATUS_CONFIG = {
  pending:           { label: 'Pending',           color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed:         { label: 'Confirmed',         color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  picked_up:         { label: 'Picked Up',         color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  in_transit:        { label: 'In Transit',        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  out_for_delivery:  { label: 'Out for Delivery',  color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  delivered:         { label: 'Delivered',         color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  failed:            { label: 'Failed',            color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  cancelled:         { label: 'Cancelled',         color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  );
}
