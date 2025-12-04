import React from 'react';
import { Receipt, Users } from 'lucide-react';
import Avatar from '../ui/Avatar';

const ExpenseItem = ({ expense, users, currentUser, formatMoney }) => {
  const paidByUser = users.find(u => u.id === expense.paid_by);
  const isUserPaidBy = expense.paid_by === currentUser?.id;
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Receipt className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{expense.description}</h3>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="font-bold text-gray-800">{formatMoney(expense.amount)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Avatar user={paidByUser} size="sm" />
            <span>
              {isUserPaidBy ? 'You paid' : `${paidByUser?.name} paid`}
            </span>
            {expense.group_id && (
              <>
                <span>•</span>
                <Users className="w-3 h-3" />
                <span>Group expense</span>
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {new Date(expense.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseItem;