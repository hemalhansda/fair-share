import React from 'react';
import { PieChart } from 'lucide-react';
import Avatar from '../ui/Avatar';

const MobileHeader = ({ currentUser, setIsSettingsModalOpen }) => (
  <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-20">
    <div className="flex items-center gap-2 text-emerald-600">
      <PieChart className="w-6 h-6" />
      <h1 className="text-lg font-bold">fyrShare</h1>
    </div>
    <button 
      onClick={() => setIsSettingsModalOpen && setIsSettingsModalOpen(true)}
      className="focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full transition-transform hover:scale-105 active:scale-95"
      title="Settings"
    >
      <Avatar user={currentUser} size="sm" />
    </button>
  </div>
);

export default MobileHeader;