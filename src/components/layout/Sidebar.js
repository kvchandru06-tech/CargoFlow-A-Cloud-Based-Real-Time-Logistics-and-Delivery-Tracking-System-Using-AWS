import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon, TruckIcon, UsersIcon,
  BellIcon, PlusCircleIcon, ClipboardDocumentListIcon,
  DocumentChartBarIcon, XMarkIcon, ArrowRightOnRectangleIcon,
  UserGroupIcon, UserCircleIcon,
} from '@heroicons/react/24/outline';

const navConfig = {
  admin: [
    { label: 'Dashboard',  to: '/admin',           icon: HomeIcon },
    { label: 'Shipments',  to: '/admin/shipments',  icon: TruckIcon },
    { label: 'Agents',     to: '/admin/agents',     icon: UserGroupIcon },
    { label: 'Users',      to: '/admin/users',      icon: UsersIcon },
    { label: 'Reports',    to: '/admin/reports',    icon: DocumentChartBarIcon },
    { label: 'Profile',    to: '/admin/profile',    icon: UserCircleIcon },
  ],
  customer: [
    { label: 'Dashboard',      to: '/customer',                  icon: HomeIcon },
    { label: 'My Shipments',   to: '/customer/shipments',        icon: TruckIcon },
    { label: 'New Shipment',   to: '/customer/shipments/new',    icon: PlusCircleIcon },
    { label: 'Notifications',  to: '/customer/notifications',    icon: BellIcon },
    { label: 'Profile',        to: '/customer/profile',          icon: UserCircleIcon },
  ],
  agent: [
    { label: 'Dashboard',   to: '/agent',              icon: HomeIcon },
    { label: 'Deliveries',  to: '/agent/deliveries',   icon: ClipboardDocumentListIcon },
    { label: 'Profile',     to: '/agent/profile',      icon: UserCircleIcon },
  ],
};

export default function Sidebar({ role, open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navConfig[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'from-brand-800 to-brand-900',
    customer: 'from-brand-700 to-brand-900',
    agent: 'from-slate-800 to-slate-900',
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 flex flex-col
        bg-gradient-to-b ${roleColors[role] || roleColors.customer}
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">CargoFlow</span>
              <p className="text-blue-200 text-xs capitalize">{role} Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-white/10">
          <NavLink to={`/${role}/profile`} onClick={onClose} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{user?.name}</p>
              <p className="text-blue-200 text-xs truncate">{user?.email}</p>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${role}`}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium text-sm"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
