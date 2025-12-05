import React from 'react';
import { NavLink } from 'react-router-dom';
import { PieChart, LogOut, Home, Users, UserPlus, Activity, Settings } from 'lucide-react';
import Avatar from '../ui/Avatar';

const Sidebar = ({ 
  currentUser, 
  handleLogout,
  setSelectedGroup,
  setIsSettingsModalOpen
}) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'groups', label: 'Groups', icon: Users, path: '/groups' },
    { id: 'friends', label: 'Friends', icon: UserPlus, path: '/friends' },
    { id: 'activity', label: 'Activity', icon: Activity, path: '/activity' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6 flex items-center gap-2 text-emerald-600">
        <PieChart className="w-8 h-8" />
        <h1 className="text-2xl font-bold tracking-tight">fyrShare</h1>
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
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 mb-3">
          <Avatar user={currentUser} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'Guest'}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser?.email || 'Not signed in'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsModalOpen && setIsSettingsModalOpen(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
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