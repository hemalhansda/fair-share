import React, { useState, useEffect } from 'react';
import { Receipt, Users } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { formatCurrency, getCurrencySymbol, convertCurrency } from '../../services/currency';

const ExpenseItem = ({ expense, users, currentUser, formatMoney, userCurrency = 'USD', onClick }) => {
  const [convertedAmount, setConvertedAmount] = useState(expense.amount);
  const [isConverting, setIsConverting] = useState(false);
  
  // Handle both old and new data formats
  const paidById = expense.paid_by || expense.paidBy;
  const expenseDate = expense.created_at || expense.date;
  const groupId = expense.group_id || expense.groupId;
  const expenseOriginalCurrency = expense.currency || 'USD';
  
  // Try to get user from embedded data first, then fallback to users array
  let paidByUser;
  if (expense.paid_by_user) {
    paidByUser = expense.paid_by_user;
  } else {
    paidByUser = users?.find(u => u.id === paidById) || { name: 'Unknown User', id: paidById };
  }
  
  const isUserPaidBy = paidById === currentUser?.id;

  // Convert currency when component mounts or currency changes
  useEffect(() => {
    const convertAmount = async () => {
      if (expenseOriginalCurrency === userCurrency) {
        setConvertedAmount(expense.amount);
        return;
      }

      setIsConverting(true);
      try {
        const result = await convertCurrency(expense.amount, expenseOriginalCurrency, userCurrency);
        if (result.success) {
          setConvertedAmount(result.amount);
        } else {
          setConvertedAmount(expense.amount); // Fallback to original amount
        }
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setConvertedAmount(expense.amount); // Fallback to original amount
      } finally {
        setIsConverting(false);
      }
    };

    convertAmount();
  }, [expense.amount, expenseOriginalCurrency, userCurrency]);
  
  return (
    <div 
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:bg-gray-50"
      onClick={() => onClick && onClick(expense)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Receipt className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{expense.description}</h3>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="font-bold text-gray-800">
                {isConverting ? (
                  <span className="text-gray-400">Converting...</span>
                ) : (
                  formatCurrency(convertedAmount, userCurrency)
                )}
              </div>
              {expenseOriginalCurrency !== userCurrency && (
                <div className="text-xs text-gray-500">
                  (Originally {formatCurrency(expense.amount, expenseOriginalCurrency)})
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Avatar user={paidByUser} size="sm" />
            <span>
              {isUserPaidBy ? 'You paid' : `${paidByUser?.name} paid`}
            </span>
            {groupId && (
              <>
                <span>•</span>
                <Users className="w-3 h-3" />
                <span>Group expense</span>
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {expenseDate ? new Date(expenseDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Unknown date'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseItem;