import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'info'
  });

  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info'
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          onConfirm?.();
          resolve(true);
        },
        confirmText,
        cancelText,
        variant
      });
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const confirmDelete = useCallback((itemName, onConfirm) => {
    return showConfirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      onConfirm,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
  }, [showConfirm]);

  return {
    confirmState,
    showConfirm,
    hideConfirm,
    confirmDelete
  };
};