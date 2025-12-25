import React from 'react';

const Button = ({ children, variant = 'primary', onClick, className = '', disabled = false, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800";
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30",
    secondary: "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-gray-300",
    danger: "bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-500",
    ghost: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;