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

    // Scroll state for header shrinking
    const [isScrolled, setIsScrolled] = React.useState(false);

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 animate-fadeIn pb-safe flex flex-col"> {/* Corporate Blue Background */}

            {/* Main Content Container with scroll listener */}
            <div
                className="flex-1 overflow-y-auto pt-[140px] md:pt-[100px]" // Padding top matches header height
                onScroll={(e) => {
                    const offset = e.currentTarget.scrollTop;
                    setIsScrolled(offset > 20);
                }}
            >
                <div className="max-w-5xl mx-auto p-4 md:p-6 min-h-screen flex flex-col">

                    {/* Content */}
                    <div className="flex-1 bg-[#1e293b] rounded-xl shadow-2xl border border-blue-800/50 overflow-hidden flex flex-col relative z-0">
                        {historyData.length > 0 ? (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead className="bg-[#1e293b] border-b border-blue-800">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">رقم العملية</th>
                                                <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">التاريخ</th>
                                                <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">الطلبات</th>
                                                <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">التحصيل</th>
                                                <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">المسدد</th>
                                                <th className="px-6 py-4 text-xs font-bold text-blue-300 uppercase tracking-wider">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-blue-900/50">
                                            {historyData.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-blue-900/10 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                                                        #{payment.id.slice(-6)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        {new Date(payment.createdAt).toLocaleString('ar-EG-u-nu-latn', {
                                                            year: 'numeric', month: 'short', day: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300 font-medium">
                                                        {payment.verifiedCount}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        {payment.verifiedTotalCollected.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-white font-bold">
                                                        {payment.verifiedAmount.toLocaleString('en-US', { minimumFractionDigits: 1 })} ج.م
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                            <CheckCircleIcon className="w-3 h-3 ml-1" />
                                                            تمت
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden flex flex-col divide-y divide-blue-800/50">
                                    {historyData.map((payment) => (
                                        <div key={payment.id} className="p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/20 font-mono mb-1 inline-block">
                                                        #{payment.id.slice(-6)}
                                                    </span>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(payment.createdAt).toLocaleString('ar-EG-u-nu-latn', {
                                                            month: 'short', day: 'numeric',
                                                            hour: 'numeric', minute: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <CheckCircleIcon className="w-3 h-3 ml-1" />
                                                    تمت التسوية
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-lg border border-blue-900/30">
                                                <div>
                                                    <p className="text-[10px] text-gray-500">عدد الطلبات</p>
                                                    <p className="text-sm font-medium text-gray-300">{payment.verifiedCount} طلب</p>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] text-gray-500">المبلغ المسدد</p>
                                                    <p className="text-base font-bold text-white">{payment.verifiedAmount.toLocaleString('en-US')} ج.م</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400 p-6 text-center">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <ReceiptIcon className="w-10 h-10 text-gray-600" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">لا توجد تسويات</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    لم يتم العثور على أي تسويات لهذا المندوب، أو تم حذف جميع الطلبات المرتبطة بالتسويات السابقة.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Note */}
                    <div className="mt-6 flex items-start gap-3 bg-blue-900/20 p-4 rounded-lg border border-blue-500/10">
                        <ExclamationIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs md:text-sm text-blue-300 leading-relaxed">
                            يتم استبعاد الطلبات المحذوفة أو الملغية تلقائياً. المبالغ الظاهرة تمثل القيمة الفعلية للطلبات المتبقية في النظام فقط.
                        </p>
                    </div>
                </div>
            </div>

            {/* Fixed Header */}
            <div className={`
                fixed top-0 left-0 right-0 z-20 
                bg-[#0f172a]/95 backdrop-blur-md border-b border-blue-800/50 
                transition-all duration-300 ease-in-out
                ${isScrolled ? 'py-2 shadow-lg' : 'py-4 md:py-6 shadow-none'}
            `}>
                <div className="max-w-5xl mx-auto px-4 md:px-6 w-full">
                    <div className="flex flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                            <button
                                onClick={onBack}
                                className={`
                                    rounded-full bg-blue-900/50 hover:bg-blue-800 text-blue-200 transition-all border border-blue-700/50 flex-shrink-0
                                    ${isScrolled ? 'p-2' : 'p-3'}
                                `}
                            >
                                <ArrowRightIcon className={`${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`} />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h2 className={`font-bold text-white leading-tight truncate transition-all ${isScrolled ? 'text-lg' : 'text-xl md:text-2xl'}`}>
                                    سجل المدفوعات
                                </h2>
                                <p className={`text-blue-400 truncate transition-all ${isScrolled ? 'text-[10px]' : 'text-xs md:text-sm mt-1'}`}>
                                    {driver.name}
                                </p>
                            </div>
                        </div>
                        <div className={`
                            bg-blue-900/30 rounded-xl border border-blue-500/20 text-center flex-shrink-0 flex items-center gap-2 transition-all
                            ${isScrolled ? 'px-3 py-1.5' : 'px-4 py-3'}
                        `}>
                            <span className={`text-blue-300 block ${isScrolled ? 'text-[10px]' : 'text-xs md:text-sm'}`}>إجمالي الحركات</span>
                            <p className={`font-bold text-white ${isScrolled ? 'text-sm' : 'text-lg md:text-xl'}`}>
                                {historyData.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DriverPaymentHistoryPage;
