import React from 'react';
import { NavLink } from 'react-router-dom';
import { PieChart, LogOut, Home, Users, UserPlus, Activity, Settings, Moon, Sun } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = ({ 
  currentUser, 
  handleLogout,
  setSelectedGroup,
  setIsSettingsModalOpen
}) => {
  const { isDark, toggleTheme } = useTheme();
  
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'groups', label: 'Groups', icon: Users, path: '/groups' },
    { id: 'friends', label: 'Friends', icon: UserPlus, path: '/friends' },
    { id: 'activity', label: 'Activity', icon: Activity, path: '/activity' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <PieChart className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">fyrShare</h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navigationItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={() => setSelectedGroup && setSelectedGroup(null)}
            className={({ isActive }) => 
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 px-2 mb-3">
          <Avatar user={currentUser} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{currentUser?.name || 'Guest'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email || 'Not signed in'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsModalOpen && setIsSettingsModalOpen(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;