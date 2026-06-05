import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ROLES = ['', 'admin', 'customer', 'agent'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const res = await api.get(`/auth/users${params}`);
      setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleUser = async (userId) => {
    try {
      const res = await api.put(`/auth/users/${userId}/toggle`);
      toast.success(res.data.message);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    customer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    agent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{users.length} users</p>
        </div>
        <select
          className="input w-40"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All Roles'}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <div className="table-container rounded-2xl">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-semibold text-sm flex-shrink-0">
                          {u.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-sm">{u.email}</td>
                    <td className="text-sm text-slate-400">{u.phone || '—'}</td>
                    <td>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${roleColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        u.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">
                      {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleUser(u.id)}
                          className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                            u.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
