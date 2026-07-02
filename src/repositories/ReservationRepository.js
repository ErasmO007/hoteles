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
  async findAllWithDetails() {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          guests:guest_id (
            full_name,
            email,
            phone
          ),
          rooms:room_id (
            number,
            type,
            price
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en findAllWithDetails:', error);
      return [];
    }
  }
}

export default ReservationRepository;