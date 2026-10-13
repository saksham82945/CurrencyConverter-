import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SimulatorBanner } from '../common/SimulatorBanner';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-fintech-dark flex flex-col font-sans transition-colors duration-200">
      {/* Persistent Simulator Disclaimer Banner */}
      <SimulatorBanner />

      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
