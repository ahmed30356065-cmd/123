import React, { useMemo } from 'react';
import { Payment, Order, User, OrderStatus } from '../../types';
import { ArrowRightIcon, ReceiptIcon, CheckCircleIcon, ExclamationIcon } from '../icons';

interface DriverPaymentHistoryPageProps {
    driver: User;
    payments: Payment[];
    orders: Order[];
    onBack: () => void;
}

const DriverPaymentHistoryPage: React.FC<DriverPaymentHistoryPageProps> = ({ driver, payments, orders, onBack }) => {

    // Helper to calculate payment details based on CURRENTLY EXISTING orders
    // This retroactively updates history if orders are deleted or cancelled
    const calculateCorrectedPayment = (payment: Payment) => {
        const validOrders = payment.reconciledOrderIds
            .map(id => orders.find(o => o.id === id))
            .filter((o): o is Order => !!o && o.status !== OrderStatus.Cancelled); // STRICTLY EXCLUDE CANCELLED & DELETED

        const count = validOrders.length;
        const totalFees = validOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

        let companyShare = 0;
        if (driver.commissionType === 'fixed') {
            companyShare = count * (driver.commissionRate || 0);
        } else {
            companyShare = totalFees * ((driver.commissionRate || 0) / 100);
        }

        return {
            ...payment,
            verifiedCount: count,
            verifiedAmount: companyShare,
            verifiedTotalCollected: totalFees,
            isValid: count > 0 // If 0, it means all orders in this payment were deleted/cancelled
        };
    };

    const historyData = useMemo(() => {
        return payments
            .filter(p => p.driverId === driver.id)
            .map(calculateCorrectedPayment)
            .filter(p => p.isValid) // Hide empty payments
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [payments, driver.id, orders]);

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 overflow-y-auto animate-fadeIn"> {/* Corporate Blue Background */}
            <div className="max-w-5xl mx-auto p-6 min-h-screen flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-blue-800/50 pb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full bg-blue-900/50 hover:bg-blue-800 text-blue-200 transition-colors"
                        >
                            <ArrowRightIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-white">سجل المدفوعات والتسويات</h2>
                            <p className="text-blue-400 text-sm">السجل المالي للمندوب: {driver.name}</p>
                        </div>
                    </div>
                    <div className="bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-500/20">
                        <span className="text-blue-300 text-sm">إجمالي الحركات</span>
                        <p className="text-xl font-bold text-white">{historyData.length}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-[#1e293b] rounded-xl shadow-2xl border border-blue-800/50 overflow-hidden">
                    {historyData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-[#1e293b] border-b border-blue-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">رقم التسوية</th>
                                        <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">التاريخ والوقت</th>
                                        <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">عدد الطلبات</th>
                                        <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">إجمالي التحصيل</th>
                                        <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">حصة التطبيق (المبلغ المسدد)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-900/50">
                                    {historyData.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-blue-900/10 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                                                {payment.id.split('-')[1] || payment.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                {new Date(payment.createdAt).toLocaleString('ar-EG-u-nu-latn', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300 font-medium">
                                                {payment.verifiedCount} طلب
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                {payment.verifiedTotalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white font-bold">
                                                {payment.verifiedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <CheckCircleIcon className="w-3 h-3 ml-1" />
                                                    تمت التسوية
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
                            <ReceiptIcon className="w-16 h-16 mb-4 text-gray-600" />
                            <p className="text-lg">لا توجد تسويات سابقة لهذا المندوب.</p>
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="mt-6 flex items-start gap-3 bg-blue-900/20 p-4 rounded-lg border border-blue-500/10">
                    <ExclamationIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-300">
                        ملاحظة: هذا السجل يقوم تلقائياً باستبعاد أي طلبات تم إلغاؤها أو حذفها من النظام بعد وقت التسوية، مما يضمن دقة الحسابات المالية في جميع الأوقات.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DriverPaymentHistoryPage;
