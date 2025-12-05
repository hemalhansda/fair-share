import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alert, setAlert] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    autoClose: true,
    duration: 5000
  });

  const showAlert = useCallback(({
    title = '',
    message,
    type = 'info',
    autoClose = true,
    duration = 5000
  }) => {
    setAlert({
      isOpen: true,
      title,
      message,
      type,
      autoClose,
      duration
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, title = 'Success') => {
    showAlert({ title, message, type: 'success' });
  }, [showAlert]);

  const showError = useCallback((message, title = 'Error') => {
    showAlert({ title, message, type: 'error', autoClose: false });
  }, [showAlert]);

  const showWarning = useCallback((message, title = 'Warning') => {
    showAlert({ title, message, type: 'warning' });
  }, [showAlert]);

  const showInfo = useCallback((message, title = 'Info') => {
    showAlert({ title, message, type: 'info' });
  }, [showAlert]);

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};