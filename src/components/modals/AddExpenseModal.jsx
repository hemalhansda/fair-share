import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const AddExpenseModal = ({ 
  isOpen, 
  onClose, 
  users, 
  currentUser, 
  groups,
  onAddExpense 
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUser?.id || '');
  const [splitWith, setSplitWith] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [splitMethod, setSplitMethod] = useState('equal');
  const [customSplits, setCustomSplits] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || splitWith.length === 0) return;

    const expense = {
      description: description.trim(),
      amount: parseFloat(amount),
      paid_by: paidBy,
      group_id: groupId || null,
      split_with: splitWith,
      split_method: splitMethod,
      custom_splits: splitMethod === 'custom' ? customSplits : null
    };

    onAddExpense(expense);
    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setPaidBy(currentUser?.id || '');
    setSplitWith([]);
    setGroupId('');
    setSplitMethod('equal');
    setCustomSplits({});
    onClose();
  };

  const toggleSplitWith = (userId) => {
    setSplitWith(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCustomSplitChange = (userId, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: parseFloat(value) || 0
    }));
  };

  const availableUsers = groupId 
    ? users.filter(user => {
        const group = groups.find(g => g.id === groupId);
        return group?.members?.includes(user.id);
      })
    : users;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What was this expense for?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paid by
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group (optional)
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split with
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableUsers.map(user => (
              <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitWith.includes(user.id)}
                  onChange={() => toggleSplitWith(user.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Avatar user={user} size="sm" />
                <span className="text-sm font-medium text-gray-800">{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        {splitWith.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split method
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="equal"
                  checked={splitMethod === 'equal'}
                  onChange={(e) => setSplitMethod(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Equal split</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="custom"
                  checked={splitMethod === 'custom'}
                  onChange={(e) => setSplitMethod(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Custom amounts</span>
              </label>
            </div>

            {splitMethod === 'custom' && (
              <div className="mt-3 space-y-2">
                {splitWith.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return (
                    <div key={userId} className="flex items-center gap-3">
                      <Avatar user={user} size="sm" />
                      <span className="text-sm flex-1">{user?.name}</span>
                      <div className="relative w-24">
                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                          type="number"
                          value={customSplits[userId] || ''}
                          onChange={(e) => handleCustomSplitChange(userId, e.target.value)}
                          className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!description.trim() || !amount || splitWith.length === 0}
            className="flex-1"
          >
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddExpenseModal;