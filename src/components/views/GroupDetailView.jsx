import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Receipt, Settings, TrendingUp, TrendingDown, DollarSign, Calendar, User2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import ExpenseItem from '../expenses/ExpenseItem';
import ExpenseDetailModal from '../modals/ExpenseDetailModal';
import EditGroupModal from '../modals/EditGroupModal';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { calculateBalances, updateGroup } from '../../services/database';

const GroupDetailView = ({ 
  groups,
  users, 
  expenses, 
  currentUser, 
  formatMoney, 
  setShowAddExpense,
  userCurrency = 'USD',
  onEditExpense,
  onUpdateGroup
}) => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  
  // State for expense detail modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  
  // State for edit group modal
  const [showEditGroup, setShowEditGroup] = useState(false);
  
  // Find the group by ID
  const group = groups?.find(g => g.id === groupId);
  
  // Use group's default currency or fall back to user's currency
  const groupCurrency = group?.default_currency || userCurrency;

  // Handle group edit
  const handleEditGroup = async (groupId, groupData) => {
    try {
      const result = await updateGroup(groupId, groupData);
      if (result.success) {
        // Call the parent handler to refresh group data
        if (onUpdateGroup) {
          onUpdateGroup(groupId, groupData);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  };

  // Filter expenses for this group (memoized to prevent infinite re-renders)
  const groupExpenses = useMemo(() => {
    return expenses.filter(e => e.group_id === group?.id);
  }, [expenses, group?.id]);

  // Get group members with user details (including current user)
  const groupMembers = useMemo(() => {
    if (!group?.members) return [];
    return group.members.map(memberId => {
      // Check users array first
      let user = users.find(u => u.id === memberId);
      
      // If not found and it's the current user, use current user data
      if (!user && memberId === currentUser?.id) {
        user = currentUser;
      }
      
      return user || { id: memberId, name: 'Unknown User', avatar: '??' };
    });
  }, [group?.members, users, currentUser]);

  // Calculate balances for this group only with currency conversion
  const [groupBalances, setGroupBalances] = useState({ totalOwed: 0, totalOwes: 0, details: {} });

  useEffect(() => {
    const calculateGroupBalances = async () => {
      if (!currentUser || groupExpenses.length === 0) {
        setGroupBalances({ totalOwed: 0, totalOwes: 0, details: {} });
        return;
      }

      // Convert all expenses to group's default currency before calculating balances
      const convertedExpenses = [];
      for (const expense of groupExpenses) {
        const expenseCurrency = expense.currency || 'USD';
        let convertedAmount = expense.amount;

        if (expenseCurrency !== groupCurrency) {
          try {
            const { success, amount } = await convertCurrency(expense.amount, expenseCurrency, groupCurrency);
            if (success) {
              convertedAmount = amount;
            }
          } catch (error) {
            console.error('Currency conversion failed for balance calculation:', error);
          }
        }

        convertedExpenses.push({
          ...expense,
          amount: convertedAmount,
          currency: groupCurrency
        });
      }

      const balances = calculateBalances(convertedExpenses, currentUser.id, users);
      setGroupBalances(balances);
    };

    calculateGroupBalances();
  }, [groupExpenses, currentUser?.id, groupCurrency]); // Removed users from dependency to prevent re-renders

  // Calculate individual member contributions with currency conversion
  const [memberContributions, setMemberContributions] = useState({});

  useEffect(() => {
    const calculateContributions = async () => {
      const contributions = {};
      
      // Initialize all members with 0
      groupMembers.forEach(member => {
        contributions[member.id] = {
          user: member,
          paid: 0,
          owes: 0,
          net: 0
        };
      });

      // Calculate what each member paid and owes with currency conversion
      for (const expense of groupExpenses) {
        const paidById = expense.paid_by;
        const expenseCurrency = expense.currency || 'USD';
        
        // Convert expense amount to group's default currency
        let convertedAmount = expense.amount;
        if (expenseCurrency !== groupCurrency) {
          try {
            const { success, amount } = await convertCurrency(expense.amount, expenseCurrency, groupCurrency);
            if (success) {
              convertedAmount = amount;
            }
          } catch (error) {
            console.error('Currency conversion failed for expense:', expense.id, error);
          }
        }

        const splitAmount = convertedAmount / (expense.expense_splits?.length || 1);

        // Add to what this person paid (in converted currency)
        if (contributions[paidById]) {
          contributions[paidById].paid += convertedAmount;
        }

        // Add to what each person in the split owes (in converted currency)
        expense.expense_splits?.forEach(split => {
          if (contributions[split.user_id]) {
            contributions[split.user_id].owes += splitAmount;
          }
        });
      }

      // Calculate net amounts (positive = they owe the group, negative = group owes them)
      Object.values(contributions).forEach(contrib => {
        contrib.net = contrib.owes - contrib.paid;
      });

      setMemberContributions(contributions);
    };

    if (groupMembers.length > 0) {
      calculateContributions();
    }
  }, [group?.id, groupExpenses, groupCurrency]); // Use group ID instead of groupMembers to prevent re-renders

  if (!group) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Group not found</p>
        <Button onClick={() => navigate('/groups')} className="mt-4">
          Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 pb-8">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/groups')}
              className="p-2 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowEditGroup(true)}
              className="p-2 hover:bg-white/20 text-white"
              title="Edit Group"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center ring-2 sm:ring-4 ring-white/30">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 truncate">{group.name}</h1>
              <div className="flex items-center gap-2 sm:gap-3 text-blue-100 text-xs sm:text-sm flex-wrap">
                <span className="truncate">{group.type}</span>
                <span className="hidden sm:inline">•</span>
                <span>{groupMembers.length} members</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {groupCurrency}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/20">
              <div className="text-[10px] sm:text-xs text-emerald-100 mb-1">Total Expenses</div>
              <div className="text-sm sm:text-lg font-bold">{groupExpenses.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/20">
              <div className="text-[10px] sm:text-xs text-emerald-100 mb-1">You're Owed</div>
              <div className="text-sm sm:text-lg font-bold text-emerald-300 truncate">
                {(() => {
                  const currentUserContrib = memberContributions[currentUser?.id];
                  if (!currentUserContrib) return formatCurrency(0, groupCurrency);
                  const netAmount = currentUserContrib.net;
                  return netAmount < 0 ? formatCurrency(Math.abs(netAmount), groupCurrency) : formatCurrency(0, groupCurrency);
                })()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/20">
              <div className="text-[10px] sm:text-xs text-emerald-100 mb-1">You Owe</div>
              <div className="text-sm sm:text-lg font-bold text-rose-300 truncate">
                {(() => {
                  const currentUserContrib = memberContributions[currentUser?.id];
                  if (!currentUserContrib) return formatCurrency(0, groupCurrency);
                  const netAmount = currentUserContrib.net;
                  return netAmount > 0 ? formatCurrency(netAmount, groupCurrency) : formatCurrency(0, groupCurrency);
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-4 space-y-3 sm:space-y-4">
        {/* Balances Breakdown */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Balances
            </h2>
          </div>
          
          <div className="p-4 sm:p-5">
            {Object.values(memberContributions).filter(c => Math.abs(c.net) > 0.01).length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {Object.values(memberContributions)
                  .filter(contrib => Math.abs(contrib.net) > 0.01)
                  .sort((a, b) => b.net - a.net)
                  .map(contrib => {
                    const isCurrentUser = contrib.user.id === currentUser?.id;
                    const owesOrOwed = contrib.net > 0;
                    
                    return (
                      <div 
                        key={contrib.user.id} 
                        className="group flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg sm:rounded-xl hover:from-emerald-50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <Avatar user={contrib.user} size="sm" className="sm:w-10 sm:h-10" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base text-gray-800 flex items-center gap-2 flex-wrap">
                              <span className="truncate">{isCurrentUser ? 'You' : contrib.user.name}</span>
                              {isCurrentUser && <span className="text-[10px] sm:text-xs bg-emerald-100 text-emerald-600 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">You</span>}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                              Paid {formatCurrency(contrib.paid, groupCurrency)} • 
                              Share {formatCurrency(contrib.owes, groupCurrency)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className={`text-sm sm:text-lg font-bold ${owesOrOwed ? 'text-rose-600' : 'text-emerald-600'} flex items-center gap-1`}>
                            {owesOrOwed ? (
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                            <span className="truncate">{formatCurrency(Math.abs(contrib.net), groupCurrency)}</span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            {owesOrOwed ? 'owes' : 'gets back'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-lg font-semibold text-gray-700">All Settled Up!</p>
                <p className="text-sm text-gray-500 mt-1">Everyone has paid their share 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Members Section - Redesigned */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
              <User2 className="w-5 h-5 text-emerald-600" />
              Members <span className="text-sm font-normal text-gray-500">({groupMembers.length})</span>
            </h2>
          </div>
          
          <div className="p-4 sm:p-5">
            <div className="grid gap-2 sm:gap-3">
              {groupMembers.map(member => {
                const contrib = memberContributions[member.id] || { paid: 0, owes: 0, net: 0 };
                const isCurrentUser = member.id === currentUser?.id;
                
                return (
                  <div 
                    key={member.id} 
                    className="group flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-emerald-50 hover:shadow-md transition-all">
                  
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Avatar user={member} size="sm" className="sm:w-10 sm:h-10" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-gray-800 truncate flex items-center gap-2">
                          <span className="truncate">{member.name}</span>
                          {isCurrentUser && <span className="text-[10px] sm:text-xs bg-emerald-600 text-white px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">You</span>}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">{member.email}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2 sm:ml-3">
                      <div className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                        {formatCurrency(contrib.paid, groupCurrency)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        paid
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expenses Section - Enhanced */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Expenses <span className="text-sm font-normal text-gray-500">({groupExpenses.length})</span>
            </h2>
            <Button 
              onClick={() => setShowAddExpense(true)} 
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
            
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="p-4 sm:p-5">
            {groupExpenses.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto scrollbar-hide">
                {groupExpenses
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map(expense => (
                    <ExpenseItem 
                      key={expense.id} 
                      expense={expense} 
                      users={users} 
                      currentUser={currentUser} 
                      formatMoney={formatMoney}
                      userCurrency={groupCurrency}
                      onClick={(expense) => {
                        setSelectedExpense(expense);
                        setShowExpenseDetail(true);
                      }}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-1">No expenses yet</p>
                <p className="text-sm text-gray-500 mb-4">Start by adding your first expense</p>
                <Button 
                  onClick={() => setShowAddExpense(true)} 
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600">
                
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Expense
                </Button>
              </div>
            )}
          </div>
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
        userCurrency={groupCurrency}
        onEdit={onEditExpense}
        onUpdate={(updatedExpense) => {
          console.log('Expense updated:', updatedExpense);
          setShowExpenseDetail(false);
          setSelectedExpense(null);
        }}
      />

      {/* Edit Group Modal */}
      <EditGroupModal
        isOpen={showEditGroup}
        onClose={() => setShowEditGroup(false)}
        group={group}
        users={users}
        currentUser={currentUser}
        onEditGroup={handleEditGroup}
      />
    </div>
  );
};

export default GroupDetailView;