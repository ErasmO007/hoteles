import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [secretMode, setSecretMode] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen((value) => !value);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleCollapseToggle = () => {
    setSidebarCollapsed((value) => !value);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${secretMode ? 'bg-[#111827] text-[#f9fafb]' : 'bg-[#f6efe9] text-[#2f1b1d]'}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleCollapseToggle}
        secretMode={secretMode}
      />
      <div className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Header onMenuToggle={handleMenuToggle} secretMode={secretMode} onSecretModeChange={setSecretMode} />
        <main className="px-4 py-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;