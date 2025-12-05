import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
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
        {Object.keys(balances.details).length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Check className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>You are all settled up!</p>
          </div>
        )}
      </div>
    </div>

    {/* Recent Activity Snippet */}
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {expenses.slice(0, 3).map(expense => (
          <ExpenseItem 
            key={expense.id} 
            expense={expense} 
            users={users} 
            currentUser={currentUser} 
            formatMoney={formatMoney}
            userCurrency={userCurrency}
            onClick={(expense) => {
              setSelectedExpense(expense);
              setShowExpenseDetail(true);
            }}
          />
        ))}
      </div>
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