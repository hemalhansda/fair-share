import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import ExpenseItem from '../expenses/ExpenseItem';
import ExpenseDetailModal from '../modals/ExpenseDetailModal';

const ActivityView = ({ 
  expenses, 
  users, 
  currentUser, 
  formatMoney,
  userCurrency = 'USD',
  isLoading 
}) => {
  // State for expense detail modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);

  return (
  <div className="space-y-6">
    <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
    
    {isLoading ? (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 h-16 rounded-xl animate-pulse" />
        ))}
      </div>
    ) : (
      <div className="space-y-3">
        {expenses.map(expense => (
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
        
        {expenses.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No activity yet</p>
            <p className="text-sm">Your expense history will appear here</p>
          </div>
        )}
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