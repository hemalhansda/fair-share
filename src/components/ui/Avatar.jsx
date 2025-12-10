import React from 'react';

const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  if (!user) return <div className={`${sizeClasses[size]} bg-gray-200 rounded-full ${className}`} />;

  // Show Google profile picture if available
  if (user.picture) {
    return (
      <img 
        src={user.picture} 
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full border-2 border-white shadow-sm object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border-2 border-white shadow-sm ${className}`}>
      {user.avatar}
    </div>
  );
};

export default Avatar;