import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, UserPlus, Activity } from 'lucide-react';

const MobileNavigation = ({ setSelectedGroup }) => {
  const navigationItems = [
    { id: 'dashboard', icon: Home, path: '/dashboard' },
    { id: 'groups', icon: Users, path: '/groups' },
    { id: 'friends', icon: UserPlus, path: '/friends' },
    { id: 'activity', icon: Activity, path: '/activity' },
  ];

  return (
    <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around p-3 fixed bottom-0 w-full z-20 safe-area-bottom">
      {navigationItems.map(item => (
        <NavLink
          key={item.id}
          to={item.path}
          onClick={() => setSelectedGroup && setSelectedGroup(null)}
          className={({ isActive }) => 
            `p-2 rounded-xl transition-colors ${
              isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
            }`
          }
        >
          <item.icon size={24} />
        </NavLink>
      ))}
    </div>
  );
};

export default MobileNavigation;