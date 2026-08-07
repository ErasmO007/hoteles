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
import Payments from './pages/Payments';
import AdminUsers from './pages/AdminUsers';
import { ToastProvider } from './contexts/ToastContext';
import { hasPermission, hasRoleAccess } from './utils/roles';

// Componente de protección de rutas
const ProtectedRoute = ({ children, requiredRole, permission }) => {
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

  if (requiredRole && !hasRoleAccess(user, requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !hasPermission(user, permission)) {
    return <Navigate to="/dashboard" replace />;
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
          <Route path="dashboard" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="rooms" element={<ProtectedRoute permission="rooms"><Rooms /></ProtectedRoute>} />
          <Route path="guests" element={<ProtectedRoute permission="guests"><Guests /></ProtectedRoute>} />
          <Route path="reservations" element={<ProtectedRoute permission="reservations"><Reservations /></ProtectedRoute>} />
          <Route path="payments" element={<ProtectedRoute permission="payments"><Payments /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute permission="reports"><Reports /></ProtectedRoute>} />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute permission="manageUsers" requiredRole="admin">
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