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

  // Initialize edited expense when modal opens
  useEffect(() => {
    if (expense && isOpen) {
      setEditedExpense({
        description: expense.description,
        amount: expense.amount,
        paid_by: expense.paid_by || expense.paidBy,
        group_id: expense.group_id || expense.groupId,
        category: expense.category || 'General',
        split_with: expense.expense_splits?.map(split => split.user_id) || [],
        split_method: 'equal' // Default to equal split
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

    setIsLoading(true);
    try {
      const result = await updateExpense(expense.id, editedExpense);
      
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
    setEditedExpense({
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paid_by || expense.paidBy,
      group_id: expense.group_id || expense.groupId,
      category: expense.category || 'General',
      split_with: expense.expense_splits?.map(split => split.user_id) || [],
      split_method: 'equal'
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
            <div className="flex items-center gap-3">
              <Avatar user={paidByUser} size="sm" />
              <div>
                <div className="font-medium text-gray-800">
                  {paidById === currentUser?.id ? 'You' : paidByUser?.name}
                </div>
                <div className="text-xs text-gray-500">{paidByUser?.email}</div>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </div>
            <div className="text-sm text-gray-800">
              {formatDate(expenseDate)}
            </div>
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