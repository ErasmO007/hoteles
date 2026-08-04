import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRooms, filterReservations, buildOccupancyCalendar, buildDailyAlerts, buildRoomPerformanceSummary, buildPaymentSummary } from './hotelUtils.js';

test('filterRooms works with search, status and type', () => {
  const rooms = [
    { id: 1, number: '101', type: 'single', status: 'available', description: 'Vista al jardín' },
    { id: 2, number: '202', type: 'double', status: 'occupied', description: 'Cama king' },
    { id: 3, number: '303', type: 'suite', status: 'maintenance', description: 'Suite familiar' },
  ];

  const result = filterRooms(rooms, { searchTerm: '202', statusFilter: 'occupied', typeFilter: 'double' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 2);
});

test('filterReservations filters by term and status', () => {
  const reservations = [
    { id: 'a1', status: 'active', guests: { full_name: 'Ana López' }, rooms: { number: '101' } },
    { id: 'b2', status: 'completed', guests: { full_name: 'Luis Pérez' }, rooms: { number: '202' } },
  ];

  const result = filterReservations(reservations, { searchTerm: 'ana', statusFilter: 'active' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'a1');
});

test('buildOccupancyCalendar calculates occupancy for a month', () => {
  const reservations = [
    { id: 'r1', status: 'active', check_in: '2026-07-10', check_out: '2026-07-12' },
  ];

  const calendar = buildOccupancyCalendar({ reservations, year: 2026, month: 6, totalRooms: 2 });
  const july10 = calendar.find((day) => day.date === '2026-07-10');

  assert.ok(july10);
  assert.equal(july10.occupancyRate, 50);
  assert.equal(july10.status, 'occupied');
});

test('buildOccupancyCalendar uses occupancyData when provided', () => {
  const calendar = buildOccupancyCalendar({
    year: 2026,
    month: 6,
    totalRooms: 2,
    occupancyData: { '2026-07-10': { occupied: 1, percentage: 50 } },
  });

  const july10 = calendar.find((day) => day.date === '2026-07-10');
  assert.ok(july10);
  assert.equal(july10.occupancyRate, 50);
});

test('buildDailyAlerts generates useful alerts for the day', () => {
  const alerts = buildDailyAlerts({
    occupancyRate: 80,
    activeReservations: [{ id: 1 }],
    availableRooms: 2,
    totalRooms: 10,
  });

  assert.ok(alerts.some((alert) => alert.title === 'Alta ocupación'));
  assert.ok(alerts.some((alert) => alert.title === 'Llegadas del día'));
  assert.ok(alerts.some((alert) => alert.title === 'Pocas habitaciones libres'));
});

test('buildRoomPerformanceSummary calculates occupancy, bookings and revenue', () => {
  const rooms = [
    { id: 'r1', number: '101', type: 'single', price: 1200 },
    { id: 'r2', number: '202', type: 'double', price: 1800 },
  ];

  const reservations = [
    { room_id: 'r1', total_amount: 2400, status: 'completed', check_in: '2026-07-10', check_out: '2026-07-12' },
  ];

  const result = buildRoomPerformanceSummary({
    rooms,
    reservations,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
  });

  assert.equal(result[0].number, '101');
  assert.equal(result[0].bookings, 1);
  assert.equal(result[0].totalRevenue, 2400);
  assert.equal(result[0].occupancyRate, 6.45);
});

test('buildDailyAlerts includes pending payments and rooms requiring cleaning', () => {
  const alerts = buildDailyAlerts({
    occupancyRate: 30,
    activeReservations: [],
    availableRooms: 10,
    totalRooms: 20,
    pendingPayments: 2,
    pendingCleaningRooms: 3,
  });

  assert.ok(alerts.some((alert) => alert.title === 'Pagos pendientes'));
  assert.ok(alerts.some((alert) => alert.title === 'Habitaciones por limpiar'));
});

test('buildPaymentSummary summarizes payments by status and total amount', () => {
  const payments = [
    { amount: 1200, status: 'completed' },
    { amount: 800, status: 'pending' },
    { amount: 500, status: 'completed' },
  ];

  const summary = buildPaymentSummary(payments);

  assert.equal(summary.total, 2500);
  assert.equal(summary.completed, 2);
  assert.equal(summary.pending, 1);
  assert.equal(summary.count, 3);
});
