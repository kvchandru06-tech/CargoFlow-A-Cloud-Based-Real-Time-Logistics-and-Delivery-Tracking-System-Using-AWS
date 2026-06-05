import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TrackPage from './pages/TrackPage';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminShipments from './pages/admin/AdminShipments';
import AdminShipmentDetail from './pages/admin/AdminShipmentDetail';
import AdminAgents from './pages/admin/AdminAgents';
import AdminReports from './pages/admin/AdminReports';
import AdminUsers from './pages/admin/AdminUsers';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerShipments from './pages/customer/CustomerShipments';
import CreateShipment from './pages/customer/CreateShipment';
import ShipmentDetail from './pages/customer/ShipmentDetail';
import CustomerNotifications from './pages/customer/CustomerNotifications';

import AgentDashboard from './pages/agent/AgentDashboard';
import AgentDeliveries from './pages/agent/AgentDeliveries';
import AgentDeliveryDetail from './pages/agent/AgentDeliveryDetail';

import ProfilePage from './pages/ProfilePage';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';


function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Loading CargoFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return children;
}


export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/track/:trackingNumber" element={<TrackPage />} />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout role="admin" />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="shipments" element={<AdminShipments />} />
              <Route path="shipments/:id" element={<AdminShipmentDetail />} />
              <Route path="agents" element={<AdminAgents />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Customer */}
            <Route path="/customer" element={
              <ProtectedRoute roles={['customer']}>
                <DashboardLayout role="customer" />
              </ProtectedRoute>
            }>
              <Route index element={<CustomerDashboard />} />
              <Route path="shipments" element={<CustomerShipments />} />
              <Route path="shipments/new" element={<CreateShipment />} />
              <Route path="shipments/:id" element={<ShipmentDetail />} />
              <Route path="notifications" element={<CustomerNotifications />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Agent */}
            <Route path="/agent" element={
              <ProtectedRoute roles={['agent']}>
                <DashboardLayout role="agent" />
              </ProtectedRoute>
            }>
              <Route index element={<AgentDashboard />} />
              <Route path="deliveries" element={<AgentDeliveries />} />
              <Route path="deliveries/:id" element={<AgentDeliveryDetail />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallbacks */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-red-600 mb-2">403</h1>
                  <p className="text-slate-600">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
