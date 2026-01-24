import React from 'react';
import { Order, User, OrderStatus } from '../../types';
import { TruckIcon, UsersIcon, CheckCircleIcon, ClockIcon } from '../icons';

interface AdminDashboardProps {
  orders: Order[];
  users: User[];
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div className="mr-4">
      <h3 className="text-gray-500 font-semibold">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, users }) => {
  const totalOrders = orders.length;
  const totalUsers = users.length;
  const totalMerchants = users.filter(u => u.role === 'merchant').length;
  const totalDrivers = users.filter(u => u.role === 'driver').length;

  const pendingOrders = orders.filter(o => o.status === OrderStatus.Pending).length;
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.Delivered).length;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">نظرة عامة على النظام</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الطلبات" value={totalOrders} icon={<TruckIcon className="w-6 h-6 text-blue-800" />} color="bg-blue-100" />
        <StatCard title="إجمالي المستخدمين" value={totalUsers} icon={<UsersIcon className="w-6 h-6 text-purple-800" />} color="bg-purple-100" />
        <StatCard title="طلبات مكتملة" value={deliveredOrders} icon={<CheckCircleIcon className="w-6 h-6 text-green-800" />} color="bg-green-100" />
        <StatCard title="طلبات قيد الانتظار" value={pendingOrders} icon={<ClockIcon className="w-6 h-6 text-yellow-800" />} color="bg-yellow-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">توزيع المستخدمين</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">التجار</span>
                    <span className="font-bold text-lg text-blue-600">{totalMerchants}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600">السائقين</span>
                    <span className="font-bold text-lg text-green-600">{totalDrivers}</span>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">أحدث الطلبات</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                    <tr className="border-b-2 border-gray-200">
                        <th className="p-2 font-semibold text-gray-600 text-sm">رقم الطلب</th>
                        <th className="p-2 font-semibold text-gray-600 text-sm">التاجر</th>
                        <th className="p-2 font-semibold text-gray-600 text-sm">الحالة</th>
                    </tr>
                    </thead>
                    <tbody>
                    {recentOrders.map(order => (
                        <tr key={order.id} className="border-b border-gray-100">
                        <td className="p-2 font-mono text-xs text-gray-700">{order.id}</td>
                        <td className="p-2 text-gray-800 text-sm">{order.merchantName}</td>
                        <td className="p-2 text-xs">{order.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
