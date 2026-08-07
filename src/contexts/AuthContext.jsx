import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/AuthService';
import { hasRoleAccess } from '../utils/roles';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authService = AuthService.getInstance();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setError(err.message || 'No se pudo verificar la sesión');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    try {
      const { data: { subscription } } = authService.supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session) {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('Auth subscription error:', err);
      return undefined;
    }
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authService.login(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email, password, userData) => {
    try {
      setError(null);
      const data = await authService.register(email, password, userData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    hasRole: async (role) => {
      if (!user) return false;
      return hasRoleAccess(user, role);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;