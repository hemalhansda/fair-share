import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';
import MobileHeader from '../layout/MobileHeader';
import MobileNavigation from '../layout/MobileNavigation';
import FloatingActionButton from '../layout/FloatingActionButton';

const AppLayout = ({ 
  currentUser, 
  setSelectedGroup, 
  handleLogout,
  setIsExpenseModalOpen 
}) => {
  return (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden font-sans text-gray-900">
      {/* Sidebar (Desktop) */}
      <Sidebar 
        currentUser={currentUser}
        setSelectedGroup={setSelectedGroup}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader currentUser={currentUser} />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full pb-24 md:pb-8">
          <Outlet />
        </div>

        {/* Floating Action Button (Mobile & Desktop) */}
        <FloatingActionButton onClick={() => setIsExpenseModalOpen(true)} />

        {/* Mobile Bottom Navigation */}
        <MobileNavigation setSelectedGroup={setSelectedGroup} />
      </main>
    </div>
  );
};

export default AppLayout;