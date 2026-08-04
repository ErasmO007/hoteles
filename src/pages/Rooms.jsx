import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoomRepository from '../repositories/RoomRepository';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { formatCurrency, getStatusLabel, filterRooms } from '../utils/hotelUtils';
import { useToast } from '../contexts/ToastContext';

const Rooms = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    type: 'single',
    price: '',
    capacity: 1,
    status: 'available',
    description: '',
    floor: 1,
  });

  const roomRepo = new RoomRepository();

  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await roomRepo.findAll();
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setError('Error al cargar las habitaciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Verificar que el usuario está autenticado
    if (!user) {
      setError('Debes iniciar sesión para realizar esta acción');
      return;
    }

    try {
      // Validar datos
      if (!formData.number.trim()) {
        setError('El número de habitación es requerido');
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError('El precio debe ser mayor a 0');
        return;
      }
      if (!formData.capacity || parseInt(formData.capacity) <= 0) {
        setError('La capacidad debe ser mayor a 0');
        return;
      }

      // Preparar datos - asegurar que todos los campos estén definidos
      const roomData = {
        number: formData.number.trim(),
        type: formData.type,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        status: formData.status || 'available',
        description: formData.description || '',
        floor: parseInt(formData.floor) || 1,
        is_active: true,
      };

      console.log('Guardando habitación:', roomData);
      console.log('Usuario autenticado:', user.email);

      let result;
      if (editingRoom) {
        result = await roomRepo.update(editingRoom.id, roomData);
        console.log('Habitación actualizada:', result);
      } else {
        result = await roomRepo.create(roomData);
        console.log('Habitación creada:', result);
      }

      await loadRooms();
      setIsModalOpen(false);
      resetForm();
      addToast(editingRoom ? 'Habitación actualizada correctamente' : 'Habitación creada correctamente', 'success');
      
    } catch (error) {
      console.error('Error saving room:', error);
      setError(error.message || 'Error al guardar la habitación');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta habitación?')) return;
    
    try {
      await roomRepo.delete(id);
      await loadRooms();
      addToast('Habitación eliminada correctamente', 'info');
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Error al eliminar la habitación: ' + error.message);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      number: room.number || '',
      type: room.type || 'single',
      price: room.price?.toString() || '',
      capacity: room.capacity || 1,
      status: room.status || 'available',
      description: room.description || '',
      floor: room.floor || 1,
    });
    setIsModalOpen(true);
    setError('');
  };

  const handleCreate = () => {
    setEditingRoom(null);
    resetForm();
    setIsModalOpen(true);
    setError('');
  };

  const resetForm = () => {
    setEditingRoom(null);
    setFormData({
      number: '',
      type: 'single',
      price: '',
      capacity: 1,
      status: 'available',
      description: '',
      floor: 1,
    });
    setError('');
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await roomRepo.updateRoomStatus(roomId, newStatus);
      await loadRooms();
      addToast(`Estado actualizado a ${getStatusLabel(newStatus)}`, 'success');
    } catch (error) {
      console.error('Error updating room status:', error);
      setError('No se pudo actualizar el estado de la habitación');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      cleaned: 'bg-blue-100 text-blue-800',
      reserved: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredRooms = filterRooms(rooms, { searchTerm, statusFilter, typeFilter });
  const occupancySummary = {
    available: rooms.filter((room) => room.status === 'available').length,
    occupied: rooms.filter((room) => room.status === 'occupied').length,
    maintenance: rooms.filter((room) => room.status === 'maintenance').length,
    cleaned: rooms.filter((room) => room.status === 'cleaned').length,
  };

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;

  // Si no hay usuario autenticado, mostrar mensaje
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Inicia sesión para gestionar habitaciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Habitaciones</h1>
          <p className="text-gray-500">Control rápido de disponibilidad y estado de cada habitación</p>
        </div>
        <Button onClick={handleCreate}>
          + Nueva Habitación
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm text-green-700">Disponibles</p>
          <p className="text-2xl font-semibold text-green-800">{occupancySummary.available}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Ocupadas</p>
          <p className="text-2xl font-semibold text-blue-800">{occupancySummary.occupied}</p>
        </div>
        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">En mantenimiento</p>
          <p className="text-2xl font-semibold text-yellow-800">{occupancySummary.maintenance}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">Limpias</p>
          <p className="text-2xl font-semibold text-gray-800">{occupancySummary.cleaned}</p>
        </div>
      </div>

      <Card className="border border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número, tipo o estado"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="available">Disponible</option>
              <option value="occupied">Ocupada</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="cleaned">Limpia</option>
              <option value="reserved">Reservada</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="single">Individual</option>
              <option value="double">Doble</option>
              <option value="suite">Suite</option>
              <option value="family">Familiar</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'available', 'occupied', 'maintenance', 'cleaned'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${statusFilter === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {value === 'all' ? 'Todos' : value === 'available' ? 'Disponibles' : value === 'occupied' ? 'Ocupadas' : value === 'maintenance' ? 'Mantenimiento' : 'Limpias'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} loading={true} />
          ))
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <Card
              key={room.id}
              title={`Habitación ${room.number}`}
              className="border border-gray-100 hover:shadow-md transition-all"
              actions={
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(room.id)}>
                    Eliminar
                  </Button>
                </div>
              }
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tipo:</span> {room.type}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className="text-xs font-semibold text-blue-600"
                  >
                    Ver detalle
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Capacidad:</span> {room.capacity} personas
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Precio:</span> {formatCurrency(room.price)}
                </p>
                {room.floor && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Piso:</span> {room.floor}
                  </p>
                )}
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                    {getStatusLabel(room.status)}
                  </span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No hay habitaciones que coincidan con los filtros</p>
            <button 
              onClick={handleCreate}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Crear la primera habitación
            </button>
          </div>
        )}
      </div>

      {selectedRoom && (
        <div className="rounded-2xl border border-gray-200 bg-[#fdf8f4] p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Detalle de {selectedRoom.number}</h3>
              <p className="text-sm text-gray-600">Estado actual: {getStatusLabel(selectedRoom.status)}</p>
            </div>
            <button type="button" onClick={() => setSelectedRoomId(null)} className="text-sm text-gray-500">Cerrar</button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs uppercase text-gray-400">Tipo</p>
              <p className="font-semibold text-gray-700">{selectedRoom.type}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs uppercase text-gray-400">Precio</p>
              <p className="font-semibold text-gray-700">{formatCurrency(selectedRoom.price)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs uppercase text-gray-400">Capacidad</p>
              <p className="font-semibold text-gray-700">{selectedRoom.capacity} personas</p>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingRoom ? 'Editar Habitación' : 'Nueva Habitación'}
        actions={
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="room-form">
              {editingRoom ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <Input
            label="Número de Habitación"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            placeholder="Ej: 101"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="single">Individual</option>
                <option value="double">Doble</option>
                <option value="suite">Suite</option>
                <option value="family">Familiar</option>
              </select>
            </div>
            <Input
              label="Precio (MXN)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacidad"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              min="1"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="available">Disponible</option>
                <option value="occupied">Ocupada</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="cleaned">Limpia</option>
                <option value="reserved">Reservada</option>
              </select>
            </div>
          </div>

          <Input
            label="Piso"
            type="number"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
            min="1"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Descripción de la habitación..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rooms;