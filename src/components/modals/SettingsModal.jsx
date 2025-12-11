import React, { useState, useEffect } from 'react';
import { X, Settings, Globe, LogOut, Info, Code, Heart, ExternalLink, Mail, Github, Linkedin } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getCurrencyOptions } from '../../services/currency';

const SettingsModal = ({ isOpen, onClose, userPreferences, onUpdatePreferences, handleLogout }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

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
      setActiveTab('settings');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      {/* Custom Header with Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
              activeTab === 'settings'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
              activeTab === 'about'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Info className="w-4 h-4" />
            About
          </button>
        </div>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
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
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {/* App Info */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                fS
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">fyrShare</h3>
                <p className="text-sm text-emerald-600 font-semibold">Split expenses, share fairly</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              fyrShare makes splitting expenses with friends and groups effortless. Track who paid what, 
              split bills fairly, and settle up with ease. Support for multiple currencies with real-time 
              conversion ensures accurate expense tracking wherever you are.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600" />
              Key Features
            </h4>
            <div className="grid gap-2">
              {[
                '💰 Multi-currency support with live exchange rates',
                '👥 Create groups and manage expenses together',
                '📊 Real-time balance calculations',
                '🔄 Split expenses equally or by custom amounts',
                '📱 Responsive design for all devices',
                '🔒 Secure Google OAuth authentication'
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Developer Info */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-red-500" />
              <h4 className="font-bold text-gray-800">Developed By</h4>
            </div>
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-lg text-gray-800">Hemaal Hansda</h5>
                <p className="text-sm text-gray-600 mt-1">Full Stack Developer & Designer</p>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                A passionate developer crafting intuitive and beautiful web applications. 
                Specializing in modern web technologies, user experience design, and building 
                products that solve real-world problems.
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.hemaalhansda.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 rounded-lg border border-gray-200 hover:border-emerald-200 transition-all text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Portfolio
                </a>
                <a
                  href="https://github.com/hemalhansda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-800 text-gray-700 hover:text-white rounded-lg border border-gray-200 hover:border-gray-800 transition-all text-sm font-medium"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/hemaalhansda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-lg border border-gray-200 hover:border-blue-600 transition-all text-sm font-medium"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600" />
              Built With
            </h4>
            <div className="flex flex-wrap gap-2">
              {['React', 'Vite', 'Tailwind CSS', 'Supabase', 'PostgreSQL'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} fyrShare. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Made with <Heart className="w-3 h-3 inline text-red-500" /> by Hemaal Hansda
            </p>
          </div>
        </div>
      )}

      {/* Logout Button - Show on Settings tab only */}
      {activeTab === 'settings' && handleLogout && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              handleLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </Modal>
  );
};

export default SettingsModal;