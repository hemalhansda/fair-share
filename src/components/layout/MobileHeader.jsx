import React from 'react';
import { PieChart, Moon, Sun } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useTheme } from '../../contexts/ThemeContext';

const MobileHeader = ({ currentUser, setIsSettingsModalOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className="md:hidden bg-white dark:bg-gray-800 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <PieChart className="w-6 h-6" />
        <h1 className="text-lg font-bold">fyrShare</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button 
          onClick={() => setIsSettingsModalOpen && setIsSettingsModalOpen(true)}
          className="focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-full transition-transform hover:scale-105 active:scale-95"
          title="Settings"
        >
          <Avatar user={currentUser} size="sm" />
        </button>
      </div>
    </div>
  );
};

export default MobileHeader;