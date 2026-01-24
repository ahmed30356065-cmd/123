
import React, { useState } from 'react';
import { Order, OrderStatus, User, AppTheme } from '../../types';
import { PhoneIcon, WhatsAppIcon, MapPinIcon, BuildingStorefrontIcon, ClockIcon, ClipboardListIcon, ShoppingCartIcon, CheckCircleIcon, SparklesIcon, UserIcon, DollarSignIcon, CalendarIcon, RocketIcon } from '../icons';

interface OrderDetailsScreenProps {
    order: Order;
    users: User[];
    listType: 'new' | 'in-transit';
    driver: User;
    onAcceptOrder: (orderId: string, driverId: string, deliveryFee: number) => void;
    onUpdateStatus: (orderId: string, status: OrderStatus) => void;
    onBack: () => void;
    theme?: AppTheme;
}

const ContactActions: React.FC<{ phone: string }> = ({ phone }) => {
    if (!phone) return null;
    return (
        <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
            <a
                href={`tel:${phone}`}
                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 clickable"
            >
                <PhoneIcon className="w-4 h-4" />
                <span className="font-bold text-sm">اتصال</span>
            </a>
            <a
                href={`https://wa.me/2${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 clickable"
            >
                <WhatsAppIcon className="w-4 h-4" />
                <span className="font-bold text-sm">واتساب</span>
            </a>
        </div>
    );
};

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ order, users, listType, driver, onAcceptOrder, onUpdateStatus, onBack, theme }) => {
    const [fee, setFee] = useState('');
    const [error, setError] = useState('');
    const merchant = users.find(u => u.id === order.merchantId);

    const handleAcceptClick = () => {
        const deliveryFee = parseFloat(fee);
        if (isNaN(deliveryFee) || deliveryFee <= 0) {
            setError('سعر غير صالح');
            return;
        }
        setError('');

        onAcceptOrder(order.id, driver.id, deliveryFee);
    }

    const formattedDateTime = (() => {
        try {
            const d = new Date(order.createdAt);
            if (isNaN(d.getTime())) return '';
            const day = d.toLocaleDateString('ar-EG', { weekday: 'long' });
            const date = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' });
            const time = d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: 'numeric' });
            return `${day}، ${date} - ${time}`;
        } catch (e) { return ''; }
    })();

    const isSpecialRequest = order.type === 'shopping_order' && (!order.items || order.items.length === 0);

    let serviceDetails = order.notes || '';
    let receiverDataRaw = '';
    let receiverPhone = null;

    if (isSpecialRequest && order.notes) {
        const parts = order.notes.split('-----------');
        serviceDetails = parts[0].trim();
        if (parts.length > 1) {
            receiverDataRaw = parts[1].trim();
            const match = receiverDataRaw.match(/01[0125][0-9]{8}/);
            if (match) receiverPhone = match[0];
        }
    }

    const productTotal = order.finalPrice ?? order.totalPrice ?? 0;
    const totalToCollect = (order.deliveryFee || 0) + productTotal;

    const isFeeValid = fee !== '' && !isNaN(parseFloat(fee)) && parseFloat(fee) > 0;

    return (
        // Container with safe area management
        <div className="fixed inset-0 flex flex-col bg-[#1A1A1A] text-white overflow-hidden z-[60]">

            {/* Header with Safe Area Padding */}
            <div className="flex-none bg-[#1F1F1F] border-b border-white/5 shadow-sm z-10 pt-safe">
                <div className="px-5 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 -mr-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95 clickable"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 rotate-180"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-red-500 font-mono tracking-wider leading-none">#{order.id}</h1>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1.5">
                                <ClockIcon className="w-3 h-3 text-gray-500" />
                                <span>{formattedDateTime}</span>
                            </div>
                        </div>
                    </div>

                    {order.type === 'shopping_order' ? (
                        <div className="bg-purple-500/10 text-purple-300 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-purple-500/20 flex items-center gap-1.5">
                            <RocketIcon className="w-3.5 h-3.5" />
                            {isSpecialRequest ? 'خدمة خاصة' : 'تسوق'}
                        </div>
                    ) : (
                        <div className="bg-blue-500/10 text-blue-300 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-blue-500/20 flex items-center gap-1.5">
                            <ShoppingCartIcon className="w-3.5 h-3.5" />
                            طلب توصيل
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area - Adjusted padding based on listType */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar ${listType === 'in-transit' ? 'pb-44' : 'pb-10'}`}>

                <div className="bg-[#252525] rounded-2xl border border-white/5 p-4 shadow-lg relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border-2 border-red-500/30 flex items-center justify-center shadow-lg text-red-400 flex-shrink-0">
                            <MapPinIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">العميل (نقطة التسليم)</p>
                                    <h3 className="text-lg font-bold text-white leading-snug break-words">{order.customer?.address || 'العنوان غير محدد'}</h3>
                                    <p className="text-sm text-gray-300 font-medium mt-1">{order.customer?.name || 'عميل'}</p>
                                </div>
                                <span className="text-xs text-cyan-400 font-bold font-mono bg-black/20 px-2 py-1 rounded text-left mt-1 selectable" dir="ltr">{order.customer?.phone}</span>
                            </div>

                            <ContactActions phone={order.customer?.phone || ''} />
                        </div>
                    </div>
                </div>

                {isSpecialRequest ? (
                    <div className="bg-[#2A2A2A] rounded-2xl border border-dashed border-purple-500/30 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ClipboardListIcon className="w-4 h-4 text-purple-400" />
                            <h4 className="text-xs font-bold text-gray-300">تفاصيل الطلب الخاص</h4>
                        </div>
                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap font-medium">
                            {serviceDetails}
                        </p>
                        {receiverPhone && (
                            <div className="mt-3 pt-2 border-t border-white/5">
                                <p className="text-[10px] text-green-400 flex items-center gap-1 mb-2">
                                    <CheckCircleIcon className="w-3 h-3" /> يوجد رقم مستلم آخر: <span className="font-mono text-white ml-1 text-left selectable" dir="ltr">{receiverPhone}</span>
                                </p>
                                <ContactActions phone={receiverPhone} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[#252525] rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                        {(!order.items || order.items.length === 0) && order.notes ? (
                            /* Notes View (Instead of 0 items) */
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <ClipboardListIcon className="w-4 h-4 text-purple-400" />
                                    <h4 className="text-xs font-bold text-gray-300">تفاصيل الطلب (ملاحظات التاجر)</h4>
                                </div>
                                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap font-medium bg-[#1A1A1A] p-3 rounded-xl border border-white/5">
                                    {order.notes}
                                </p>
                            </div>
                        ) : (
                            /* Standard Items View */
                            <>
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCartIcon className="w-4 h-4 text-yellow-500" />
                                        <h4 className="text-xs font-bold text-gray-300">
                                            {(order.items && order.items.length > 0) ? 'قائمة المنتجات' : 'تفاصيل الطلب'}
                                        </h4>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 bg-black/20 px-2 py-0.5 rounded">{order.items?.length || 0} صنف</span>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-[#1A1A1A] p-2 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-white">{item.quantity}x</div>
                                                <span className="text-sm text-gray-200">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-mono text-gray-400">{item.price}</span>
                                        </div>
                                    ))}
                                </div>

                                {productTotal > 0 && (
                                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-xs text-gray-400">إجمالي المنتجات</span>
                                        <span className="text-lg font-bold text-white">{productTotal} ج.م</span>
                                    </div>
                                )}
                            </>
                        )}

                        {merchant && (
                            <div className="mt-4 pt-3 border-t border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs text-purple-400 font-bold flex items-center gap-1"><BuildingStorefrontIcon className="w-3 h-3" /> التاجر</span>
                                        <span className="text-sm text-white font-bold block mt-1">{merchant.name}</span>
                                    </div>
                                    {merchant.phone && (
                                        <span className="text-xs text-purple-300 font-bold font-mono bg-black/20 px-2 py-1 rounded text-left mt-1 selectable" dir="ltr">{merchant.phone}</span>
                                    )}
                                </div>
                                <ContactActions phone={merchant.phone || ''} />
                            </div>
                        )}
                    </div>
                )}

                {/* Input & Accept Button - Now inside scroll view */}
                {listType === 'new' && (
                    <div className="bg-[#1F1F1F] p-4 rounded-2xl border border-white/5 shadow-lg mt-2">
                        <div className="flex gap-3 items-center">
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={fee}
                                    onChange={(e) => { setFee(e.target.value); setError(''); }}
                                    placeholder="0"
                                    className="w-full bg-[#111] border border-gray-600 rounded-xl px-4 py-3 text-white font-bold text-center text-lg outline-none focus:border-red-500 transition-colors"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold pointer-events-none">ج.م</span>
                                {error && <div className="absolute -top-8 left-0 right-0 text-red-500 text-xs text-center font-bold bg-[#1F1F1F] py-1 rounded shadow-md border border-red-500/30">{error}</div>}
                            </div>
                            <button
                                onClick={handleAcceptClick}
                                disabled={!isFeeValid}
                                className={`flex-[2] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 clickable
                                    ${isFeeValid
                                        ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                                        : 'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                قبول وتحديد السعر
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Fixed Section - Only for In-Transit (Delivery Confirmation) */}
            {listType === 'in-transit' && (
                <div
                    className="fixed bottom-0 left-0 right-0 p-4 bg-[#1F1F1F] border-t border-white/5 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.4)] transition-all duration-200"
                    style={{
                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
                    }}
                >
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                            <span className="text-xs text-gray-400">المطلوب تحصيله (شامل التوصيل)</span>
                            <span className="text-xl font-black text-green-400">{totalToCollect} <span className="text-xs font-bold text-gray-500">ج.م</span></span>
                        </div>
                        <button
                            onClick={() => onUpdateStatus(order.id, OrderStatus.Delivered)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 clickable"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            تم التسليم بنجاح
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailsScreen;
