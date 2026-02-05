
import React, { useMemo } from 'react';
import { Order, User, OrderStatus } from '../../types';
import OrderStatusBadge from '../OrderStatusBadge';
import OrderIdDisplay from '../OrderIdDisplay';
import { PencilIcon, TrashIcon, PhoneIcon, UserIcon, MapPinIcon, StoreIcon, TruckIconV2, CalendarIcon, ClockIcon, DollarSignIcon, ShoppingCartIcon, WhatsAppIcon, CheckCircleIcon, RocketIcon } from '../icons';

interface OrderCardProps {
    order: Order;
    users: User[];
    onEdit?: (order: Order) => void;
    onDelete?: (order: Order) => void;
    onOpenStatusModal?: (order: Order) => void;
    onOpenPaymentModal?: (order: Order) => void;
}

// استخدام React.memo بشكل صارم لمنع إعادة الرندر
const OrderCard: React.FC<OrderCardProps> = React.memo(({ order, users, onEdit, onDelete, onOpenStatusModal, onOpenPaymentModal }) => {
    const driver = useMemo(() => users.find(u => u.id === order.driverId), [users, order.driverId]);
    const merchantUser = useMemo(() => users.find(u => u.id === order.merchantId), [users, order.merchantId]);
    const customerUser = useMemo(() => users.find(u => u.phone === order.customer?.phone), [users, order.customer?.phone]);
    const isShoppingOrder = order.type === 'shopping_order';

    const parseDate = (dateVal: any) => {
        try {
            if (!dateVal) return null;
            let d: Date;
            if (typeof dateVal.toDate === 'function') {
                d = dateVal.toDate();
            } else if (dateVal.seconds) {
                d = new Date(dateVal.seconds * 1000);
            } else {
                d = new Date(dateVal);
            }
            if (isNaN(d.getTime())) return null;
            return d;
        } catch (e) {
            return null;
        }
    };

    const formattedDateTime = useMemo(() => {
        const d = parseDate(order.createdAt);
        if (!d) return { date: '---', time: '---', day: '---' };

        const day = d.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long' });
        const date = d.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
        const time = d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric', hour12: true });

        return { day, date, time };
    }, [order.createdAt]);

    const deliveredTime = useMemo(() => {
        if (order.status !== OrderStatus.Delivered || !order.deliveredAt) return null;
        const d = parseDate(order.deliveredAt);
        if (!d) return null;
        return d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric', hour12: true });
    }, [order.status, order.deliveredAt]);

    const getBorderColor = () => {
        if (isShoppingOrder) return 'border-orange-500';
        switch (order.status) {
            case OrderStatus.Delivered: return 'border-teal-500'; // Teal for Delivered
            case OrderStatus.InTransit: return 'border-blue-500';
            case OrderStatus.Cancelled: return 'border-red-500';
            case OrderStatus.Pending: return 'border-yellow-500';
            default: return 'border-gray-500';
        }
    };

    return (
        <div className={`relative bg-gray-800 rounded-xl shadow-lg border-r-4 ${getBorderColor()} overflow-hidden admin-order-card transform-gpu will-change-transform`}>
            <div className="p-4 border-b border-gray-700/50 flex justify-between items-start bg-gray-900/30">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <OrderIdDisplay order={order} className="font-mono text-xl font-black text-red-500 tracking-tighter" showHash={false} />
                        {order.customOrderNumber && (
                            <div className="bg-white/10 text-white px-2 py-0.5 rounded text-sm font-bold font-mono border border-white/10">
                                #{order.customOrderNumber}
                            </div>
                        )}
                        {/* Payment Status Badges - Added to Header */}
                        {order.isCollected ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20">
                                <CheckCircleIcon className="w-3 h-3" />
                                تم التحصيل
                            </span>
                        ) : order.isVodafoneCash ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/20">
                                <CheckCircleIcon className="w-3 h-3" />
                                فودافون كاش
                            </span>
                        ) : order.paymentStatus === 'paid' ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                <CheckCircleIcon className="w-3 h-3" />
                                مدفوع
                            </span>
                        ) : null}
                        {isShoppingOrder && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20">
                                <RocketIcon className="w-3 h-3" />
                                تسوق خاص
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-gray-700/60 px-2 py-1 rounded border border-white/5 shadow-inner">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[11px] font-black text-white">{formattedDateTime.day}، {formattedDateTime.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-700/60 px-2 py-1 rounded border border-white/5 shadow-inner">
                            <ClockIcon className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-[11px] font-black text-white font-mono">{formattedDateTime.time}</span>
                        </div>
                        {deliveredTime && (
                            <div className="flex items-center gap-1.5 bg-teal-500/10 px-2 py-1 rounded border border-teal-500/20 shadow-inner animate-fadeIn">
                                <CheckCircleIcon className="w-3.5 h-3.5 text-teal-400" />
                                <span className="text-[11px] font-black text-teal-400 font-mono">تم: {deliveredTime}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <OrderStatusBadge status={order.status} />
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Customer Section */}
                <div className="flex flex-col bg-gray-900/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-start gap-3 mb-2">
                        <div className="mt-1 p-1.5 rounded-full bg-blue-500/10 text-blue-400 flex-shrink-0">
                            <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> عنوان العميل</p>
                            <p className="text-white font-bold text-sm leading-snug break-words">{order.customer?.address || 'العنوان غير محدد'}</p>
                        </div>
                    </div>

                    {/* Customer Phone (Left Aligned) */}
                    <div className="flex justify-end pt-2 border-t border-gray-700/30">
                        <div className="flex items-center gap-2" dir="ltr">
                            {order.customer?.phone && (
                                <a href={`https://wa.me/2${order.customer.phone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 flex-shrink-0 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all border border-green-500/10 clickable" title="واتساب">
                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                </a>
                            )}
                            {order.customer?.phone && (
                                <a href={`tel:${order.customer.phone}`} className="p-1.5 flex-shrink-0 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all border border-blue-500/10 clickable" title="اتصال">
                                    <PhoneIcon className="w-3.5 h-3.5" />
                                </a>
                            )}
                            <span className="text-xs text-gray-300 font-mono bg-black/20 px-2 py-1 rounded border border-gray-700 selectable font-bold tracking-wide">
                                {order.customer?.phone || ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Merchant Section & Order Details */}
                <div className="flex flex-col bg-orange-900/10 p-3 rounded-xl border border-orange-500/10">
                    <div className="flex items-start gap-3 mb-2">
                        <div className="mt-1 p-1.5 rounded-full bg-orange-500/10 text-orange-400 flex-shrink-0 overflow-hidden w-8 h-8 flex items-center justify-center border border-orange-500/20">
                            {order.merchantId === 'delinow' ? (
                                customerUser?.storeImage ? (
                                    <img src={customerUser.storeImage} alt="Customer" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-4 h-4" />
                                )
                            ) : (
                                <StoreIcon className="w-4 h-4" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-orange-400 font-bold mb-0.5">{order.merchantId === 'delinow' ? 'صاحب الطلب' : 'المرسل (التاجر)'}</p>
                            <p className="text-white font-black text-sm truncate">
                                {order.merchantId === 'delinow'
                                    ? (customerUser?.name || order.customer?.name || 'طلب خدمة خاصة')
                                    : (merchantUser?.name || order.merchantName || 'طلب مباشر من العميل')}
                            </p>
                        </div>
                    </div>

                    {/* Order Details: Items (Merchant) or Notes (Special) */}
                    <div className="mt-2 text-sm text-gray-300 border-t border-orange-500/10 pt-2 space-y-1">
                        {order.merchantId === 'delinow' ? (
                            // Special Order: Show Notes
                            <div className="bg-gray-900/40 p-2 rounded-lg border border-gray-700/30">
                                <p className="text-[10px] text-gray-500 font-bold mb-1">تفاصيل الخدمة المطلوبة:</p>
                                <p className="text-white leading-relaxed whitespace-pre-wrap text-xs">{order.notes || 'لا توجد تفاصيل'}</p>
                            </div>
                        ) : (
                            // Merchant Order: Show Items
                            <div className="space-y-1.5">
                                {order.notes && (
                                    <div className="bg-gray-900/40 p-2 rounded-lg border border-gray-700/30 mb-2">
                                        <p className="text-[10px] text-orange-400 font-bold mb-1">ملاحظات الطلب:</p>
                                        <p className="text-white leading-relaxed whitespace-pre-wrap text-xs">{order.notes}</p>
                                    </div>
                                )}
                                {order.items && order.items.length > 0 ? (
                                    <>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs bg-gray-900/40 p-1.5 rounded border border-gray-700/30">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-orange-400 font-mono">x{item.quantity}</span>
                                                    <span className="text-white">{item.name}</span>
                                                    {item.selectedSize && <span className="text-[9px] text-gray-500">({item.selectedSize.name})</span>}
                                                </div>
                                                <span className="text-gray-400 font-mono font-bold">{(item.price * item.quantity).toLocaleString()} ج.م</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-700/30 font-bold text-xs">
                                            <span className="text-gray-400">الإجمالي:</span>
                                            <span className="text-white">{(order.items.reduce((s, i) => s + (i.price * i.quantity), 0)).toLocaleString()} ج.م</span>
                                        </div>
                                    </>
                                ) : (
                                    // Empty state: Do not show anything if no items, 
                                    // unless we want to explicitely say "Empty". 
                                    // User requested to REMOVE "details not available".
                                    null
                                )}
                            </div>
                        )}
                    </div>

                    {/* Merchant Phone (Left Aligned) */}
                    {order.merchantId !== 'delinow' && (merchantUser?.phone || order.merchantId) && (
                        <div className="flex justify-end pt-2 border-t border-orange-500/10 mt-1">
                            <div className="flex items-center gap-2" dir="ltr">
                                {merchantUser?.phone && (
                                    <a href={`https://wa.me/2${merchantUser.phone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 flex-shrink-0 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all border border-green-500/10 clickable" title="واتساب">
                                        <WhatsAppIcon className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                {merchantUser?.phone && (
                                    <a href={`tel:${merchantUser.phone}`} className="p-1.5 flex-shrink-0 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all border border-blue-500/10 clickable" title="اتصال">
                                        <PhoneIcon className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                <span className="text-xs text-gray-300 font-mono bg-black/20 px-2 py-1 rounded border border-gray-700 selectable font-bold tracking-wide">
                                    {merchantUser?.phone || order.merchantId}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Driver & Price Section - Updated Driver View */}
                <div className="grid grid-cols-2 gap-5 bg-gray-900/40 p-2 rounded-lg border border-gray-700/30">
                    {/* Left Column: Driver Info */}
                    <div className="flex flex-col justify-center pl-2">
                        {driver ? (
                            <div className="flex flex-col gap-1">
                                {/* Avatar & Name */}
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {driver.storeImage ? (
                                            <img src={driver.storeImage} alt={driver.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-gray-500 mb-0.5">المندوب</p>
                                        <p className="text-white text-xs font-bold truncate leading-tight">{driver.name}</p>
                                    </div>
                                </div>

                                {/* Phone Container (Compact - No flex-1) */}
                                {driver.phone && (
                                    <div className="flex items-center gap-1.5 pt-1.5 mt-1 border-t border-gray-700/30 w-fit" dir="ltr">
                                        <a href={`https://wa.me/2${driver.phone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 flex-shrink-0 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all border border-green-500/10 clickable" title="واتساب">
                                            <WhatsAppIcon className="w-3.5 h-3.5" />
                                        </a>
                                        <a href={`tel:${driver.phone}`} className="p-1.5 flex-shrink-0 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all border border-blue-500/10 clickable" title="اتصال">
                                            <PhoneIcon className="w-3.5 h-3.5" />
                                        </a>
                                        <span className="text-[10px] text-gray-300 font-mono bg-black/20 px-2 py-1 rounded border border-gray-700 selectable font-bold tracking-wide">
                                            {driver.phone}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 h-full">
                                <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                                    <TruckIconV2 className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] text-gray-500 mb-0.5">المندوب</p>
                                    <p className="text-white text-xs font-bold truncate">لم يعين</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Financials & Payment Status */}
                    <div className="flex flex-col gap-3 border-r border-gray-700 pr-4 pl-1 justify-center">
                        {/* Delivery Fee */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <DollarSignIcon className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-500">سعر التوصيل</p>
                                <p className="text-amber-400 text-xs font-bold">{order.deliveryFee ? `${order.deliveryFee.toLocaleString('en-US')} ج.م` : '-'}</p>
                            </div>
                        </div>

                        {/* Payment Status Container */}
                        {(order.paymentStatus || order.paidAmount !== undefined) && (
                            <button
                                onClick={(e) => {
                                    if (onOpenPaymentModal) {
                                        e.stopPropagation();
                                        onOpenPaymentModal(order);
                                    }
                                }}
                                disabled={!onOpenPaymentModal}
                                className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 min-w-[80px] transition-all
                                    ${order.unpaidAmount && order.unpaidAmount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50'}
                                `}
                            >
                                <DollarSignIcon className={`w-4 h-4 ${order.paymentStatus === 'paid' || order.isCollected ? 'text-emerald-400' : 'text-gray-400'}`} />
                                <span className="text-[10px] font-bold text-gray-300">
                                    {order.unpaidAmount && order.unpaidAmount > 0 ? `${order.unpaidAmount} متبقي` : 'Manage Payment'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-900/80 border-t border-gray-700/50">
                {onOpenStatusModal ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenStatusModal(order); }}
                        className="text-[10px] font-bold bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 rounded-lg px-3 py-1.5 flex items-center transition-all clickable"
                    >
                        <PencilIcon className="w-3.5 h-3.5 ml-1 text-gray-300" />
                        <span>تغيير الحالة</span>
                    </button>
                ) : <div />}

                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(order); }} className="p-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors border border-blue-500/20 bg-blue-500/10 clickable"><PencilIcon className="w-4 h-4" /></button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(order); }}
                            className="p-2 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors border border-red-500/20 bg-red-500/10 clickable"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

export default OrderCard;
