import React from 'react';
import { User } from '../../types';
import { UserIcon } from '../icons';

interface ManageUsersProps {
  users: User[];
  onApproveUser: (userId: string) => void;
}

const ManageUsers: React.FC<ManageUsersProps> = ({ users, onApproveUser }) => {
  const getRoleName = (role: string) => {
      switch (role) {
          case 'admin': return 'مسؤول';
          case 'merchant': return 'تاجر';
          case 'driver': return 'سائق';
          default: return role;
      }
  }

  return (
    <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">إدارة المستخدمين</h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الدور</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">معرف المستخدم</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">إجراء</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                        <tr key={user.id}>
                             <td className="px-6 py-4">
                                <div className="p-2 bg-gray-100 rounded-full inline-block">
                                    <UserIcon className="h-5 w-5 text-gray-600" />
                                </div>
                             </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getRoleName(user.role)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{user.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {user.status === 'active' ? 'نشط' : 'قيد المراجعة'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {user.role !== 'admin' && user.status === 'pending' && (
                                    <button
                                        onClick={() => onApproveUser(user.id)}
                                        className="text-green-600 hover:text-green-900"
                                    >
                                        موافقة
                                    </button>
                                )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ManageUsers;