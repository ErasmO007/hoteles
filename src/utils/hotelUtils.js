export const formatCurrency = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(number);
};

export const getStatusLabel = (status, labels = {}) => {
  const defaultLabels = {
    available: 'Disponible',
    occupied: 'Ocupada',
    maintenance: 'Mantenimiento',
    cleaned: 'Limpia',
    reserved: 'Reservada',
    active: 'Activa',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No Show',
    pending: 'Pendiente',
  };

  const finalLabels = { ...defaultLabels, ...labels };
  return finalLabels[status] || status || 'Sin estado';
};

export const buildDailyAlerts = ({ occupancyRate = 0, activeReservations = [], availableRooms = 0, totalRooms = 0, pendingPayments = 0, pendingCleaningRooms = 0 }) => {
  const items = [];

  if (occupancyRate >= 75) {
    items.push({ type: 'success', title: 'Alta ocupación', message: 'La ocupación del hotel está por encima del 75%.' });
  } else if (occupancyRate < 40) {
    items.push({ type: 'warning', title: 'Ocupación baja', message: 'Considera promociones para atraer más reservas.' });
  }

  if (activeReservations?.length > 0) {
    items.push({ type: 'info', title: 'Llegadas del día', message: `${activeReservations.length} reservas activas requieren atención.` });
  }

  if (totalRooms > 0 && availableRooms <= Math.ceil(totalRooms * 0.2)) {
    items.push({ type: 'info', title: 'Pocas habitaciones libres', message: `Solo quedan ${availableRooms} habitaciones disponibles.` });
  }

  if (pendingPayments > 0) {
    items.push({ type: 'warning', title: 'Pagos pendientes', message: `Hay ${pendingPayments} pagos sin completar.` });
  }

  if (pendingCleaningRooms > 0) {
    items.push({ type: 'info', title: 'Habitaciones por limpiar', message: `${pendingCleaningRooms} habitaciones requieren preparación para el próximo ingreso.` });
  }

  if (items.length === 0) {
    items.push({ type: 'info', title: 'Todo en orden', message: 'No hay alertas pendientes en este momento.' });
  }

  return items;
};

export const filterRooms = (rooms, filters = {}) => {
  const searchTerm = (filters.searchTerm || '').toLowerCase().trim();
  const statusFilter = filters.statusFilter || 'all';
  const typeFilter = filters.typeFilter || 'all';

  return rooms.filter((room) => {
    const matchesSearch = !searchTerm || [room.number, room.type, room.description, room.status]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesType = typeFilter === 'all' || room.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });
};

export const filterReservations = (reservations, filters = {}) => {
  const searchTerm = (filters.searchTerm || '').toLowerCase().trim();
  const statusFilter = filters.statusFilter || 'all';

  return reservations.filter((reservation) => {
    const guestName = reservation.guests?.full_name || '';
    const roomNumber = reservation.rooms?.number || '';
    const searchable = `${guestName} ${roomNumber} ${reservation.status}`.toLowerCase();

    const matchesSearch = !searchTerm || searchable.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
};

export const buildRoomPerformanceSummary = ({ rooms = [], reservations = [], startDate, endDate }) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const totalDays = start && end ? Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1) : 30;

  return rooms.map((room) => {
    const roomReservations = (reservations || []).filter((reservation) => reservation.room_id === room.id && reservation.status === 'completed');
    const occupiedNights = roomReservations.reduce((sum, reservation) => {
      if (!reservation.check_in || !reservation.check_out) return sum;
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
      return sum + nights;
    }, 0);

    const occupancyRate = totalDays > 0 ? Number(((occupiedNights / totalDays) * 100).toFixed(2)) : 0;

    return {
      id: room.id,
      number: room.number,
      type: room.type,
      price: room.price,
      totalRevenue: roomReservations.reduce((sum, reservation) => sum + Number(reservation.total_amount || 0), 0),
      bookings: roomReservations.length,
      occupancyRate,
      occupiedNights,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

export const buildPaymentSummary = (payments = []) => {
  const completed = payments.filter((payment) => payment.status === 'completed').length;
  const pending = payments.filter((payment) => payment.status === 'pending').length;
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return {
    total,
    completed,
    pending,
    count: payments.length,
  };
};

export const buildOccupancyCalendar = ({ reservations = [], year, month, totalRooms = 1, occupancyData = null }) => {
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const currentDate = new Date(year, month, day);
    const isoDate = currentDate.toISOString().split('T')[0];
    const occupancyEntry = occupancyData?.[isoDate];

    let occupied = 0;
    let occupancyRate = 0;

    if (occupancyEntry) {
      occupied = occupancyEntry.occupied || 0;
      occupancyRate = occupancyEntry.percentage || 0;
    } else {
      occupied = reservations.filter((reservation) => {
        if (reservation.status !== 'active') return false;
        const checkIn = reservation.check_in?.split('T')[0];
        const checkOut = reservation.check_out?.split('T')[0];
        return checkIn <= isoDate && isoDate < checkOut;
      }).length;

      occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;
    }

    days.push({
      date: isoDate,
      label: currentDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
      occupancyRate,
      occupiedRooms: occupied,
      status: occupancyRate >= 50 ? 'occupied' : 'available',
    });
  }

  return days;
};
