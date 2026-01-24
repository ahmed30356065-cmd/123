import React from 'react';
import { User, Role } from '../types';
import { UserIcon } from './icons';

interface RoleSelectionProps {
  users: User[];
  onSelectUser: (user: User) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ users, onSelectUser }) => {

  const renderUsersByRole = (role: Role, title: string) => {
    const filteredUsers = users.filter(u => u.role === role);
    if (filteredUsers.length === 0) return null;

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-600 mb-3 border-b pb-2">{title}</h3>
        <div className="space-y-3">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="w-full flex items-center text-right p-3 bg-gray-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <UserIcon className="w-5 h-5 ml-3 text-gray-500" />
              <span className="font-medium text-gray-800">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderUsersByRole('admin', 'مسؤول')}
      {renderUsersByRole('merchant', 'تاجر')}
      {renderUsersByRole('driver', 'سائق')}
    </div>
  );
};

export default RoleSelection;
