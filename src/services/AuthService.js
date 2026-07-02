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
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async register(email, password, userData) {
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

    if (error) throw error;
    return data;
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