import React from 'react';
import { UserPlus, Check, Edit2, Trash2, TrendingUp, TrendingDown, Users, CheckCircle2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { UserSkeleton } from '../ui/SkeletonLoader';
import { formatCurrency } from '../../services/currency';

const FriendsView = ({ 
  users, 
  currentUser, 
  balances, 
  formatMoney, 
  handleSettleUp, 
  setShowAddFriend,
  onEditUser,
  onDeleteUser,
  userCurrency = 'USD',
  isDataLoading = false
}) => {
  const friends = users.filter(u => u.id !== currentUser?.id);
  const friendsWithBalance = friends.filter(f => Math.abs(balances.details[f.id] || 0) > 0.01);
  const settledFriends = friends.filter(f => Math.abs(balances.details[f.id] || 0) <= 0.01);
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Friends</h2>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100">
              Manage your friends and settle balances
            </p>
          </div>
          <button
            onClick={setShowAddFriend}
            className="flex items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Friend</span>
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3">
            <div className="text-[10px] sm:text-xs text-emerald-100 mb-0.5 sm:mb-1">Total Friends</div>
            <div className="text-lg sm:text-2xl font-bold">{friends.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3">
            <div className="text-[10px] sm:text-xs text-emerald-100 mb-0.5 sm:mb-1">Unsettled</div>
            <div className="text-lg sm:text-2xl font-bold">{friendsWithBalance.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3">
            <div className="text-[10px] sm:text-xs text-emerald-100 mb-0.5 sm:mb-1">Settled</div>
            <div className="text-lg sm:text-2xl font-bold">{settledFriends.length}</div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isDataLoading ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 sm:p-4">
              <UserSkeleton />
            </div>
          ))}
        </div>
      ) : friends.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Friends Yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto">
            Add friends to start splitting expenses and tracking balances together!
          </p>
          <Button 
            onClick={setShowAddFriend}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 !text-sm sm:!text-base"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Your First Friend
          </Button>
        </div>
      ) : (
        /* Friends List */
        <div className="space-y-3 sm:space-y-4">
          {/* Friends with Balances */}
          {friendsWithBalance.length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-5 py-2 sm:py-3 border-b border-gray-200">
                <h3 className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  Unsettled Balances ({friendsWithBalance.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {friendsWithBalance.map(user => {
                  const balance = balances.details[user.id] || 0;
                  const isOwed = balance > 0;
                  
                  return (
                    <div 
                      key={user.id} 
                      className="p-3 sm:p-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <Avatar user={user} size="md" className="flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base text-gray-800 truncate">{user.name}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">{user.email}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          {/* Balance Info */}
                          <div className="text-right">
                            <div className={`font-bold text-xs sm:text-sm flex items-center gap-1 ${
                              isOwed ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {isOwed ? (
                                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                              <span className="hidden sm:inline">{isOwed ? 'owes you' : 'you owe'}</span>
                            </div>
                            <div className={`font-bold text-sm sm:text-base ${
                              isOwed ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {formatCurrency(Math.abs(balance), userCurrency)}
                            </div>
                            <button 
                              onClick={() => handleSettleUp(user.id)}
                              className="text-[10px] sm:text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline mt-0.5 sm:mt-1"
                            >
                              Settle Up
                            </button>
                          </div>
                          
                          {/* Action Buttons - Desktop */}
                          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditUser(user)}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit friend"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => onDeleteUser(user)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete friend"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          {/* Action Buttons - Mobile */}
                          <div className="flex sm:hidden items-center gap-1">
                            <button
                              onClick={() => onEditUser(user)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => onDeleteUser(user)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settled Friends */}
          {settledFriends.length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 sm:px-5 py-2 sm:py-3 border-b border-emerald-100">
                <h3 className="text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  All Settled ({settledFriends.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {settledFriends.map(user => (
                  <div 
                    key={user.id} 
                    className="p-3 sm:p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Avatar user={user} size="md" className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-gray-800 truncate">{user.name}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">{user.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full">
                          <Check size={12} className="sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-semibold">Settled</span>
                        </div>
                        
                        {/* Action Buttons - Desktop */}
                        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditUser(user)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit friend"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteUser(user)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete friend"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        {/* Action Buttons - Mobile */}
                        <div className="flex sm:hidden items-center gap-1">
                          <button
                            onClick={() => onEditUser(user)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteUser(user)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsView;