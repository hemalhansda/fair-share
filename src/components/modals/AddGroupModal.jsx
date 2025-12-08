import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const AddGroupModal = ({ 
  isOpen, 
  onClose, 
  users, 
  currentUser,
  onAddGroup 
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('General');
  const [selectedMembers, setSelectedMembers] = useState([currentUser?.id || '']);
  const [emailInput, setEmailInput] = useState('');

  const groupTypes = [
    'Trip', 'Home', 'General', 'Entertainment', 
    'Food & Dining', 'Transportation', 'Shopping'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    // Always include current user in members
    const allMembers = currentUser ? [currentUser.id, ...selectedMembers] : selectedMembers;
    let uniqueMembers = [...new Set(allMembers)]; // Remove duplicates
    
    // Add email if provided
    if (emailInput.trim() && emailInput.includes('@')) {
      uniqueMembers.push(emailInput.trim().toLowerCase());
    }

    const group = {
      name: groupName.trim(),
      type: groupType,
      members: uniqueMembers,
      created_by: currentUser?.id
    };

    onAddGroup(group);
    handleClose();
  };

  const handleClose = () => {
    setGroupName('');
    setGroupType('General');
    setSelectedMembers([currentUser?.id || '']);
    setEmailInput('');
    onClose();
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };



  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Group">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter group name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={groupType}
            onChange={(e) => setGroupType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {groupTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Add Members
          </label>
          
          {/* Simple email input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Add member by email (optional)
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Always show current user first */}
            {currentUser && (
              <label className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <Avatar user={currentUser} size="sm" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800">
                    {currentUser.name} (You)
                  </span>
                  <div className="text-xs text-gray-500">{currentUser.email}</div>
                </div>
              </label>
            )}
            
            {/* Show other users (friends) */}
            {users.filter(user => user.id !== currentUser?.id).map(user => {
              const isSelected = selectedMembers.includes(user.id);
              
              return (
                <label 
                  key={user.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMember(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Avatar user={user} size="sm" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">
                      {user.name}
                    </span>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </label>
              );
            })}
          </div>
          
          {(selectedMembers.length > 0 || currentUser) && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">
                Selected members ({selectedMembers.length + (currentUser ? 1 : 0)}{emailInput.trim() && emailInput.includes('@') ? ' + 1 email' : ''})
              </div>
              <div className="flex flex-wrap gap-1">
                {/* Always show current user first */}
                {currentUser && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {currentUser.name} (You)
                  </span>
                )}
                {/* Show other selected members */}
                {selectedMembers.map(userId => {
                  const user = users.find(u => u.id === userId) || currentUser;
                  return user && user.id !== currentUser?.id ? (
                    <span key={userId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {user.name}
                      <button
                        type="button"
                        onClick={() => toggleMember(userId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
                {/* Show email if entered */}
                {emailInput.trim() && emailInput.includes('@') && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {emailInput.trim()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!groupName.trim()}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddGroupModal;