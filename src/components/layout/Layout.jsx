import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div className="min-h-screen bg-[#f6efe9]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleCollapseToggle}
      />
      <div className="min-h-screen transition-all duration-300">
        <Header onMenuToggle={handleMenuToggle} />
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