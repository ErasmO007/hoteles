import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import RoomRepository from '../repositories/RoomRepository';
import ReservationRepository from '../repositories/ReservationRepository';
import GuestRepository from '../repositories/GuestRepository';
import PaymentRepository from '../repositories/PaymentRepository';
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    activeReservations: 0,
    totalGuests: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentGuests, setRecentGuests] = useState([]);
  
  // Estados para los modales
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para los formularios
  const [checkInData, setCheckInData] = useState({
    guest_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    guests_count: 1,
  });
  
  const [checkOutData, setCheckOutData] = useState({
    reservation_id: '',
    payment_method: 'cash',
    payment_amount: 0,
  });
  
  const [newRoomData, setNewRoomData] = useState({
    number: '',
    type: 'single',
    price: '',
    capacity: 1,
    status: 'available',
    floor: 1,
  });

  // Listas para los selects
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeReservationsList, setActiveReservationsList] = useState([]);

  const roomRepo = new RoomRepository();
  const reservationRepo = new ReservationRepository();
  const guestRepo = new GuestRepository();
  const paymentRepo = new PaymentRepository();

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadSelectData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [roomStats, activeReservations, recentGuests, revenueData] = await Promise.all([
        roomRepo.getOccupancyStats(),
        reservationRepo.findActiveReservations(),
        guestRepo.findRecentGuests(5),
        getRevenueData(),
      ]);

      setStats({
        totalRooms: roomStats?.total || 0,
        availableRooms: roomStats?.available || 0,
        occupiedRooms: roomStats?.occupied || 0,
        occupancyRate: roomStats?.occupancyRate || 0,
        activeReservations: activeReservations?.length || 0,
        totalGuests: recentGuests?.length || 0,
        revenue: revenueData?.total || 0,
      });
      setRecentGuests(recentGuests || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const [guestsData, roomsData, reservationsData] = await Promise.all([
        guestRepo.findAll(),
        roomRepo.getAvailableRooms(),
        reservationRepo.findActiveReservations(),
      ]);
      setGuests(guestsData || []);
      setRooms(roomsData || []);
      setActiveReservationsList(reservationsData || []);
    } catch (error) {
      console.error('Error loading select data:', error);
    }
  };

  const getRevenueData = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date();
      
      const data = await paymentRepo.getRevenueByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      return data;
    } catch (error) {
      console.error('Error getting revenue:', error);
      return { total: 0 };
    }
  };

  // ============================================
  // FUNCIONALIDAD CHECK-IN
  // ============================================
  const handleCheckIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingAction(true);

    try {
      // Validar datos
      if (!checkInData.guest_id || !checkInData.room_id || !checkInData.check_in || !checkInData.check_out) {
        throw new Error('Todos los campos son obligatorios');
      }

      const checkIn = new Date(checkInData.check_in);
      const checkOut = new Date(checkInData.check_out);
      
      if (checkOut <= checkIn) {
        throw new Error('La fecha de check-out debe ser mayor a check-in');
      }

      // Obtener el precio de la habitación
      const room = rooms.find(r => r.id === checkInData.room_id);
      if (!room) throw new Error('Habitación no encontrada');

      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalAmount = room.price * days;

      // Verificar disponibilidad
      const isAvailable = await reservationRepo.checkRoomAvailability(
        checkInData.room_id,
        checkInData.check_in,
        checkInData.check_out
      );

      if (!isAvailable) {
        throw new Error('La habitación no está disponible en las fechas seleccionadas');
      }

      // Crear la reservación (check-in)
      const reservationData = {
        guest_id: checkInData.guest_id,
        room_id: checkInData.room_id,
        check_in: checkInData.check_in,
        check_out: checkInData.check_out,
        total_amount: totalAmount,
        guests_count: parseInt(checkInData.guests_count) || 1,
        status: 'active',
        special_requests: 'Check-in realizado desde el dashboard',
      };

      await reservationRepo.create(reservationData);

      // Actualizar estado de la habitación a ocupada
      await roomRepo.updateRoomStatus(checkInData.room_id, 'occupied');

      setSuccess('✅ Check-in realizado exitosamente');
      setShowCheckInModal(false);
      resetCheckInForm();
      loadDashboardData();
      loadSelectData();

    } catch (error) {
      console.error('Error en check-in:', error);
      setError(error.message || 'Error al realizar el check-in');
    } finally {
      setLoadingAction(false);
    }
  };

  // ============================================
  // FUNCIONALIDAD CHECK-OUT
  // ============================================
  const handleCheckOut = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingAction(true);

    try {
      if (!checkOutData.reservation_id) {
        throw new Error('Selecciona una reservación');
      }

      // Obtener la reservación
      const reservation = await reservationRepo.findById(checkOutData.reservation_id);
      if (!reservation) throw new Error('Reservación no encontrada');

      // Verificar que tenga un monto de pago
      if (!checkOutData.payment_amount || checkOutData.payment_amount <= 0) {
        throw new Error('El monto del pago debe ser mayor a 0');
      }

      // Registrar el pago
      const paymentData = {
        reservation_id: checkOutData.reservation_id,
        amount: parseFloat(checkOutData.payment_amount),
        payment_method: checkOutData.payment_method,
        status: 'completed',
        reference: 'CHECKOUT-' + Date.now(),
        notes: 'Pago realizado en checkout desde el dashboard',
        payment_date: new Date().toISOString(),
      };

      await paymentRepo.create(paymentData);

      // Actualizar estado de la reservación a completada
      await reservationRepo.updateStatus(checkOutData.reservation_id, 'completed');

      // Actualizar estado de la habitación a disponible
      const room = await roomRepo.findById(reservation.room_id);
      if (room) {
        await roomRepo.updateRoomStatus(reservation.room_id, 'available');
      }

      setSuccess('✅ Check-out realizado exitosamente');
      setShowCheckOutModal(false);
      resetCheckOutForm();
      loadDashboardData();
      loadSelectData();

    } catch (error) {
      console.error('Error en check-out:', error);
      setError(error.message || 'Error al realizar el check-out');
    } finally {
      setLoadingAction(false);
    }
  };

  // ============================================
  // FUNCIONALIDAD NUEVA HABITACIÓN
  // ============================================
  const handleNewRoom = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingAction(true);

    try {
      // Validar datos
      if (!newRoomData.number.trim()) {
        throw new Error('El número de habitación es requerido');
      }
      if (!newRoomData.price || parseFloat(newRoomData.price) <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      const roomData = {
        number: newRoomData.number.trim(),
        type: newRoomData.type,
        price: parseFloat(newRoomData.price),
        capacity: parseInt(newRoomData.capacity) || 1,
        status: newRoomData.status || 'available',
        floor: parseInt(newRoomData.floor) || 1,
        is_active: true,
      };

      await roomRepo.create(roomData);

      setSuccess('✅ Habitación creada exitosamente');
      setShowNewRoomModal(false);
      resetNewRoomForm();
      loadDashboardData();
      loadSelectData();

    } catch (error) {
      console.error('Error al crear habitación:', error);
      setError(error.message || 'Error al crear la habitación');
    } finally {
      setLoadingAction(false);
    }
  };

  // ============================================
  // FUNCIONES DE RESET
  // ============================================
  const resetCheckInForm = () => {
    setCheckInData({
      guest_id: '',
      room_id: '',
      check_in: '',
      check_out: '',
      guests_count: 1,
    });
  };

  const resetCheckOutForm = () => {
    setCheckOutData({
      reservation_id: '',
      payment_method: 'cash',
      payment_amount: 0,
    });
  };

  const resetNewRoomForm = () => {
    setNewRoomData({
      number: '',
      type: 'single',
      price: '',
      capacity: 1,
      status: 'available',
      floor: 1,
    });
  };

  // ============================================
  // FUNCIONES DE NAVEGACIÓN
  // ============================================
  const goToRooms = () => navigate('/rooms');
  const goToReports = () => navigate('/reports');

  const statCards = [
    {
      title: 'Ocupación',
      value: `${Math.round(stats.occupancyRate)}%`,
      subtitle: `${stats.occupiedRooms}/${stats.totalRooms} habitaciones`,
      icon: HomeIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Reservaciones Activas',
      value: stats.activeReservations,
      subtitle: 'hoy',
      icon: CalendarIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Huéspedes',
      value: stats.totalGuests,
      subtitle: 'registrados',
      icon: UserGroupIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Ingresos',
      value: `$${stats.revenue.toLocaleString()}`,
      subtitle: 'este mes',
      icon: CurrencyDollarIcon,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Bienvenido, {user?.user_metadata?.full_name || 'Usuario'}</p>
        </div>
        <button 
          onClick={() => setShowCheckInModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40"
        >
          Nueva Reservación
        </button>
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className={`bg-gradient-to-r ${stat.color} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos y listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ocupación de Habitaciones" className="border border-gray-100">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Disponibles</span>
              <span className="text-sm font-medium text-green-600">{stats.availableRooms}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.availableRooms / stats.totalRooms) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ocupadas</span>
              <span className="text-sm font-medium text-blue-600">{stats.occupiedRooms}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.occupiedRooms / stats.totalRooms) * 100}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card title="Huéspedes Recientes" className="border border-gray-100">
          <div className="space-y-3">
            {recentGuests.length > 0 ? (
              recentGuests.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                      {guest.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{guest.full_name}</p>
                      <p className="text-sm text-gray-500">{guest.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {guest.created_at ? new Date(guest.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No hay huéspedes recientes</p>
            )}
          </div>
        </Card>
      </div>

      {/* ============================================ */}
      {/* ACCIONES RÁPIDAS CON FUNCIONALIDAD */}
      {/* ============================================ */}
      <Card title="Acciones Rápidas" className="border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* BOTÓN CHECK-IN */}
          <button
            onClick={() => setShowCheckInModal(true)}
            className="p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl text-center transition-all hover:shadow-md"
          >
            <div className="text-3xl mb-1">🏨</div>
            <div className="text-sm font-medium text-green-700">Check-in</div>
          </button>

          {/* BOTÓN CHECK-OUT */}
          <button
            onClick={() => setShowCheckOutModal(true)}
            className="p-4 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl text-center transition-all hover:shadow-md"
          >
            <div className="text-3xl mb-1">🚪</div>
            <div className="text-sm font-medium text-red-700">Check-out</div>
          </button>

          {/* BOTÓN NUEVA HABITACIÓN */}
          <button
            onClick={() => setShowNewRoomModal(true)}
            className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl text-center transition-all hover:shadow-md"
          >
            <div className="text-3xl mb-1">🛏️</div>
            <div className="text-sm font-medium text-blue-700">Nueva Habitación</div>
          </button>

          {/* BOTÓN REPORTES */}
          <button
            onClick={goToReports}
            className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl text-center transition-all hover:shadow-md"
          >
            <div className="text-3xl mb-1">📊</div>
            <div className="text-sm font-medium text-purple-700">Reportes</div>
          </button>
        </div>
      </Card>

      {/* ============================================ */}
      {/* MODAL CHECK-IN */}
      {/* ============================================ */}
      <Modal
        isOpen={showCheckInModal}
        onClose={() => { setShowCheckInModal(false); resetCheckInForm(); setError(''); setSuccess(''); }}
        title="🏨 Realizar Check-in"
        actions={
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => { setShowCheckInModal(false); resetCheckInForm(); }}>
              Cancelar
            </Button>
            <Button type="submit" form="checkin-form" isLoading={loadingAction}>
              Realizar Check-in
            </Button>
          </div>
        }
      >
        <form id="checkin-form" onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Huésped</label>
            <select
              value={checkInData.guest_id}
              onChange={(e) => setCheckInData({ ...checkInData, guest_id: e.target.value })}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar huésped</option>
              {guests.map(guest => (
                <option key={guest.id} value={guest.id}>
                  {guest.full_name} - {guest.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Habitación</label>
            <select
              value={checkInData.room_id}
              onChange={(e) => setCheckInData({ ...checkInData, room_id: e.target.value })}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar habitación</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  Hab. {room.number} - {room.type} (${room.price}/noche)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Check-in"
              type="date"
              value={checkInData.check_in}
              onChange={(e) => setCheckInData({ ...checkInData, check_in: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
            />
            <Input
              label="Check-out"
              type="date"
              value={checkInData.check_out}
              onChange={(e) => setCheckInData({ ...checkInData, check_out: e.target.value })}
              required
              min={checkInData.check_in || new Date().toISOString().split('T')[0]}
            />
          </div>

          <Input
            label="Número de Huéspedes"
            type="number"
            value={checkInData.guests_count}
            onChange={(e) => setCheckInData({ ...checkInData, guests_count: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />
        </form>
      </Modal>

      {/* ============================================ */}
      {/* MODAL CHECK-OUT */}
      {/* ============================================ */}
      <Modal
        isOpen={showCheckOutModal}
        onClose={() => { setShowCheckOutModal(false); resetCheckOutForm(); setError(''); setSuccess(''); }}
        title="🚪 Realizar Check-out"
        actions={
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => { setShowCheckOutModal(false); resetCheckOutForm(); }}>
              Cancelar
            </Button>
            <Button type="submit" form="checkout-form" isLoading={loadingAction}>
              Realizar Check-out
            </Button>
          </div>
        }
      >
        <form id="checkout-form" onSubmit={handleCheckOut} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reservación Activa</label>
            <select
              value={checkOutData.reservation_id}
              onChange={(e) => {
                const selected = activeReservationsList.find(r => r.id === e.target.value);
                setCheckOutData({ 
                  ...checkOutData, 
                  reservation_id: e.target.value,
                  payment_amount: selected?.total_amount || 0,
                });
              }}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar reservación</option>
              {activeReservationsList.map(res => (
                <option key={res.id} value={res.id}>
                  #{res.id.slice(0, 8)} - {res.guests?.full_name || 'N/A'} - Hab. {res.rooms?.number || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
            <select
              value={checkOutData.payment_method}
              onChange={(e) => setCheckOutData({ ...checkOutData, payment_method: e.target.value })}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          <Input
            label="Monto a Pagar"
            type="number"
            value={checkOutData.payment_amount}
            onChange={(e) => setCheckOutData({ ...checkOutData, payment_amount: parseFloat(e.target.value) || 0 })}
            step="0.01"
            min="0"
            required
          />
        </form>
      </Modal>

      {/* ============================================ */}
      {/* MODAL NUEVA HABITACIÓN */}
      {/* ============================================ */}
      <Modal
        isOpen={showNewRoomModal}
        onClose={() => { setShowNewRoomModal(false); resetNewRoomForm(); setError(''); setSuccess(''); }}
        title="🛏️ Nueva Habitación"
        actions={
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => { setShowNewRoomModal(false); resetNewRoomForm(); }}>
              Cancelar
            </Button>
            <Button type="submit" form="newroom-form" isLoading={loadingAction}>
              Crear Habitación
            </Button>
          </div>
        }
      >
        <form id="newroom-form" onSubmit={handleNewRoom} className="space-y-4">
          <Input
            label="Número de Habitación"
            value={newRoomData.number}
            onChange={(e) => setNewRoomData({ ...newRoomData, number: e.target.value })}
            placeholder="Ej: 101"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={newRoomData.type}
                onChange={(e) => setNewRoomData({ ...newRoomData, type: e.target.value })}
                className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              value={newRoomData.price}
              onChange={(e) => setNewRoomData({ ...newRoomData, price: e.target.value })}
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
              value={newRoomData.capacity}
              onChange={(e) => setNewRoomData({ ...newRoomData, capacity: parseInt(e.target.value) || 1 })}
              min="1"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={newRoomData.status}
                onChange={(e) => setNewRoomData({ ...newRoomData, status: e.target.value })}
                className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            value={newRoomData.floor}
            onChange={(e) => setNewRoomData({ ...newRoomData, floor: parseInt(e.target.value) || 1 })}
            min="1"
          />
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;