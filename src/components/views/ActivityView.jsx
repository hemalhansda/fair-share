import React, { useState, useMemo } from 'react';
import { Clock, Receipt, Calendar } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ExpenseDetailModal from '../modals/ExpenseDetailModal';
import { ActivitySkeleton } from '../ui/SkeletonLoader';
import { formatCurrency } from '../../services/currency';

const ActivityView = ({ 
  expenses, 
  users, 
  currentUser, 
  formatMoney,
  userCurrency = 'USD',
  isLoading,
  onEditExpense
}) => {
  // State for expense detail modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(expense);
    });
    
    return groups;
  }, [expenses]);

  return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Activity</h2>
        <p className="text-sm text-gray-500 mt-1">Track all your expenses and payments</p>
      </div>
      <div className="px-4 py-2 bg-blue-50 rounded-lg">
        <div className="text-xs text-gray-500">Total Expenses</div>
        <div className="text-lg font-bold text-blue-600">{expenses.length}</div>
      </div>
    </div>
    
    {isLoading ? (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    ) : expenses.length === 0 ? (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">No activity yet</p>
        <p className="text-sm">Your expense history will appear here</p>
      </div>
    ) : (
      <div className="space-y-6">
        {Object.entries(groupedExpenses).map(([dateLabel, dateExpenses]) => (
          <div key={dateLabel} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {dateLabel}
              </h3>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            
            {/* Timeline for this date */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {/* Timeline items */}
                <div className="space-y-6">
                  {dateExpenses.map((expense, index) => {
                    const paidByUser = users.find(u => u.id === expense.paid_by) || expense.paid_by_user;
                    const isPaidByCurrentUser = expense.paid_by === currentUser?.id;
                    const time = new Date(expense.created_at).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    });
                    
                    return (
                      <div 
                        key={expense.id} 
                        className="relative flex gap-4 group cursor-pointer"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowExpenseDetail(true);
                        }}
                      >
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 flex-shrink-0 ${
                          isPaidByCurrentUser 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-blue-50 border-blue-200'
                        } group-hover:scale-110 transition-transform`}>
                          <Receipt className={`w-5 h-5 ${
                            isPaidByCurrentUser ? 'text-emerald-600' : 'text-blue-600'
                          }`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-gray-800">{expense.description}</h3>
                                {expense.category && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                    {expense.category}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Avatar user={paidByUser} size="xs" />
                                <span className="truncate">
                                  {isPaidByCurrentUser ? 'You paid' : `${paidByUser?.name} paid`}
                                </span>
                                {expense.groups && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="truncate text-gray-500">{expense.groups.name}</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Splits info */}
                              {expense.expense_splits && expense.expense_splits.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <div className="flex -space-x-2">
                                    {expense.expense_splits.slice(0, 3).map((split, i) => (
                                      <Avatar 
                                        key={i} 
                                        user={split.users} 
                                        size="xs" 
                                        className="ring-2 ring-white"
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-500 ml-2">
                                    Split {expense.expense_splits.length === 1 ? 'equally' : `${expense.expense_splits.length} ways`}
                                  </span>
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-400 mt-2">{time}</div>
                            </div>
                            
                            {/* Amount */}
                            <div className="text-right flex-shrink-0">
                              <div className={`text-xl font-bold ${
                                isPaidByCurrentUser ? 'text-emerald-600' : 'text-gray-800'
                              }`}>
                                {formatCurrency(expense.amount, expense.currency || userCurrency)}
                              </div>
                              {isPaidByCurrentUser && (
                                <div className="text-xs text-emerald-600 mt-1">You paid</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
    
    {/* Expense Detail Modal */}
    <ExpenseDetailModal
      isOpen={showExpenseDetail}
      onClose={() => {
        setShowExpenseDetail(false);
        setSelectedExpense(null);
      }}
      expense={selectedExpense}
      users={users}
      currentUser={currentUser}
      userCurrency={userCurrency}
      onEdit={onEditExpense}
      onUpdate={(updatedExpense) => {
        console.log('Expense updated:', updatedExpense);
        setShowExpenseDetail(false);
        setSelectedExpense(null);
      }}
    />
  </div>
  );
};

export default ActivityView;