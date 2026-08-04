import BaseRepository from './BaseRepository';

class GuestRepository extends BaseRepository {
  constructor() {
    super('guests');
  }

  async findByEmail(email) {
    return this.findBy('email', email);
  }

  async findByPhone(phone) {
    return this.findBy('phone', phone);
  }

  async findRecentGuests(limit = 10) {
    const { data, error } = await this.supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  async findFrequentGuests(minStays = 2) {
    // Consulta más compleja que requiere joins
    const { data, error } = await this.supabase
      .from('guests')
      .select(`
        *,
        reservations:reservations(count)
      `)
      .eq('reservations.status', 'completed');
    
    if (error) throw error;
    
    return data.filter(guest => guest.reservations.length >= minStays);
  }

  async searchGuests(searchTerm) {
    const { data, error } = await this.supabase
      .from('guests')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    
    if (error) throw error;
    return data;
  }

  async getGuestHistory(guestId) {
    try {
      const { data: reservations, error } = await this.supabase
        .from('reservations')
        .select('id, status, check_in, check_out, total_amount, guest_id, room_id')
        .eq('guest_id', guestId)
        .order('check_in', { ascending: false });

      if (error) throw error;

      if (!reservations || reservations.length === 0) {
        return [];
      }

      const roomIds = [...new Set(reservations.map((reservation) => reservation.room_id).filter(Boolean))];
      let roomsMap = {};

      if (roomIds.length > 0) {
        const { data: rooms, error: roomsError } = await this.supabase
          .from('rooms')
          .select('id, number, type')
          .in('id', roomIds);

        if (!roomsError && rooms) {
          roomsMap = rooms.reduce((acc, room) => ({ ...acc, [room.id]: room }), {});
        }
      }

      return reservations.map((reservation) => ({
        ...reservation,
        room: roomsMap[reservation.room_id] || null,
      }));
    } catch (error) {
      console.error('Error getting guest history:', error);
      return [];
    }
  }
}

export default GuestRepository;