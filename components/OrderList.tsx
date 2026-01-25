
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, User, OrderStatus } from '../types';
import OrderStatusBadge from './OrderStatusBadge';
import { PhoneIcon, WhatsAppIcon, EmptyBoxIcon, SearchIcon, ChartBarIcon, UserIcon, ClockIcon, CalendarIcon, ShoppingCartIcon, RocketIcon, CheckCircleIcon, XIcon, TruckIconV2, ClipboardListIcon } from './icons';

interface MerchantOrderCardProps {
    order: Order;
    driver: { name: string; phone?: string | null };
    viewingMerchant?: User;
}

const MerchantOrderCard: React.FC<MerchantOrderCardProps> = ({ order, driver, viewingMerchant }) => {
    const formattedDate = (() => {
        try {
            const createdAt = order.createdAt;
            let d: Date;
            if ((createdAt as any).seconds) {
                d = new Date((createdAt as any).seconds * 1000);
            } else {
                d = new Date(createdAt);
            }
            if (isNaN(d.getTime())) return '';
            const day = d.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'short' });
            const date = d.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'numeric' });
            const time = d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric' });
            return `${day} ${date} - ${time}`;
        } catch (e) {
            return '';
        }
    })();

    // Delivery Time Logic (Requires Permission)
    const deliveryTime = useMemo(() => {
        if (!viewingMerchant?.canShowDeliveryTime || order.status !== OrderStatus.Delivered || !order.deliveredAt) return null;
        try {
            let d: Date;
            if ((order.deliveredAt as any).seconds) {
                d = new Date((order.deliveredAt as any).seconds * 1000);
            } else {
                d = new Date(order.deliveredAt);
            }
            if (isNaN(d.getTime())) return null;
            return d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric', hour12: true });
        } catch (e) { return null; }
    }, [order.deliveredAt, order.status, viewingMerchant]);

    const isShoppingOrder = order.type === 'shopping_order';

    return (
        <div className={`bg-gray-800 rounded-2xl p-4 space-y-3 transition-all border shadow-sm hover:shadow-md relative overflow-hidden group ${isShoppingOrder ? 'border-purple-500/30' : 'border-gray-700'}`}>
            {isShoppingOrder && (
                <div className="absolute top-0 left-0 bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded-br-lg font-bold z-10">
                    تسوق خاص
                </div>
            )}

            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-xs text-red-400 bg-red-900/10 px-2 py-0.5 rounded-md border border-red-900/30 font-bold tracking-wider">
                            #{order.id}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-md">
                            <ClockIcon className="w-3 h-3 opacity-70" />
                            {formattedDate}
                        </span>
                        {deliveryTime && (
                            <span className="text-[10px] text-green-400 font-bold flex items-center gap-1 bg-green-900/20 px-2 py-0.5 rounded-md border border-green-500/20 animate-fadeIn">
                                <CheckCircleIcon className="w-3 h-3" />
                                تم: {deliveryTime}
                            </span>
                        )}
                    </div>

                    <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                            {isShoppingOrder ? <RocketIcon className="w-4 h-4 text-purple-400" /> : <ShoppingCartIcon className="w-4 h-4 text-gray-500" />}
                        </div>
                        <p className="font-bold text-white text-sm leading-snug line-clamp-2">
                            {order.customer?.address || 'العنوان غير محدد'}
                        </p>
                    </div>

                    {order.notes && (
                        <div className="mt-2 bg-red-900/10 p-2.5 rounded-lg border border-red-500/20">
                            <p className="text-[11px] font-bold text-red-400 mb-1">ملاحظات:</p>
                            <p className="text-xs text-gray-200 leading-relaxed font-medium">
                                {order.notes}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-gray-400 flex items-center gap-1 bg-gray-700/30 px-2 py-1 rounded-lg">
                            <UserIcon className="w-3 h-3" />
                            <span className="font-mono dir-ltr copyable-phone">{order.customer?.phone || ''}</span>
                        </p>
                        {order.totalPrice && (
                            <p className="text-xs font-bold text-green-400 bg-green-900/10 px-2 py-1 rounded-lg border border-green-500/10">
                                {order.totalPrice.toLocaleString('en-US')} ج.م
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 mr-2 flex flex-col items-end gap-2">
                    <OrderStatusBadge status={order.status} />
                </div>
            </div>

            <div className="pt-3 border-t border-gray-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="p-1.5 bg-gray-700 rounded-full ml-2 border border-gray-600">
                            <TruckIconV2 className={`w-3.5 h-3.5 ${driver.name !== 'لم يعين' ? 'text-blue-400' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500">مندوب التوصيل</span>
                            <span className={`text-xs font-bold ${driver.name === 'لم يعين' ? 'text-gray-500 italic' : 'text-white'}`}>
                                {driver.name}
                            </span>
                        </div>
                    </div>

                    {driver.phone && (order.status === OrderStatus.InTransit || order.status === OrderStatus.Delivered) && (
                        <div className="flex space-x-2 space-x-reverse">
                            <a href={`https://wa.me/2${driver.phone}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-600/10 text-green-400 rounded-lg hover:bg-green-600/20 transition-colors border border-green-500/10">
                                <WhatsAppIcon className="w-4 h-4" />
                            </a>
                            <a href={`tel:${driver.phone}`} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-colors border border-blue-500/10">
                                <PhoneIcon className="w-4 h-4" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

interface OrderListProps {
    orders: Order[];
    users: User[];
    viewingMerchant?: User; // New prop to pass permission context
}

const FilterChip: React.FC<{
    active: boolean;
    label: string;
    count?: number;
    onClick: () => void;
    icon?: React.ReactNode;
}> = ({ active, label, count, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${active
            ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/20'
            : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200'
            }`}
    >
        {icon && <span className={active ? 'text-white' : 'text-gray-500'}>{icon}</span>}
        {label}
        {count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-black/20 text-gray-500'}`}>
                {count}
            </span>
        )}
    </button>
);

const OrderList: React.FC<OrderListProps> = ({ orders, users, viewingMerchant }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter States
    const [filterMode, setFilterMode] = useState<'today' | 'all' | 'custom'>('today');
    const [showShoppingOnly, setShowShoppingOnly] = useState(false);
    const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [visibleCount, setVisibleCount] = useState(20);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Helper to normalize dates for comparison
    const isSameDate = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const getOrderDate = (order: Order): Date => {
        const val = order.createdAt as any;
        if (typeof val.toDate === 'function') return val.toDate();
        if (val.seconds) return new Date(val.seconds * 1000);
        return new Date(val);
    };

    // 1. Filter by Time/Date
    const dateFilteredOrders = useMemo(() => {
        if (filterMode === 'all') return orders;

        const targetDate = filterMode === 'today' ? new Date() : new Date(customDate);

        return orders.filter(o => {
            const oDate = getOrderDate(o);
            return isSameDate(oDate, targetDate);
        });
    }, [orders, filterMode, customDate]);

    // 2. Filter by Type & Search
    const finalFilteredOrders = useMemo(() => {
        return dateFilteredOrders
            .filter(order => !showShoppingOnly || order.type === 'shopping_order')
            .filter(order =>
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.customer?.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.customer?.phone || '').includes(searchTerm)
            )
            .sort((a, b) => getOrderDate(b).getTime() - getOrderDate(a).getTime()); // Newest first
    }, [dateFilteredOrders, showShoppingOnly, searchTerm]);

    // Counts for Badges
    const counts = useMemo(() => {
        const today = new Date();
        return {
            today: orders.filter(o => isSameDate(getOrderDate(o), today)).length,
            all: orders.length,
            shopping: orders.filter(o => o.type === 'shopping_order').length
        };
    }, [orders]);

    useEffect(() => { setVisibleCount(20); }, [finalFilteredOrders.length]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && visibleCount < finalFilteredOrders.length) {
                setVisibleCount(prev => prev + 20);
            }
        }, { threshold: 0.1 });
        if (bottomRef.current) observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [finalFilteredOrders.length, visibleCount]);

    const visibleOrders = useMemo(() => finalFilteredOrders.slice(0, visibleCount), [finalFilteredOrders, visibleCount]);

    return (
        <div className="bg-gray-900 flex flex-col h-full min-h-full">
            {/* Header Title - Normal flow, not sticky */}
            <div className="px-4 py-4 flex items-center gap-2 bg-gray-900 border-b border-gray-800">
                <div className="p-2 bg-red-600/10 rounded-xl text-red-500">
                    <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">سجل الطلبات</h3>
                    <p className="text-xs text-gray-400 font-medium">عرض ومتابعة تاريخ الطلبات</p>
                </div>
            </div>

            {/* Filters Bar - Normal flow, not sticky */}
            <div className="bg-gray-900 border-b border-gray-800 pb-2">

                {/* Search */}
                <div className="px-4 pt-3 pb-3">
                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="بحث برقم الطلب، الهاتف، العنوان..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-gray-500 text-sm shadow-inner"
                        />
                    </div>
                </div>

                {/* Horizontal Filter Chips */}
                <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide items-center">
                    <FilterChip
                        active={filterMode === 'today' && !showShoppingOnly}
                        label="طلبات اليوم"
                        count={counts.today}
                        onClick={() => { setFilterMode('today'); setShowShoppingOnly(false); }}
                        icon={<ClockIcon className="w-4 h-4" />}
                    />

                    <FilterChip
                        active={showShoppingOnly}
                        label="طلبات التسوق"
                        count={counts.shopping}
                        onClick={() => setShowShoppingOnly(!showShoppingOnly)}
                        icon={<RocketIcon className="w-4 h-4" />}
                    />

                    <FilterChip
                        active={filterMode === 'all' && !showShoppingOnly}
                        label="الكل (منذ البدء)"
                        count={counts.all}
                        onClick={() => { setFilterMode('all'); setShowShoppingOnly(false); }}
                        icon={<ClipboardListIcon className="w-4 h-4" />}
                    />

                    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-all ${filterMode === 'custom' ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700'}`}>
                        <input
                            type="date"
                            value={customDate}
                            onChange={(e) => { setCustomDate(e.target.value); setFilterMode('custom'); setShowShoppingOnly(false); }}
                            className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                        />
                        <CalendarIcon className={`w-4 h-4 ${filterMode === 'custom' ? 'text-blue-400' : 'text-gray-500'}`} />
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="p-4 space-y-3 pb-24">
                {visibleOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 py-20 bg-gray-800/20 rounded-3xl border border-dashed border-gray-700 mt-4">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <EmptyBoxIcon className="w-10 h-10 opacity-30" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-300">لا توجد طلبات</h3>
                        <p className="text-sm mt-1">لا توجد طلبات مطابقة للفلاتر المحددة.</p>
                    </div>
                ) : (
                    <>
                        {visibleOrders.map((order) => (
                            <MerchantOrderCard
                                key={order.id}
                                order={order}
                                driver={{
                                    name: users.find(u => u.id === order.driverId)?.name || 'لم يعين',
                                    phone: users.find(u => u.id === order.driverId)?.phone
                                }}
                                viewingMerchant={viewingMerchant}
                            />
                        ))}
                        <div ref={bottomRef} className="h-10 flex items-center justify-center">
                            {visibleCount < finalFilteredOrders.length && <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderList;
