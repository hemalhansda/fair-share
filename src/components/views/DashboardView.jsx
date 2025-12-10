import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Receipt } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import ExpenseItem from '../expenses/ExpenseItem';
import ExpenseDetailModal from '../modals/ExpenseDetailModal';
import { DashboardSkeleton, ExpenseSkeleton } from '../ui/SkeletonLoader';
import { formatCurrency } from '../../services/currency';

const DashboardView = ({ 
  balances, 
  formatMoney, 
  users, 
  handleSettleUp, 
  expenses,
  userCurrency = 'USD',
  currentUser,
  isDataLoading = false,
  onEditExpense
}) => {
  const navigate = useNavigate();
  
  // State for expense detail modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);

  if (isDataLoading) {
    return <DashboardSkeleton />;
  }

  return (
  <div className="space-y-6">
    {/* Balance Cards */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col">
        <span className="text-emerald-600 font-medium text-xs uppercase tracking-wider mb-1">You are owed</span>
        <span className="text-2xl font-bold text-emerald-700">{formatCurrency(balances.totalOwed, userCurrency)}</span>
      </div>
      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col">
        <span className="text-rose-600 font-medium text-xs uppercase tracking-wider mb-1">You owe</span>
        <span className="text-2xl font-bold text-rose-700">{formatCurrency(balances.totalOwes, userCurrency)}</span>
      </div>
    </div>

    {/* Net Balance Breakdown */}
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Friends Balance</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/friends')}>See all</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {Object.entries(balances.details).filter(([_, amt]) => Math.abs(amt) > 0.01).map(([userId, amount]) => {
          const user = users.find(u => u.id === userId);
          const isOwed = amount > 0;
          return (
            <div key={userId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar user={user} />
                <div>
                  <div className="font-semibold text-gray-800">{user?.name}</div>
                  <div className={`text-xs ${isOwed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isOwed ? 'owes you' : 'you owe'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${isOwed ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCurrency(Math.abs(amount), userCurrency)}
                </div>
                <button 
                  onClick={() => handleSettleUp(userId)}
                  className="text-xs text-blue-500 hover:underline mt-1"
                >
                  Settle Up
                </button>
              </div>
            </div>
          );
        })}
        {Object.entries(balances.details).filter(([_, amt]) => Math.abs(amt) > 0.01).length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Check className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">You're all settled up!</p>
            <p className="text-xs mt-1">No outstanding balances with friends</p>
          </div>
        )}
      </div>
    </div>

    {/* Recent Activity Timeline */}
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>See all</Button>
      </div>
      
      {expenses.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline items */}
            <div className="space-y-6">
              {expenses.slice(0, 5).map((expense, index) => {
                const paidByUser = users.find(u => u.id === expense.paid_by) || expense.paid_by_user;
                const isPaidByCurrentUser = expense.paid_by === currentUser?.id;
                const date = new Date(expense.created_at);
                const isToday = date.toDateString() === new Date().toDateString();
                const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
                
                let dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (isToday) dateLabel = 'Today';
                if (isYesterday) dateLabel = 'Yesterday';
                
                return (
                  <div key={expense.id} className="relative flex gap-4 group cursor-pointer" onClick={() => {
                    setSelectedExpense(expense);
                    setShowExpenseDetail(true);
                  }}>
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      isPaidByCurrentUser ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'
                    } group-hover:scale-110 transition-transform`}>
                      <Receipt className={`w-5 h-5 ${isPaidByCurrentUser ? 'text-emerald-600' : 'text-blue-600'}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800 truncate">{expense.description}</h3>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                              {expense.category || 'General'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
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
                          <div className="text-xs text-gray-400 mt-1">{dateLabel}</div>
                        </div>
                        
                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-bold ${isPaidByCurrentUser ? 'text-emerald-600' : 'text-gray-800'}`}>
                            {formatCurrency(expense.amount, expense.currency || userCurrency)}
                          </div>
                          {isPaidByCurrentUser && (
                            <div className="text-xs text-emerald-600">You paid</div>
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">No expenses yet</p>
          <p className="text-xs mt-1">Start by adding your first expense</p>
        </div>
      )}
    </div>
    
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

export default DashboardView;