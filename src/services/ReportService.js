import supabase from '../lib/supabase';
import RoomRepository from '../repositories/RoomRepository';
import ReservationRepository from '../repositories/ReservationRepository';
import PaymentRepository from '../repositories/PaymentRepository';

class ReportService {
  static instance = null;

  constructor() {
    if (ReportService.instance) {
      return ReportService.instance;
    }
    ReportService.instance = this;
    this.roomRepo = new RoomRepository();
    this.reservationRepo = new ReservationRepository();
    this.paymentRepo = new PaymentRepository();
    this.supabase = supabase;
  }

  static getInstance() {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  async getOccupancyReport(startDate, endDate) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        check_in,
        check_out,
        status,
        rooms:room_id (number, type)
      `)
      .or(`check_in.gte.${startDate},check_out.lte.${endDate}`)
      .eq('status', 'active');
    
    if (error) throw error;
    
    const occupancyByDay = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      occupancyByDay[dateStr] = {
        occupied: 0,
        total: 0,
        percentage: 0,
      };
    }
    
    // Calcular ocupación
    const totalRooms = await this.roomRepo.getOccupancyStats();
    const total = totalRooms.total;
    
    data.forEach(reservation => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      
      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (occupancyByDay[dateStr]) {
          occupancyByDay[dateStr].occupied++;
          occupancyByDay[dateStr].total = total;
        }
      }
    });
    
    // Calcular porcentajes
    Object.keys(occupancyByDay).forEach(date => {
      const day = occupancyByDay[date];
      day.percentage = day.total > 0 ? (day.occupied / day.total) * 100 : 0;
    });
    
    return occupancyByDay;
  }

  async getRevenueReport(startDate, endDate) {
    return this.paymentRepo.getRevenueByDateRange(startDate, endDate);
  }

  async getTopGuests(limit = 10) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        guest_id,
        guests:guest_id (full_name, email, phone),
        total_amount,
        status
      `)
      .eq('status', 'completed')
      .order('total_amount', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    const guestStats = {};
    data.forEach(item => {
      const guestId = item.guest_id;
      if (!guestStats[guestId]) {
        guestStats[guestId] = {
          name: item.guests.full_name,
          email: item.guests.email,
          phone: item.guests.phone,
          totalSpent: 0,
          stays: 0,
        };
      }
      guestStats[guestId].totalSpent += item.total_amount;
      guestStats[guestId].stays++;
    });
    
    return Object.values(guestStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  async getRoomPerformance() {
    const [roomsResult, reservationsResult] = await Promise.all([
      this.roomRepo.findAll(),
      this.supabase
        .from('reservations')
        .select(`
          room_id,
          total_amount,
          status,
          check_in,
          check_out
        `)
        .eq('status', 'completed')
    ]);

    if (roomsResult.error) throw roomsResult.error;
    if (reservationsResult.error) throw reservationsResult.error;

    const startDate = new Date();
    startDate.setDate(1);
    const endDate = new Date();
    const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);

    const roomStats = (roomsResult.data || []).map((room) => {
      const roomReservations = (reservationsResult.data || []).filter((reservation) => reservation.room_id === room.id);
      const occupiedNights = roomReservations.reduce((sum, reservation) => {
        if (!reservation.check_in || !reservation.check_out) return sum;
        const checkIn = new Date(reservation.check_in);
        const checkOut = new Date(reservation.check_out);
        const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
        return sum + nights;
      }, 0);

      return {
        id: room.id,
        number: room.number,
        type: room.type,
        price: room.price,
        totalRevenue: roomReservations.reduce((sum, reservation) => sum + Number(reservation.total_amount || 0), 0),
        bookings: roomReservations.length,
        occupancyRate: Number(((occupiedNights / totalDays) * 100).toFixed(2)),
        occupiedNights,
      };
    });

    return roomStats.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }
}

export default ReportService;