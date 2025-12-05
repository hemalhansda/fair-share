import React from 'react';
import { X, Calendar, User, Users, Receipt, DollarSign } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { formatCurrency } from '../../services/currency';

const ExpenseDetailModal = ({ 
  isOpen, 
  onClose, 
  expense, 
  users, 
  currentUser,
  userCurrency = 'USD' 
}) => {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center pb-4 border-b border-gray-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{expense.description}</h3>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(expense.amount, expenseOriginalCurrency)}
          </div>
          {expenseOriginalCurrency !== userCurrency && (
            <div className="text-sm text-gray-500 mt-1">
              ≈ {formatCurrency(expense.amount, userCurrency)} (in your currency)
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
            <div className="text-sm text-gray-800">
              {expense.category || 'General'}
            </div>
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
                        ≈ {formatCurrency(splitAmount, userCurrency)}
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
                <span>
                  {formatCurrency(expense.amount / totalSplitMembers, expenseOriginalCurrency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExpenseDetailModal;