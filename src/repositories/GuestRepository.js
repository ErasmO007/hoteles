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
}

export default GuestRepository;