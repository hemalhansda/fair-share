import React from 'react';
import { Users, Plus } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const GroupsView = ({ 
  groups, 
  users, 
  formatMoney, 
  getGroupBalance, 
  setShowAddGroup, 
  setSelectedGroup 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-bold text-gray-800">Groups</h2>
      <Button onClick={() => setShowAddGroup(true)} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Add Group
      </Button>
    </div>
    
    <div className="grid gap-4">
      {groups.map(group => (
        <div 
          key={group.id} 
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          onClick={() => setSelectedGroup(group)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{group.name}</h3>
                <p className="text-sm text-gray-500">{group.members?.length || 0} members</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {group.members?.slice(0, 4).map(memberId => {
                const user = users.find(u => u.id === memberId);
                return user ? (
                  <Avatar key={user.id} user={user} size="sm" className="border-2 border-white" />
                ) : null;
              })}
              {group.members?.length > 4 && (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                  +{group.members.length - 4}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Your balance</div>
              <div className={`font-semibold ${getGroupBalance(group.id) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatMoney(getGroupBalance(group.id))}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No groups yet</p>
          <p className="text-sm">Create a group to start splitting expenses with friends</p>
        </div>
      )}
    </div>
  </div>
);

export default GroupsView;