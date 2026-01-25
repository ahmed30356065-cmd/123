
import React, { useState, useEffect } from 'react';
import { Order, User, OrderStatus, Payment } from '../../types';
import { UserIcon, WalletIcon, ReceiptIcon, ClockIcon, CheckCircleIcon, XIcon, CashIcon, ExclamationIcon } from '../icons';
import DriverPaymentHistoryPage from './DriverPaymentHistoryPage';
import ConfirmationModal from './ConfirmationModal';
import useAndroidBack from '../../hooks/useAndroidBack';

const FinancialRow: React.FC<{ label: string, value: number, currency?: string, colorClass?: string }> = ({ label, value, currency = 'ج.م', colorClass = 'text-white' }) => (
    <div className="flex justify-between items-baseline bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <span className={`text-lg font-bold ${colorClass}`}>
            {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
        </span>
    </div>
);

// Professional Segmented Control for Shift Status
const ShiftStatusControl: React.FC<{
    status: 'active' | 'closed';
    mode: '12_hour' | 'always_open';
    onChange: () => void;
}> = ({ status, mode, onChange }) => {

    if (mode === 'always_open') {
        return (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg w-full justify-center">
                <ClockIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-300">نظام مفتوح دائماً</span>
            </div>
        );
    }

    const isActive = status === 'active';

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">حالة اليومية</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isActive ? 'مفتوحة الآن' : 'مغلقة'}
                </span>
            </div>
            <button
                onClick={onChange}
                className={`
                    relative group w-full py-2 px-1 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 border
                    ${isActive
                        ? 'bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-lg shadow-green-900/20'
                        : 'bg-[#1a1a1a] hover:bg-[#222] border-gray-600 text-gray-400 hover:text-white'
                    }
                `}
            >
                {isActive ? (
                    <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">اليومية نشطة</span>
                    </>
                ) : (
                    <>
                        <XIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">اليومية مغلقة - اضغط للتفعيل</span>
                    </>
                )}
            </button>
        </div>
    );
};

interface AdminWalletScreenProps {
    orders: Order[];
    users: User[];
    payments: Payment[];
    updateUser: (userId: string, updatedData: Partial<User>) => void;
    handleDriverPayment: (driverId: string) => void;
}

const AdminWalletScreen: React.FC<AdminWalletScreenProps> = ({ orders, users, payments, updateUser, handleDriverPayment }) => {
    const [historyDriver, setHistoryDriver] = useState<User | null>(null);
    const [payingDriverInfo, setPayingDriverInfo] = useState<{ driver: User; amount: number } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showHistoryPage, setShowHistoryPage] = useState(false); // New state for full page history

    const drivers = users.filter(u => u.role === 'driver');

    // --- Back Button Logic ---
    const pushModalState = (modalName: string) => {
        try {
            window.history.pushState({ view: 'wallet', modal: modalName }, '', window.location.pathname);
        } catch (e) { }
    };

    const closeModal = () => {
        // 1. Force close React state immediately to unmount modal
        setHistoryDriver(null);
        setPayingDriverInfo(null);

        // 2. Revert browser history if needed
        if (window.history.state?.modal) {
            window.history.back();
        }
    };

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (!event.state?.modal) {
                setHistoryDriver(null);
                setPayingDriverInfo(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    if (drivers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 h-[calc(100vh-15rem)]">
                <WalletIcon className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold">لا يوجد مناديب لعرضهم</h3>
                <p className="text-gray-400">ستظهر هنا إحصائيات محافظ المناديب.</p>
            </div>
        );
    }

    const confirmPayment = () => {
        if (payingDriverInfo) {
            const driverId = payingDriverInfo.driver.id;

            // Close modal state explicitly first
            setPayingDriverInfo(null);

            // Safely remove history state if it exists
            if (window.history.state?.modal === 'pay') {
                window.history.back();
            }

            // Execute logic (Global State Update)
            handleDriverPayment(driverId);

            // Show success feedback
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
        }

    };

    // Android Back Button Handler
    useAndroidBack(() => {
        // 1. Close History Page (Detailed View) - Returns to Wallet Main
        if (showHistoryPage) {
            setShowHistoryPage(false);
            setHistoryDriver(null);
            return true;
        }

        // 2. Close Payment Confirmation Modal
        if (payingDriverInfo) {
            closeModal(); // This clears state and handles history.back()
            return true;
        }

        // 3. Close Success Modal
        if (showSuccessModal) {
            setShowSuccessModal(false);
            return true;
        }

        return false;
    }, [showHistoryPage, payingDriverInfo, showSuccessModal]);

    return (
        <>
            {showHistoryPage && historyDriver && (
                <div className="fixed inset-0 z-[100] bg-gray-900">
                    <DriverPaymentHistoryPage
                        driver={historyDriver}
                        payments={payments}
                        orders={orders}
                        onBack={() => {
                            setShowHistoryPage(false);
                            setHistoryDriver(null);
                        }}
                    />
                </div>
            )}

            {/* Added pb-32 to ensure bottom cards are fully visible above the fixed nav */}
            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-32 ${showHistoryPage ? 'hidden' : ''}`}>
                {drivers.map((driver) => {
                    // Updated Logic: Include ALL orders that are Delivered AND Not Reconciled
                    // Removed 'isToday' check to ensure total debt is calculated correctly
                    const unreconciledOrders = orders.filter(
                        (order) =>
                            order.driverId === driver.id &&
                            order.status === OrderStatus.Delivered &&  // Strict: Only Delivered
                            order.status !== OrderStatus.Cancelled &&  // Double Strict: Never Cancelled
                            !order.reconciled
                    );

                    const totalFees = unreconciledOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
                    const commissionRate = driver.commissionRate || 0;

                    let companyShare = 0;
                    if (driver.commissionType === 'fixed') {
                        companyShare = unreconciledOrders.length * commissionRate;
                    } else {
                        companyShare = totalFees * (commissionRate / 100);
                    }
                    const driverShare = totalFees - companyShare;
                    const commissionLabel = driver.commissionType === 'fixed'
                        ? `${commissionRate} ج.م/طلب`
                        : `${commissionRate}%`;

                    const handleLogStatusToggle = () => {
                        const newStatus = driver.dailyLogStatus === 'active' ? 'closed' : 'active';
                        const updates: any = { dailyLogStatus: newStatus };
                        if (newStatus === 'active') updates.dailyLogStartedAt = new Date();
                        updateUser(driver.id, updates);
                    };

                    const isLogActive = driver.dailyLogStatus === 'active' || driver.dailyLogMode === 'always_open';
                    const statusColor = isLogActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500';

                    const hasActiveOrders = orders.some(o =>
                        String(o.driverId) === String(driver.id) &&
                        o.status !== OrderStatus.Delivered &&
                        o.status !== OrderStatus.Cancelled
                    );

                    return (
                        <div key={driver.id} className={`bg-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden transition-all duration-300 ${statusColor}`}>
                            {/* Header */}
                            <div className="p-5 pb-0 flex justify-between items-start">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border border-gray-600">
                                        {driver.storeImage ? <img src={driver.storeImage} className="w-full h-full object-cover" alt="Avatar" /> : <UserIcon className="w-6 h-6 text-gray-300" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{driver.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{driver.id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-4">
                                {/* Shift Control */}
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <ShiftStatusControl
                                        status={driver.dailyLogStatus || 'closed'}
                                        mode={driver.dailyLogMode || '12_hour'}
                                        onChange={handleLogStatusToggle}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-xs font-bold text-gray-400">إجمالي المديونية (غير مسواة)</h4>
                                        <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300">{unreconciledOrders.length} طلبات</span>
                                    </div>
                                    <FinancialRow label="إجمالي التحصيل" value={totalFees} colorClass="text-blue-400" />
                                    <FinancialRow label={`العمولة المستحقة (${commissionLabel})`} value={companyShare} colorClass="text-red-400" />
                                    <FinancialRow label="صافي للمندوب" value={driverShare} colorClass="text-green-400" />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between p-4 bg-gray-900 border-t border-gray-700">
                                <button
                                    onClick={() => { setHistoryDriver(driver); setShowHistoryPage(true); }}
                                    className="flex items-center text-xs font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    <ReceiptIcon className="w-4 h-4 ml-1.5" />
                                    سجل العمليات
                                </button>
                                {hasActiveOrders ? (
                                    <div
                                        className="flex items-center text-xs bg-red-900/40 text-red-400 font-bold px-4 py-2.5 rounded-lg border border-red-900/50 cursor-not-allowed w-auto text-center"
                                        title="لا يمكن التسوية لوجود طلبات قيد التوصيل"
                                    >
                                        <ClockIcon className="w-4 h-4 ml-2 animate-pulse" />
                                        أكمل الطلبات أولاً
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { pushModalState('pay'); setPayingDriverInfo({ driver, amount: companyShare }); }}
                                        disabled={unreconciledOrders.length === 0}
                                        className="flex items-center text-xs bg-green-600 text-white hover:bg-green-700 font-bold px-4 py-2.5 rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-md"
                                    >
                                        تسوية الحساب
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {payingDriverInfo && (
                <ConfirmationModal
                    title={`تأكيد تسوية الحساب`}
                    message={`هل تؤكد استلام مبلغ ${payingDriverInfo.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م من المندوب ${payingDriverInfo.driver.name}؟ سيتم حذف المديونية من حساب المندوب فوراً.`}
                    onClose={closeModal}
                    onConfirm={confirmPayment}
                    confirmButtonText="تأكيد التسوية"
                    confirmVariant='success'
                />
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-[2px] animate-fadeIn" style={{ touchAction: 'none' }} onClick={() => setShowSuccessModal(false)}>
                    <div className="w-full max-w-xs bg-[#1e293b] rounded-2xl border border-gray-700 shadow-2xl p-6 text-center transform scale-100 animate-pop-in relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"></div>
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full bg-[#0f172a] border border-gray-700 shadow-inner">
                                <CheckCircleIcon className="w-10 h-10 text-green-500 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">تمت التسوية بنجاح</h3>
                        <p className="text-gray-400 text-sm">تم تصفير المديونية وتحديث تطبيق المندوب.</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminWalletScreen;
