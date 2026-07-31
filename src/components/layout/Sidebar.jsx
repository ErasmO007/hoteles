import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon, HomeIcon, BuildingOfficeIcon, UserGroupIcon, CalendarIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, BuildingOfficeIcon as BuildingOfficeIconSolid, UserGroupIcon as UserGroupIconSolid, CalendarIcon as CalendarIconSolid, ChartBarIcon as ChartBarIconSolid } from '@heroicons/react/24/solid';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userRole = user?.user_metadata?.role || 'receptionist';

  // Definir menús según rol
  const menuItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      to: '/rooms',
      label: 'Habitaciones',
      icon: BuildingOfficeIcon,
      iconSolid: BuildingOfficeIconSolid,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      to: '/guests',
      label: 'Huéspedes',
      icon: UserGroupIcon,
      iconSolid: UserGroupIconSolid,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      to: '/reservations',
      label: 'Reservaciones',
      icon: CalendarIcon,
      iconSolid: CalendarIconSolid,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      to: '/reports',
      label: 'Reportes',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      roles: ['admin', 'manager'],
    },
    {
      to: '/admin/users',
      label: 'Administrar Usuarios',
      icon: Cog6ToothIcon,
      iconSolid: Cog6ToothIcon,
      roles: ['admin'],
    },
  ];

  // Filtrar menús según rol
  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 z-50 flex h-full flex-col bg-gray-900 text-white shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-64 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-72`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-gray-700 p-4`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold">H</span>
              </div>
              <span className="text-lg font-bold">DASH Hotel</span>
            </div>
          )}
          {isCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold">H</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden rounded-lg p-1 transition-colors hover:bg-gray-700 lg:inline-flex">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button onClick={onClose} className="rounded-lg p-1 transition-colors hover:bg-gray-700 lg:hidden">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-2">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `mb-1 flex items-center rounded-lg px-3 py-3 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start'} ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <item.iconSolid className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} /> : <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />}
                  {!isCollapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t border-gray-700 p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} space-x-2`}>
            <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
            {!isCollapsed && <span className="text-sm text-gray-400">Configuración</span>}
          </div>
          {!isCollapsed && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Versión 1.0.0</p>
              <p className="mt-1">© 2026 DASH Hotel</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;