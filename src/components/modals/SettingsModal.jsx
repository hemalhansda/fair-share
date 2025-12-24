import React, { useState, useEffect } from 'react';
import { X, Settings, Globe, LogOut, Info, Code, Heart, ExternalLink, Mail, Github, Linkedin, Phone, User, Camera, Link as LinkIcon } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getCurrencyOptions } from '../../services/currency';
import PhoneAuth from '../auth/PhoneAuth';

const SettingsModal = ({ isOpen, onClose, userPreferences, onUpdatePreferences, handleLogout, currentUser, onUpdateUser, handlePhoneLogin, isPhoneLoading, handleGoogleLogin, isGoogleLoading }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [showPhoneLink, setShowPhoneLink] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');

  useEffect(() => {
    if (isOpen && userPreferences) {
      setSelectedCurrency(userPreferences.currency || 'USD');
    }
    if (isOpen && currentUser) {
      setEditedName(currentUser.name || '');
      setProfileImageUrl(currentUser.picture || '');
    }
  }, [isOpen, userPreferences, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onUpdatePreferences({ currency: selectedCurrency });
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCurrency(userPreferences?.currency || 'USD');
      setActiveTab('settings');
      setShowPhoneLink(false);
      setIsEditingProfile(false);
      onClose();
    }
  };

  const handlePhoneLinkComplete = async (data) => {
    setShowPhoneLink(false);
    if (onUpdateUser) {
      await onUpdateUser(data);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (onUpdateUser) {
      await onUpdateUser({
        name: editedName,
        picture: profileImageUrl,
        profileImage
      });
      setIsEditingProfile(false);
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
        <div className="space-y-6">
          {/* Account Management Section */}
          <div className="pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Account
            </h3>
            
            {/* Profile Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser?.avatar || 'U'}</span>
                    )}
                  </div>
                  {isEditingProfile && (
                    <label className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200">
                      <Camera className="w-3 h-3 text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800">{currentUser?.name}</p>
                      <p className="text-sm text-gray-500">{currentUser?.email}</p>
                      {currentUser?.phone && (
                        <p className="text-sm text-gray-500">{currentUser.phone}</p>
                      )}
                    </>
                  )}
                </div>
                <div>
                  {isEditingProfile ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleProfileUpdate}
                        className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Link Phone/Google */}
            {!showPhoneLink && (
              <div className="space-y-2">
                {!currentUser?.phone && (
                  <button
                    onClick={() => setShowPhoneLink(true)}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">Add Phone Number</p>
                        <p className="text-xs text-gray-600">Link your phone for additional login method</p>
                      </div>
                    </div>
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                  </button>
                )}

                {/* Only show Link Google if user logged in via phone (no google_id and has phone-generated email) */}
                {!currentUser?.google_id && currentUser?.email?.includes('@phone.user') && (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">
                          {isGoogleLoading ? 'Connecting...' : 'Link Google Account'}
                        </p>
                        <p className="text-xs text-gray-600">Connect Google for faster sign-in</p>
                      </div>
                    </div>
                    <LinkIcon className="w-5 h-5 text-red-600" />
                  </button>
                )}
              </div>
            )}

            {/* Phone Link Form */}
            {showPhoneLink && (
              <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Add Phone Number</h4>
                  <button
                    onClick={() => setShowPhoneLink(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <PhoneAuth
                  onPhoneLogin={async (data) => {
                    await handlePhoneLogin(data);
                    // Only complete the linking after OTP verification
                    if (data.type === 'verifyOTP') {
                      handlePhoneLinkComplete({ phone: data.phone });
                    }
                  }}
                  isLoading={isPhoneLoading}
                />
              </div>
            )}
          </div>

          {/* Currency Settings */}
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
        </div>
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