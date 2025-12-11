import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, User2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { GroupSkeleton } from '../ui/SkeletonLoader';
import { formatCurrency } from '../../services/currency';

const GroupsView = ({ 
  groups, 
  users, 
  formatMoney, 
  getGroupBalance, 
  setShowAddGroup, 
  setSelectedGroup,
  onEditGroup,
  onDeleteGroup,
  userCurrency = 'USD',
  isDataLoading = false
}) => {
  const navigate = useNavigate();

  const handleGroupClick = (group) => {
    setSelectedGroup(group); // Still set for state management
    navigate(`/groups/${group.id}`); // Navigate to detail view
  };

  return (
  <div className="space-y-4 sm:space-y-6">
    {/* Header with gradient background */}
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Groups</h1>
          <p className="text-emerald-100 text-sm sm:text-base">Manage and track group expenses</p>
        </div>
        <Button 
          onClick={() => setShowAddGroup(true)} 
          className="bg-white !text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl flex-shrink-0 ml-4 border border-white/20"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">New Group</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-100" />
            <span className="text-xs sm:text-sm text-emerald-100">Total Groups</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold">{groups.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <User2 className="w-4 h-4 text-emerald-100" />
            <span className="text-xs sm:text-sm text-emerald-100">Active Members</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold">
            {groups.reduce((acc, group) => {
              const uniqueMembers = new Set([...acc.members, ...(group.members || [])]);
              return { members: Array.from(uniqueMembers) };
            }, { members: [] }).members.length}
          </div>
        </div>
      </div>
    </div>
    
    {/* Groups Grid */}
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {isDataLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <GroupSkeleton key={i} />
        ))
      ) : (
        groups.map(group => {
          const balance = getGroupBalance(group.id);
          const isPositive = balance >= 0;
          
          return (
            <div 
              key={group.id} 
              className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer"
              onClick={() => handleGroupClick(group)}
            >
              {/* Card Header with Gradient */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs sm:text-sm text-gray-800 truncate">{group.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGroup(group);
                      }}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit group"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup(group);
                      }}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete group"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Members Avatars */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {group.members?.slice(0, 5).map(memberId => {
                      const user = users.find(u => u.id === memberId);
                      return user ? (
                        <Avatar 
                          key={user.id} 
                          user={user} 
                          size="sm" 
                          className="border-2 border-white ring-1 ring-gray-200 hover:z-10 transition-transform hover:scale-110" 
                        />
                      ) : null;
                    })}
                    {group.members?.length > 5 && (
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white ring-1 ring-gray-200">
                        +{group.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Card Body - Balance Info */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Your balance</div>
                      <div className={`text-lg sm:text-xl font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(Math.abs(balance), group.default_currency || userCurrency)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Currency Badge */}
                  {group.default_currency && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                      <DollarSign className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600">{group.default_currency}</span>
                    </div>
                  )}
                </div>
                
                {/* Status Text */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    {Math.abs(balance) < 0.01 ? (
                      <span className="text-emerald-600 font-medium">✓ All settled up!</span>
                    ) : isPositive ? (
                      <span>You're owed <span className="font-semibold text-emerald-600">{formatCurrency(balance, group.default_currency || userCurrency)}</span></span>
                    ) : (
                      <span>You owe <span className="font-semibold text-rose-600">{formatCurrency(Math.abs(balance), group.default_currency || userCurrency)}</span></span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
      
    {!isDataLoading && groups.length === 0 && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 px-6">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No groups yet</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Create your first group to start splitting expenses with friends, family, or roommates
        </p>
        <Button 
          onClick={() => setShowAddGroup(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Group
        </Button>
      </div>
    )}
  </div>
  );
};

export default GroupsView;