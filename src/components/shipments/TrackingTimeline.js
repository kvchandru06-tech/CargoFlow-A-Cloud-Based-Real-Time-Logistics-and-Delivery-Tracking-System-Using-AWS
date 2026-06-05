import React from 'react';
import { format } from 'date-fns';
import {
  CheckCircleIcon, ClockIcon, TruckIcon,
  MapPinIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/solid';

const STATUS_ICONS = {
  pending:           ClockIcon,
  confirmed:         CheckCircleIcon,
  picked_up:         TruckIcon,
  in_transit:        TruckIcon,
  out_for_delivery:  MapPinIcon,
  delivered:         CheckCircleIcon,
  failed:            ExclamationCircleIcon,
  cancelled:         ExclamationCircleIcon,
};

const STATUS_COLORS = {
  pending:           'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  confirmed:         'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  picked_up:         'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  in_transit:        'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  out_for_delivery:  'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  delivered:         'text-green-500 bg-green-50 dark:bg-green-900/20',
  failed:            'text-red-500 bg-red-50 dark:bg-red-900/20',
  cancelled:         'text-slate-400 bg-slate-50 dark:bg-slate-700',
};

export default function TrackingTimeline({ history = [] }) {
  if (!history.length) {
    return (
      <div className="text-center py-8 text-slate-400">
        No tracking history available.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {[...history].reverse().map((entry, idx) => {
        const Icon = STATUS_ICONS[entry.status] || ClockIcon;
        const colorClass = STATUS_COLORS[entry.status] || STATUS_COLORS.pending;
        const isFirst = idx === 0;

        return (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {idx < history.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
            )}

            {/* Icon */}
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass} ${isFirst ? 'ring-2 ring-offset-2 ring-current' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-semibold text-sm capitalize ${isFirst ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {entry.status.replace(/_/g, ' ')}
                  </p>
                  {entry.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{entry.description}</p>
                  )}
                  {entry.location && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" />
                      {entry.location}
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                  {entry.timestamp
                    ? format(new Date(entry.timestamp), 'MMM d, h:mm a')
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
