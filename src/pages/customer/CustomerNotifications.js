import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BellIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  info:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  error:   'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
};

const TYPE_DOT = {
  success: 'bg-green-500',
  info:    'bg-blue-500',
  warning: 'bg-yellow-500',
  error:   'bg-red-500',
};

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = unreadOnly ? '?unread_only=true' : '';
      const res = await api.get(`/notifications${params}`);
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={e => setUnreadOnly(e.target.checked)}
              className="rounded"
            />
            Unread only
          </label>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm py-1.5">
              <CheckIcon className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <BellIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`card p-4 border transition-all ${TYPE_COLORS[n.type] || TYPE_COLORS.info} ${
                !n.is_read ? 'shadow-sm' : 'opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Type dot */}
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                  TYPE_DOT[n.type] || 'bg-blue-500'
                } ${n.is_read ? 'opacity-30' : ''}`} />

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${
                      n.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {n.title}
                    </p>
                    <p
                      className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0"
                      title={n.created_at ? format(new Date(n.created_at), 'PPpp') : ''}
                    >
                      {n.created_at
                        ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                        : '—'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  {n.shipment_id && (
                    <Link
                      to={`/customer/shipments/${n.shipment_id}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-700 dark:text-brand-400 hover:underline mt-2 font-medium"
                    >
                      View shipment <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Mark read button */}
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="p-1 rounded-lg text-brand-700 dark:text-brand-400 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors flex-shrink-0"
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
