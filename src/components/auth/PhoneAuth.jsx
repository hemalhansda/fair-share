import React, { useState } from 'react';
import { Phone, ArrowRight, ArrowLeft } from 'lucide-react';

const PhoneAuth = ({ onPhoneLogin, isLoading }) => {
  const [countryCode, setCountryCode] = useState('+1');
  const [localNumber, setLocalNumber] = useState(''); // Only the local number without country code
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [error, setError] = useState('');

  // Get the full phone number in E.164 format
  const getFullPhoneNumber = () => {
    return countryCode + localNumber.replace(/\D/g, '');
  };

  const handlePhoneChange = (e) => {
    // Only allow digits in the local number field
    const cleaned = e.target.value.replace(/\D/g, '');
    setLocalNumber(cleaned);
    setError('');
  };

  const handleCountryCodeChange = (e) => {
    const code = e.target.value;
    setCountryCode(code);
    // Keep the local number when changing country code
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    // Validate the local number length based on country
    const minLocalLength = countryCode === '+1' ? 10 : 10; // Most countries need at least 10 digits
    
    if (localNumber.length < minLocalLength) {
      setError('Please enter a valid phone number');
      return;
    }

    // Get full phone number in E.164 format
    const e164Phone = getFullPhoneNumber();

    try {
      await onPhoneLogin({ phone: e164Phone, type: 'sendOTP' });
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    const e164Phone = getFullPhoneNumber();

    try {
      await onPhoneLogin({ phone: e164Phone, otp, type: 'verifyOTP' });
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto px-2 sm:px-0">
      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} className="space-y-3 sm:space-y-4">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">Sign in with Phone</h3>
            <p className="text-xs sm:text-sm text-gray-600">Enter your phone number to receive a verification code</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={countryCode}
                onChange={handleCountryCodeChange}
                className="w-full sm:w-auto px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base bg-white min-w-0 shrink-0"
                disabled={isLoading}
              >
                <option value="+1">🇺🇸 +1</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+81">🇯🇵 +81</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+55">🇧🇷 +55</option>
                <option value="+52">🇲🇽 +52</option>
              </select>
              <input
                type="tel"
                id="phone"
                value={localNumber}
                onChange={handlePhoneChange}
                placeholder={countryCode === '+91' ? '9876543210' : countryCode === '+1' ? '5551234567' : 'Phone number'}
                className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base min-w-0"
                disabled={isLoading}
                autoComplete="tel-national"
                inputMode="numeric"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || localNumber.length < 10}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send Verification Code</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-3 sm:space-y-4">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">Enter Verification Code</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              We sent a 6-digit code to<br />
              <span className="font-medium text-gray-800">{countryCode} {localNumber}</span>
            </p>
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-xl sm:text-2xl tracking-widest font-mono"
              disabled={isLoading}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Change Phone Number</span>
            </button>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Didn't receive code? Resend
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneAuth;
