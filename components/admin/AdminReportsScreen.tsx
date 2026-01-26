
import React, { useMemo, useState } from 'react';
import { Order, User, Payment, OrderStatus } from '../../types';
import { ChartBarIcon, DollarSignIcon, TruckIconV2, CheckCircleIcon, ClockIcon, UsersIcon, StoreIcon, TrendingUpIcon, TrendingDownIcon, XIcon, CalendarIcon, ClipboardListIcon, SearchIcon, UserIcon, MapPinIcon, CoinsIcon } from '../icons';
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
        const todayOrders = orders.filter(o => {
            const oDate = (o.createdAt as any).seconds ? new Date((o.createdAt as any).seconds * 1000) : new Date(o.createdAt);
            return getBusinessDate(oDate).getTime() === todayBusinessDate.getTime();
        });

        const delivered = todayOrders.filter(o => o.status === OrderStatus.Delivered);
        const cancelled = todayOrders.filter(o => o.status === OrderStatus.Cancelled);
        const pending = todayOrders.filter(o => o.status === OrderStatus.Pending);

        const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const totalDeliveryFees = delivered.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

        let totalCommission = 0;
        const driverPerformance: Record<string, { name: string, count: number, total: number }> = {};

        delivered.forEach(o => {
            const driver = users.find(u => u?.id === o.driverId);
            if (driver) {
                // Commission Calc
                if (driver.commissionType === 'fixed') {
                    totalCommission += (driver.commissionRate || 0);
                } else {
                    totalCommission += (o.deliveryFee || 0) * ((driver.commissionRate || 0) / 100);
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

        return {
            date: todayBusinessDate,
            count: todayOrders.length,
            deliveredCount: delivered.length,
            cancelledCount: cancelled.length,
            pendingCount: pending.length,
            totalRevenue,
            totalDeliveryFees,
            totalCommission,
            topDrivers
        };
    }, [isOpen, orders, users]);

    if (!isOpen || !dailyStats) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#0f172a] w-full max-w-4xl max-h-[90vh] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-[#1e293b] flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            التقرير اليومي الشامل
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg">اليومية الحالية</span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {dailyStats.date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-500 transition-all">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                            <p className="text-xs text-gray-500 font-bold mb-1">إجمالي الطلبات</p>
                            <p className="text-3xl font-black text-white">{dailyStats.count}</p>
                        </div>
                        <div className="bg-green-900/10 p-4 rounded-2xl border border-green-500/20">
                            <p className="text-xs text-green-500/70 font-bold mb-1">تم التوصيل</p>
                            <p className="text-3xl font-black text-green-400">{dailyStats.deliveredCount}</p>
                        </div>
                        <div className="bg-red-900/10 p-4 rounded-2xl border border-red-500/20">
                            <p className="text-xs text-red-500/70 font-bold mb-1">ملغي / مرفوض</p>
                            <p className="text-3xl font-black text-red-400">{dailyStats.cancelledCount}</p>
                        </div>
                        <div className="bg-yellow-900/10 p-4 rounded-2xl border border-yellow-500/20">
                            <p className="text-xs text-yellow-500/70 font-bold mb-1">قيد التنفيذ</p>
                            <p className="text-3xl font-black text-yellow-400">{dailyStats.pendingCount}</p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -ml-10 -mt-10 pointer-events-none"></div>
                        <h3 className="text-lg font-bold text-white mb-6 relative z-10 flex items-center gap-2">
                            <DollarSignIcon className="w-5 h-5 text-green-400" />
                            الملخص المالي
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            <div>
                                <p className="text-xs text-gray-400 mb-2">إجمالي قيمة المبيعات</p>
                                <p className="text-2xl font-black text-white">{dailyStats.totalRevenue.toLocaleString('en-US')} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-2">إجمالي رسوم التوصيل</p>
                                <p className="text-2xl font-black text-blue-400">{dailyStats.totalDeliveryFees.toLocaleString('en-US')} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-2">عمولة التطبيق (الصافي)</p>
                                <p className="text-2xl font-black text-green-400">{dailyStats.totalCommission.toLocaleString('en-US')} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Top Drivers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TruckIconV2 className="w-5 h-5 text-blue-400" />
                                أفضل المناديب اليوم
                            </h3>
                            <div className="space-y-4">
                                {dailyStats.topDrivers.length > 0 ? (
                                    dailyStats.topDrivers.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                                                    {i + 1}
                                                </div>
                                                <span className="text-sm font-bold text-white">{d.name}</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-blue-400">{d.count} طلب</p>
                                                <p className="text-[10px] text-gray-500">{d.total.toLocaleString()} ج.م توصيل</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4 text-sm">لا توجد بيانات حتى الآن</p>
                                )}
                            </div>
                        </div>

                        {/* Status Distribution Bar */}
                        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-white mb-6">توزيع حالات الطلب</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-300 mb-2">
                                        <span>نسبة التوصيل</span>
                                        <span>{dailyStats.count > 0 ? Math.round((dailyStats.deliveredCount / dailyStats.count) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${dailyStats.count > 0 ? (dailyStats.deliveredCount / dailyStats.count) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-300 mb-2">
                                        <span>نسبة الإلغاء</span>
                                        <span>{dailyStats.count > 0 ? Math.round((dailyStats.cancelledCount / dailyStats.count) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${dailyStats.count > 0 ? (dailyStats.cancelledCount / dailyStats.count) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Main Screen ---

export const AdminReportsScreen: React.FC<AdminReportsScreenProps> = ({ orders, users, payments, currentUser }) => {
    const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);
    const [reportType, setReportType] = useState<'driver' | 'merchant'>('driver');
    const [resultsModalOpen, setResultsModalOpen] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<any>(null);
    const [dailyReportOpen, setDailyReportOpen] = useState(false);

    const stats = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === OrderStatus.Delivered);
        const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const totalDeliveryFees = deliveredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

        let totalCommission = 0;
        deliveredOrders.forEach(o => {
            const driver = users.find(u => u?.id === o.driverId);
            if (driver) {
                if (driver.commissionType === 'fixed') {
                    totalCommission += (driver.commissionRate || 0);
                } else {
                    totalCommission += (o.deliveryFee || 0) * ((driver.commissionRate || 0) / 100);
                }
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
                if (driver.commissionType === 'fixed') {
                    monthlyCommission += (driver.commissionRate || 0);
                } else {
                    monthlyCommission += (o.deliveryFee || 0) * ((driver.commissionRate || 0) / 100);
                }
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
            commission15Percent: monthlyCommission * 0.15
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
                appCommission = delivered.length * (user.commissionRate || 0);
            } else {
                appCommission = totalDelivery * ((user.commissionRate || 0) / 100);
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

                {/* Quick Actions for Detailed Reports */}
                <div className="flex gap-3">
                    {currentUser.role === 'admin' && (
                        <button
                            onClick={() => setDailyReportOpen(true)}
                            className="flex-1 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 border border-blue-700 rounded-xl p-3 flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-lg shadow-blue-900/30"
                        >
                            <div className="p-2 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30"><ClipboardListIcon className="w-5 h-5 text-blue-200" /></div>
                            <span className="text-sm font-bold text-white">التقرير اليومي الشامل</span>
                        </button>
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
                                <p className="text-xs text-purple-200 font-bold mb-1">صافي أرباح الشهر الحالي</p>
                                <h3 className="text-2xl font-black text-white">{stats.monthlyCommission.toLocaleString('en-US')} <span className="text-sm font-normal text-purple-300">ج.م</span></h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 p-5 rounded-2xl border border-orange-500/30 relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-orange-500/20 rounded-xl text-orange-300">
                                <CoinsIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-orange-200 font-bold mb-1">نسبة الشطارة (15%)</p>
                                <h3 className="text-2xl font-black text-white">{stats.commission15Percent.toLocaleString('en-US')} <span className="text-sm font-normal text-orange-300">ج.م</span></h3>
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

            <DailyReportModal
                isOpen={dailyReportOpen}
                onClose={() => setDailyReportOpen(false)}
                orders={orders}
                users={users}
            />
        </div >
    );
};
