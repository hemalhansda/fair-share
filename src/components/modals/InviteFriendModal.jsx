import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, MessageCircle, Copy, Check, Share2, Sparkles, Send, Loader, UserPlus, Search } from 'lucide-react';
import Modal from '../ui/Modal';
import emailjs from '@emailjs/browser';
import { searchUsersByEmail, addFriend } from '../../services/database';

const InviteFriendModal = ({ isOpen, onClose, currentUser, onFriendAdded }) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success' | 'error' | null
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  const [addedUsers, setAddedUsers] = useState(new Set());

  // Generate invite link (you can customize this to your actual domain)
  const appUrl = window.location.origin;
  const inviteLink = `${appUrl}/welcome?ref=${currentUser?.id || 'invite'}`;
  
  // Invite message template
  const inviteMessage = `Hey! I'm using fyrShare to split expenses and track shared costs. Join me on fyrShare!\n\n${inviteLink}`;
  
  const emailSubject = 'Join me on fyrShare - Split expenses easily!';
  const emailBody = `Hi there!\n\nI've been using fyrShare to manage shared expenses with friends and groups, and it's been amazing! You can track who owes what, split bills easily, and settle up with just a few taps.\n\nJoin me on fyrShare:\n${inviteLink}\n\nLooking forward to splitting expenses with you!\n\nBest,\n${currentUser?.name || 'Your friend'}`;

  // Debounced search for existing users
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (email && email.length >= 2 && currentUser?.id) {
        setIsSearching(true);
        const result = await searchUsersByEmail(email, currentUser.id);
        if (result.success) {
          setSearchResults(result.data);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [email, currentUser?.id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchResults([]);
      setAddedUsers(new Set());
      setEmail('');
      setSendStatus(null);
    }
  }, [isOpen]);

  const handleAddExistingUser = async (user) => {
    if (!currentUser?.id || addedUsers.has(user.id)) return;
    
    setAddingUserId(user.id);
    try {
      // Only store basic info - picture is fetched from users table for signed-up users
      const friendData = {
        name: user.name,
        email: user.email,
        avatar: user.avatar || user.name?.substring(0, 2).toUpperCase()
      };
      
      const result = await addFriend(friendData, currentUser.id);
      
      if (result.success) {
        setAddedUsers(prev => new Set([...prev, user.id]));
        if (onFriendAdded) {
          onFriendAdded(result.data);
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    } finally {
      setAddingUserId(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailShare = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on fyrShare',
          text: inviteMessage,
          url: inviteLink,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
        }
      }
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setSendStatus('error');
      setTimeout(() => setSendStatus(null), 3000);
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      // EmailJS configuration from environment variables
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      // Check if EmailJS is configured
      if (!serviceId || !templateId || !publicKey) {
        alert('Email service not configured. Please add EmailJS credentials to your .env file.');
        setIsSending(false);
        return;
      }

      const templateParams = {
        to_email: email,
        to_name: email.split('@')[0],
        from_name: currentUser?.name || 'Your friend',
        from_email: currentUser?.email || '',
        invite_link: inviteLink,
        app_name: 'fyrShare',
        message: `I've been using fyrShare to manage shared expenses with friends and groups. Join me!`
      };


      const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      
      setSendStatus('success');
      setEmail('');
      setTimeout(() => setSendStatus(null), 5000);
    } catch (error) {
      setSendStatus('error');
      setTimeout(() => setSendStatus(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="max-w-lg"
      customHeader={
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-2xl relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
          
          <div className="text-center text-white">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold mb-1">Invite Friends</h2>
            <p className="text-emerald-100 text-xs">
              Share fyrShare with friends and start splitting expenses together
            </p>
          </div>
        </div>
      }
    >
      <div className="relative">
        {/* Search & Add Existing Users Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-800">Find Existing Users</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Search by email to find friends already on fyrShare
            </p>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Search by email..."
                className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader className="w-4 h-4 animate-spin text-emerald-500" />
                </div>
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-emerald-700 font-medium">Found {searchResults.length} user{searchResults.length > 1 ? 's' : ''}:</p>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user.avatar || user.name?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddExistingUser(user)}
                      disabled={addingUserId === user.id || addedUsers.has(user.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        addedUsers.has(user.id)
                          ? 'bg-emerald-100 text-emerald-700'
                          : addingUserId === user.id
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {addedUsers.has(user.id) ? (
                        <>
                          <Check className="w-4 h-4" />
                          Added
                        </>
                      ) : addingUserId === user.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {email.length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="mt-3 text-xs text-gray-500 italic">
                No existing users found. Send them an invite below!
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-500 font-medium">NOT ON FYRSHARE?</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Send Email Invite Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Send Email Invitation</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              {email && searchResults.length === 0 
                ? `Send an invite to "${email}"` 
                : "Enter an email to send them a personalized invite"}
            </p>
            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  disabled={isSending}
                />
              </div>
              <button
                type="submit"
                disabled={isSending || !email}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  isSending || !email
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : sendStatus === 'success'
                    ? 'bg-green-500 text-white'
                    : sendStatus === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isSending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : sendStatus === 'success' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Invitation Sent!
                  </>
                ) : sendStatus === 'error' ? (
                  <>
                    <X className="w-4 h-4" />
                    Failed to Send
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-500 font-medium">OR SHARE VIA</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 rounded-xl transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-800">Share via WhatsApp</div>
              <div className="text-xs text-gray-600">Send invite to your contacts</div>
            </div>
            <Share2 className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </button>

          {/* Email */}
          <button
            onClick={handleEmailShare}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 rounded-xl transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-800">Share via Email</div>
              <div className="text-xs text-gray-600">Send a personalized invitation</div>
            </div>
            <Share2 className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </button>

          {/* Native Share (Mobile only) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 rounded-xl transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-800">More Options</div>
                <div className="text-xs text-gray-600">Share via other apps</div>
              </div>
              <Share2 className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-500 font-medium">OR COPY LINK</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Copy Link Section */}
        <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
            Your Invite Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 hover:bg-gray-900 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Share this link with anyone to invite them to fyrShare
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default InviteFriendModal;
