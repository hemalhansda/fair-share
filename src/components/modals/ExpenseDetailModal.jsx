import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Users, Receipt, DollarSign, Edit, Save, XCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { updateExpense } from '../../services/database';

const ExpenseDetailModal = ({ 
  isOpen, 
  onClose, 
  expense, 
  users, 
  currentUser,
  userCurrency = 'USD',
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedExpense, setEditedExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedAmounts, setConvertedAmounts] = useState({});
  const [isConverting, setIsConverting] = useState(false);
  const [customSplitMode, setCustomSplitMode] = useState('amount'); // 'amount' or 'percentage'

  // Initialize edited expense when modal opens
  useEffect(() => {
    if (expense && isOpen) {
      const splitWith = expense.expense_splits?.map(split => split.user_id) || [];
      const customSplits = {};
      
      // Initialize custom splits from existing data
      expense.expense_splits?.forEach(split => {
        customSplits[split.user_id] = parseFloat(split.amount) || 0;
      });
      
      // Parse existing date or use current date/time
      const existingDate = expense.created_at || expense.date || new Date().toISOString();
      const dateObj = new Date(existingDate);
      const dateStr = dateObj.toISOString().split('T')[0];
      const timeStr = dateObj.toTimeString().slice(0, 5);
      
      setEditedExpense({
        description: expense.description,
        amount: expense.amount,
        paid_by: expense.paid_by || expense.paidBy,
        group_id: expense.group_id || expense.groupId,
        category: expense.category || 'General',
        split_with: splitWith,
        split_method: 'equal', // Default to equal split
        custom_splits: customSplits,
        date: dateStr,
        time: timeStr
      });
      setIsEditing(false);
    }
  }, [expense, isOpen]);

  // Convert currency for all amounts when modal opens or currency changes
  useEffect(() => {
    const convertAllAmounts = async () => {
      if (!expense || !isOpen) {
        setConvertedAmounts({});
        return;
      }

      const expenseOriginalCurrency = expense.currency || 'USD';
      const splits = expense.expense_splits || [];
      const totalSplitMembers = splits.length;
      
      if (expenseOriginalCurrency === userCurrency) {
        setConvertedAmounts({});
        return;
      }

      setIsConverting(true);
      try {
        const conversions = {};
        
        // Convert main expense amount
        const mainResult = await convertCurrency(expense.amount, expenseOriginalCurrency, userCurrency);
        if (mainResult.success) {
          conversions.mainAmount = mainResult.amount;
        }

        // Convert split amounts
        for (const split of splits) {
          const splitAmount = parseFloat(split.amount) || (expense.amount / totalSplitMembers);
          const splitResult = await convertCurrency(splitAmount, expenseOriginalCurrency, userCurrency);
          if (splitResult.success) {
            conversions[`split_${split.user_id}`] = splitResult.amount;
          }
        }

        // Convert average amount
        const avgAmount = expense.amount / totalSplitMembers;
        const avgResult = await convertCurrency(avgAmount, expenseOriginalCurrency, userCurrency);
        if (avgResult.success) {
          conversions.averageAmount = avgResult.amount;
        }

        setConvertedAmounts(conversions);
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setConvertedAmounts({});
      } finally {
        setIsConverting(false);
      }
    };

    convertAllAmounts();
  }, [expense, isOpen, userCurrency]);

  // Early return after all hooks are declared
  if (!expense) return null;

  // Handle both old and new data formats
  const paidById = expense.paid_by || expense.paidBy;
  const expenseDate = expense.created_at || expense.date;
  const groupId = expense.group_id || expense.groupId;
  const expenseOriginalCurrency = expense.currency || 'USD';
  
  // Get payer information
  let paidByUser;
  if (expense.paid_by_user) {
    paidByUser = expense.paid_by_user;
  } else {
    paidByUser = users?.find(u => u.id === paidById) || { name: 'Unknown User', id: paidById };
  }

  // Get split information
  const splits = expense.expense_splits || [];
  const totalSplitMembers = splits.length;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle save changes
  const handleSave = async () => {
    if (!editedExpense) return;

    // Validate that at least one person is selected for split
    if (!editedExpense.split_with || editedExpense.split_with.length === 0) {
      alert('Please select at least one person to split the expense with.');
      return;
    }

    // Validate amount
    if (!editedExpense.amount || editedExpense.amount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    // Validate description
    if (!editedExpense.description || editedExpense.description.trim() === '') {
      alert('Please enter a description for the expense.');
      return;
    }

    // Validate custom split totals if using custom method
    if (editedExpense.split_method === 'custom') {
      if (customSplitMode === 'amount') {
        const customSplitTotal = Object.values(editedExpense.custom_splits || {})
          .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
        
        if (Math.abs(customSplitTotal - editedExpense.amount) > 0.01) {
          alert(`Custom split total ($${customSplitTotal.toFixed(2)}) must equal the expense amount ($${editedExpense.amount.toFixed(2)}).`);
          return;
        }
      } else {
        const percentageTotal = Object.values(editedExpense.custom_splits || {})
          .reduce((sum, percentage) => sum + (parseFloat(percentage) || 0), 0);
        
        if (Math.abs(percentageTotal - 100) > 0.1) {
          alert(`Custom split percentages must total 100%. Current total: ${percentageTotal.toFixed(1)}%`);
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      // Create datetime from date and time inputs
      const expenseDateTime = new Date(`${editedExpense.date}T${editedExpense.time}`);
      const updatedExpenseData = {
        ...editedExpense,
        date: expenseDateTime.toISOString() // Store as ISO string
      };
      
      const result = await updateExpense(expense.id, updatedExpenseData);
      
      if (result.success) {
        setIsEditing(false);
        if (onUpdate) {
          onUpdate(result.data);
        }
      } else {
        alert('Failed to update expense: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    const splitWith = expense.expense_splits?.map(split => split.user_id) || [];
    const customSplits = {};
    
    // Reset custom splits from existing data
    expense.expense_splits?.forEach(split => {
      customSplits[split.user_id] = parseFloat(split.amount) || 0;
    });
    
    // Parse existing date or use current date/time
    const existingDate = expense.created_at || expense.date || new Date().toISOString();
    const dateObj = new Date(existingDate);
    const dateStr = dateObj.toISOString().split('T')[0];
    const timeStr = dateObj.toTimeString().slice(0, 5);
    
    setEditedExpense({
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paid_by || expense.paidBy,
      group_id: expense.group_id || expense.groupId,
      category: expense.category || 'General',
      split_with: splitWith,
      split_method: 'equal',
      custom_splits: customSplits,
      date: dateStr,
      time: timeStr
    });
    setIsEditing(false);
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    setEditedExpense(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      customHeader={
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Expense' : 'Expense Details'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                  title="Edit expense"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors text-sm font-medium"
                  title="Save changes"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                  title="Cancel editing"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center pb-4 border-b border-gray-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editedExpense?.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="text-xl font-bold text-gray-800 mb-2 w-full text-center bg-transparent border-b-2 border-blue-300 focus:border-blue-500 outline-none"
              placeholder="Expense description"
            />
          ) : (
            <h3 className="text-xl font-bold text-gray-800 mb-2">{expense.description}</h3>
          )}
          {isEditing ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg text-gray-600">$</span>
              <input
                type="number"
                step="0.01"
                value={editedExpense?.amount || ''}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                className="text-2xl font-bold text-emerald-600 bg-transparent border-b-2 border-emerald-300 focus:border-emerald-500 outline-none text-center w-32"
                placeholder="0.00"
              />
            </div>
          ) : (
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(expense.amount, expenseOriginalCurrency)}
            </div>
          )}
          {expenseOriginalCurrency !== userCurrency && (
            <div className="text-sm text-gray-500 mt-1">
              {isConverting ? (
                <span>Converting...</span>
              ) : (
                <>≈ {formatCurrency(convertedAmounts.mainAmount || expense.amount, userCurrency)} (in your currency)</>
              )}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Paid By */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <User className="w-4 h-4" />
              Paid by
            </div>
            {isEditing ? (
              <select
                value={editedExpense?.paid_by || ''}
                onChange={(e) => handleChange('paid_by', e.target.value)}
                className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">Select who paid</option>
                {users?.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.id === currentUser?.id ? 'You' : user.name} ({user.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar user={paidByUser} size="sm" />
                <div>
                  <div className="font-medium text-gray-800">
                    {paidById === currentUser?.id ? 'You' : paidByUser?.name}
                  </div>
                  <div className="text-xs text-gray-500">{paidByUser?.email}</div>
                </div>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="date"
                  value={editedExpense?.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                />
                <input
                  type="time"
                  value={editedExpense?.time || ''}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                />
              </div>
            ) : (
              <div className="text-sm text-gray-800">
                {formatDate(expenseDate)}
              </div>
            )}
          </div>
        </div>

        {/* Category & Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Receipt className="w-4 h-4" />
              Category
            </div>
            {isEditing ? (
              <select
                value={editedExpense?.category || 'General'}
                onChange={(e) => handleChange('category', e.target.value)}
                className="text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none"
              >
                <option value="General">General</option>
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Travel">Travel</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <div className="text-sm text-gray-800">
                {expense.category || 'General'}
              </div>
            )}
          </div>

          {/* Group */}
          {expense.groups && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <Users className="w-4 h-4" />
                Group
              </div>
              <div className="text-sm text-gray-800">
                {expense.groups.name}
                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                  {expense.groups.type}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Split Members - Editable in edit mode */}
        {isEditing && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="w-4 h-4" />
                Split between group members
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleChange('split_method', 'equal');
                    setCustomSplitMode('amount');
                  }}
                  className={`px-3 py-1 text-xs rounded ${
                    editedExpense?.split_method === 'equal'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  Equal Split
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('split_method', 'custom');
                    // Initialize custom splits when switching to custom
                    const currentSplitWith = editedExpense?.split_with || [];
                    if (currentSplitWith.length > 0) {
                      const initialSplits = {};
                      const equalAmount = (editedExpense?.amount || 0) / currentSplitWith.length;
                      const equalPercentage = 100 / currentSplitWith.length;
                      
                      currentSplitWith.forEach(userId => {
                        initialSplits[userId] = customSplitMode === 'amount' ? equalAmount : equalPercentage;
                      });
                      
                      handleChange('custom_splits', initialSplits);
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded ${
                    editedExpense?.split_method === 'custom'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  Custom Split
                </button>
              </div>
            </div>
            
            {/* Custom Split Mode Toggle */}
            {editedExpense?.split_method === 'custom' && (
              <div className="mb-4">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSplitMode('amount');
                      // Convert percentages to amounts
                      const currentSplits = editedExpense?.custom_splits || {};
                      const newSplits = {};
                      Object.entries(currentSplits).forEach(([userId, value]) => {
                        newSplits[userId] = customSplitMode === 'percentage' 
                          ? (parseFloat(value) / 100) * (editedExpense?.amount || 0)
                          : parseFloat(value) || 0;
                      });
                      handleChange('custom_splits', newSplits);
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      customSplitMode === 'amount'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Amount ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSplitMode('percentage');
                      // Convert amounts to percentages
                      const currentSplits = editedExpense?.custom_splits || {};
                      const totalAmount = editedExpense?.amount || 0;
                      const newSplits = {};
                      Object.entries(currentSplits).forEach(([userId, value]) => {
                        newSplits[userId] = customSplitMode === 'amount' && totalAmount > 0
                          ? (parseFloat(value) / totalAmount) * 100
                          : parseFloat(value) || 0;
                      });
                      handleChange('custom_splits', newSplits);
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      customSplitMode === 'percentage'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {expense.groups?.members?.map(memberId => {
                const user = users?.find(u => u.id === memberId) || 
                           (memberId === currentUser?.id ? currentUser : null);
                if (!user) return null;
                
                const isSelected = editedExpense?.split_with?.includes(user.id);
                const currentSplitAmount = editedExpense?.custom_splits?.[user.id] || 
                  (isSelected && editedExpense?.split_method === 'equal' 
                    ? (editedExpense?.amount || 0) / (editedExpense?.split_with?.length || 1)
                    : 0);
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentSplitWith = editedExpense?.split_with || [];
                          if (e.target.checked) {
                            const newSplitWith = [...currentSplitWith, user.id];
                            handleChange('split_with', newSplitWith);
                            
                            // Initialize custom split amount if custom method
                            if (editedExpense?.split_method === 'custom') {
                              const currentCustomSplits = editedExpense?.custom_splits || {};
                              const equalAmount = (editedExpense?.amount || 0) / newSplitWith.length;
                              handleChange('custom_splits', {
                                ...currentCustomSplits,
                                [user.id]: equalAmount
                              });
                            }
                          } else {
                            const newSplitWith = currentSplitWith.filter(id => id !== user.id);
                            handleChange('split_with', newSplitWith);
                            
                            // Remove from custom splits
                            if (editedExpense?.custom_splits) {
                              const newCustomSplits = { ...editedExpense.custom_splits };
                              delete newCustomSplits[user.id];
                              handleChange('custom_splits', newCustomSplits);
                            }
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Avatar user={user} size="sm" />
                      <div>
                        <div className="font-medium text-gray-800">
                          {user.id === currentUser?.id ? 'You' : user.name}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center gap-2 min-w-0">
                        {editedExpense?.split_method === 'custom' ? (
                          <div className="flex items-center gap-1 bg-gray-50 p-2 rounded border">
                            <span className="text-sm text-gray-600 font-medium">
                              {customSplitMode === 'amount' ? '$' : ''}
                            </span>
                            <input
                              type="number"
                              step={customSplitMode === 'amount' ? '0.01' : '0.1'}
                              min="0"
                              max={customSplitMode === 'percentage' ? '100' : undefined}
                              value={editedExpense?.custom_splits?.[user.id] || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                const currentCustomSplits = editedExpense?.custom_splits || {};
                                handleChange('custom_splits', {
                                  ...currentCustomSplits,
                                  [user.id]: value
                                });
                              }}
                              className="w-24 px-2 py-1 text-sm border-0 bg-white rounded focus:ring-2 focus:ring-blue-500 outline-none text-center font-medium"
                              placeholder={customSplitMode === 'amount' ? '0.00' : '0.0'}
                            />
                            <span className="text-sm text-gray-600 font-medium">
                              {customSplitMode === 'percentage' ? '%' : ''}
                            </span>
                            {customSplitMode === 'percentage' && editedExpense?.custom_splits?.[user.id] && (
                              <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                ≈ ${((parseFloat(editedExpense?.custom_splits?.[user.id]) || 0) / 100 * (editedExpense?.amount || 0)).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded">
                            ${currentSplitAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {editedExpense?.split_with?.length === 0 && (
              <div className="text-center py-4 text-red-500 text-sm">
                Please select at least one person to split the expense with.
              </div>
            )}
            
            {editedExpense?.split_method === 'custom' && editedExpense?.split_with?.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-700 font-medium">
                    {customSplitMode === 'amount' ? 'Total Custom Split:' : 'Total Percentage:'}
                  </span>
                  <span className="text-blue-800 font-bold">
                    {customSplitMode === 'amount' 
                      ? `$${Object.values(editedExpense?.custom_splits || {}).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0).toFixed(2)}`
                      : `${Object.values(editedExpense?.custom_splits || {}).reduce((sum, percentage) => sum + (parseFloat(percentage) || 0), 0).toFixed(1)}%`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-blue-600 mt-1">
                  <span>
                    {customSplitMode === 'amount' ? 'Expected Total:' : 'Expected Percentage:'}
                  </span>
                  <span>
                    {customSplitMode === 'amount' 
                      ? `$${(editedExpense?.amount || 0).toFixed(2)}`
                      : '100.0%'
                    }
                  </span>
                </div>
                {customSplitMode === 'percentage' && (
                  <div className="flex justify-between items-center text-xs text-blue-600 mt-1">
                    <span>Amount Total:</span>
                    <span>
                      ${Object.values(editedExpense?.custom_splits || {}).reduce((sum, percentage) => {
                        const amount = (parseFloat(percentage) || 0) / 100 * (editedExpense?.amount || 0);
                        return sum + amount;
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Split Details */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
            <Users className="w-4 h-4" />
            Split between {totalSplitMembers} member{totalSplitMembers !== 1 ? 's' : ''}
          </div>
          
          <div className="space-y-3">
            {splits.map((split, index) => {
              const splitUser = split.users || users?.find(u => u.id === split.user_id) || { name: 'Unknown User' };
              const splitAmount = parseFloat(split.amount) || (expense.amount / totalSplitMembers);
              const isCurrentUser = split.user_id === currentUser?.id;
              
              return (
                <div key={split.user_id || index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar user={splitUser} size="sm" />
                    <div>
                      <div className="font-medium text-gray-800">
                        {isCurrentUser ? 'You' : splitUser?.name}
                      </div>
                      <div className="text-xs text-gray-500">{splitUser?.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">
                      {formatCurrency(splitAmount, expenseOriginalCurrency)}
                    </div>
                    {expenseOriginalCurrency !== userCurrency && (
                      <div className="text-xs text-gray-500">
                        {isConverting ? (
                          <span>Converting...</span>
                        ) : (
                          <>≈ {formatCurrency(convertedAmounts[`split_${split.user_id}`] || splitAmount, userCurrency)}</>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Split Summary */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-700 font-medium">Total Split Amount:</span>
              <span className="text-blue-800 font-bold">
                {formatCurrency(expense.amount, expenseOriginalCurrency)}
              </span>
            </div>
            {totalSplitMembers > 1 && (
              <div className="flex justify-between items-center text-xs text-blue-600 mt-1">
                <span>Average per person:</span>
                <div className="text-right">
                  <div>
                    {formatCurrency(expense.amount / totalSplitMembers, expenseOriginalCurrency)}
                  </div>
                  {expenseOriginalCurrency !== userCurrency && (
                    <div className="text-xs text-blue-500">
                      {isConverting ? (
                        <span>Converting...</span>
                      ) : (
                        <>≈ {formatCurrency(convertedAmounts.averageAmount || (expense.amount / totalSplitMembers), userCurrency)}</>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


      </div>
    </Modal>
  );
};

export default ExpenseDetailModal;