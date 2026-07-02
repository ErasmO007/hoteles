import BaseRepository from './BaseRepository';

class RoomRepository extends BaseRepository {
  constructor() {
    super('rooms');
  }

  async findByStatus(status) {
    return this.findBy('status', status);
  }

  async getAvailableRooms() {
    return this.findBy('status', 'available');
  }

  async updateRoomStatus(id, status) {
    return this.update(id, { status, updated_at: new Date() });
  }

  async getOccupancyStats() {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('status, type, capacity')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const total = data.length;
    const available = data.filter(r => r.status === 'available').length;
    const occupied = data.filter(r => r.status === 'occupied').length;
    const maintenance = data.filter(r => r.status === 'maintenance').length;
    const cleaned = data.filter(r => r.status === 'cleaned').length;

    return {
      total,
      available,
      occupied,
      maintenance,
      cleaned,
      occupancyRate: total > 0 ? (occupied / total) * 100 : 0,
    };
  }

  async getRoomsByType() {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('type, status, price')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const roomsByType = {};
    data.forEach(room => {
      if (!roomsByType[room.type]) {
        roomsByType[room.type] = [];
      }
      roomsByType[room.type].push(room);
    });
    
    return roomsByType;
  }
}

export default RoomRepository;