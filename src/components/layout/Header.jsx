import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BellIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden">
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex-1 lg:min-w-[260px] lg:max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <button className="relative rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700">
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800">{user?.user_metadata?.full_name || 'Usuario'}</p>
              <p className="text-xs capitalize text-gray-500">{user?.user_metadata?.role || 'receptionist'}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-md">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600" title="Cerrar sesión">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;