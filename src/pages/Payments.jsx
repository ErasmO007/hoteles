import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PaymentRepository from '../repositories/PaymentRepository';
import ReservationRepository from '../repositories/ReservationRepository';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { formatCurrency, getStatusLabel, buildPaymentSummary } from '../utils/hotelUtils';
import { useToast } from '../contexts/ToastContext';

const Payments = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [formData, setFormData] = useState({
    reservation_id: '',
    amount: '',
    payment_method: 'cash',
    status: 'completed',
    reference: '',
    notes: '',
  });

  const paymentRepo = new PaymentRepository();
  const reservationRepo = new ReservationRepository();

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [paymentsData, reservationsData] = await Promise.all([
        paymentRepo.findAll(),
        reservationRepo.findAllWithDetails(),
      ]);

      setReservations(reservationsData || []);

      const reservationMap = (reservationsData || []).reduce((acc, reservation) => {
        if (reservation?.id) {
          acc[reservation.id] = reservation;
        }
        return acc;
      }, {});

      const enriched = (paymentsData || []).map((payment) => ({
        ...payment,
        reservation: payment.reservation_id ? reservationMap[payment.reservation_id] || null : null,
      }));

      setPayments(enriched || []);
    } catch (paymentError) {
      console.error('Error loading payments:', paymentError);
      setError('No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId, status) => {
    try {
      await paymentRepo.update(paymentId, {
        status,
        updated_at: new Date().toISOString(),
      });
      await loadPayments();
      addToast('Estado del pago actualizado', 'success');
    } catch (updateError) {
      console.error('Error updating payment status:', updateError);
      setError('No se pudo actualizar el estado del pago');
    }
  };

  const handleOpenModal = () => {
    setError('');
    setFormData({
      reservation_id: '',
      amount: '',
      payment_method: 'cash',
      status: 'completed',
      reference: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.reservation_id) {
        throw new Error('Selecciona una reserva');
      }
      if (!formData.amount || Number(formData.amount) <= 0) {
        throw new Error('El monto debe ser mayor a cero');
      }

      const reservation = reservations.find((item) => item.id === formData.reservation_id);
      const reservationTotal = Number(reservation?.total_amount || 0);
      const currentPaid = payments
        .filter((payment) => payment.reservation_id === formData.reservation_id)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const nextBalance = reservationTotal - (currentPaid + Number(formData.amount));

      await paymentRepo.create({
        reservation_id: formData.reservation_id,
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        status: nextBalance <= 0 ? 'completed' : formData.status,
        reference: formData.reference || `ADMIN-${Date.now()}`,
        notes: formData.notes || 'Pago registrado por administrador',
        payment_date: new Date().toISOString(),
      });

      await loadPayments();
      setIsModalOpen(false);
      addToast(nextBalance <= 0 ? 'Pago registrado y reserva saldada' : 'Pago parcial registrado correctamente', 'success');
    } catch (submitError) {
      console.error('Error creating payment:', submitError);
      setError(submitError.message || 'No se pudo registrar el pago');
    }
  };

  const summary = buildPaymentSummary(payments);
  const filteredPayments = payments.filter((payment) => {
    const search = (searchTerm || '').toLowerCase().trim();
    const matchesSearch = !search || [
      payment.reservation?.id,
      payment.payment_method,
      payment.status,
      payment.amount,
      payment.reservation?.guest_id,
    ].join(' ').toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    const reservationTotal = Number(payment.reservation?.total_amount || 0);
    const paidAmount = Number(payment.amount || 0);
    const balance = Math.max(0, reservationTotal - paidAmount);
    const matchesBalance = balanceFilter === 'all' || (balanceFilter === 'pending' && balance > 0) || (balanceFilter === 'paid' && balance === 0);

    return matchesSearch && matchesStatus && matchesBalance;
  });

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Inicia sesión para ver el módulo de pagos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Administración de pagos</h1>
          <p className="text-gray-500">Registra pagos, revisa saldos pendientes y controla el estado de cuentas de cada reserva.</p>
        </div>
        <Button onClick={handleOpenModal}>+ Nuevo pago</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm text-green-700">Total cobrados</p>
          <p className="text-2xl font-semibold text-green-800">{formatCurrency(summary.total)}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Pagos completados</p>
          <p className="text-2xl font-semibold text-blue-800">{summary.completed}</p>
        </div>
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">Pendientes</p>
          <p className="text-2xl font-semibold text-yellow-800">{summary.pending}</p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-sm text-purple-700">Saldo por cobrar</p>
          <p className="text-2xl font-semibold text-purple-800">{formatCurrency(Math.max(0, (reservations.reduce((sum, reservation) => sum + Number(reservation.total_amount || 0), 0)) - summary.total))}</p>
        </div>
      </div>

      <Card className="border border-gray-100">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Buscar por método, estado o referencia"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completado</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todos los saldos</option>
              <option value="pending">Con saldo pendiente</option>
              <option value="paid">Pagado por completo</option>
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reserva / Huésped</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Monto total</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Monto pagado</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Saldo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Método / Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">
                    Cargando pagos...
                  </td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">
                        {payment.reservation?.guests?.full_name || payment.reservation?.guest_id || 'Sin reserva'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.reservation?.rooms?.number ? `Hab. ${payment.reservation.rooms.number}` : payment.reservation_id || 'Sin reserva'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      {formatCurrency(Number(payment.reservation?.total_amount || 0))}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      {formatCurrency(Math.max(0, Number(payment.reservation?.total_amount || 0) - Number(payment.amount || 0)))}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === 'completed' ? 'bg-green-100 text-green-700' : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {getStatusLabel(payment.status, { completed: 'Completado', pending: 'Pendiente', cancelled: 'Cancelado' })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{payment.payment_method || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{payment.created_at ? new Date(payment.created_at).toLocaleDateString('es-MX') : 'Sin fecha'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.status !== 'completed' && (
                        <Button size="sm" variant="success" onClick={() => handleStatusChange(payment.id, 'completed')}>
                          Marcar pagado
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">
                    No hay pagos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar pago"
        size="md"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="payment-form">Guardar pago</Button>
          </div>
        }
      >
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Reserva</label>
            <select
              value={formData.reservation_id}
              onChange={(e) => setFormData({ ...formData, reservation_id: e.target.value })}
              className="w-full rounded-xl border border-[#ead8cc] bg-white px-3 py-2.5 shadow-sm"
            >
              <option value="">Selecciona una reserva</option>
              {reservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.guests?.full_name || reservation.guest_id} - Hab. {reservation.rooms?.number || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Monto pagado"
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Método de pago</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full rounded-xl border border-[#ead8cc] bg-white px-3 py-2.5 shadow-sm"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-[#ead8cc] bg-white px-3 py-2.5 shadow-sm"
              >
                <option value="completed">Completado</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
          </div>

          <Input
            label="Referencia"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder="Ej. TRANS-001"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full rounded-xl border border-[#ead8cc] bg-white px-3 py-2.5 shadow-sm"
              placeholder="Información adicional del pago"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
