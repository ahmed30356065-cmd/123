import React, { useMemo } from 'react';
import { Payment, Order, User, OrderStatus } from '../../types';
import { ArrowRightIcon, ReceiptIcon, CheckCircleIcon, ExclamationIcon, XIcon } from '../icons';

interface DriverPaymentHistoryPageProps {
    driver: User;
    payments: Payment[];
    orders: Order[];
    onBack: () => void;
    onDeletePayment?: (paymentId: string) => void;
    currentUser?: User | null;
}

const DriverPaymentHistoryPage: React.FC<DriverPaymentHistoryPageProps> = ({ driver, payments, orders, onBack, onDeletePayment, currentUser }) => {

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

        const driverShare = totalFees - companyShare;

        return {
            ...payment,
            verifiedCount: count,
            companyShare: companyShare, // App Dues
            driverShare: driverShare,   // Driver Dues
            verifiedTotalCollected: totalFees,
            verifiedAmount: payment.amount, // Keep original simplified, or use companyShare if payment is exact
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

    // Helper for Business Date (Shift starts/ends at 6 AM)
    const getBusinessDate = (dateString: string | Date | any) => {
        let date: Date;
        if (typeof dateString === 'string' || typeof dateString === 'number') {
            date = new Date(dateString);
        } else if (dateString?.seconds) {
            date = new Date(dateString.seconds * 1000);
        } else {
            date = new Date(dateString);
        }

        if (date.getHours() < 6) {
            date.setDate(date.getDate() - 1);
        }
        return date;
    };

    // Helper for Delete Confirmation
    const [deleteId, setDeleteId] = React.useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 animate-fadeIn pb-safe flex flex-col"> {/* Corporate Blue Background */}

            {/* Main Content Container with scroll listener */}
            <div
                className="flex-1 overflow-y-auto pt-[160px] md:pt-[120px]" // Increased padding for Status Bar + Header
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
                                                <th className="px-6 py-4 text-xs font-bold text-green-400 uppercase tracking-wider">مستحقات المندوب</th>
                                                <th className="px-6 py-4 text-xs font-bold text-red-400 uppercase tracking-wider">مستحقات التطبيق</th>
                                                <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">المبلغ المسدد</th>
                                                {currentUser?.role === 'admin' && <th className="px-6 py-4 text-xs font-bold text-red-400 uppercase tracking-wider">إجراءات</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-blue-900/50">
                                            {historyData.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-blue-900/10 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                                                        #{payment.id.slice(-6)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        <div className="flex flex-col">
                                                            <span>{getBusinessDate(payment.createdAt).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                            <span className="text-[10px] text-gray-500">{new Date(payment.createdAt).toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300 font-medium">
                                                        {payment.verifiedCount}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-green-400">
                                                        {payment.driverShare.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-red-400">
                                                        {payment.companyShare.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-white font-bold">
                                                        {payment.amount.toLocaleString('en-US', { minimumFractionDigits: 1 })} ج.م
                                                    </td>
                                                    {currentUser?.role === 'admin' && (
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => setDeleteId(payment.id)}
                                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                            >
                                                                <XIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-blue-900/50">
                                    {historyData.map((payment) => (
                                        <div key={payment.id} className="bg-[#1e293b] rounded-xl shadow-lg border-r-4 border-green-500 overflow-hidden mb-4">
                                            {/* Header */}
                                            <div className="p-4 border-b border-gray-700/50 flex justify-between items-start bg-gray-900/30">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-lg font-black text-green-400 tracking-tighter">#{payment.id.slice(-6)}</span>
                                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">
                                                            <CheckCircleIcon className="w-3 h-3" />
                                                            تمت التسوية
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-gray-400">{getBusinessDate(payment.createdAt).toLocaleDateString('ar-EG-u-nu-latn')}</span>
                                                        <span className="text-[10px] text-gray-500 font-mono">{new Date(payment.createdAt).toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                                                    </div>
                                                </div>
                                                {currentUser?.role === 'admin' && (
                                                    <button
                                                        onClick={() => setDeleteId(payment.id)}
                                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                    >
                                                        <XIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Body */}
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                                    <span className="text-xs text-gray-400">عدد الطلبات</span>
                                                    <span className="text-sm font-bold text-white">{payment.verifiedCount} طلب</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                                                        <p className="text-[9px] text-green-500/70 mb-1">مستحقات المندوب</p>
                                                        <p className="text-sm font-black text-green-400">{payment.driverShare.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
                                                    </div>
                                                    <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                                                        <p className="text-[9px] text-red-500/70 mb-1">مستحقات التطبيق</p>
                                                        <p className="text-sm font-black text-red-400">{payment.companyShare.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="bg-gray-900/80 p-3 border-t border-gray-700/50 flex justify-between items-center">
                                                <span className="text-xs text-gray-400">المبلغ المسدد</span>
                                                <span className="text-lg font-black text-white">{payment.amount.toLocaleString('en-US')} <span className="text-[10px] font-normal text-gray-500">ج.م</span></span>
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
                            التواريخ تتبع نظام "اليومية" (تنتهي 6 صباحاً).
                        </p>
                    </div>
                </div>
            </div>

            {/* Fixed Header */}
            <div className={`
                fixed top-0 left-0 right-0 z-20 pt-safe
                bg-[#0f172a]/95 backdrop-blur-md border-b border-blue-800/50 
                transition-all duration-300 ease-in-out
                ${isScrolled ? 'pb-2 shadow-lg' : 'pb-4 md:pb-6 shadow-none'}
            `}>
                {/* Added 'top' padding to container below */}
                <div className="max-w-5xl mx-auto px-4 md:px-6 w-full pt-4 md:pt-6">
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

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setDeleteId(null)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-red-500/30 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <XIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">حذف التسوية؟</h3>
                            <p className="text-sm text-gray-400 mb-6">هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء، وستعود الطلبات لتظهر كديون غير مسددة.</p>
                            <div className="flex gap-3 w-full">
                                <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all" onClick={() => setDeleteId(null)}>إلغاء</button>
                                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all" onClick={() => { if (onDeletePayment && deleteId) onDeletePayment(deleteId); setDeleteId(null); }}>حذف نهائي</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DriverPaymentHistoryPage;
