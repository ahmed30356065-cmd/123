import React, { useMemo } from 'react';
import { Payment, Order, User, OrderStatus } from '../../types';
import { ArrowRightIcon, ReceiptIcon, CheckCircleIcon, ExclamationIcon, XIcon, DollarSignIcon, TruckIconV2, CalendarIcon, TrashIcon, PencilIcon, ClockIcon } from '../icons';

interface DriverPaymentHistoryPageProps {
    driver: User;
    payments: Payment[];
    orders: Order[];
    onBack: () => void;
    onDeletePayment?: (paymentId: string) => void;
    currentUser?: User | null;
    manualDailies?: any[]; // added manualDailies
    onEditDaily?: (daily: any) => void;
    onDeleteDaily?: (id: string, driverName: string) => void;
}

const SummaryCard: React.FC<{
    label: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
    colorClass: string;
}> = ({ label, value, subValue, icon, colorClass }) => (
    <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700/50 shadow-xl flex flex-col justify-between h-full relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-full h-1 ${colorClass.replace('text-', 'bg-')}/50`} />
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-gray-400 font-medium">{label}</span>
            <div className={`p-2 rounded-xl bg-gray-800/50 ${colorClass}`}>
                {icon}
            </div>
        </div>
        <div>
            <span className={`text-xl font-black ${colorClass} tracking-tight`}>{value}</span>
            {subValue && <span className="text-[10px] text-gray-500 block mt-1">{subValue}</span>}
        </div>
    </div>
);

const DriverPaymentHistoryPage: React.FC<DriverPaymentHistoryPageProps> = ({ driver, payments, orders, onBack, onDeletePayment, currentUser, manualDailies = [], onEditDaily, onDeleteDaily }) => {

    // Helper to calculate payment details based on CURRENTLY EXISTING orders
    const calculateCorrectedPayment = (payment: Payment) => {
        const validOrders = (payment.reconciledOrderIds || [])
            .map(id => orders.find(o => o.id === id))
            .filter((o): o is Order => !!o && o.status !== OrderStatus.Cancelled);

        const count = validOrders.length;
        const totalFees = validOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

        let companyShare = 0;
        if (driver.commissionType === 'fixed') {
            companyShare = count * (driver.commissionRate || 0);
        } else {
            companyShare = totalFees * ((driver.commissionRate || 0) / 100);
        }

        // Add safety check: App dues cannot exceed total fees
        if (companyShare > totalFees) companyShare = totalFees;

        // Manual Dailies Logic
        let dailiesAmount = 0; // Commission/Company Share from Dailies
        let dailiesOrdersCount = 0; // Actual sum of orders count
        let dailiesTotalFees = 0; // Fees collected from Dailies

        if (payment.reconciledManualDailyIds && payment.reconciledManualDailyIds.length > 0) {
            const relevantDailies = manualDailies.filter(d => payment.reconciledManualDailyIds?.includes(d.id));
            dailiesOrdersCount = relevantDailies.reduce((sum, d) => sum + (d.ordersCount || 0), 0);
            dailiesAmount = relevantDailies.reduce((sum, d) => sum + (d.amount || 0), 0);
            dailiesTotalFees = relevantDailies.reduce((sum, d) => sum + (d.totalDeliveryFees || 0), 0);
        }

        // Add Dailies Commission to Company Share
        companyShare += dailiesAmount;

        // Total Collected = Orders Fees + Manual Dailies Fees
        const totalCollected = totalFees + dailiesTotalFees;

        // Driver Share = Total Collected - Company Share (Commission)
        const driverShare = totalCollected - companyShare;

        return {
            ...payment,
            verifiedCount: count,
            verifiedDailiesCount: dailiesOrdersCount, // Now storing sum of orders
            dailiesAmount: dailiesAmount,
            companyShare: companyShare,
            driverShare: driverShare,
            verifiedTotalCollected: totalCollected,
            verifiedAmount: payment.amount,
            isValid: count > 0 || dailiesOrdersCount > 0
        };
    };

    const historyData = useMemo(() => {
        return payments
            .filter(p => p.driverId === driver.id)
            .map(calculateCorrectedPayment)
            .filter(p => p.isValid)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [payments, driver.id, orders, manualDailies]);

    // Calculate Global Totals for the header
    const totals = useMemo(() => {
        return historyData.reduce((acc, curr) => ({
            totalCollected: acc.totalCollected + curr.verifiedTotalCollected,
            totalDriverShare: acc.totalDriverShare + curr.driverShare,
            totalCompanyShare: acc.totalCompanyShare + curr.companyShare,
            totalPaid: acc.totalPaid + curr.amount
        }), { totalCollected: 0, totalDriverShare: 0, totalCompanyShare: 0, totalPaid: 0 });
    }, [historyData]);

    // Scroll state for header standard shrinking
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

    const [deleteId, setDeleteId] = React.useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 animate-fadeIn flex flex-col font-sans">

            {/* Fixed Header */}
            <div className={`
                fixed top-0 left-0 right-0 z-30 pt-safe transition-all duration-300
                bg-[#0f172a]/90 backdrop-blur-xl border-b border-gray-800
                ${isScrolled ? 'pb-3 shadow-lg' : 'pb-6'}
            `}>
                <div className="max-w-5xl mx-auto px-4 w-full pt-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-2.5 rounded-full border border-gray-700 transition-all active:scale-95"
                            >
                                <ArrowRightIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">سجل المعاملات</h2>
                                <p className="text-xs text-blue-400 font-bold mt-0.5">{driver.name}</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">عدد العمليات</p>
                            <p className="text-lg font-black text-white leading-none">{historyData.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar-hide"
                onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
            >
                <div className="max-w-5xl mx-auto px-4 pb-24 pt-[6.5rem]"> {/* Adjusted PT for header */}

                    {/* Summary Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <SummaryCard
                            label="إجمالي التحصيل"
                            value={`${totals.totalCollected.toLocaleString('en-US')} ج.م`}
                            icon={<DollarSignIcon className="w-5 h-5" />}
                            colorClass="text-blue-400"
                        />
                        <SummaryCard
                            label="صافي للمندوب"
                            value={`${totals.totalDriverShare.toLocaleString('en-US')} ج.م`}
                            subValue="بعد خصم العمولة"
                            icon={<TruckIconV2 className="w-5 h-5" />}
                            colorClass="text-green-400"
                        />
                        <SummaryCard
                            label="مستحقات التطبيق"
                            value={`${totals.totalCompanyShare.toLocaleString('en-US')} ج.م`}
                            subValue="عمولة الشركة"
                            icon={<ReceiptIcon className="w-5 h-5" />}
                            colorClass="text-red-400"
                        />
                        <SummaryCard
                            label="المبلغ المسدد"
                            value={`${totals.totalPaid.toLocaleString('en-US')} ج.م`}
                            subValue="تم تسويته فعلياً"
                            icon={<CheckCircleIcon className="w-5 h-5" />}
                            colorClass="text-emerald-400"
                        />
                    </div>

                    {/* Transaction History List */}
                    <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>

                        {/* Active/Unreconciled Dailies Section */}
                        {manualDailies.filter(d => d.driverId === driver.id && !d.reconciled).length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-yellow-500 px-1 border-r-4 border-yellow-500 mr-1 flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4" />
                                    يوميات نشطة (غير مسواة)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {manualDailies.filter(d => d.driverId === driver.id && !d.reconciled).map(daily => (
                                        <div key={daily.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex justify-between items-center group hover:bg-yellow-500/10 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                                    <CalendarIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold text-sm">{daily.ordersCount} طلبات</span>
                                                        <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">{daily.amount} ج.م</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(daily.dayDate).toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => onEditDaily?.(daily)}
                                                    className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                                                    title="تعديل اليومية"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteDaily?.(daily.id, driver.name)}
                                                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                                                    title="حذف اليومية"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h3 className="text-sm font-bold text-gray-400 px-1 border-r-4 border-blue-500 mr-1">تفاصيل العمليات السابقة</h3>

                        {historyData.length > 0 ? (
                            historyData.map((payment, index) => {
                                const date = getBusinessDate(payment.createdAt);
                                return (
                                    <div
                                        key={payment.id}
                                        className="bg-[#1e293b] rounded-2xl p-0 border border-gray-700 hover:border-blue-500/30 transition-all duration-300 shadow-lg overflow-hidden group"
                                    >
                                        {/* Card Header Stripe */}
                                        <div className="h-1 w-full bg-gradient-to-r from-green-500 via-blue-500 to-green-500 opacity-60"></div>

                                        <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">

                                            {/* Left: ID & Date */}
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <div className="w-12 h-12 rounded-xl bg-blue-900/20 flex items-center justify-center border border-blue-500/20 text-blue-400 shrink-0">
                                                    <CalendarIcon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between md:justify-start gap-2 mb-1">
                                                        <span className="text-white font-bold text-lg">
                                                            {date.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full border border-gray-700 font-mono">
                                                            {new Date(payment.createdAt).toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-mono tracking-wider">
                                                        ID: #{payment.id.slice(-8).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Middle: Stats (Mobile Grid / Desktop Flex) */}
                                            <div className="bg-black/20 rounded-xl border border-white/5 w-full md:w-auto">
                                                <div className="grid grid-cols-3 md:flex md:items-center divide-x divide-x-reverse divide-gray-700/50 md:divide-x-0 md:gap-6 p-3">

                                                    {/* Orders */}
                                                    <div className="flex flex-col items-center md:items-start px-2 md:px-0">
                                                        <span className="text-[10px] text-gray-500 mb-0.5">الطلبات</span>
                                                        <span className="text-sm font-bold text-white">
                                                            {payment.verifiedCount + (payment.verifiedDailiesCount || 0)}
                                                        </span>
                                                    </div>

                                                    {/* Driver Share */}
                                                    <div className="flex flex-col items-center md:items-start px-2 md:px-0 md:border-r md:border-gray-700 md:pr-6">
                                                        <span className="text-[10px] text-green-500/70 mb-0.5">للمندوب</span>
                                                        <span className="text-sm font-bold text-green-400">{Math.round(payment.driverShare)}</span>
                                                    </div>

                                                    {/* Company Share */}
                                                    <div className="flex flex-col items-center md:items-start px-2 md:px-0 md:border-r md:border-gray-700 md:pr-6">
                                                        <span className="text-[10px] text-red-500/70 mb-0.5">للشركة</span>
                                                        <span className="text-sm font-bold text-red-400">
                                                            {Math.round(payment.companyShare)}
                                                        </span>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* Right: Total & Delete */}
                                            <div className="flex items-center justify-between gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-800/50">
                                                {/* Mobile Label only */}
                                                <span className="md:hidden text-xs text-gray-500">المبلغ المسدد</span>

                                                <div className="flex items-center gap-4 flex-1 md:flex-none justify-end">
                                                    <span className="text-xl font-black text-white">{payment.amount.toLocaleString('en-US')} <span className="text-xs font-medium text-gray-500">ج.م</span></span>

                                                    {currentUser?.role === 'admin' && (
                                                        <button
                                                            onClick={() => setDeleteId(payment.id)}
                                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                                                            title="حذف السجل"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-[#1e293b]/50 rounded-3xl border border-dashed border-gray-700">
                                <ReceiptIcon className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                                <h3 className="text-lg font-bold text-gray-300">لا توجد معاملات سابقة</h3>
                                <p className="text-sm text-gray-500">لم يتم إجراء أي تسويات لهذا المندوب بعد.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setDeleteId(null)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-red-500/30 shadow-2xl p-6 transform scale-100 animate-pop-in" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/30">
                                <XIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">حذف سجل التسوية؟</h3>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                هل أنت متأكد من حذف هذا السجل المالي؟ <br />
                                <span className="text-red-400 font-bold">تنبيه:</span> ستعود جميع الطلبات المرتبطة به كديون غير مسددة على المندوب.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3.5 rounded-xl transition-all" onClick={() => setDeleteId(null)}>إلغاء</button>
                                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20 transition-all" onClick={() => { if (onDeletePayment && deleteId) onDeletePayment(deleteId); setDeleteId(null); }}>تأكيد الحذف</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DriverPaymentHistoryPage;
