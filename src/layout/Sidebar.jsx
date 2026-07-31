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
  UserPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CalendarIcon as CalendarIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed = false, onToggleCollapse }) => {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'receptionist';

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
      icon: UserPlusIcon,
      iconSolid: UserPlusIcon,
      roles: ['admin'],
    },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Overlay para móvil */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl transition-all duration-300 z-50 ${
          isOpen ? 'w-64' : 'w-20'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Logo */}
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-4 border-b border-gray-700/50 h-16`}>
          {isOpen ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="font-bold text-lg">D</span>
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-lg block whitespace-nowrap">DASH Hotel</span>
                <p className="text-[10px] text-gray-400 -mt-0.5 whitespace-nowrap">Management</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="font-bold text-lg">D</span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse || toggleSidebar}
            className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-all hidden lg:block"
          >
            {isOpen ? (
              <ChevronLeftIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Menú */}
        <nav className="mt-6 px-3 overflow-y-auto h-[calc(100vh-8rem)]">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center ${isOpen ? 'justify-start' : 'justify-center'} px-3 py-3 rounded-xl mb-1 transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600/20 text-white shadow-lg shadow-blue-600/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${isActive ? 'bg-blue-600/30' : 'group-hover:bg-gray-600/30'}`}>
                    {isActive ? (
                      <item.iconSolid className="h-5 w-5" />
                    ) : (
                      <item.icon className="h-5 w-5" />
                    )}
                  </div>
                  {isOpen && (
                    <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`absolute bottom-0 ${isOpen ? 'w-64' : 'w-20'} border-t border-gray-700/50 p-4`}>
          <div className={`flex ${isOpen ? 'justify-start' : 'justify-center'} items-center space-x-2`}>
            <Cog6ToothIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
            {isOpen && <span className="text-sm text-gray-500 truncate">Configuración</span>}
          </div>
          {isOpen && (
            <div className="mt-2 text-[10px] text-gray-600">
              <p>Versión 1.0.0</p>
              <p className="mt-1">Rol: {userRole}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;