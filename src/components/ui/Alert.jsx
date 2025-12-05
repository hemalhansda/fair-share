import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

const Alert = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  autoClose = true,
  duration = 5000 
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, duration, onClose]);

  if (!isOpen) return null;

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          button: 'text-green-600 hover:text-green-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          button: 'text-red-600 hover:text-red-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          button: 'text-yellow-600 hover:text-yellow-800'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          button: 'text-blue-600 hover:text-blue-800'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`max-w-md w-full ${styles.bg} border rounded-lg shadow-lg p-6 transform transition-all duration-200 ease-out`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={`text-sm font-semibold ${styles.text} mb-1`}>
                {title}
              </h3>
            )}
            <p className={`text-sm ${styles.text}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${styles.button} hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;