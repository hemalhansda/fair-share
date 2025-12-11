import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Clock, Receipt, Calendar, Loader2 } from 'lucide-react';
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
  onEditExpense,
  onLoadMore,
  hasMore = false,
  totalCount = 0
}) => {
  // State for expense detail modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  
  // Pagination state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    
    const observer = new IntersectionObserver(
      async (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingMore && hasMore) {
          setIsLoadingMore(true);
          await onLoadMore();
          setIsLoadingMore(false);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

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
  <div className="space-y-4 sm:space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Activity</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Track all your expenses and payments</p>
      </div>
      <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
        <div className="text-[10px] sm:text-xs text-gray-500">Total Expenses</div>
        <div className="text-base sm:text-lg font-bold text-emerald-600">{totalCount || expenses.length}</div>
      </div>
    </div>
    
    {isLoading ? (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    ) : expenses.length === 0 ? (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center text-gray-400">
        <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
        <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No activity yet</p>
        <p className="text-xs sm:text-sm">Your expense history will appear here</p>
      </div>
    ) : (
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(groupedExpenses).map(([dateLabel, dateExpenses]) => (
          <div key={dateLabel} className="space-y-3 sm:space-y-4">
            {/* Date Header */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {dateLabel}
              </h3>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            
            {/* Timeline for this date */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
              <div className="relative">
                {/* Timeline line - hidden on mobile */}
                <div className="hidden sm:block absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {/* Timeline items */}
                <div className="space-y-4 sm:space-y-6">
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
                        className="relative flex gap-2 sm:gap-4 group cursor-pointer hover:bg-gray-50 sm:hover:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none -mx-2 sm:mx-0"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowExpenseDetail(true);
                        }}
                      >
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex-shrink-0 ${
                          isPaidByCurrentUser 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-blue-50 border-blue-200'
                        } group-hover:scale-110 transition-transform`}>
                          <Receipt className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            isPaidByCurrentUser ? 'text-emerald-600' : 'text-blue-600'
                          }`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-800 truncate">{expense.description}</h3>
                                {expense.category && (
                                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                                    {expense.category}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-1">
                                <Avatar user={paidByUser} size="xs" className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="truncate">
                                  {isPaidByCurrentUser ? 'You paid' : `${paidByUser?.name} paid`}
                                </span>
                                {expense.groups && (
                                  <>
                                    <span className="text-gray-400 hidden sm:inline">•</span>
                                    <span className="truncate text-gray-500 hidden sm:inline">{expense.groups.name}</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Group name on mobile - separate line */}
                              {expense.groups && (
                                <div className="text-[10px] sm:hidden text-gray-500 mb-1 truncate">
                                  in {expense.groups.name}
                                </div>
                              )}
                              
                              {/* Splits info */}
                              {expense.expense_splits && expense.expense_splits.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                                  <div className="flex -space-x-1.5 sm:-space-x-2">
                                    {expense.expense_splits.slice(0, 3).map((split, i) => (
                                      <Avatar 
                                        key={i} 
                                        user={split.users} 
                                        size="xs" 
                                        className="ring-1 sm:ring-2 ring-white w-5 h-5 sm:w-6 sm:h-6"
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] sm:text-xs text-gray-500 ml-1 sm:ml-2">
                                    Split {expense.expense_splits.length === 1 ? 'equally' : `${expense.expense_splits.length} ways`}
                                  </span>
                                </div>
                              )}
                              
                              <div className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">{time}</div>
                            </div>
                            
                            {/* Amount */}
                            <div className="text-right flex-shrink-0">
                              <div className={`text-base sm:text-xl font-bold ${
                                isPaidByCurrentUser ? 'text-emerald-600' : 'text-gray-800'
                              }`}>
                                {formatCurrency(expense.amount, expense.currency || userCurrency)}
                              </div>
                              {isPaidByCurrentUser && (
                                <div className="text-[10px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1 hidden sm:block">You paid</div>
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
    
    {/* Infinite scroll loader */}
    {!isLoading && expenses.length > 0 && hasMore && (
      <div ref={loaderRef} className="flex justify-center py-6 sm:py-8">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          <span className="text-xs sm:text-sm">Loading more...</span>
        </div>
      </div>
    )}
    
    {/* End of list message */}
    {!isLoading && expenses.length > 0 && !hasMore && (
      <div className="text-center py-4 sm:py-6 text-gray-400">
        <p className="text-xs sm:text-sm">You've reached the end of your activity</p>
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