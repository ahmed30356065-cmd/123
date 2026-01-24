import React from 'react';
import { Order, User, OrderStatus } from '../../types';
import OrderStatusBadge from '../OrderStatusBadge';
import { ChevronDownIcon } from '../icons';

interface ManageOrdersProps {
  orders: Order[];
  users: User[];
  assignDriver: (orderId: string, driverId: string) => void;
}

const ManageOrders: React.FC<ManageOrdersProps> = ({ orders, users, assignDriver }) => {
  const drivers = users.filter(u => u.role === 'driver');

  const handleAssignDriver = (orderId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    const driverId = e.target.value;
    if (driverId) {
      assignDriver(orderId, driverId);
    }
  };
  
  return (
    <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">إدارة الطلبات</h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الطلب</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">التاجر</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">تعيين سائق</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                    <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{order.merchantName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{order.customer.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{order.customer.address}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><OrderStatusBadge status={order.status} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.status === OrderStatus.Pending ? (
                                <div className="relative">
                                    <select
                                        defaultValue={order.driverId || ""}
                                        onChange={(e) => handleAssignDriver(order.id, e)}
                                        className="w-full pl-3 pr-10 py-2 text-right bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
                                    >
                                        <option value="">اختر سائق</option>
                                        {drivers.map(driver => (
                                            <option key={driver.id} value={driver.id}>{driver.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </div>
                                </div>
                            ) : (
                                users.find(u => u.id === order.driverId)?.name || 'لم يعين'
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

export default ManageOrders;