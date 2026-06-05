import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/agents')
      .then(res => setAgents(res.data.agents))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const vehicleIcon = { bike: '🏍️', van: '🚐', truck: '🚛' };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Delivery Agents</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{agents.length} registered agents</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-lg">
                    {agent.user?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{agent.user?.name}</p>
                    <p className="text-xs text-slate-400">{agent.user?.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  agent.is_available
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {agent.is_available ? 'Available' : 'Busy'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Vehicle</p>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">
                    {vehicleIcon[agent.vehicle_type]} {agent.vehicle_type}
                  </p>
                  <p className="text-xs text-slate-400">{agent.vehicle_number}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Deliveries</p>
                  <p className="font-bold text-2xl text-slate-900 dark:text-white">{agent.total_deliveries}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{agent.rating}</span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                {agent.current_location && (
                  <p className="text-xs text-slate-400">📍 {agent.current_location}</p>
                )}
              </div>

              {agent.user?.phone && (
                <p className="text-xs text-slate-400 mt-2">📞 {agent.user.phone}</p>
              )}
            </div>
          ))}

          {agents.length === 0 && (
            <div className="col-span-3 card p-12 text-center">
              <UserGroupIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No agents registered yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
