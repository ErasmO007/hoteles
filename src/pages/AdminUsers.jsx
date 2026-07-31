import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import supabase from '../lib/supabase';

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // ============================================
  // ESTADO INICIAL DEL FORMULARIO CON PASSWORD
  // ============================================
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'receptionist',
    phone: '',
  });

  // Verificar rol admin
  useEffect(() => {
    const userRole = user?.user_metadata?.role;
    if (user && userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user?.user_metadata?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  // ============================================
  // CARGAR USUARIOS
  // ============================================
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: profiles, error: profilesError } = await supabase
        .from('usuarios_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Intentar obtener emails desde auth.users (solo si es posible)
      const usersWithEmail = await Promise.all(
        (profiles || []).map(async (profile) => {
          let email = profile.email || 'Email no disponible';
          
          // Intentar obtener email desde auth (solo si tenemos la función RPC)
          try {
            const { data, error } = await supabase.rpc('get_user_email', {
              user_id: profile.id
            });
            if (!error && data) email = data;
          } catch (e) {
            // Si falla, usar el email guardado en el perfil
          }
          
          return { ...profile, email };
        })
      );

      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar los usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CREAR USUARIO - VÍA EDGE FUNCTION
  // ============================================
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingAction(true);

    try {
      // Validar datos
      if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
        throw new Error('Email, contraseña y nombre son obligatorios');
      }

      if (newUserData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Obtener la URL de la Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/create-user`;

      console.log('🔄 Llamando a Edge Function...');
      console.log('📧 Email:', newUserData.email);
      console.log('👤 Nombre:', newUserData.full_name);
      console.log('🔑 Rol:', newUserData.role);

      // Llamar a la Edge Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: newUserData.email,
          password: newUserData.password,
          full_name: newUserData.full_name,
          role: newUserData.role,
          phone: newUserData.phone || '',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el usuario');
      }

      setSuccess(`✅ Usuario ${newUserData.email} creado exitosamente`);
      setShowCreateModal(false);
      resetNewUserForm();
      loadUsers();

    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message || 'Error al crear el usuario');
    } finally {
      setLoadingAction(false);
    }
  };

  // ============================================
  // ACTUALIZAR ROL
  // ============================================
  const handleUpdateRole = async () => {
    if (!editingUser) return;
    
    setError('');
    setSuccess('');
    setLoadingAction(true);

    try {
      const { error } = await supabase
        .from('usuarios_profiles')
        .update({ 
          role: editingUser.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setSuccess(`✅ Rol actualizado para ${editingUser.full_name}`);
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();

    } catch (error) {
      console.error('Error updating role:', error);
      setError(error.message || 'Error al actualizar el rol');
    } finally {
      setLoadingAction(false);
    }
  };

  // ============================================
  // ELIMINAR USUARIO
  // ============================================
  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${userEmail}?`)) return;
    if (!window.confirm('⚠️ Esta acción no se puede deshacer. ¿Continuar?')) return;

    setError('');
    setSuccess('');
    setLoadingAction(true);

    try {
      const { error: profileError } = await supabase
        .from('usuarios_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      setSuccess(`✅ Usuario ${userEmail} eliminado del sistema`);
      loadUsers();

    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Error al eliminar el usuario');
    } finally {
      setLoadingAction(false);
    }
  };

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================
  const resetNewUserForm = () => {
    setNewUserData({
      email: '',
      password: '',
      full_name: '',
      role: 'receptionist',
      phone: '',
    });
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente',
      receptionist: 'Recepcionista',
      cleaning_staff: 'Limpieza',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      receptionist: 'bg-green-100 text-green-800',
      cleaning_staff: 'bg-yellow-100 text-yellow-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // ============================================
  // RENDER - Verificar acceso
  // ============================================
  const userRole = user?.user_metadata?.role;
  
  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-500 mt-2">Solo administradores pueden acceder</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER - Panel de Administración
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 Administración de Usuarios</h1>
          <p className="text-gray-500">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Nuevo Usuario
        </Button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          ✅ {success}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <Card className="border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {userItem.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {userItem.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {userItem.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {userItem.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}>
                        {getRoleLabel(userItem.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { 
                            setEditingUser({ ...userItem }); 
                            setShowEditModal(true); 
                          }}
                          disabled={userItem.id === user?.id}
                        >
                          Editar Rol
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                          disabled={userItem.id === user?.id}
                        >
                          Eliminar
                        </Button>
                      </div>
                      {userItem.id === user?.id && (
                        <span className="text-xs text-gray-400 ml-2">(Tú)</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ============================================ */}
      {/* MODAL CREAR USUARIO - CON CONTRASEÑA */}
      {/* ============================================ */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { 
          setShowCreateModal(false); 
          resetNewUserForm(); 
          setError(''); 
          setSuccess(''); 
        }}
        title="👤 Crear Nuevo Usuario"
        size="lg"
        actions={
          <div className="flex space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => { 
                setShowCreateModal(false); 
                resetNewUserForm(); 
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="create-user-form" 
              isLoading={loadingAction}
            >
              Crear Usuario
            </Button>
          </div>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              value={newUserData.full_name}
              onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
              placeholder="Juan Pérez"
              required
            />
            <Input
              label="Email"
              type="email"
              value={newUserData.email}
              onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* ============================================ */}
            {/* CAMPO CONTRASEÑA AGREGADO AQUÍ */}
            {/* ============================================ */}
            <Input
              label="Contraseña"
              type="password"
              value={newUserData.password}
              onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
            />
            <Input
              label="Teléfono"
              value={newUserData.phone}
              onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
              placeholder="+52 449 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              value={newUserData.role}
              onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="admin">Administrador</option>
              <option value="manager">Gerente</option>
              <option value="receptionist">Recepcionista</option>
              <option value="cleaning_staff">Personal de Limpieza</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              ℹ️ El usuario recibirá un correo de confirmación. 
              Deberá confirmar su cuenta antes de poder iniciar sesión.
            </p>
          </div>
        </form>
      </Modal>

      {/* ============================================ */}
      {/* MODAL EDITAR ROL */}
      {/* ============================================ */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { 
          setShowEditModal(false); 
          setEditingUser(null); 
          setError(''); 
          setSuccess(''); 
        }}
        title="✏️ Editar Rol de Usuario"
        actions={
          <div className="flex space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => { 
                setShowEditModal(false); 
                setEditingUser(null); 
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="edit-role-form" 
              isLoading={loadingAction}
            >
              Actualizar Rol
            </Button>
          </div>
        }
      >
        <form id="edit-role-form" onSubmit={handleUpdateRole} className="space-y-4">
          {editingUser && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Usuario:</span> {editingUser.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {editingUser.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Rol actual:</span>{' '}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(editingUser.role)}`}>
                    {getRoleLabel(editingUser.role)}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nuevo Rol</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="admin">Administrador</option>
                  <option value="manager">Gerente</option>
                  <option value="receptionist">Recepcionista</option>
                  <option value="cleaning_staff">Personal de Limpieza</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  ⚠️ Cambiar el rol afectará los permisos del usuario en el sistema.
                </p>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsers;