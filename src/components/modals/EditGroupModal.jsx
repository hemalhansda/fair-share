import React, { useState, useEffect } from 'react';
import { X, Users, Save, AlertCircle, User } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const EditGroupModal = ({ isOpen, onClose, group, users, currentUser, onEditGroup }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'General',
    members: []
  });
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const groupTypes = [
    'Trip', 'Home', 'General', 'Entertainment', 
    'Food & Dining', 'Transportation', 'Shopping'
  ];

  // Reset form when modal opens/closes or group changes
  useEffect(() => {
    if (isOpen && group) {
      setFormData({
        name: group.name || '',
        type: group.type || 'General',
        members: group.members || []
      });
      setEmailInput('');
      setError('');
    }
  }, [isOpen, group]);

  const handleMemberToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  const handleAddEmailMember = () => {
    if (emailInput.trim() && emailInput.includes('@')) {
      const email = emailInput.trim().toLowerCase();
      // Check if email is already in the members list
      if (!formData.members.includes(email)) {
        setFormData(prev => ({
          ...prev,
          members: [...prev.members, email]
        }));
      }
      setEmailInput('');
    }
  };

  const handleEmailKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmailMember();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (formData.members.length < 1) {
      setError('Please select at least one other member');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const groupData = {
        name: formData.name.trim(),
        type: formData.type,
        members: formData.members
      };

      await onEditGroup(group.id, groupData);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        type: 'General',
        members: []
      });
      setEmailInput('');
    } catch (error) {
      setError(error.message || 'Failed to update group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError('');
      setFormData({
        name: '',
        type: 'General',
        members: []
      });
    }
  };

  if (!group) return null;

  const availableUsers = users.filter(u => u.id !== currentUser?.id);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Group">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter group name"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={isSubmitting}
          >
            {groupTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Users size={16} className="inline mr-1" />
            Members ({formData.members.length + 1} selected)
          </label>
          
          {/* Email input for adding new users */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Add member by email (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleEmailKeyPress}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter email address and press Enter"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                onClick={handleAddEmailMember}
                disabled={!emailInput.trim() || !emailInput.includes('@') || isSubmitting}
                size="sm"
                variant="secondary"
              >
                Add
              </Button>
            </div>
          </div>
          
          {/* Current user (always included) */}
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar user={currentUser} />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{currentUser?.name} (You)</div>
                <div className="text-xs text-gray-500">{currentUser?.email}</div>
              </div>
              <div className="text-emerald-600 font-medium">Owner</div>
            </div>
          </div>

          {/* Other users */}
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {availableUsers.map(user => (
              <label 
                key={user.id} 
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.members.includes(user.id)}
                  onChange={() => handleMemberToggle(user.id)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  disabled={isSubmitting}
                />
                <Avatar user={user} />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </label>
            ))}
            
            {/* Email members */}
            {formData.members.filter(member => typeof member === 'string' && member.includes('@')).map(email => (
              <div
                key={email}
                className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{email}</div>
                  <div className="text-xs text-gray-500">Invited by email</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMemberToggle(email)}
                  className="text-red-500 hover:text-red-700"
                  disabled={isSubmitting}
                >
                  Remove
                </Button>
              </div>
            ))}
            
            {availableUsers.length === 0 && formData.members.filter(member => typeof member === 'string' && member.includes('@')).length === 0 && (
              <div className="p-4 text-center text-gray-400">
                <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No friends available</p>
                <p className="text-xs">Add friends first to include them in groups</p>
              </div>
            )}
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
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Update Group
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditGroupModal;