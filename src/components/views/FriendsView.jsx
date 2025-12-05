import React from 'react';
import { UserPlus, Check, Edit2, Trash2, MoreVertical } from 'lucide-react';
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
}) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-800">Friends</h2>
      <Button onClick={setShowAddFriend} variant="secondary" className="!px-3 !py-1 text-sm">
        <UserPlus size={16} /> Add Friend
      </Button>
    </div>
    
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
      {isDataLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4">
            <UserSkeleton />
          </div>
        ))
      ) : (
        users.filter(u => u.id !== currentUser?.id).map(user => {
          const balance = balances.details[user.id] || 0;
          const isOwed = balance > 0;
          
          return (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <Avatar user={user} />
                <div>
                  <div className="font-semibold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  {Math.abs(balance) > 0.01 ? (
                    <>
                      <div className={`font-bold text-sm ${isOwed ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isOwed ? 'owes you' : 'you owe'} {formatCurrency(Math.abs(balance), userCurrency)}
                      </div>
                      <button 
                        onClick={() => handleSettleUp(user.id)}
                        className="text-xs text-blue-500 hover:underline mt-1"
                      >
                        Settle Up
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Check size={12} className="text-emerald-500" />
                      All settled
                    </div>
                  )}
                </div>
                
                {/* Actions menu */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditUser(user)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit friend"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteUser(user)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete friend"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
      {!isDataLoading && users.length <= 1 && (
        <div className="p-8 text-center text-gray-400">
          <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No friends added yet.</p>
          <p className="text-xs mt-1">Add friends to start splitting expenses!</p>
        </div>
      )}
    </div>
  </div>
);

export default FriendsView;