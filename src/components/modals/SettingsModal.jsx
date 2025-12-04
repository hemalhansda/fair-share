import React, { useState, useEffect } from 'react';
import { X, Settings, Globe } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getCurrencyOptions } from '../../services/currency';

const SettingsModal = ({ isOpen, onClose, userPreferences, onUpdatePreferences }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && userPreferences) {
      setSelectedCurrency(userPreferences.currency || 'USD');
    }
  }, [isOpen, userPreferences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onUpdatePreferences({ currency: selectedCurrency });
      onClose();
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCurrency(userPreferences?.currency || 'USD');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Settings">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Globe className="w-4 h-4 inline mr-2" />
            Preferred Currency
          </label>
          <p className="text-sm text-gray-500 mb-4">
            All expenses will be converted to your preferred currency for display. 
            The original currency will still be shown for reference.
          </p>
          
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={isSubmitting}
          >
            {getCurrencyOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Currency conversion uses live exchange rates. 
              Rates are updated hourly and may vary slightly from bank rates.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SettingsModal;