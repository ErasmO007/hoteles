import supabase from '../lib/supabase';

class AuthService {
  // Singleton para AuthService
  static instance = null;

  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }
    AuthService.instance = this;
    this.supabase = supabase;
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const message = error.message || 'Error al iniciar sesión';
        if (message.includes('Bad Request') || message.includes('Invalid login')) {
          throw new Error('Credenciales inválidas o la autenticación no está configurada correctamente en Supabase.');
        }
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error('AuthService.login error:', error);
      throw error;
    }
  }

  async register(email, password, userData) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role || 'receptionist',
          },
        },
      });

      if (error) {
        const message = error.message || 'Error al registrar el usuario';
        if (message.includes('Internal Server Error') || message.includes('retry')) {
          throw new Error('No se pudo crear la cuenta. Revisa la configuración de Auth en Supabase o desactiva la confirmación por correo.');
        }
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error('AuthService.register error:', error);
      throw error;
    }
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  async resetPassword(email) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  }

  async updatePassword(newPassword) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  }

  async updateProfile(userData) {
    const { data, error } = await this.supabase.auth.updateUser({
      data: userData,
    });
    if (error) throw error;
    return data;
  }

  // Verificación de roles
  async hasRole(requiredRole) {
    const user = await this.getCurrentUser();
    if (!user) return false;
    
    const userRole = user.user_metadata?.role || 'receptionist';
    const roles = {
      admin: ['admin'],
      manager: ['admin', 'manager'],
      receptionist: ['admin', 'manager', 'receptionist'],
    };
    
    return roles[requiredRole]?.includes(userRole) || false;
  }
}

export default AuthService;