import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon, HomeIcon, BuildingOfficeIcon, UserGroupIcon, CalendarIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, BuildingOfficeIcon as BuildingOfficeIconSolid, UserGroupIcon as UserGroupIconSolid, CalendarIcon as CalendarIconSolid, ChartBarIcon as ChartBarIconSolid } from '@heroicons/react/24/solid';

const Sidebar = ({ isOpen, onClose, isCollapsed }) => {
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

  return (
    <div className={`border-b border-[#5b3138] bg-[#2f1b1d] text-[#f8efe9] shadow-[0_10px_30px_rgba(47,27,29,0.16)] ${isOpen ? 'block' : 'hidden'} lg:block`}>
      <div className="flex items-center justify-end px-4 py-3 lg:px-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 transition-colors hover:bg-[#5b3138] lg:hidden"
          aria-label="Cerrar menú"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-3 pb-3 lg:flex-row lg:items-center lg:justify-center">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? 'bg-[#9b4b5d] text-white' : 'text-[#e8d7cf] hover:bg-[#5b3138] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? <item.iconSolid className="mr-2 h-5 w-5" /> : <item.icon className="mr-2 h-5 w-5" />}
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;