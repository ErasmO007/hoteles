import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReservationRepository from '../repositories/ReservationRepository';
import GuestRepository from '../repositories/GuestRepository';
import RoomRepository from '../repositories/RoomRepository';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

const Reservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(0);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    guest_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    guests_count: 1,
    special_requests: '',
  });

  const reservationRepo = new ReservationRepository();
  const guestRepo = new GuestRepository();
  const roomRepo = new RoomRepository();

  useEffect(() => {
    if (user) {
      loadReservations();
      loadGuests();
      loadRooms();
    }
  }, [user]);

  const loadReservations = async () => {
  try {
    setLoading(true);
    // Usar el nuevo método que maneja los joins correctamente
    const data = await reservationRepo.findAllWithDetails();
    setReservations(data || []);
  } catch (error) {
    console.error('Error loading reservations:', error);
    setError('Error al cargar las reservaciones');
  } finally {
    setLoading(false);
  }
};

  const loadGuests = async () => {
    try {
      const data = await guestRepo.findAll();
      setGuests(data || []);
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await roomRepo.getAvailableRooms();
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  // Calcular el total automáticamente
  const calculateTotal = () => {
    if (!formData.room_id || !formData.check_in || !formData.check_out) {
      return 0;
    }

    const room = rooms.find(r => r.id === formData.room_id);
    if (!room) return 0;

    const checkIn = new Date(formData.check_in);
    const checkOut = new Date(formData.check_out);
    const days = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    
    return room.price * days;
  };

  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const room = rooms.find(r => r.id === roomId);
    setSelectedRoomPrice(room ? room.price : 0);
    setFormData({ ...formData, room_id: roomId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!user) {
      setError('Debes iniciar sesión para realizar esta acción');
      return;
    }

    try {
      // Validar datos
      if (!formData.guest_id) {
        setError('Selecciona un huésped');
        return;
      }
      if (!formData.room_id) {
        setError('Selecciona una habitación');
        return;
      }
      if (!formData.check_in || !formData.check_out) {
        setError('Selecciona las fechas de check-in y check-out');
        return;
      }

      const checkIn = new Date(formData.check_in);
      const checkOut = new Date(formData.check_out);
      
      if (checkOut <= checkIn) {
        setError('La fecha de check-out debe ser mayor a la de check-in');
        return;
      }

      // Calcular días y total
      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const room = rooms.find(r => r.id === formData.room_id);
      
      if (!room) {
        setError('Habitación no encontrada');
        return;
      }

      const totalAmount = room.price * days;

      // Verificar disponibilidad
      const isAvailable = await reservationRepo.checkRoomAvailability(
        formData.room_id,
        formData.check_in,
        formData.check_out
      );

      if (!isAvailable) {
        setError('La habitación no está disponible en las fechas seleccionadas');
        return;
      }

      // Preparar datos con total_amount
      const reservationData = {
        guest_id: formData.guest_id,
        room_id: formData.room_id,
        check_in: formData.check_in,
        check_out: formData.check_out,
        total_amount: totalAmount,
        guests_count: parseInt(formData.guests_count) || 1,
        special_requests: formData.special_requests || '',
        status: 'active',
      };

      console.log('Guardando reservación:', reservationData);

      if (editingReservation) {
        await reservationRepo.update(editingReservation.id, reservationData);
      } else {
        await reservationRepo.create(reservationData);
      }

      await loadReservations();
      setIsModalOpen(false);
      resetForm();
      
    } catch (error) {
      console.error('Error saving reservation:', error);
      setError(error.message || 'Error al guardar la reservación');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Estás seguro de cancelar esta reservación?')) return;
    
    try {
      await reservationRepo.updateStatus(id, 'cancelled');
      await loadReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      setError('Error al cancelar la reservación');
    }
  };

  const resetForm = () => {
    setEditingReservation(null);
    setSelectedRoomPrice(0);
    setFormData({
      guest_id: '',
      room_id: '',
      check_in: '',
      check_out: '',
      guests_count: 1,
      special_requests: '',
    });
    setError('');
  };

  const handleCreate = () => {
    setEditingReservation(null);
    resetForm();
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No Show',
      pending: 'Pendiente',
    };
    return labels[status] || status;
  };

  const totalAmount = calculateTotal();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Reservaciones</h1>
        <Button onClick={handleCreate}>
          + Nueva Reservación
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <Card className="border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Huésped
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Habitación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.guests?.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.guests?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Hab. {reservation.rooms?.number || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.rooms?.type || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(reservation.check_in).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(reservation.check_out).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusLabel(reservation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${reservation.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {reservation.status === 'active' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancel(reservation.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No hay reservaciones activas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal para nueva reservación */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Nueva Reservación"
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
            <Button type="submit" form="reservation-form">
              Crear Reservación
            </Button>
          </div>
        }
      >
        <form id="reservation-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Huésped</label>
            <select
              value={formData.guest_id}
              onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar huésped</option>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.full_name} - {guest.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Habitación</label>
            <select
              value={formData.room_id}
              onChange={handleRoomChange}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar habitación</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Hab. {room.number} - {room.type} (${room.price}/noche)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Check-in"
              type="date"
              value={formData.check_in}
              onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
            />
            <Input
              label="Fecha Check-out"
              type="date"
              value={formData.check_out}
              onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
              required
              min={formData.check_in || new Date().toISOString().split('T')[0]}
            />
          </div>

          <Input
            label="Número de Huéspedes"
            type="number"
            value={formData.guests_count}
            onChange={(e) => setFormData({ ...formData, guests_count: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />

          {totalAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Total a pagar:</span>
                <span className="text-xl font-bold text-blue-700">${totalAmount}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                * Calculado automáticamente según el precio de la habitación y los días de estadía
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Peticiones Especiales</label>
            <textarea
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              rows="3"
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Alguna petición especial..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reservations;