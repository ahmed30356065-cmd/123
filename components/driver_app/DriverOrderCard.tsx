
import React, { useMemo } from 'react';
import { Order, User, OrderStatus, AppTheme } from '../../types';
import { MapPinIcon, BuildingStorefrontIcon, ClockIcon, ClipboardListIcon, SparklesIcon, ChevronLeftIcon, CalendarIcon, StoreIcon, RocketIcon, UserIcon } from '../icons';

interface DriverOrderCardProps {
    order: Order;
    users?: User[];
    onViewDetails: () => void;
    theme?: AppTheme;
}

const DriverOrderCard: React.FC<DriverOrderCardProps> = React.memo(({ order, users, onViewDetails, theme }) => {
    const isNewOrder = order.status === OrderStatus.Pending;
    const isShoppingOrder = order.type === 'shopping_order';
    
    // Efficiently find merchant without heavy computation
    const merchantUser = useMemo(() => users?.find(u => u.id === order.merchantId), [users, order.merchantId]);

    const dateTimeInfo = useMemo(() => {
        try {
            let d: Date;
            const createdAt = order.createdAt as any;

            if (createdAt && typeof createdAt.toDate === 'function') {
                d = createdAt.toDate();
            } else if (createdAt && createdAt.seconds) {
                d = new Date(createdAt.seconds * 1000);
            } else if (createdAt instanceof Date) {
                d = createdAt;
            } else {
                d = new Date(createdAt);
            }

            if (isNaN(d.getTime())) return { day: '---', date: '---', time: '---' };

            return {
                day: d.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long' }),
                date: d.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }),
                time: d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric', hour12: true })
            };
        } catch (e) {
            return { day: '---', date: '---', time: '---' };
        }
    }, [order.createdAt]);

    const getFrameContainerClass = (type?: string) => {
        if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0';
        switch(type) {
            case 'gold': return 'p-[2px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.4)]';
            case 'neon': return 'p-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
            case 'royal': return 'p-[2px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-sm border border-purple-500/30';
            case 'fire': return 'p-[2px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
            default: return 'p-0'; 
        }
    };
    
    const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

    return (
        <button 
            type="button"
            onClick={(e) => {
                // Prevent double firing if event bubbles from children unexpectedly
                e.stopPropagation();
                onViewDetails();
            }}
            className={`w-full text-right bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-lg transition-all duration-200 relative group border ${isShoppingOrder ? 'border-purple-500/30' : 'border-white/5'} active:scale-[0.98] mb-1 cursor-pointer select-none`}
        >
            {/* Left accent bar (Status indicator) */}
            <div className={`absolute right-0 top-0 bottom-0 w-1.5 z-10 ${
                isShoppingOrder ? 'bg-gradient-to-b from-purple-600 to-indigo-500' :
                isNewOrder ? 'bg-gradient-to-b from-blue-500 to-blue-700' : 
                'bg-gradient-to-b from-green-500 to-emerald-700'
            }`}></div>
            
            {/* Shopping Background Gradient */}
            {isShoppingOrder && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent pointer-events-none"></div>
            )}

            <div className="p-4 pl-3 relative z-0">
                {/* Header: ID & Status Badge */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-red-500 tracking-wider">#{order.id}</span>
                        {isShoppingOrder && (
                            <span className="bg-purple-500/10 text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                                <RocketIcon className="w-3 h-3" /> خاص
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                         <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isNewOrder ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                            {isNewOrder ? 'طلب متاح' : order.status}
                         </span>
                    </div>
                </div>

                {/* Date & Time Metadata Blocks */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/5 shadow-inner">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-black text-gray-300">{dateTimeInfo.day}، {dateTimeInfo.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/5 shadow-inner">
                        <ClockIcon className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-[10px] font-black text-gray-300 font-mono">{dateTimeInfo.time}</span>
                    </div>
                </div>

                {/* Body Content */}
                <div className="space-y-3 pr-1">
                    
                    {/* 1. Customer (Destination) */}
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 rounded-full bg-blue-500/10 text-blue-400 flex-shrink-0">
                            <MapPinIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-gray-500 font-bold mb-0.5 uppercase">عنوان العميل (الوجهة)</p>
                            <p className="text-gray-200 font-bold text-sm leading-tight line-clamp-2">{order.customer?.address || 'العنوان غير محدد'}</p>
                        </div>
                    </div>

                    {/* 2. Merchant/Source/Note */}
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isShoppingOrder ? 'bg-purple-900/10 border-purple-500/10' : 'bg-white/5 border-white/5'}`}>
                        <div className={`relative flex items-center justify-center rounded-full flex-shrink-0 ${!isCustomFrame(merchantUser?.specialFrame) ? getFrameContainerClass(merchantUser?.specialFrame) : ''}`}>
                            {isCustomFrame(merchantUser?.specialFrame) && (
                                <img src={merchantUser?.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-125 pointer-events-none" alt="frame" />
                            )}
                            <div className={`${isCustomFrame(merchantUser?.specialFrame) ? 'w-[85%] h-[85%]' : 'w-8 h-8'} rounded-full overflow-hidden bg-purple-500/10 flex items-center justify-center border border-purple-500/20 relative z-0`}>
                                {isShoppingOrder ? <RocketIcon className="w-4 h-4 text-purple-400" /> : <StoreIcon className="w-4 h-4 text-purple-400" />}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[9px] font-bold mb-0.5 uppercase ${isShoppingOrder ? 'text-purple-300' : 'text-purple-400'}`}>
                                {isShoppingOrder ? 'تفاصيل الطلب' : 'المرسل (التاجر)'}
                            </p>
                            
                            {isShoppingOrder ? (
                                <p className="text-gray-200 text-xs leading-relaxed line-clamp-2 italic">
                                    "{order.notes || 'لا توجد تفاصيل إضافية'}"
                                </p>
                            ) : (
                                <h4 className="font-black text-white text-sm truncate group-hover:text-red-400 transition-colors">
                                    {merchantUser?.name || order.merchantName || 'طلب مباشر من العميل'}
                                </h4>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer: Pricing & Action Hint */}
                <div className="mt-4 pt-3 flex justify-between items-center bg-black/20 -mx-4 -mb-4 px-4 py-3">
                    <div className="flex flex-col">
                        {order.deliveryFee && (order.status === OrderStatus.InTransit || order.status === OrderStatus.Delivered) ? (
                            <>
                                <span className="text-[9px] text-gray-500 font-bold">أجرة التوصيل</span>
                                <span className="text-green-400 font-black text-base leading-none">
                                    {order.deliveryFee.toLocaleString('en-US')} <span className="text-[9px] font-medium">ج.م</span>
                                </span>
                            </>
                        ) : (
                            <span className="text-[10px] font-bold text-gray-400 italic">في انتظار تحديد قيمة التوصيل</span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-all">
                        <span>تفاصيل الطلب</span>
                        <ChevronLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </button>
    );
}, (prev, next) => {
    // Custom comparison function for high-speed updates
    // Only re-render if data crucial for display changes
    return (
        prev.order.id === next.order.id &&
        prev.order.status === next.order.status &&
        prev.order.driverId === next.order.driverId &&
        prev.order.deliveryFee === next.order.deliveryFee &&
        prev.order.totalPrice === next.order.totalPrice &&
        prev.users === next.users && 
        prev.theme === next.theme
    );
});

export default DriverOrderCard;
