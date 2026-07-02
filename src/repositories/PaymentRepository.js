import BaseRepository from './BaseRepository';

class PaymentRepository extends BaseRepository {
  constructor() {
    super('payments');
  }

  async findByReservationId(reservationId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getRevenueByDateRange(startDate, endDate) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('amount, created_at, payment_method')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'completed');
      
      if (error) throw error;
      
      const total = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const byMethod = {};
      
      data?.forEach(payment => {
        if (!byMethod[payment.payment_method]) {
          byMethod[payment.payment_method] = 0;
        }
        byMethod[payment.payment_method] += payment.amount;
      });
      
      return {
        total,
        data: data || [],
        byMethod,
        count: data?.length || 0,
      };
    } catch (error) {
      console.error('Error en getRevenueByDateRange:', error);
      return { total: 0, data: [], byMethod: {}, count: 0 };
    }
  }
}

export default PaymentRepository;