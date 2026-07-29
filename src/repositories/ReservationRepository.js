import BaseRepository from './BaseRepository';

class ReservationRepository extends BaseRepository {
  constructor() {
    super('reservations');
  }

  async findByGuestId(guestId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('guest_id', guestId);
    
    if (error) throw error;
    return data || [];
  }

  async findByRoomId(roomId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('room_id', roomId);
    
    if (error) throw error;
    return data || [];
  }

  async findActiveReservations() {
    try {
      // Primero obtener las reservaciones activas
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          id,
          check_in,
          check_out,
          status,
          total_amount,
          guests_count,
          special_requests,
          created_at,
          guest_id,
          room_id
        `)
        .eq('status', 'active')
        .order('check_in', { ascending: true });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }

      // Obtener datos de huéspedes y habitaciones por separado
      const guestIds = data.map(r => r.guest_id).filter(id => id);
      const roomIds = data.map(r => r.room_id).filter(id => id);

      // Obtener huéspedes
      let guestsData = [];
      if (guestIds.length > 0) {
        const { data: guests, error: guestsError } = await this.supabase
          .from('guests')
          .select('id, full_name, email, phone')
          .in('id', guestIds);
        
        if (!guestsError && guests) {
          guestsData = guests;
        }
      }

      // Obtener habitaciones
      let roomsData = [];
      if (roomIds.length > 0) {
        const { data: rooms, error: roomsError } = await this.supabase
          .from('rooms')
          .select('id, number, type, price')
          .in('id', roomIds);
        
        if (!roomsError && rooms) {
          roomsData = rooms;
        }
      }

      // Combinar los datos
      const result = data.map(reservation => ({
        ...reservation,
        guests: guestsData.find(g => g.id === reservation.guest_id) || null,
        rooms: roomsData.find(r => r.id === reservation.room_id) || null,
      }));

      return result;
    } catch (error) {
      console.error('Error en findActiveReservations:', error);
      return [];
    }
  }

  async findReservationsByDate(date) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .or(`check_in.lte.${date},check_out.gte.${date}`)
      .eq('status', 'active');
    
    if (error) throw error;
    return data || [];
  }

  async checkRoomAvailability(roomId, checkIn, checkOut) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('room_id', roomId)
      .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`)
      .eq('status', 'active');
    
    if (error) throw error;
    return data.length === 0;
  }

  async updateStatus(id, status) {
    return this.update(id, { 
      status, 
      updated_at: new Date().toISOString() 
    });
  }

  // Método simplificado para obtener todas las reservaciones con detalles
  // =============================================
// MÉTODO CORREGIDO - findAllWithDetails
// =============================================

async findAllWithDetails() {
  try {
    console.log('🔄 Cargando reservaciones con detalles...');
    
    // 1. Obtener TODAS las reservaciones (no solo activas)
    const { data: reservations, error: resError } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (resError) {
      console.error('❌ Error al obtener reservaciones:', resError);
      throw resError;
    }
    
    console.log(`📋 Encontradas ${reservations?.length || 0} reservaciones`);
    
    if (!reservations || reservations.length === 0) {
      return [];
    }

    // 2. Obtener IDs únicos de huéspedes y habitaciones
    const guestIds = [...new Set(reservations.map(r => r.guest_id).filter(id => id))];
    const roomIds = [...new Set(reservations.map(r => r.room_id).filter(id => id))];

    console.log(`👤 Huéspedes IDs: ${guestIds.length}, 🏨 Habitaciones IDs: ${roomIds.length}`);

    // 3. Obtener datos de huéspedes
    let guestsMap = {};
    if (guestIds.length > 0) {
      const { data: guests, error: guestsError } = await this.supabase
        .from('guests')
        .select('id, full_name, email, phone, nationality')
        .in('id', guestIds);
      
      if (!guestsError && guests) {
        guestsMap = guests.reduce((acc, g) => ({ ...acc, [g.id]: g }), {});
        console.log(`✅ ${Object.keys(guestsMap).length} huéspedes cargados`);
      } else {
        console.warn('⚠️ Error al cargar huéspedes:', guestsError);
      }
    }

    // 4. Obtener datos de habitaciones
    let roomsMap = {};
    if (roomIds.length > 0) {
      const { data: rooms, error: roomsError } = await this.supabase
        .from('rooms')
        .select('id, number, type, price, status')
        .in('id', roomIds);
      
      if (!roomsError && rooms) {
        roomsMap = rooms.reduce((acc, r) => ({ ...acc, [r.id]: r }), {});
        console.log(`✅ ${Object.keys(roomsMap).length} habitaciones cargadas`);
      } else {
        console.warn('⚠️ Error al cargar habitaciones:', roomsError);
      }
    }

    // 5. Combinar datos
    const result = reservations.map(reservation => ({
      ...reservation,
      guests: guestsMap[reservation.guest_id] || null,
      rooms: roomsMap[reservation.room_id] || null,
    }));

    console.log(`✅ ${result.length} reservaciones procesadas correctamente`);
    return result;

  } catch (error) {
    console.error('❌ Error en findAllWithDetails:', error);
    return [];
  }
}
}

export default ReservationRepository;