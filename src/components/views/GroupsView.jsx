import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
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
  userCurrency = 'USD'
}) => {
  const navigate = useNavigate();

  const handleGroupClick = (group) => {
    setSelectedGroup(group); // Still set for state management
    navigate(`/groups/${group.id}`); // Navigate to detail view
  };

  return (
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
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => handleGroupClick(group)}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{group.name}</h3>
                <p className="text-sm text-gray-500">{group.members?.length || 0} members</p>
              </div>
            </div>
            
            {/* Actions menu */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGroup(group);
                }}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit group"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteGroup(group);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete group"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => handleGroupClick(group)}
          >
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
                {formatCurrency(getGroupBalance(group.id), userCurrency)}
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
};

export default GroupsView;