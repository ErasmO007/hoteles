import React, { useState, useEffect } from 'react';
import ReportService from '../services/ReportService';
import RoomRepository from '../repositories/RoomRepository';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { buildOccupancyCalendar, getStatusLabel } from '../utils/hotelUtils';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [occupancyData, setOccupancyData] = useState({});
  const [revenueData, setRevenueData] = useState(null);
  const [topGuests, setTopGuests] = useState([]);
  const [roomPerformance, setRoomPerformance] = useState([]);
  const [roomStatuses, setRoomStatuses] = useState([]);
  const [calendarView, setCalendarView] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const reportService = ReportService.getInstance();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [occupancyReport, revenueReport, topGuestsData, roomPerformanceData] = await Promise.all([
        loadOccupancyReport(),
        loadRevenueReport(),
        loadTopGuests(),
        loadRoomPerformance(),
      ]);
      await loadOccupancyCalendar(occupancyReport, roomPerformanceData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOccupancyReport = async () => {
    const data = await reportService.getOccupancyReport(
      dateRange.startDate,
      dateRange.endDate
    );
    setOccupancyData(data);
    return data;
  };

  const loadRevenueReport = async () => {
    const data = await reportService.getRevenueReport(
      dateRange.startDate,
      dateRange.endDate
    );
    setRevenueData(data);
    return data;
  };

  const loadTopGuests = async () => {
    const data = await reportService.getTopGuests(10);
    setTopGuests(data);
    return data;
  };

  const loadRoomPerformance = async () => {
    const data = await reportService.getRoomPerformance();
    setRoomPerformance(data);
    return data;
  };

  const loadRoomStatuses = async () => {
    const roomRepo = new RoomRepository();
    const data = await roomRepo.findAll();
    setRoomStatuses(data || []);
    return data || [];
  };

  const loadOccupancyCalendar = async (occupancyReport = occupancyData, roomPerformanceData = roomPerformance) => {
    const selectedMonth = new Date(calendarMonth);
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const calendar = buildOccupancyCalendar({
      year,
      month,
      totalRooms: roomPerformanceData?.length || 1,
      occupancyData: occupancyReport || {},
    });
    setCalendarView(calendar);
  };

  const goToPreviousMonth = () => {
    const nextMonth = new Date(calendarMonth);
    nextMonth.setMonth(nextMonth.getMonth() - 1);
    setCalendarMonth(nextMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(calendarMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCalendarMonth(nextMonth);
  };

  const handleDateChange = async () => {
    await loadReports();
  };

  // Calcular estadísticas de ocupación
  const getOccupancyStats = () => {
    const days = Object.values(occupancyData);
    if (days.length === 0) return { avgOccupancy: 0, totalDays: 0 };
    
    const totalOccupancy = days.reduce((sum, day) => sum + day.percentage, 0);
    return {
      avgOccupancy: totalOccupancy / days.length,
      totalDays: days.length,
    };
  };

  const occupancyStats = getOccupancyStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Reportes Administrativos</h1>
      </div>

      {/* Filtros de fecha */}
      <Card className="border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Input
            label="Fecha Inicio"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
          <Button onClick={handleDateChange}>
            Actualizar Reportes
          </Button>
        </div>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Ocupación Promedio</p>
          <p className="text-2xl font-bold text-gray-800">
            {occupancyStats.avgOccupancy.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">{occupancyStats.totalDays} días</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Ingresos Totales</p>
          <p className="text-2xl font-bold text-green-600">
            ${revenueData?.total?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-400">{revenueData?.count || 0} transacciones</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Top Huéspedes</p>
          <p className="text-2xl font-bold text-gray-800">{topGuests.length}</p>
          <p className="text-xs text-gray-400">con más estadías</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Habitaciones</p>
          <p className="text-2xl font-bold text-gray-800">{roomPerformance.length}</p>
          <p className="text-xs text-gray-400">con reservas</p>
        </div>
      </div>

      {/* Ocupación diaria */}
      <Card title="Ocupación Diaria" className="border border-gray-100">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(occupancyData).length > 0 ? (
              Object.entries(occupancyData).map(([date, data]) => (
                <div key={date} className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 w-28">{date}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-16 text-right">
                    {data.percentage.toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos de ocupación</p>
            )}
          </div>
        )}
      </Card>

      <Card title="Calendario de ocupación" className="border border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {calendarMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-500">Vista mensual para controlar la ocupación del hotel</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={goToPreviousMonth}>←</Button>
              <Button variant="secondary" size="sm" onClick={goToNextMonth}>→</Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-blue-50 px-3 py-1">● Ocupado</span>
            <span className="rounded-full bg-white px-3 py-1 border border-gray-200">● Libre</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-7">
            {calendarView.map((day) => (
              <div
                key={day.date}
                className={`min-h-[84px] rounded-xl border p-2 text-sm shadow-sm ${day.occupancyRate >= 50 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                <p className="font-semibold text-gray-700">{day.label}</p>
                <p className="mt-2 text-xs text-gray-500">{day.occupancyRate}%</p>
                <p className="text-[11px] text-gray-400">{day.status === 'occupied' ? 'Ocupado' : 'Libre'}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Estado por habitación" className="border border-gray-100">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {roomStatuses.length > 0 ? roomStatuses.map((room) => {
            const statusClasses = room.status === 'occupied'
              ? 'border-red-200 bg-red-50'
              : room.status === 'available'
                ? 'border-green-200 bg-green-50'
                : 'border-yellow-200 bg-yellow-50';

            return (
              <div key={room.id} className={`rounded-xl border p-3 ${statusClasses}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Hab. {room.number}</p>
                    <p className="text-xs text-gray-500 capitalize">{room.type}</p>
                  </div>
                  <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-gray-700">
                    {getStatusLabel(room.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">${room.price}</p>
              </div>
            );
          }) : (
            <p className="text-sm text-gray-500">No hay estados de habitaciones disponibles</p>
          )}
        </div>
      </Card>

      {/* Top Huéspedes */}
      <Card title="Top Huéspedes" className="border border-gray-100">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {topGuests.length > 0 ? (
              topGuests.map((guest, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-800">{guest.name}</p>
                      <p className="text-sm text-gray-500">{guest.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">${guest.totalSpent.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{guest.stays} estadías</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos de huéspedes</p>
            )}
          </div>
        )}
      </Card>

      {/* Rendimiento de habitaciones */}
      <Card title="Rendimiento de Habitaciones" className="border border-gray-100">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Habitación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reservas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ocupación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roomPerformance.map((room, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Hab. {room.number}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {room.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      ${room.price}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {room.bookings}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {room.occupancyRate}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                      ${room.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Reports;