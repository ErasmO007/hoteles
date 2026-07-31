import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Guests from './pages/Guests';
import Reservations from './pages/Reservations';
import Reports from './pages/Reports';
import AdminUsers from './pages/AdminUsers';
import { ToastProvider } from './contexts/ToastContext';

// Componente de protección de rutas
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRole = user.user_metadata?.role || 'receptionist';
    const roles = {
      admin: ['admin'],
      manager: ['admin', 'manager'],
      receptionist: ['admin', 'manager', 'receptionist'],
    };

    if (!roles[requiredRole]?.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="guests" element={<Guests />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="reports" element={<Reports />} />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;