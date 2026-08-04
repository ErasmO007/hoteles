import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon, HomeIcon, BuildingOfficeIcon, UserGroupIcon, CalendarIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, BuildingOfficeIcon as BuildingOfficeIconSolid, UserGroupIcon as UserGroupIconSolid, CalendarIcon as CalendarIconSolid, ChartBarIcon as ChartBarIconSolid } from '@heroicons/react/24/solid';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();
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

  const sidebarWidthClass = isCollapsed ? 'lg:w-20' : 'lg:w-64';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[#2f1b1d] text-[#f8efe9] shadow-[0_20px_60px_rgba(47,27,29,0.25)] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${sidebarWidthClass}`}>
        <div className="flex items-center justify-between border-b border-[#5b3138] p-4">
          <span className={`text-sm font-semibold text-[#f8efe9] ${isCollapsed ? 'hidden' : 'block'}`}>Menú</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden rounded-lg p-1 transition-colors hover:bg-[#5b3138] lg:inline-flex"
              aria-label="Colapsar menú"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 transition-colors hover:bg-[#5b3138] lg:hidden"
              aria-label="Cerrar menú"
            >
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
                `mb-1 flex items-center rounded-lg px-3 py-3 transition-colors ${
                  isActive ? 'bg-[#9b4b5d] text-white' : 'text-[#e8d7cf] hover:bg-[#5b3138] hover:text-white'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <item.iconSolid className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5`} /> : <item.icon className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5`} />}
                  {!isCollapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;