import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Receipt } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import ExpenseItem from '../expenses/ExpenseItem';
import { formatCurrency, convertCurrency } from '../../services/currency';
import { calculateBalances } from '../../services/database';

const GroupDetailView = ({ 
  groups,
  users, 
  expenses, 
  currentUser, 
  formatMoney, 
  setShowAddExpense,
  userCurrency = 'USD' 
}) => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  
  // Find the group by ID
  const group = groups?.find(g => g.id === groupId);

  // Filter expenses for this group
  const groupExpenses = expenses.filter(e => e.group_id === group?.id);

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

      // Convert all expenses to user's preferred currency before calculating balances
      const convertedExpenses = [];
      for (const expense of groupExpenses) {
        const expenseCurrency = expense.currency || 'USD';
        let convertedAmount = expense.amount;

        if (expenseCurrency !== userCurrency) {
          try {
            const { success, amount } = await convertCurrency(expense.amount, expenseCurrency, userCurrency);
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
          currency: userCurrency
        });
      }

      const balances = calculateBalances(convertedExpenses, currentUser.id, users);
      setGroupBalances(balances);
    };

    calculateGroupBalances();
  }, [groupExpenses, currentUser?.id, users, userCurrency]);

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
        
        // Convert expense amount to user's preferred currency
        let convertedAmount = expense.amount;
        if (expenseCurrency !== userCurrency) {
          try {
            const { success, amount } = await convertCurrency(expense.amount, expenseCurrency, userCurrency);
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
  }, [groupMembers, groupExpenses, userCurrency]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/groups')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{group.name}</h1>
            <p className="text-sm text-gray-500">{group.type} • {groupMembers.length} members</p>
          </div>
        </div>
      </div>

      {/* Who owes whom section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Group Balance</h2>
        
        {Object.values(memberContributions).filter(c => Math.abs(c.net) > 0.01).length > 0 ? (
          <div className="space-y-3">
            {Object.values(memberContributions)
              .filter(contrib => Math.abs(contrib.net) > 0.01)
              .sort((a, b) => b.net - a.net) // Sort by net amount (highest debt first)
              .map(contrib => (
                <div key={contrib.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar user={contrib.user} size="sm" />
                    <div>
                      <div className="font-medium text-gray-800">
                        {contrib.user.id === currentUser?.id ? 'You' : contrib.user.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Paid {formatCurrency(contrib.paid, userCurrency)} • 
                        Owes {formatCurrency(contrib.owes, userCurrency)}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${contrib.net > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {contrib.net > 0 ? 'Owes ' : 'Gets back '}
                    {formatCurrency(Math.abs(contrib.net), userCurrency)}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>All settled up! 🎉</p>
          </div>
        )}
      </div>

      {/* Members section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Members ({groupMembers.length})</h2>
        
        <div className="grid gap-3">
          {groupMembers.map(member => {
            const contrib = memberContributions[member.id] || { paid: 0, owes: 0, net: 0 };
            return (
              <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar user={member} />
                  <div>
                    <div className="font-medium text-gray-800">
                      {member.id === currentUser?.id ? `${member.name} (You)` : member.name}
                    </div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">
                    Paid {formatCurrency(contrib.paid, userCurrency)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Share: {formatCurrency(contrib.owes, userCurrency)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Group Expenses ({groupExpenses.length})
          </h2>
          <Button 
            onClick={() => setShowAddExpense(true)} 
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
        
        <div className="space-y-3">
          {groupExpenses.length > 0 ? (
            groupExpenses.map(expense => (
              <ExpenseItem 
                key={expense.id} 
                expense={expense} 
                users={users} 
                currentUser={currentUser} 
                formatMoney={formatMoney}
                userCurrency={userCurrency}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No expenses yet</p>
              <p className="text-xs">Add an expense to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailView;