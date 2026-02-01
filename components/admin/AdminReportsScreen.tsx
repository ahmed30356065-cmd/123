
import React, { useMemo, useState, useEffect } from 'react';
import { Order, User, Payment, OrderStatus } from '../../types';
import { ChartBarIcon, DollarSignIcon, TruckIconV2, CheckCircleIcon, ClockIcon, UsersIcon, StoreIcon, TrendingUpIcon, TrendingDownIcon, XIcon, CalendarIcon, ClipboardListIcon, SearchIcon, UserIcon, MapPinIcon, CoinsIcon, TrashIcon, ExclamationIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface AdminReportsScreenProps {
    orders: Order[];
    users: User[];
    payments: Payment[];
    currentUser: User;
}

// --- Components ---

const StatBox: React.FC<{ title: string; value: string | number; subValue?: string; icon: React.ReactNode; color: string; trend?: 'up' | 'down'; trendValue?: string }> = ({ title, value, subValue, icon, color, trend, trendValue }) => (
    <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 blur-3xl -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-black text-white">{value}</h3>
                {subValue && <p className="text-[10px] text-gray-400 mt-1">{subValue}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-gray-900/50 border border-gray-700 ${color.replace('bg-', 'text-')}`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center gap-1 relative z-10">
                {trend === 'up' ? <TrendingUpIcon className="w-3 h-3 text-green-500" /> : <TrendingDownIcon className="w-3 h-3 text-red-500" />}
                <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>{trendValue}</span>
                <span className="text-[10px] text-gray-600">مقارنة بالأمس</span>
            </div>
        )}
    </div>
);

// --- New Modals ---

const ReportCriteriaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    type: 'driver' | 'merchant';
    users: User[];
    onGenerate: (userId: string, dateRange: { type: 'all' | 'custom'; start?: string; end?: string }) => void;
}> = ({ isOpen, onClose, type, users, onGenerate }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [dateType, setDateType] = useState<'all' | 'custom'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useAndroidBack(() => {
        if (isOpen) { onClose(); return true; }
        return false;
    }, [isOpen]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => u?.role === type && (u?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u?.phone?.includes(searchTerm)));
    }, [users, type, searchTerm]);

    if (!isOpen) return null;

    const handleGenerate = () => {
        if (!selectedUserId) return;
        onGenerate(selectedUserId, {
            type: dateType,
            start: dateType === 'custom' ? startDate : undefined,
            end: dateType === 'custom' ? endDate : undefined
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-pop-in flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {type === 'driver' ? <TruckIconV2 className="w-5 h-5 text-blue-400" /> : <StoreIcon className="w-5 h-5 text-purple-400" />}
                        {type === 'driver' ? 'تقرير مندوب مفصل' : 'تقرير تاجر مفصل'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* User Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 block">اختر {type === 'driver' ? 'المندوب' : 'التاجر'}</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="بحث بالاسم أو الرقم..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 px-4 pl-10 text-white text-sm focus:border-blue-500 outline-none"
                            />
                            <SearchIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                        </div>
                        <div className="max-h-40 overflow-y-auto bg-[#0f172a] border border-gray-600 rounded-xl custom-scrollbar">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => setSelectedUserId(u.id)}
                                        className={`w-full flex items-center justify-between p-3 text-right hover:bg-gray-800 border-b border-gray-700/50 last:border-0 transition-colors ${selectedUserId === u.id ? 'bg-blue-900/20 text-blue-400' : 'text-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                                {u.storeImage ? <img src={u.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold">{u.name}</p>
                                                <p className="text-[10px] opacity-70 font-mono">{u.phone}</p>
                                            </div>
                                        </div>
                                        {selectedUserId === u.id && <CheckCircleIcon className="w-4 h-4" />}
                                    </button>
                                ))
                            ) : (
                                <p className="p-4 text-center text-xs text-gray-500">لا توجد نتائج</p>
                            )}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 block">الفترة الزمنية</label>
                        <div className="flex bg-[#0f172a] p-1 rounded-xl border border-gray-600">
                            <button onClick={() => setDateType('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${dateType === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>منذ بدء العمل</button>
                            <button onClick={() => setDateType('custom')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${dateType === 'custom' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>فترة محددة</button>
                        </div>

                        {dateType === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                                <div>
                                    <label className="text-[10px] text-gray-500 mb-1 block">من</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2 px-3 text-white text-xs outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 mb-1 block">إلى</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2 px-3 text-white text-xs outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-gray-700 bg-[#151e2d]">
                    <button
                        onClick={handleGenerate}
                        disabled={!selectedUserId || (dateType === 'custom' && (!startDate || !endDate))}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <ClipboardListIcon className="w-5 h-5" />
                        عرض التقرير
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReportResultsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    reportData: { user: User; orders: Order[]; summary: any; dateLabel: string } | null;
}> = ({ isOpen, onClose, reportData }) => {

    useAndroidBack(() => {
        if (isOpen) { onClose(); return true; }
        return false;
    }, [isOpen]);

    if (!isOpen || !reportData) return null;

    const { user, orders, summary, dateLabel } = reportData;
    const isDriver = user?.role === 'driver';

    const formatDateTime = (dateInput: any) => {
        if (!dateInput) return '---';
        try {
            let d: Date;
            if ((dateInput as any).seconds) {
                d = new Date((dateInput as any).seconds * 1000);
            } else {
                d = new Date(dateInput);
            }
            if (isNaN(d.getTime())) return '---';
            return d.toLocaleString('ar-EG-u-nu-latn', {
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
        } catch (e) { return '---'; }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1e293b] w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl border-x-0 sm:border border-gray-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-5 border-b border-gray-700 bg-[#151e2d] flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            {user.name}
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${isDriver ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                {isDriver ? 'مندوب' : 'تاجر'}
                            </span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {dateLabel}
                        </p>
                    </div>
                    <button onClick={onClose} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white transition-colors"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
                            <p className="text-[10px] text-gray-500 font-bold mb-1">عدد الطلبات</p>
                            <p className="text-xl font-black text-white">{summary.count}</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
                            <p className="text-[10px] text-gray-500 font-bold mb-1">إجمالي القيمة</p>
                            <p className="text-xl font-black text-green-400">{summary.totalRevenue.toLocaleString('en-US')} <span className="text-[10px]">ج.م</span></p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
                            <p className="text-[10px] text-gray-500 font-bold mb-1">إجمالي التوصيل</p>
                            <p className="text-xl font-black text-blue-400">{summary.totalDelivery.toLocaleString('en-US')} <span className="text-[10px]">ج.م</span></p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
                            <p className="text-[10px] text-gray-500 font-bold mb-1">{isDriver ? 'صافي الربح' : 'العمولة المستحقة'}</p>
                            <p className={`text-xl font-black ${isDriver ? 'text-yellow-400' : 'text-red-400'}`}>
                                {isDriver ? summary.driverEarnings.toLocaleString('en-US') : summary.appCommission.toLocaleString('en-US')} <span className="text-[10px]">ج.م</span>
                            </p>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <ClipboardListIcon className="w-4 h-4 text-gray-400" />
                            سجل الطلبات
                        </h4>
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <div key={order.id} className="bg-[#252525] p-4 rounded-2xl border border-white/5 flex flex-col gap-3 shadow-md hover:border-white/10 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-blue-400 font-black bg-blue-900/10 px-2 py-0.5 rounded border border-blue-500/20">#{order.id}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${order.status === OrderStatus.Delivered ? 'bg-green-500/10 text-green-400' : order.status === OrderStatus.Cancelled ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-xs text-gray-400">إجمالي الطلب</p>
                                            <p className="text-sm font-bold text-white">{order.totalPrice?.toLocaleString('en-US')} ج.م</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-gray-300 leading-relaxed">
                                            {isDriver ? `استلام من: ${order.merchantName}` : `توصيل إلى: ${order.customer?.address}`}
                                        </p>
                                    </div>

                                    {/* Professional Financial Row */}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-700 mt-1 bg-black/20 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
                                            <ClockIcon className="w-3 h-3" />
                                            <span className="dir-ltr">{formatDateTime(order.deliveredAt || order.createdAt)}</span>
                                        </div>
                                        {isDriver && (
                                            <div className="flex items-center gap-2 bg-green-900/20 px-3 py-1 rounded-lg border border-green-500/20">
                                                <span className="text-[10px] text-green-300 font-bold">سعر التوصيل:</span>
                                                <span className="text-sm font-black text-green-400">{order.deliveryFee?.toLocaleString('en-US') || 0} ج.م</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                                لا توجد طلبات في هذه الفترة
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper for Business Date logic
const getBusinessDate = (date: Date) => {
    const d = new Date(date);
    if (d.getHours() < 6) {
        d.setDate(d.getDate() - 1);
    }
    d.setHours(0, 0, 0, 0);
    return d;
};

const DailyReportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
    users: User[];
}> = ({ isOpen, onClose, orders, users }) => {
    const dailyStats = useMemo(() => {
        if (!isOpen) return null;

        const todayBusinessDate = getBusinessDate(new Date());

        // Filter orders for "Today" (6 AM today to 6 AM tomorrow)
        const todayOrders = orders.filter((o: Order) => {
            const oDate = (o.createdAt as any).seconds ? new Date((o.createdAt as any).seconds * 1000) : new Date(o.createdAt);
            return getBusinessDate(oDate).getTime() === todayBusinessDate.getTime();
        });

        const delivered = todayOrders.filter((o: Order) => o.status === OrderStatus.Delivered);
        const cancelled = todayOrders.filter(o => o.status === OrderStatus.Cancelled);
        const pending = todayOrders.filter(o => o.status === OrderStatus.Pending);

        const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const totalDeliveryFees = delivered.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

        let totalCommission = 0;
        const driverPerformance: Record<string, { name: string, count: number, total: number }> = {};

        delivered.forEach(o => {
            const driver = users.find((u: User) => u?.id === o.driverId);
            if (driver) {
                // Commission Calc: Only count if > 0 (Paid Daily)
                let comm = 0;
                if (driver.commissionType === 'fixed') {
                    comm = (driver.commissionRate || 0);
                } else {
                    comm = (o.deliveryFee || 0) * ((driver.commissionRate || 0) / 100);
                }

                // Strict "Paid Dailies" Logic: If result is effectively > 0
                if (comm > 0) {
                    totalCommission += comm;
                }

                // Driver Performance
                if (!driverPerformance[driver.id]) {
                    driverPerformance[driver.id] = { name: driver.name, count: 0, total: 0 };
                }
                driverPerformance[driver.id].count += 1;
                driverPerformance[driver.id].total += (o.deliveryFee || 0);
            }
        });

        const topDrivers = Object.values(driverPerformance)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Admin Share (15%)
        const adminShare = totalCommission * 0.15;

        return {
            date: todayBusinessDate,
            count: todayOrders.length,
            deliveredCount: delivered.length,
            cancelledCount: cancelled.length,
            pendingCount: pending.length,
            totalRevenue,
            totalDeliveryFees,
            totalCommission,
            adminShare,
            topDrivers
        };
    }, [isOpen, orders, users]);

    if (!isOpen || !dailyStats) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#0f172a] w-full max-w-3xl max-h-[90vh] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Compact Header */}
                <div className="px-6 py-4 border-b border-gray-800 bg-[#1e293b] flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            التقرير اليومي
                            <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                {dailyStats.date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

                    {/* Compact Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50 flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 font-bold mb-1">الكل</span>
                            <span className="text-2xl font-black text-white">{dailyStats.count}</span>
                        </div>
                        <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/10 flex flex-col items-center">
                            <span className="text-[10px] text-green-500/70 font-bold mb-1">توصيل</span>
                            <span className="text-2xl font-black text-green-400">{dailyStats.deliveredCount}</span>
                        </div>
                        <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10 flex flex-col items-center">
                            <span className="text-[10px] text-red-500/70 font-bold mb-1">إلغاء</span>
                            <span className="text-2xl font-black text-red-400">{dailyStats.cancelledCount}</span>
                        </div>
                        <div className="bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/10 flex flex-col items-center">
                            <span className="text-[10px] text-yellow-500/70 font-bold mb-1">انتظار</span>
                            <span className="text-2xl font-black text-yellow-400">{dailyStats.pendingCount}</span>
                        </div>
                    </div>

                    {/* Detailed Financials */}
                    <div className="bg-[#161f32] rounded-2xl p-5 border border-gray-800 relative overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 relative z-10">
                            <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                                <span className="text-xs text-gray-400">إجمالي المبيعات</span>
                                <span className="text-lg font-bold text-white">{dailyStats.totalRevenue.toLocaleString()} <span className="text-[10px] text-gray-600">ج.م</span></span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                                <span className="text-xs text-gray-400">رسوم التوصيل</span>
                                <span className="text-lg font-bold text-blue-400">{dailyStats.totalDeliveryFees.toLocaleString()} <span className="text-[10px] text-gray-600">ج.م</span></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">أرباح التطبيق (اليوميات)</span>
                                <span className="text-xl font-black text-green-400">{dailyStats.totalCommission.toLocaleString()} <span className="text-[10px] text-gray-600">ج.م</span></span>
                            </div>
                            {/* Admin Share - Visible only in specific contexts if needed, usually Admin sees this modal */}
                            <div className="flex justify-between items-center bg-orange-900/10 -m-1 p-1 px-3 rounded-lg border border-orange-500/10">
                                <span className="text-xs text-orange-400 font-bold">نسبة الإدارة (15%)</span>
                                <span className="text-lg font-black text-orange-400">{dailyStats.adminShare.toLocaleString()} <span className="text-[10px]">ج.م</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Top Drivers Compact */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                            <TruckIconV2 className="w-4 h-4" />
                            النشاط الأعلى
                        </h3>
                        <div className="space-y-2">
                            {dailyStats.topDrivers.length > 0 ? (
                                dailyStats.topDrivers.slice(0, 3).map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-800/40 rounded-lg border border-gray-700/30">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                                            <span className="text-xs font-bold text-gray-300">{d.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-blue-400">{d.count} طلب</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-600 text-center py-2">لا توجد بيانات</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Main Screen ---

import { addData, batchSaveData, updateData, subscribeToCollection } from '../../services/firebase';
import { MonthlyReport } from '../../types';

// ... (Existing Imports)

// --- Helper for formatting Money ---
const formatMoney = (amount: number) => amount.toLocaleString('en-US', { maximumFractionDigits: 1 });

export const AdminReportsScreen: React.FC<AdminReportsScreenProps> = ({ orders: allOrders, users, payments, currentUser }) => {
    // 1. Filter out Archived Orders for Live View
    const orders = useMemo(() => allOrders.filter((o: Order) => !o.isArchived), [allOrders]);

    const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);
    const [reportType, setReportType] = useState<'driver' | 'merchant'>('driver');
    const [resultsModalOpen, setResultsModalOpen] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<any>(null);
    const [dailyReportOpen, setDailyReportOpen] = useState(false);

    // Archive State
    const [isArchiving, setIsArchiving] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [archiveHistory, setArchiveHistory] = useState<MonthlyReport[]>([]); // Need to fetch this
    const [selectedRecord, setSelectedRecord] = useState<MonthlyReport | null>(null);

    // Fetch History on specific user action or effect. Since we don't have a direct hook for this new collection yet, 
    // we'll assume we might need to add it or fetch once. For now, fetch on open.

    useEffect(() => {
        if (showHistory) {
            const unsub = subscribeToCollection('monthly_reports', (data) => {
                const sorted = (data as MonthlyReport[]).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setArchiveHistory(sorted);
            });
            return () => unsub();
        }
    }, [showHistory]);

    const handleArchiveMonth = async () => {
        setIsArchiving(true);
        try {
            const now = new Date();
            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`; // e.g., "فبراير 2024"

            // Snapshot current (non-archived) orders
            const snapshotOrders = [...orders];

            if (snapshotOrders.length === 0) {
                alert("لا توجد بيانات لتصفيرها.");
                setIsArchiving(false);
                setShowArchiveConfirm(false);
                return;
            }

            // Find last order IDs before reset
            const regularOrders = snapshotOrders.filter(o => o.id.startsWith('ORD-'));
            const shoppingOrders = snapshotOrders.filter(o => o.id.startsWith('S-'));

            const getMaxId = (ordersList: Order[], prefix: string) => {
                const maxId = ordersList.reduce((max, o) => {
                    const numStr = o.id.replace(prefix, '');
                    const num = parseInt(numStr || '0');
                    return Math.max(max, num);
                }, 0);
                return maxId > 0 ? `${prefix}${maxId}` : `${prefix}0`;
            };

            const lastRegularOrderId = getMaxId(regularOrders, 'ORD-');
            const lastShoppingOrderId = getMaxId(shoppingOrders, 'S-');

            // Calculate comprehensive metrics
            const deliveredOrders = snapshotOrders.filter(o => o.status === OrderStatus.Delivered);
            const cancelledOrders = snapshotOrders.filter(o => o.status === OrderStatus.Cancelled);

            let totalRev = 0;
            let totalFees = 0;
            let totalProf = 0;
            const walletSnapshots: Record<string, any> = {};

            deliveredOrders.forEach(o => {
                const driver = users.find(u => u.id === o.driverId);
                totalRev += (o.totalPrice || 0);
                totalFees += (o.deliveryFee || 0);

                // Calculate commission (app profit)
                let profit = 0;
                if (driver) {
                    if (driver.commissionType === 'fixed') {
                        profit = (driver.commissionRate || 0);
                    } else {
                        profit = (o.deliveryFee || 0) * ((driver.commissionRate || 0) / 100);
                    }
                }
                if (profit > 0) totalProf += profit;

                // Build wallet snapshot
                if (driver) {
                    if (!walletSnapshots[driver.id]) {
                        // Calculate actual unpaid balance for this driver
                        const driverOrders = deliveredOrders.filter(ord => ord.driverId === driver.id && !ord.reconciled);
                        const driverFees = driverOrders.reduce((sum, ord) => sum + (ord.deliveryFee || 0), 0);
                        let driverCommission = 0;
                        driverOrders.forEach(ord => {
                            if (driver.commissionType === 'fixed') {
                                driverCommission += (driver.commissionRate || 0);
                            } else {
                                driverCommission += (ord.deliveryFee || 0) * ((driver.commissionRate || 0) / 100);
                            }
                        });
                        const driverBalance = driverFees - driverCommission;

                        walletSnapshots[driver.id] = {
                            name: driver.name,
                            role: 'driver',
                            balance: driverBalance,
                            ordersCount: driverOrders.length
                        };
                    }
                }
            });

            // Create comprehensive monthly report
            const report: MonthlyReport = {
                id: `ARCHIVE_${now.getTime()}`,
                month: now.getMonth(),
                year: now.getFullYear(),
                monthLabel: monthLabel,
                totalRevenue: totalRev,
                totalDeliveryFees: totalFees,
                totalAppProfit: totalProf,
                adminShare: totalProf * 0.15, // 15% of app profit
                totalDriverPayouts: totalFees - totalProf,
                createdAt: now,
                archivedOrdersCount: snapshotOrders.length,
                deliveredOrdersCount: deliveredOrders.length,
                cancelledOrdersCount: cancelledOrders.length,
                lastRegularOrderId: lastRegularOrderId,
                lastShoppingOrderId: lastShoppingOrderId,
                walletSnapshots: walletSnapshots,
                archivedBy: currentUser.id
            };

            // 1. Save monthly report
            await addData('monthly_reports', report);

            // 2. Archive all orders with month label (batch update)
            const BATCH_SIZE = 400;
            const chunks = [];
            await addData('monthly_reports', newReport);

            // 4. Update Drivers (Batch)
            // We set walletOpeningBalance.
            for (const update of userUpdates) {
                await updateData('users', update.id, { walletOpeningBalance: update.walletOpeningBalance });
            }

            // 5. Mark Orders as Archived (Batch)
            // We use batchSaveData for efficiency
            const orderUpdates = archivedOrders.map(o => ({
                id: o.id,
                isArchived: true,
                archiveMonth: newReport.monthLabel
            }));

            await batchSaveData('orders', orderUpdates);

            // 6. Archive Payments (Optional but recommended to keep math sane)
            // We mark them as reconciled/archived
            const allPayments = payments.filter(p => !p.reconciledOrderIds?.includes('ARCHIVED'));
            const paymentUpdates = allPayments.map(p => ({
                id: p.id,
                reconciledOrderIds: ['ARCHIVED'] // Mark as archived
            }));
            await batchSaveData('payments', paymentUpdates);

            setShowArchiveConfirm(false);
            // Reload to reflect changes (reset IDs, clean view)
            window.location.reload();

        } catch (error) {
            console.error("Archive Failed:", error);
            alert("حدث خطأ أثناء الأرشفة");
        } finally {
            setIsArchiving(false);
        }
    };

    const stats = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === OrderStatus.Delivered);
        const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const totalDeliveryFees = deliveredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

        // Logic: App Profit = Sum(Paid Dailies)
        let totalCommission = 0;
        deliveredOrders.forEach(o => {
            const driver = users.find(u => u?.id === o.driverId);
            if (driver) {
                let comm = 0;
                if (driver.commissionType === 'fixed') {
                    comm = (driver.commissionRate || 0);
                } else {
                    comm = (o.deliveryFee || 0) * ((driver.commissionRate || 0) / 100);
                }
                if (comm > 0) totalCommission += comm;
            }
        });

        // Monthly Calculation
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyOrders = deliveredOrders.filter(o => {
            const d = (o.deliveredAt as any)?.seconds ? new Date((o.deliveredAt as any).seconds * 1000) : new Date(o.deliveredAt || o.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        let monthlyCommission = 0;
        monthlyOrders.forEach(o => {
            const driver = users.find(u => u?.id === o.driverId);
            if (driver) {
                let comm = 0;
                if (driver.commissionType === 'fixed') {
                    comm = (driver.commissionRate || 0);
                } else {
                    comm = (o.deliveryFee || 0) * ((driver.commissionRate || 0) / 100);
                }
                if (comm > 0) monthlyCommission += comm;
            }
        });

        return {
            orderCount: orders.length,
            deliveredCount: deliveredOrders.length,
            cancelledCount: orders.filter(o => o.status === OrderStatus.Cancelled).length,
            pendingCount: orders.filter(o => o.status === OrderStatus.Pending).length,
            totalRevenue,
            totalDeliveryFees,
            totalCommission,
            merchantsCount: users.filter(u => u?.role === 'merchant').length,
            driversCount: users.filter(u => u?.role === 'driver').length,
            monthlyRevenue,
            monthlyCommission,
            // Admin Profit is 15% of App Profit
            commission15PercentTotal: totalCommission * 0.15,
            commission15PercentMonthly: monthlyCommission * 0.15
        };
    }, [orders, users]);


    const handleOpenCriteria = (type: 'driver' | 'merchant') => {
        setReportType(type);
        setCriteriaModalOpen(true);
    };

    const generateReportData = (userId: string, dateRange: { type: 'all' | 'custom'; start?: string; end?: string }) => {
        const user = users.find(u => u?.id === userId);
        if (!user) return;

        let filteredOrders = orders.filter(o => user.role === 'driver' ? o.driverId === userId : o.merchantId === userId);

        let dateLabel = "منذ بدء العمل";

        if (dateRange.type === 'custom' && dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59); // End of day

            filteredOrders = filteredOrders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= start && d <= end;
            });
            dateLabel = `من ${dateRange.start} إلى ${dateRange.end}`;
        }

        // Calculate Specific Summaries
        const delivered = filteredOrders.filter(o => o.status === OrderStatus.Delivered);
        const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const totalDelivery = delivered.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

        let appCommission = 0;
        let driverEarnings = 0;

        if (user.role === 'driver') {
            if (user.commissionType === 'fixed') {
                // For fixed commission, we count orders. 
                // "Paid Dailies" logic: If the user meant Ignore orders with 0 fee? 
                // Usually "Daily" implies the fee the Driver pays to the App.
                // If the delivery fee is 0 (Free Delivery), does the driver still pay commission?
                // The request says "profit of the app is the paid dailies and not the zero dailies".
                // This likely means: Only count commission if (Commission > 0).
                // Or if it refers to the Order's Delivery Fee?
                // "The paid dailies" usually refers to the daily fee collected.
                // Let's assume: Count commission only if the RESULTING commission > 0.

                appCommission = delivered.reduce((sum, o) => {
                    // Check if there is a "paid daily" involved.
                    // If commission is fixed, it applies per order.
                    // If the user specific "Zero Dailies", they might mean orders where the calculated commission came out to 0 (e.g. if percentage based on 0 fee).

                    // However, for FIXED commission, it's always > 0 unless rate is 0.
                    // For PERCENTAGE:
                    let comm = 0;
                    if (user.commissionType === 'fixed') {
                        comm = (user.commissionRate || 0);
                    } else {
                        comm = (o.deliveryFee || 0) * ((user.commissionRate || 0) / 100);
                    }
                    return sum + comm;
                }, 0);

            } else {
                // Percentage Based
                appCommission = delivered.reduce((sum, o) => {
                    const comm = (o.deliveryFee || 0) * ((user.commissionRate || 0) / 100);
                    return sum + comm;
                }, 0);
            }
            driverEarnings = totalDelivery - appCommission;
        }

        setGeneratedReport({
            user,
            orders: filteredOrders.sort((a, b) => {
                const timeA = (a.createdAt as any).seconds ? (a.createdAt as any).seconds : new Date(a.createdAt).getTime();
                const timeB = (b.createdAt as any).seconds ? (b.createdAt as any).seconds : new Date(b.createdAt).getTime();
                return timeB - timeA;
            }),
            summary: {
                count: filteredOrders.length,
                totalRevenue,
                totalDelivery,
                appCommission,
                driverEarnings
            },
            dateLabel
        });
        setResultsModalOpen(true);
    };

    return (
        <div className="space-y-8 pb-32 animate-fadeIn relative">
            <div className="flex flex-col gap-6 border-b border-gray-700 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-900/20">
                        <ChartBarIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">التقارير المالية</h2>
                        <p className="text-gray-500 text-sm font-medium">تحليل كامل لأداء النظام والعمليات</p>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                    {currentUser.role === 'admin' && (
                        <>
                            <button
                                onClick={() => setShowArchiveConfirm(true)}
                                className="flex-1 bg-red-900/40 hover:bg-red-900/60 border border-red-800 rounded-xl p-3 flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-lg shadow-red-900/20"
                            >
                                <div className="p-2 bg-red-500/20 rounded-full group-hover:bg-red-500/30"><TrashIcon className="w-5 h-5 text-red-400" /></div>
                                <span className="text-sm font-bold text-white">تصفير حسابات الشهر</span>
                            </button>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                            >
                                <div className="p-2 bg-gray-700/50 rounded-full group-hover:bg-gray-600"><ClockIcon className="w-5 h-5 text-gray-300" /></div>
                                <span className="text-sm font-bold text-gray-200">أرشيف الشهور</span>
                            </button>
                            <button
                                onClick={() => setDailyReportOpen(true)}
                                className="flex-1 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 border border-blue-700 rounded-xl p-3 flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-lg shadow-blue-900/30"
                            >
                                <div className="p-2 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30"><ClipboardListIcon className="w-5 h-5 text-blue-200" /></div>
                                <span className="text-sm font-bold text-white">التقرير اليومي الشامل</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => handleOpenCriteria('driver')}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                    >
                        <div className="p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20"><TruckIconV2 className="w-5 h-5 text-blue-400" /></div>
                        <span className="text-sm font-bold text-gray-200">تقرير مندوب</span>
                    </button>
                    <button
                        onClick={() => handleOpenCriteria('merchant')}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                    >
                        <div className="p-2 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20"><StoreIcon className="w-5 h-5 text-purple-400" /></div>
                        <span className="text-sm font-bold text-gray-200">تقرير تاجر</span>
                    </button>
                </div>
            </div>

            {/* Financial Cards (Admin Only) */}
            {currentUser.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatBox
                        title="إجمالي المبيعات"
                        value={`${stats.totalRevenue.toLocaleString('en-US')} ج.م`}
                        subValue="قيمة المنتجات التي تم تسليمها"
                        icon={<DollarSignIcon className="w-6 h-6" />}
                        color="bg-green-500"
                        trend="up"
                        trendValue="+12%"
                    />
                    <StatBox
                        title="أرباح التوصيل"
                        value={`${stats.totalDeliveryFees.toLocaleString('en-US')} ج.م`}
                        subValue="إجمالي مصاريف الشحن المحصلة"
                        icon={<TruckIconV2 className="w-6 h-6" />}
                        color="bg-blue-500"
                    />
                    <StatBox
                        title="عمولة التطبيق"
                        value={`${stats.totalCommission.toLocaleString('en-US')} ج.م`}
                        subValue="صافي ربح المنصة من التوصيل"
                        icon={<TrendingUpIcon className="w-6 h-6" />}
                        color="bg-red-500"
                        trend="up"
                        trendValue="+5%"
                    />
                </div>
            )}

            {/* Monthly Stats Row (Admin Only) */}
            {currentUser.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-5 rounded-2xl border border-purple-500/30 relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-300">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-purple-200 font-bold mb-1">صافي أرباح الفترة الحالية</p>
                                <h3 className="text-2xl font-black text-white">{stats.totalCommission.toLocaleString('en-US')} <span className="text-sm font-normal text-purple-300">ج.م</span></h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 p-5 rounded-2xl border border-orange-500/30 relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-orange-500/20 rounded-xl text-orange-300">
                                <CoinsIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-orange-200 font-bold mb-1">أرباح الأدمن (الفترة الحالية)</p>
                                <h3 className="text-2xl font-black text-white">{stats.commission15PercentTotal.toLocaleString('en-US')} <span className="text-sm font-normal text-orange-300">ج.م</span></h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Operations Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center text-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-2xl font-black text-white">{stats.deliveredCount}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">طلب مكتمل</span>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center text-center">
                    <ClockIcon className="w-8 h-8 text-yellow-500 mb-2" />
                    <span className="text-2xl font-black text-white">{stats.pendingCount}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">قيد الانتظار</span>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center text-center">
                    <XIcon className="w-8 h-8 text-red-500 mb-2" />
                    <span className="text-2xl font-black text-white">{stats.cancelledCount}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">طلب ملغي</span>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center text-center">
                    <UsersIcon className="w-8 h-8 text-purple-500 mb-2" />
                    <span className="text-2xl font-black text-white">{users.length}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">مستخدم نشط</span>
                </div>
            </div>

            {/* Distribution Charts (CSS Based) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <StoreIcon className="w-5 h-5 text-purple-400" />
                        توزيع المتاجر
                    </h3>
                    <div className="space-y-4">
                        {['restaurant', 'market', 'pharmacy'].map(cat => {
                            const count = users.filter(u => u?.role === 'merchant' && u.storeCategory === cat).length;
                            const percentage = stats.merchantsCount > 0 ? (count / stats.merchantsCount) * 100 : 0;
                            return (
                                <div key={cat} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-gray-400">
                                        <span>{cat === 'restaurant' ? 'مطاعم' : cat === 'market' ? 'سوبر ماركت' : 'صيدليات'}</span>
                                        <span className="text-white">{count}</span>
                                    </div>
                                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-600 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TruckIconV2 className="w-5 h-5 text-blue-400" />
                        أداء المناديب
                    </h3>
                    <div className="flex flex-col justify-center h-full">
                        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-2xl mb-3 border border-white/5">
                            <span className="text-sm text-gray-400 font-bold">متوسط التوصيل اليومي</span>
                            <span className="text-xl font-black text-blue-400">{stats.deliveredCount > 0 ? (stats.deliveredCount / Math.max(stats.driversCount, 1)).toFixed(1) : 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-2xl border border-white/5">
                            <span className="text-sm text-gray-400 font-bold">نسبة نجاح التوصيل</span>
                            <span className="text-xl font-black text-green-400">
                                {stats.orderCount > 0 ? ((stats.deliveredCount / stats.orderCount) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ReportCriteriaModal
                isOpen={criteriaModalOpen}
                onClose={() => setCriteriaModalOpen(false)}
                type={reportType}
                users={users}
                onGenerate={generateReportData}
            />

            <ReportResultsModal
                isOpen={resultsModalOpen}
                onClose={() => setResultsModalOpen(false)}
                reportData={generatedReport}
            />

            {/* Archive Confirmation Modal */}
            {showArchiveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isArchiving && setShowArchiveConfirm(false)} />
                    <div className="bg-[#1a1a1a] rounded-3xl w-full max-w-md p-6 border border-red-500/30 relative z-10 animate-scaleIn shadow-2xl shadow-red-900/20">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-4 bg-red-500/10 rounded-full animate-pulse">
                                <ExclamationIcon className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white">هل أنت متأكد من تصفير الحسابات؟</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">
                                سيقوم هذا الإجراء <span className="text-red-400 font-bold">بأرشفة جميع الحسابات الحالية</span> ونقلها إلى سجلات الشهر الماضي.
                                <br />
                                سيتم بدء شهر مالي جديد ولن تظهر البيانات القديمة في الواجهة الرئيسية.
                            </p>

                            <div className="w-full bg-red-900/20 border border-red-900/50 rounded-xl p-4 mt-2">
                                <div className="flex justify-between items-center mb-2 text-red-200 text-sm font-bold">
                                    <span>إجمالي العمولة المستحقة</span>
                                    <span>{stats.totalCommission.toLocaleString('en-US')} ج.م</span>
                                </div>
                                <div className="flex justify-between items-center text-red-200 text-sm font-bold">
                                    <span>حصة الأدمن (15%)</span>
                                    <span>{stats.commission15PercentTotal.toLocaleString('en-US')} ج.م</span>
                                </div>
                            </div>

                            <div className="flex w-full gap-3 mt-4">
                                <button
                                    onClick={handleArchiveMonth}
                                    disabled={isArchiving}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isArchiving ? 'جاري التنفيذ...' : 'نعم، تصفير وبدء شهر جديد'}
                                </button>
                                <button
                                    onClick={() => setShowArchiveConfirm(false)}
                                    disabled={isArchiving}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowHistory(false)} />
                    <div className="bg-[#121212] rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-800 relative z-10 animate-scaleIn">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a] rounded-t-3xl">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <ClockIcon className="w-8 h-8 text-blue-500" />
                                    أرشيف الشهور السابقة
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">سجل كامل بجميع الفترات المالية المغلقة</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XIcon className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                            <div className="grid gap-4">
                                {archiveHistory.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">
                                        <p>لا توجد سجلات مؤرشفة حتى الآن</p>
                                    </div>
                                ) : (
                                    archiveHistory.map((report: MonthlyReport) => (
                                        <div key={report.id} className="bg-[#1a1a1a] border border-gray-800 p-5 rounded-2xl hover:border-gray-600 transition-colors group">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                                        <CalendarIcon className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white">تقرير شهر {report.month + 1} / {report.year}</h4>
                                                        <p className="text-xs text-gray-500">تم الأرشفة في {new Date(report.createdAt).toLocaleDateString('ar-EG')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                                                    <span className="text-xs text-green-400 font-bold">مكتمل</span>
                                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                    <p className="text-xs text-gray-400 mb-1">إجمالي المبيعات</p>
                                                    <p className="text-lg font-bold text-white">{formatMoney(report.totalRevenue)}</p>
                                                </div>
                                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                    <p className="text-xs text-gray-400 mb-1">رسوم التوصيل</p>
                                                    <p className="text-lg font-bold text-blue-400">{formatMoney(report.totalDeliveryFees)}</p>
                                                </div>
                                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                    <p className="text-xs text-gray-400 mb-1">صافي ربح التطبيق</p>
                                                    <p className="text-lg font-bold text-green-400">{formatMoney(report.totalAppProfit)}</p>
                                                </div>
                                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                    <p className="text-xs text-gray-400 mb-1">حصة الأدمن (15%)</p>
                                                    <p className="text-lg font-bold text-orange-400">{formatMoney(report.totalAppProfit * 0.15)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DailyReportModal
                isOpen={dailyReportOpen}
                onClose={() => setDailyReportOpen(false)}
                orders={orders}
                users={users}
            />
        </div >
    );
};
