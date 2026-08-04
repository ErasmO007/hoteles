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
    <header className="sticky top-0 z-40 border-b border-[#ead8cc] bg-[#fdf8f4]/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-[#7c3948] transition-colors hover:bg-[#f3e4db] lg:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex-1 lg:min-w-[260px] lg:max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9b4b5d]" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full rounded-xl border border-[#ead8cc] bg-white py-2 pl-10 pr-4 text-sm text-[#2f1b1d] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9b4b5d]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <button className="relative rounded-lg p-2 text-[#7c3948] transition-all hover:bg-[#f3e4db] hover:text-[#5b3138]">
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          <div className="flex items-center gap-3 border-l border-[#ead8cc] pl-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#2f1b1d]">{user?.user_metadata?.full_name || 'Usuario'}</p>
              <p className="text-xs capitalize text-[#8a5c63]">{user?.user_metadata?.role || 'receptionist'}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3948] to-[#9b4b5d] text-sm font-semibold text-white shadow-md">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2 text-[#7c3948] transition-all hover:bg-[#f3e4db] hover:text-[#8b3b49]" title="Cerrar sesión">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;