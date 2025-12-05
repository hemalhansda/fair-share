import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { CURRENCIES, getCurrencyOptions, getCurrencySymbol } from '../../services/currency';

const AddExpenseModal = ({ 
  isOpen, 
  onClose, 
  users, 
  currentUser, 
  groups,
  onAddExpense,
  selectedGroup = null // Pre-selected group when adding expense from group detail view
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paidBy, setPaidBy] = useState(currentUser?.id || '');
  const [splitWith, setSplitWith] = useState([]);
  const [groupId, setGroupId] = useState(selectedGroup?.id || '');
  const [splitMethod, setSplitMethod] = useState('equal');
  const [customSplits, setCustomSplits] = useState({});
  const [customSplitType, setCustomSplitType] = useState('amount'); // 'amount' or 'percentage'
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]); // Today's date
  const [expenseTime, setExpenseTime] = useState(new Date().toTimeString().slice(0, 5)); // Current time

  // Update groupId when selectedGroup changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setGroupId(selectedGroup?.id || '');
      // If we have a selected group, auto-populate split with all group members
      if (selectedGroup?.members) {
        setSplitWith(selectedGroup.members);
      }
    }
  }, [isOpen, selectedGroup]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || splitWith.length === 0 || !isCustomSplitValid()) return;

    // Calculate actual split amounts for each user
    let finalSplits = {};
    
    if (splitMethod === 'custom') {
      if (customSplitType === 'percentage') {
        // Convert percentages to actual amounts
        const expenseAmount = parseFloat(amount);
        splitWith.forEach(userId => {
          const percentage = customSplits[userId] || 0;
          finalSplits[userId] = (expenseAmount * percentage) / 100;
        });
      } else {
        // Use amounts directly
        finalSplits = { ...customSplits };
      }
    } else {
      // Equal split
      const expenseAmount = parseFloat(amount);
      const splitAmount = expenseAmount / splitWith.length;
      splitWith.forEach(userId => {
        finalSplits[userId] = splitAmount;
      });
    }

    // Create datetime from date and time inputs
    const expenseDateTime = new Date(`${expenseDate}T${expenseTime}`);
    
    const expense = {
      description: description.trim(),
      amount: parseFloat(amount),
      currency: currency,
      paid_by: paidBy,
      group_id: groupId || null,
      split_with: splitWith,
      split_method: splitMethod,
      custom_splits: splitMethod === 'custom' ? finalSplits : null,
      custom_split_type: splitMethod === 'custom' ? customSplitType : null,
      date: expenseDateTime.toISOString() // Store as ISO string
    };

    onAddExpense(expense);
    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setCurrency('USD');
    setPaidBy(currentUser?.id || '');
    setSplitWith([]);
    setGroupId('');
    setSplitMethod('equal');
    setCustomSplits({});
    setCustomSplitType('amount');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseTime(new Date().toTimeString().slice(0, 5));
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

  // Calculate total of custom splits
  const getTotalCustomSplits = () => {
    return Object.values(customSplits).reduce((sum, val) => sum + (val || 0), 0);
  };

  // Check if custom splits are valid
  const isCustomSplitValid = () => {
    if (splitMethod !== 'custom') return true;
    
    const total = getTotalCustomSplits();
    const expenseAmount = parseFloat(amount) || 0;
    
    if (customSplitType === 'percentage') {
      return Math.abs(total - 100) < 0.01; // Allow for small floating point differences
    } else {
      return Math.abs(total - expenseAmount) < 0.01;
    }
  };

  // Get the difference for validation display
  const getCustomSplitDifference = () => {
    if (splitMethod !== 'custom') return 0;
    
    const total = getTotalCustomSplits();
    const expenseAmount = parseFloat(amount) || 0;
    
    if (customSplitType === 'percentage') {
      return 100 - total;
    } else {
      return expenseAmount - total;
    }
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getCurrencyOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.value} - {option.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Time Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={expenseTime}
              onChange={(e) => setExpenseTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            Group {selectedGroup ? '' : '(optional)'}
          </label>
          {selectedGroup ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 flex items-center gap-2">
              <span className="text-sm font-medium">{selectedGroup.name}</span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {selectedGroup.type}
              </span>
            </div>
          ) : (
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
          )}
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
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {/* Split Type Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Split by
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="amount"
                        checked={customSplitType === 'amount'}
                        onChange={(e) => {
                          setCustomSplitType(e.target.value);
                          setCustomSplits({}); // Reset splits when switching type
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Amount ({getCurrencySymbol(currency)})</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="percentage"
                        checked={customSplitType === 'percentage'}
                        onChange={(e) => {
                          setCustomSplitType(e.target.value);
                          setCustomSplits({}); // Reset splits when switching type
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Percentage (%)</span>
                    </label>
                  </div>
                </div>

                {/* Members Split Input */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Enter {customSplitType === 'amount' ? 'amounts' : 'percentages'} for each member:
                  </div>
                  
                  {splitWith.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return (
                      <div key={userId} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <Avatar user={user} size="sm" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800">{user?.name}</span>
                        </div>
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            {customSplitType === 'amount' ? getCurrencySymbol(currency) : '%'}
                          </span>
                          <input
                            type="number"
                            value={customSplits[userId] || ''}
                            onChange={(e) => handleCustomSplitChange(userId, e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={customSplitType === 'amount' ? '0.00' : '0'}
                            step={customSplitType === 'amount' ? '0.01' : '1'}
                            min="0"
                            max={customSplitType === 'percentage' ? '100' : undefined}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Validation Summary */}
                <div className="mt-4 p-3 rounded-lg border-l-4 border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Total {customSplitType === 'amount' ? 'amount' : 'percentage'}:
                    </span>
                    <span className={`font-medium ${isCustomSplitValid() ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {customSplitType === 'amount' 
                        ? `${getCurrencySymbol(currency)}${getTotalCustomSplits().toFixed(2)}`
                        : `${getTotalCustomSplits().toFixed(1)}%`
                      }
                    </span>
                  </div>
                  
                  {!isCustomSplitValid() && (
                    <div className="mt-2 text-sm">
                      <span className="text-orange-600">
                        {customSplitType === 'amount' ? (
                          getCustomSplitDifference() > 0 
                            ? `Missing ${getCurrencySymbol(currency)}${Math.abs(getCustomSplitDifference()).toFixed(2)}`
                            : `Excess of ${getCurrencySymbol(currency)}${Math.abs(getCustomSplitDifference()).toFixed(2)}`
                        ) : (
                          getCustomSplitDifference() > 0 
                            ? `Missing ${Math.abs(getCustomSplitDifference()).toFixed(1)}%`
                            : `Excess of ${Math.abs(getCustomSplitDifference()).toFixed(1)}%`
                        )}
                      </span>
                    </div>
                  )}
                  
                  {isCustomSplitValid() && (
                    <div className="mt-2 text-sm text-emerald-600">
                      ✓ Split is balanced
                    </div>
                  )}
                </div>
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
            disabled={!description.trim() || !amount || splitWith.length === 0 || !isCustomSplitValid()}
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