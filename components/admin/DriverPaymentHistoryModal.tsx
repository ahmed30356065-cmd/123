
import React, { useMemo } from 'react';
import { User, Order, Payment, OrderStatus } from '../../types';
import { XIcon, ReceiptIcon } from '../icons';

interface DriverPaymentHistoryModalProps {
  driver: User;
  orders: Order[];
  payments: Payment[];
  onClose: () => void;
}

const StatCard: React.FC<{ label: string, value: string, subvalue?: string }> = ({ label, value, subvalue }) => (
    <div className="bg-gray-900/50 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400 font-semibold">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {subvalue && <p className="text-xs text-gray-500">{subvalue}</p>}
    </div>
);

const DriverPaymentHistoryModal: React.FC<DriverPaymentHistoryModalProps> = ({ driver, orders, payments, onClose }) => {
    const monthlyData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const relevantOrders = orders.filter(o => {
            if (o.driverId !== driver.id || o.status !== OrderStatus.Delivered || !o.deliveredAt) return false;
            try {
                const d = new Date(o.deliveredAt);
                return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            } catch { return false; }
        });

        const totalFees = relevantOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
        let companyShare = 0;
        if (driver.commissionType === 'fixed') {
            companyShare = relevantOrders.length * (driver.commissionRate || 0);
        } else {
            companyShare = totalFees * ((driver.commissionRate || 0) / 100);
        }

        const driverShare = totalFees - companyShare;
        const totalPaid = payments
            .filter(p => p.driverId === driver.id)
            .reduce((sum, p) => sum + p.amount, 0);

        const dailyGroups: { [key: string]: { orders: Order[], isPaid: boolean } } = {};
        
        relevantOrders.forEach(order => {
            try {
                const dateKey = new Date(order.deliveredAt!).toISOString().split('T')[0];
                if (!dailyGroups[dateKey]) {
                    dailyGroups[dateKey] = { orders: [], isPaid: false };
                }
                dailyGroups[dateKey].orders.push(order);
            } catch (e) {
                console.error("Invalid date for order", order.id);
            }
        });

        Object.keys(dailyGroups).forEach(dateKey => {
            const allReconciled = dailyGroups[dateKey].orders.every(o => o.reconciled);
            dailyGroups[dateKey].isPaid = allReconciled;
        });

        const sortedDays = Object.entries(dailyGroups).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());

        return {
            totalDeliveries: relevantOrders.length,
            totalFees,
            companyShare,
            driverShare,
            totalPaid,
            sortedDays
        };
    }, [orders, payments, driver]);

    const formattedCurrentMonth = (() => {
        try {
            return new Date().toLocaleString('ar-EG-u-nu-latn', { month: 'numeric', year: 'numeric' });
        } catch (e) {
            return 'الشهر الحالي';
        }
    })();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div>
                         <h3 className="text-lg font-bold text-white">سجل الدفعات: {driver.name}</h3>
                         <p className="text-sm text-gray-400">ملخص شهر {formattedCurrentMonth}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 space-y-4 overflow-y-auto">
                    {/* Monthly Summary */}
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-300 mb-3">ملخص الشهر</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           <StatCard label="إجمالي التوصيل" value={monthlyData.totalDeliveries.toString()} subvalue="طلب" />
                           <StatCard label="إجمالي المستحقات" value={monthlyData.totalFees.toLocaleString('en-US', {minimumFractionDigits: 2})} subvalue="ج.م" />
                           <StatCard label="مستحقات التطبيق" value={monthlyData.companyShare.toLocaleString('en-US', {minimumFractionDigits: 2})} subvalue="ج.م" />
                           <StatCard label="مستحقات المندوب" value={monthlyData.driverShare.toLocaleString('en-US', {minimumFractionDigits: 2})} subvalue="ج.م" />
                        </div>
                    </div>
                    
                    {/* Daily Breakdown */}
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-300 mb-3">السجل اليومي</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                             {monthlyData.sortedDays.length > 0 ? monthlyData.sortedDays.map(([date, data]) => {
                                const dayTotal = data.orders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
                                let dayCompanyShare = 0;
                                if (driver.commissionType === 'fixed') {
                                    dayCompanyShare = data.orders.length * (driver.commissionRate || 0);
                                } else {
                                    dayCompanyShare = dayTotal * ((driver.commissionRate || 0) / 100);
                                }

                                const formattedDay = (() => {
                                    try {
                                        return new Date(date).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' });
                                    } catch(e) {
                                        return date;
                                    }
                                })();

                                return (
                                    <div key={date} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-white">{formattedDay}</p>
                                            <p className="text-xs text-gray-400">
                                                {data.orders.length} طلبات - مستحقات التطبيق: <span className="font-semibold text-red-400">{dayCompanyShare.toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</span>
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${data.isPaid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {data.isPaid ? 'مدفوع' : 'غير مدفوع'}
                                        </span>
                                    </div>
                                );
                            }) : (
                                <p className="text-center text-gray-500 py-4">لا توجد طلبات مسجلة هذا الشهر.</p>
                            )}
                        </div>
                    </div>
                </div>

                 <div className="bg-gray-900 px-4 py-3 sm:px-6 flex justify-end rounded-b-lg flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriverPaymentHistoryModal;
