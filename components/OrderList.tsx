
import React, { useState, useMemo, useEffect, useRef } from 'react'; // Force Rebuild 2
import { Order, User, OrderStatus } from '../types';
import OrderStatusBadge from './OrderStatusBadge';
import {
    MapPinIcon, PhoneIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
    UserIcon, TruckIconV2, ChartBarIcon, SearchIcon,
    RefreshCwIcon, BanknoteIcon, PencilIcon, RocketIcon, ClipboardListIcon, CalendarIcon, VodafoneIcon, EmptyBoxIcon, WhatsAppIcon
} from './icons';
import { sendExternalNotification } from '../services/firebase';

interface MerchantOrderCardProps {
    order: Order;
    driver: { name: string; phone?: string | null };
    viewingMerchant?: User;
    onUpdateOrder?: (orderId: string, data: Partial<Order>) => void;

}

const MerchantOrderCard: React.FC<MerchantOrderCardProps> = ({ order, driver, viewingMerchant, onUpdateOrder }) => {
    const [showCollectModal, setShowCollectModal] = React.useState(false);
    const [showPaymentModal, setShowPaymentModal] = React.useState(false);
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
            return `${day} ${date} - ${time} `;
        } catch (e) {
            return '';
        }
    })();

    // Financial Control Logic
    const hasFinancialPerm = viewingMerchant?.canManageAdvancedFinancials;
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [newPrice, setNewPrice] = useState(order.totalPrice?.toString() || '');

    const handlePriceUpdate = () => {
        if (!newPrice || isNaN(Number(newPrice)) || !onUpdateOrder) return;
        onUpdateOrder(order.id, { totalPrice: Number(newPrice) });
        setIsEditingPrice(false);
    };

    const handleStatusUpdate = (statusType: 'paid' | 'unpaid' | 'vodafone' | 'collected') => {
        if (!onUpdateOrder) return;
        const updates: Partial<Order> = {};
        if (statusType === 'paid') {
            updates.paymentStatus = 'paid';
            updates.isVodafoneCash = false;
            updates.isCollected = false;
        } else if (statusType === 'unpaid') {
            updates.paymentStatus = 'unpaid';
            updates.isVodafoneCash = false;
            updates.isCollected = false;
        } else if (statusType === 'vodafone') {
            updates.paymentStatus = 'paid';
            updates.isVodafoneCash = true;
            updates.isCollected = false;
        } else if (statusType === 'collected') {
            updates.isCollected = true;
        }
        onUpdateOrder(order.id, updates);
    };

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

    // Determine if order is paid (either paid status OR vodafone cash)
    const isPaid = order.paymentStatus === 'paid' || order.isVodafoneCash;

    // Handle Collection with confirmation
    const handleCollect = () => {
        setShowCollectModal(true);
    };

    const confirmCollect = async () => {
        if (onUpdateOrder) {
            onUpdateOrder(order.id, { isCollected: true });

            // إرسال إشعار للمندوب عند تأكيد التحصيل
            // إرسال إشعار للمندوب عند تأكيد التحصيل
            if (order.assignedTo || order.driverId) {
                try {
                    const priceText = order.totalPrice ? `${Math.floor(order.totalPrice)} ج.م` : '';
                    await sendExternalNotification('driver', {
                        title: '✅ تأكيد استلام المبلغ',
                        body: `تم تأكيد استلام مبلغ ${priceText} للطلب #${order.customOrderNumber || order.id} `,
                        targetId: order.assignedTo || order.driverId
                    });
                    console.log('تم إرسال إشعار التحصيل للمندوب');
                } catch (error) {
                    console.error('فشل إرسال إشعار التحصيل:', error);
                }
            }
        }
        setShowCollectModal(false);
    };

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
                        {/* Show IDs - Hide when: (Paid OR VodafoneCash) AND Assigned, OR Collected */}
                        {/* ALWAYS show for Admins or users with financial permission */}
                        {(!order.isCollected && !((isPaid || order.isVodafoneCash) && (order.assignedTo || order.driverId))) || (!viewingMerchant || hasFinancialPerm) ? (
                            <>
                                <span className="font-mono text-xs text-red-400 bg-red-900/10 px-2 py-0.5 rounded-md border border-red-900/30 font-bold tracking-wider flex items-center h-6">
                                    #{order.id}
                                </span>

                                {order.customOrderNumber && (
                                    <span className="font-mono text-xs text-blue-400 bg-blue-900/10 px-2 py-0.5 rounded-md border border-blue-900/30 font-bold tracking-wider">
                                        #{order.customOrderNumber}
                                    </span>
                                )}
                            </>
                        ) : null}

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
                        {/* Merchant Collected Badge - Small & In Header */}
                        {viewingMerchant && order.isCollected && (
                            <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 bg-blue-900/20 px-2 py-0.5 rounded-md border border-blue-500/20 animate-fadeIn">
                                <CheckCircleIcon className="w-3 h-3" />
                                تم التحصيل
                            </span>
                        )}
                    </div>

                    <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                            {isShoppingOrder ? <RocketIcon className="w-4 h-4 text-purple-400" /> : <MapPinIcon className="w-4 h-4 text-gray-500" />}
                        </div>
                        <p className="font-bold text-white text-sm leading-snug line-clamp-2">
                            {order.customer?.address || 'العنوان غير محدد'}
                        </p>
                    </div>



                    {/* Collect Button - Show ONLY for unpaid orders that are assigned */}
                    {viewingMerchant && viewingMerchant.canManageOrderDetails && !order.isCollected && order.paymentStatus === 'unpaid' && !order.isVodafoneCash && (order.assignedTo || order.driverId) && (
                        <div className="mt-3 flex justify-start animate-fadeIn">
                            <button
                                onClick={handleCollect}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 font-bold text-sm"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                تأكيد التحصيل
                            </button>
                        </div>
                    )}

                    {/* Admin Financial Control - Status & Button */}
                    {hasFinancialPerm && !viewingMerchant && (
                        <div className="mt-3 flex items-center justify-between animate-fadeIn border-t border-gray-700/50 pt-3">
                            {/* Status Display */}
                            <div className="flex items-center gap-2">
                                {order.isCollected ? (
                                    <span className="text-[10px] text-blue-400 font-bold px-2 py-1 bg-blue-900/20 border border-blue-500/20 rounded-md">
                                        تم التحصيل
                                    </span>
                                ) : order.isVodafoneCash ? (
                                    <span className="text-[10px] text-red-400 font-bold px-2 py-1 bg-red-900/20 border border-red-500/20 rounded-md flex items-center gap-1">
                                        <VodafoneIcon className="w-3 h-3 rounded-full" />
                                        فودافون كاش
                                    </span>
                                ) : order.paymentStatus === 'paid' ? (
                                    <span className="text-[10px] text-green-400 font-bold px-2 py-1 bg-green-900/20 border border-green-500/20 rounded-md">
                                        مدفوع (نقدي)
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-gray-400 font-bold px-2 py-1 bg-gray-700/30 border border-gray-600/30 rounded-md">
                                        غير مدفوع
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-900/50 transition-all flex items-center gap-2 font-bold text-xs"
                            >
                                <BanknoteIcon className="w-3.5 h-3.5" />
                                إدارة الدفع
                            </button>
                        </div>
                    )}


                    {/* Status for Vodafone Cash - Always "Paid" */}
                    {viewingMerchant && viewingMerchant.canManageOrderDetails && order.isVodafoneCash && (
                        <div className="mt-3 animate-fadeIn">
                            <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 flex items-center justify-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                <p className="text-sm font-bold text-green-400">
                                    تم الدفع (فودافون كاش)
                                </p>
                            </div>
                        </div>
                    )}



                    {viewingMerchant && viewingMerchant.canManageOrderDetails && isPaid && !order.isCollected && !order.isVodafoneCash && (order.assignedTo || order.driverId) && (
                        <div className="mt-3 animate-fadeIn">
                            <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 flex items-center justify-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                <p className="text-lg font-bold text-green-400">
                                    تم الدفع
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Show "Paid" status if paid OR collected */}


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

                        {/* For non-merchants (Admin), always show price. 
                            For Merchants: ONLY show if they have permission AND don't have the advanced panel (to avoid duplication).
                            Hide when: Collected OR ((Paid OR VodafoneCash) AND (Assigned OR InTransit))
                        */}
                        {(!viewingMerchant || (viewingMerchant.canManageOrderDetails && !viewingMerchant.canManageAdvancedFinancials)) && order.totalPrice !== undefined && !order.isCollected && !((isPaid || order.isVodafoneCash) && (order.assignedTo || order.driverId || order.status === OrderStatus.InTransit)) && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 bg-gray-700/30 px-2 py-1 rounded-lg animate-fadeIn">
                                <BanknoteIcon className="w-3 h-3" />
                                <span className="font-bold text-red-400">{Number(order.totalPrice).toLocaleString('en-US')} ج.م</span>
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
                            </a >
                            <a href={`tel:${driver.phone}`} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-colors border border-blue-500/10">
                                <PhoneIcon className="w-4 h-4" />
                            </a>
                        </div >
                    )}
                </div >
            </div >

            {/* Collection Confirmation Modal */}
            {
                showCollectModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl transform animate-scaleIn">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                                    <CheckCircleIcon className="w-10 h-10 text-blue-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white text-center mb-2">تأكيد التحصيل</h3>
                            <p className="text-gray-300 text-center mb-6 text-sm">
                                هل تأكدت من استلام المبلغ من المندوب؟
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCollectModal(false)}
                                    className="flex-1 bg-gray-700 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={confirmCollect}
                                    className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                                >
                                    تأكيد التحصيل
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Payment Management Modal - Admin/Supervisor Only */}
            {
                showPaymentModal && hasFinancialPerm && !viewingMerchant && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-gray-800 rounded-2xl p-5 max-w-sm w-full border border-gray-700 shadow-2xl transform animate-scaleIn">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
                                <div className="flex items-center gap-2">
                                    <BanknoteIcon className="w-5 h-5 text-emerald-400" />
                                    <h3 className="text-lg font-bold text-white">لوحة التحكم المالي</h3>
                                </div>
                                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 mb-4 flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold">رقم الطلب:</span>
                                <span className="font-mono text-sm text-emerald-400 font-bold">#{order.customOrderNumber || order.id}</span>
                            </div>

                            {/* Price Edit */}
                            <div className="mb-4">
                                <label className="text-[10px] text-gray-400 font-bold mb-1.5 block">المبلغ المطلوب (ج.م)</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            value={newPrice}
                                            onChange={(e) => setNewPrice(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-xl py-2.5 px-3 text-white text-center font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePriceUpdate}
                                        className="bg-emerald-600 text-white px-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 font-bold block">تحديث الحالة</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleStatusUpdate('paid')} className={`text-xs font-bold py-3 rounded-xl border transition-all ${order.paymentStatus === 'paid' && !order.isVodafoneCash && !order.isCollected ? 'bg-green-600 text-white border-green-500 shadow-lg' : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>
                                        مدفوع (نقدي)
                                    </button>
                                    <button onClick={() => handleStatusUpdate('unpaid')} className={`text-xs font-bold py-3 rounded-xl border transition-all ${order.paymentStatus === 'unpaid' ? 'bg-red-600 text-white border-red-500 shadow-lg' : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>
                                        غير مدفوع
                                    </button>
                                    <button onClick={() => handleStatusUpdate('vodafone')} className={`text-xs font-bold py-3 rounded-xl border transition-all ${order.isVodafoneCash ? 'bg-red-800 text-white border-red-600 shadow-lg' : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>
                                        فودافون كاش
                                    </button>
                                    <button onClick={() => handleStatusUpdate('collected')} className={`text-xs font-bold py-3 rounded-xl border transition-all ${order.isCollected ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>
                                        تم التحصيل
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

interface OrderListProps {
    orders: Order[];
    users: User[];
    viewingMerchant?: User; // New prop to pass permission context
    onUpdateOrder?: (orderId: string, data: Partial<Order>) => void;

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

const OrderList: React.FC<OrderListProps> = ({ orders, users, viewingMerchant, onUpdateOrder }) => {
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

    // Helper: Business Date (Shift ends at 6 AM)
    const getBusinessDateOfDate = (date: Date) => {
        const d = new Date(date);
        if (d.getHours() < 6) {
            d.setDate(d.getDate() - 1);
        }
        d.setHours(0, 0, 0, 0);
        return d;
    };

    // 1. Filter by Time/Date
    const dateFilteredOrders = useMemo(() => {
        if (filterMode === 'all') return orders;

        const targetDate = filterMode === 'today'
            ? getBusinessDateOfDate(new Date())
            : new Date(customDate);

        // Ensure custom date is normalized if necessary, but usually date input gives 00:00
        targetDate.setHours(0, 0, 0, 0);

        return orders.filter(o => {
            const oDate = getOrderDate(o);
            const oBusinessDate = getBusinessDateOfDate(oDate);
            return oBusinessDate.getTime() === targetDate.getTime();
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
            .sort((a, b) => {
                // Primary: Date (Newest first)
                const timeA = getOrderDate(a).getTime();
                const timeB = getOrderDate(b).getTime();
                if (timeA !== timeB) return timeB - timeA;

                // Secondary: ID Number (Descending)
                const idA = parseInt(a.id.replace(/\D/g, '') || '0');
                const idB = parseInt(b.id.replace(/\D/g, '') || '0');
                return idB - idA;
            });
    }, [dateFilteredOrders, showShoppingOnly, searchTerm]);

    // Statistics calculations - Updated Logic
    // 1. إجمالي التوصيل: كل الطلبات (الكاش + المدفوع)
    const totalDelivery = finalFilteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    // 2. في انتظار التحصيل: المبالغ التي لم يكتمل دفعها (isCollected = false) و (ليست مدفوعة أو فودافون كاش)
    const pendingCollection = viewingMerchant?.canManageOrderDetails
        ? finalFilteredOrders
            .filter(o => !o.isCollected && o.paymentStatus !== 'paid' && !o.isVodafoneCash)
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0)
        : 0;

    // 3. إجمالي الكاش: المبالغ المحولة على فودافون كاش فقط
    const totalVodafoneCash = viewingMerchant?.canManageOrderDetails
        ? finalFilteredOrders
            .filter(o => o.isVodafoneCash)
            .reduce((sum, o) => sum + (o.cashAmount || o.totalPrice || 0), 0)
        : 0;

    // Counts for Badges
    const counts = useMemo(() => {
        const todayBusinessDate = getBusinessDateOfDate(new Date());
        return {
            today: orders.filter(o => getBusinessDateOfDate(getOrderDate(o)).getTime() === todayBusinessDate.getTime()).length,
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

            {/* Summary Section - Moved to top after filters */}
            {viewingMerchant?.canManageOrderDetails && (
                <div className="px-4 pt-3 pb-2">
                    <div className="grid grid-cols-3 gap-2">
                        {/* 1. إجمالي التوصيل */}
                        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-3 border border-green-500/30">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-5 h-5 rounded-full bg-green-900/40 flex items-center justify-center border border-green-500/30">
                                    <TruckIconV2 className="w-3 h-3 text-green-400" />
                                </div>
                                <p className="text-[9px] text-green-300 font-bold">إجمالي التوصيل</p>
                            </div>
                            <p className="text-lg font-black text-green-400">{totalDelivery.toLocaleString('en-US')}</p>
                            <p className="text-[8px] text-green-300/70">ج.م</p>
                        </div>

                        {/* 2. في انتظار التحصيل */}
                        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl p-3 border border-orange-500/30">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-5 h-5 rounded-full bg-orange-900/40 flex items-center justify-center border border-orange-500/30">
                                    <ClockIcon className="w-3 h-3 text-orange-400" />
                                </div>
                                <p className="text-[9px] text-orange-300 font-bold">في انتظار التحصيل</p>
                            </div>
                            <p className="text-lg font-black text-orange-400">{pendingCollection.toLocaleString('en-US')}</p>
                            <p className="text-[8px] text-orange-300/70">ج.م</p>
                        </div>

                        {/* 3. إجمالي الكاش */}
                        <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 rounded-xl p-3 border border-red-500/30">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-5 h-5 rounded-full overflow-hidden shadow-sm border border-red-500/30 bg-white">
                                    <VodafoneIcon className="w-full h-full object-cover" />
                                </div>
                                <p className="text-[9px] text-red-300 font-bold">إجمالي الكاش</p>
                            </div>
                            <p className="text-lg font-black text-red-400">{totalVodafoneCash.toLocaleString('en-US')}</p>
                            <p className="text-[8px] text-red-300/70">فودافون كاش</p>
                        </div>
                    </div>
                </div>
            )}

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
                                onUpdateOrder={onUpdateOrder}

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
