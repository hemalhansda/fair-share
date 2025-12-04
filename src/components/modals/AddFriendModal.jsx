import React, { useState } from 'react';
import { UserPlus, Mail } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const AddFriendModal = ({ 
  isOpen, 
  onClose, 
  onAddFriend 
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    setIsLoading(true);
    try {
      await onAddFriend({
        email: email.trim().toLowerCase(),
        name: name.trim()
      });
      handleClose();
    } catch (error) {
      console.error('Failed to add friend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setIsLoading(false);
    onClose();
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isFormValid = name.trim() && email.trim() && isValidEmail(email.trim());

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Friend">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">
            Add a friend to start splitting expenses together
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Friend's Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter their name"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="friend@example.com"
              required
              disabled={isLoading}
            />
          </div>
          {email.trim() && !isValidEmail(email.trim()) && (
            <p className="mt-1 text-xs text-red-600">Please enter a valid email address</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works</p>
              <p>Your friend will receive an invitation to join FairShare. Once they sign up with this email, you'll be connected automatically.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleClose} 
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!isFormValid || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddFriendModal;