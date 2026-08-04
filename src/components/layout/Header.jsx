import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BellIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';

const Header = ({ onMenuToggle, secretMode = false, onSecretModeChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [easterEggActive, setEasterEggActive] = useState(false);

  const notifications = [
    { id: 1, title: 'Check-in pendiente', text: 'Hay 2 huéspedes esperando ingreso hoy.' },
    { id: 2, title: 'Reserva confirmada', text: 'La reserva de María López fue aprobada.' },
  ];

  const searchItems = useMemo(
    () => [
      { label: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'inicio', 'resumen', 'panel', 'estadisticas'] },
      { label: 'Habitaciones', path: '/rooms', keywords: ['habitaciones', 'cuartos', 'rooms', 'room'] },
      { label: 'Huéspedes', path: '/guests', keywords: ['huespedes', 'huéspedes', 'guests', 'clientes'] },
      { label: 'Reservas', path: '/reservations', keywords: ['reservas', 'reservaciones', 'bookings', 'booking'] },
      { label: 'Pagos', path: '/payments', keywords: ['pagos', 'payments', 'cobros', 'facturas'] },
      { label: 'Reportes', path: '/reports', keywords: ['reportes', 'informes', 'reports'] },
      { label: 'Usuarios', path: '/admin/users', keywords: ['usuarios', 'users', 'admin', 'administracion'] },
    ],
    []
  );

  const filteredResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return [];

    return searchItems.filter((item) => {
      const haystack = `${item.label} ${item.keywords.join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchItems, searchValue]);

  useEffect(() => {
    const normalized = searchValue.trim().toLowerCase();
    const secretWords = ['misterio', 'secreto', 'easter egg', 'surprise', 'magic', 'hola'];
    const isSecret = secretWords.some((word) => normalized.includes(word));

    setEasterEggActive(isSecret);
    if (onSecretModeChange) {
      onSecretModeChange(isSecret);
    }
  }, [searchValue, onSecretModeChange]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      setShowSearchResults(false);
      return;
    }

    const secretWords = ['misterio', 'secreto', 'easter egg', 'surprise', 'magic', 'hola'];
    const isSecret = secretWords.some((word) => query.includes(word));

    if (isSecret) {
      setShowSearchResults(false);
      return;
    }

    const match = filteredResults[0];
    if (match) {
      navigate(match.path);
      setSearchValue('');
      setShowSearchResults(false);
      return;
    }

    setShowSearchResults(true);
  };

  const handleResultClick = (path) => {
    navigate(path);
    setSearchValue('');
    setShowSearchResults(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur transition-all duration-500 ${easterEggActive || secretMode ? 'border-[#4b5563] bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#374151]' : 'border-[#ead8cc] bg-[#fdf8f4]/95'}`}>
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
            <form onSubmit={handleSearchSubmit} className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9b4b5d]" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(Boolean(searchValue.trim()))}
                placeholder="Buscar dashboard, habitaciones, reservas..."
                className={`w-full rounded-xl border py-2 pl-10 pr-4 text-sm transition-all focus:border-transparent focus:outline-none ${easterEggActive || secretMode ? 'border-[#4b5563] bg-[#111827] text-[#f9fafb] focus:ring-2 focus:ring-[#f59e0b]' : 'border-[#ead8cc] bg-white text-[#2f1b1d] focus:ring-2 focus:ring-[#9b4b5d]'}`}
              />

              {showSearchResults && filteredResults.length > 0 && (
                <div className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-lg ${easterEggActive || secretMode ? 'border-[#4b5563] bg-[#1f2937]' : 'border-[#ead8cc] bg-white'}`}>
                  {filteredResults.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleResultClick(item.path)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${easterEggActive || secretMode ? 'text-[#f9fafb] hover:bg-[#374151]' : 'text-[#2f1b1d] hover:bg-[#fdf8f4]'}`}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-[#9b4b5d]">Ir</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {easterEggActive && (
            <div className={`hidden rounded-full border px-3 py-1 text-xs font-semibold shadow-sm sm:flex ${easterEggActive || secretMode ? 'border-[#f59e0b] bg-[#1f2937] text-[#fbbf24]' : 'border-[#e5b58b] bg-white/80 text-[#7c3948]'}`} aria-live="polite">
              ✨ Modo secreto activado
            </div>
          )}
          {easterEggActive && (
            <div className="relative hidden h-14 w-14 items-center justify-center rounded-full border border-[#f59e0b] bg-[#111827] shadow-[0_0_20px_rgba(245,158,11,0.35)] sm:flex" title="Godzilla secreto">
              <div className="godzilla-persona">
                <div className="godzilla-persona__head" />
                <div className="godzilla-persona__body" />
                <div className="godzilla-persona__tail" />
                <div className="godzilla-persona__eye" />
                <div className="godzilla-persona__eye godzilla-persona__eye--right" />
              </div>
            </div>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((value) => !value)}
              className={`relative rounded-lg p-2 transition-all ${easterEggActive || secretMode ? 'text-[#f9fafb] hover:bg-[#374151] hover:text-[#fbbf24]' : 'text-[#7c3948] hover:bg-[#f3e4db] hover:text-[#5b3138]'}`}
              aria-label="Mostrar notificaciones"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-[#ead8cc] bg-white p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#2f1b1d]">Notificaciones</p>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-[#9b4b5d]"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="space-y-2">
                  {notifications.map((item) => (
                    <div key={item.id} className="rounded-lg bg-[#fdf8f4] p-2">
                      <p className="text-sm font-medium text-[#2f1b1d]">{item.title}</p>
                      <p className="text-xs text-[#8a5c63]">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-l border-[#ead8cc] pl-3">
            <div className="hidden text-right sm:block">
              <p className={`text-sm font-semibold ${easterEggActive || secretMode ? 'text-[#f9fafb]' : 'text-[#2f1b1d]'}`}>{user?.user_metadata?.full_name || 'Usuario'}</p>
              <p className={`text-xs capitalize ${easterEggActive || secretMode ? 'text-[#d1d5db]' : 'text-[#8a5c63]'}`}>{user?.user_metadata?.role || 'receptionist'}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r text-sm font-semibold text-white shadow-md ${easterEggActive || secretMode ? 'from-[#f59e0b] to-[#dc2626]' : 'from-[#7c3948] to-[#9b4b5d]'}`}>
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <button onClick={handleLogout} className={`rounded-lg p-2 transition-all ${easterEggActive || secretMode ? 'text-[#f9fafb] hover:bg-[#374151] hover:text-[#fbbf24]' : 'text-[#7c3948] hover:bg-[#f3e4db] hover:text-[#8b3b49]'}`} title="Cerrar sesión">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;