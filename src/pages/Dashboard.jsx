import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import RoomRepository from '../repositories/RoomRepository';
import ReservationRepository from '../repositories/ReservationRepository';
import GuestRepository from '../repositories/GuestRepository';
import PaymentRepository from '../repositories/PaymentRepository';
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    activeReservations: 0,
    totalGuests: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentGuests, setRecentGuests] = useState([]);

  const roomRepo = new RoomRepository();
  const reservationRepo = new ReservationRepository();
  const guestRepo = new GuestRepository();
  const paymentRepo = new PaymentRepository();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [roomStats, activeReservations, recentGuests, revenueData] = await Promise.all([
        roomRepo.getOccupancyStats(),
        reservationRepo.findActiveReservations(),
        guestRepo.findRecentGuests(5),
        getRevenueData(),
      ]);

      setStats({
        totalRooms: roomStats?.total || 0,
        availableRooms: roomStats?.available || 0,
        occupiedRooms: roomStats?.occupied || 0,
        occupancyRate: roomStats?.occupancyRate || 0,
        activeReservations: activeReservations?.length || 0,
        totalGuests: recentGuests?.length || 0,
        revenue: revenueData?.total || 0,
      });
      setRecentGuests(recentGuests || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRevenueData = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date();
      
      const data = await paymentRepo.getRevenueByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      return data;
    } catch (error) {
      console.error('Error getting revenue:', error);
      return { total: 0 };
    }
  };

  const statCards = [
    {
      title: 'Ocupación',
      value: `${Math.round(stats.occupancyRate)}%`,
      subtitle: `${stats.occupiedRooms}/${stats.totalRooms} habitaciones`,
      icon: HomeIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Reservaciones Activas',
      value: stats.activeReservations,
      subtitle: 'hoy',
      icon: CalendarIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Huéspedes',
      value: stats.totalGuests,
      subtitle: 'registrados',
      icon: UserGroupIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Ingresos',
      value: `$${stats.revenue.toLocaleString()}`,
      subtitle: 'este mes',
      icon: CurrencyDollarIcon,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Bienvenido, {user?.user_metadata?.full_name || 'Usuario'}</p>
        </div>
        <button className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40">
          Nueva Reservación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className={`bg-gradient-to-r ${stat.color} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos y listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ocupación de Habitaciones" className="border border-gray-100">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Disponibles</span>
              <span className="text-sm font-medium text-green-600">{stats.availableRooms}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.availableRooms / stats.totalRooms) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ocupadas</span>
              <span className="text-sm font-medium text-blue-600">{stats.occupiedRooms}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.occupiedRooms / stats.totalRooms) * 100}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card title="Huéspedes Recientes" className="border border-gray-100">
          <div className="space-y-3">
            {recentGuests.length > 0 ? (
              recentGuests.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                      {guest.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{guest.full_name}</p>
                      <p className="text-sm text-gray-500">{guest.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {guest.created_at ? new Date(guest.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No hay huéspedes recientes</p>
            )}
          </div>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card title="Acciones Rápidas" className="border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Check-in', icon: '🏨' },
            { label: 'Check-out', icon: '🚪' },
            { label: 'Nueva Habitación', icon: '🛏️' },
            { label: 'Reportes', icon: '📊' },
          ].map((action, index) => (
            <button
              key={index}
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl text-center transition-all hover:shadow-md"
            >
              <div className="text-2xl mb-1">{action.icon}</div>
              <div className="text-sm font-medium text-gray-700">{action.label}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;