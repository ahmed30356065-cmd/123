import React from 'react';
import { Order, User, OrderStatus } from '../../types';
import {
  TruckIcon, UsersIcon, CheckCircleIcon, ClockIcon,
  DollarSignIcon, TrendingUpIcon, ActivityIcon, StoreIcon
} from '../icons';

interface AdminDashboardProps {
  orders: Order[];
  users: User[];
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string; trend?: string }> = ({ title, value, icon, color, trend }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 transition-all hover:shadow-md hover:scale-[1.02]">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
      {trend && (
        <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
      <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

const ProgressBar: React.FC<{ label: string; value: number; total: number; colorClass: string }> = ({ label, value, total, colorClass }) => {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] font-bold">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-800">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, users }) => {
  const totalOrders = orders.length;
  const totalUsers = users.length;
  const totalMerchants = users.filter(u => u.role === 'merchant').length;
  const totalDrivers = users.filter(u => u.role === 'driver').length;

  const pendingOrders = orders.filter(o => o.status === OrderStatus.Pending).length;
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.Delivered).length;
  const cancelledOrders = orders.filter(o => o.status === OrderStatus.Cancelled).length;
  const preparingOrders = orders.filter(o => o.status === OrderStatus.Preparing || o.status === OrderStatus.Ready).length;

  // Calculate Revenue (delivered or in transit)
  const totalRevenue = orders
    .filter(o => o.status === OrderStatus.Delivered || o.status === OrderStatus.InTransit)
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const totalAppProfit = totalRevenue * 0.15; // Mock 15% share

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-8 animate-fadeIn p-2 lg:p-6 bg-gray-50/50 rounded-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">نظرة عامة</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">مرحباً بك في لوحة تحكم الإدارة العامة</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-gray-600">النظام نشط حالياً</span>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المعاملات" value={`${totalRevenue.toLocaleString()} ج.م`} icon={<DollarSignIcon className="w-6 h-6" />} color="bg-emerald-500" trend="+12%" />
        <StatCard title="صافي الربح المقدر" value={`${Math.round(totalAppProfit).toLocaleString()} ج.م`} icon={<TrendingUpIcon className="w-6 h-6" />} color="bg-blue-500" trend="+8%" />
        <StatCard title="إجمالي الطلبات" value={totalOrders} icon={<TruckIcon className="w-6 h-6" />} color="bg-orange-500" />
        <StatCard title="المستخدمين" value={totalUsers} icon={<UsersIcon className="w-6 h-6" />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts/Status */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-800">حالة الطلبات</h3>
                <p className="text-xs text-gray-400 mt-1 font-bold">توزيع الطلبات حسب الحالة الحالية</p>
              </div>
              <ActivityIcon className="text-gray-300 w-6 h-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* Visual Bar Chart */}
              <div className="flex items-end justify-between h-48 px-4 border-b border-gray-100">
                <div className="flex flex-col items-center gap-2 group cursor-help">
                  <div className="w-10 bg-emerald-500 rounded-t-lg transition-all duration-700 hover:brightness-110" style={{ height: `${(deliveredOrders / totalOrders) * 100}%` || '10%' }}></div>
                  <span className="text-[10px] font-bold text-gray-400">مكتمل</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-help">
                  <div className="w-10 bg-blue-500 rounded-t-lg transition-all duration-700 hover:brightness-110" style={{ height: `${(preparingOrders / totalOrders) * 100}%` || '10%' }}></div>
                  <span className="text-[10px] font-bold text-gray-400">تحضير</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-help">
                  <div className="w-10 bg-orange-500 rounded-t-lg transition-all duration-700 hover:brightness-110" style={{ height: `${(pendingOrders / totalOrders) * 100}%` || '10%' }}></div>
                  <span className="text-[10px] font-bold text-gray-400">انتظار</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-help">
                  <div className="w-10 bg-red-500 rounded-t-lg transition-all duration-700 hover:brightness-110" style={{ height: `${(cancelledOrders / totalOrders) * 100}%` || '10%' }}></div>
                  <span className="text-[10px] font-bold text-gray-400">ملغي</span>
                </div>
              </div>

              {/* Progress Detail List */}
              <div className="space-y-5">
                <ProgressBar label="طلبات منجزة" value={deliveredOrders} total={totalOrders} colorClass="bg-emerald-500" />
                <ProgressBar label="قيد التحضير/التوصيل" value={preparingOrders} total={totalOrders} colorClass="bg-blue-500" />
                <ProgressBar label="بانتظار الموافقة" value={pendingOrders} total={totalOrders} colorClass="bg-orange-500" />
                <ProgressBar label="طلبات مرفوضة" value={cancelledOrders} total={totalOrders} colorClass="bg-red-500" />
              </div>
            </div>
          </div>

          {/* User Distribution Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-gray-400" />
              <span>توزيع الشركاء</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">إجمالي التجار</span>
                <span className="text-2xl font-black text-blue-600">{totalMerchants}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">إجمالي السائقين</span>
                <span className="text-2xl font-black text-emerald-600">{totalDrivers}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">عملاء نشطين</span>
                <span className="text-2xl font-black text-purple-600">{totalUsers - totalMerchants - totalDrivers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-800">أحدث العمليات</h3>
            <button className="text-[10px] font-black text-blue-600 hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto pr-1">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-mono text-[10px] font-black">
                    {order.id.split('-')[1] || order.id.slice(-3)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-800 line-clamp-1">{order.merchantName}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-black text-emerald-600">{order.totalPrice} ج.م</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${order.status === OrderStatus.Delivered ? 'bg-emerald-100 text-emerald-700' :
                      order.status === OrderStatus.Cancelled ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
