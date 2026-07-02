import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CalendarIcon as CalendarIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';

const Sidebar = () => {
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
  ];

  // Filtrar menús según rol
  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className={`fixed left-0 top-0 h-full bg-gray-900 text-white shadow-xl transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-700`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">H</span>
            </div>
            <span className="font-bold text-lg">DASH Hotel</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg">H</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Menú de navegación */}
      <nav className="mt-4 px-2">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-3 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <item.iconSolid className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                ) : (
                  <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                )}
                {!isCollapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className={`absolute bottom-0 ${isCollapsed ? 'w-20' : 'w-64'} border-t border-gray-700 p-4`}>
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-start'} items-center space-x-2`}>
          <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
          {!isCollapsed && (
            <span className="text-sm text-gray-400">Configuración</span>
          )}
        </div>
        {!isCollapsed && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Versión 1.0.0</p>
            <p className="mt-1">© 2026 DASH Hotel</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;