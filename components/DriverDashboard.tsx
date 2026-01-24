import React from 'react';
import { Order, User, OrderStatus } from '../types';
import OrderStatusBadge from './OrderStatusBadge';
import DriverWallet from './DriverWallet';

interface DriverDashboardProps {
  driver: User;
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ driver, orders, updateOrderStatus }) => {
  const assignedOrders = orders.filter(order => order.driverId === driver.id);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">لوحة تحكم السائق</h2>
        
        <DriverWallet balance={350.75} />

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">الطلبات المسندة إليك</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الطلب</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">إجراء</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {assignedOrders.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500">لا توجد طلبات مسندة حالياً.</td>
                        </tr>
                        ) : (
                        assignedOrders.map((order) => (
                            <tr key={order.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{order.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{order.customer.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{order.customer.address}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <OrderStatusBadge status={order.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {order.status === OrderStatus.Pending && (
                                        <button onClick={() => updateOrderStatus(order.id, OrderStatus.InTransit)} className="text-blue-600 hover:text-blue-900">بدء التوصيل</button>
                                    )}
                                    {order.status === OrderStatus.InTransit && (
                                        <button onClick={() => updateOrderStatus(order.id, OrderStatus.Delivered)} className="text-green-600 hover:text-green-900">تأكيد التوصيل</button>
                                    )}
                                </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default DriverDashboard;