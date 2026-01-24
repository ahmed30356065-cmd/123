
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderStatus, AppTheme } from '../../types';
import { ClockIcon, CheckCircleIcon, TruckIconV2, XIcon, EmptyBoxIcon, UtensilsIcon, TrashIcon, ShoppingCartIcon, ClipboardListIcon, DollarSignIcon, ImageIcon, RocketIcon, MapPinIcon } from '../icons';
import ConfirmationModal from '../admin/ConfirmationModal';

interface CustomerOrdersProps {
    orders: Order[];
    onDeleteOrder: (orderId: string) => void;
    appTheme?: AppTheme;
}

const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.WaitingMerchant:
            return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: ClockIcon, label: 'بانتظار الموافقة', progress: 10 };
        case OrderStatus.Preparing:
            return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: UtensilsIcon, label: 'جاري التحضير', progress: 35 };
        case OrderStatus.Pending:
            return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: ShoppingCartIcon, label: 'بانتظار المندوب', progress: 15 };
        case OrderStatus.InTransit:
            return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: TruckIconV2, label: 'جاري التنفيذ', progress: 65 };
        case OrderStatus.Delivered:
            // Updated to Teal
            return { color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: CheckCircleIcon, label: 'تم التوصيل', progress: 100 };
        case OrderStatus.Cancelled:
            return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XIcon, label: 'ملغي', progress: 0 };
        default:
            return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: ClockIcon, label: status, progress: 0 };
    }
};

const CustomerOrders: React.FC<CustomerOrdersProps> = ({ orders, onDeleteOrder, appTheme }) => {
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    // Header Scroll Effect State
    const [headerOpacity, setHeaderOpacity] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollY = container.scrollTop;
            const opacity = Math.min(scrollY / 60, 0.95);
            setHeaderOpacity(opacity);
        };
        
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const themeColors = {
        cardBg: 'bg-[#1e1e1e]', // Slightly lighter than black for depth
        border: 'border-white/5',
        textMain: 'text-white',
        textSub: 'text-gray-400',
        subContainer: 'bg-[#151515]',
    };

    const { currentOrders, historyOrders } = useMemo(() => {
        const current: Order[] = [];
        const history: Order[] = [];
        orders.forEach(order => {
            if (order.status === OrderStatus.Delivered || order.status === OrderStatus.Cancelled) history.push(order);
            else current.push(order);
        });
        // Sort Newest First for better UX in lists
        const sorter = (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return { currentOrders: current.sort(sorter), historyOrders: history.sort(sorter) };
    }, [orders]);

    const renderActiveOrder = (order: Order) => {
        const config = getStatusConfig(order.status);
        const grandTotal = (order.totalPrice || 0) + (order.deliveryFee || 0);
        const isSpecialRequest = order.type === 'shopping_order';
        const hasPrice = order.deliveryFee && order.deliveryFee > 0;

        // Custom Styling for Special Requests
        const cardStyle = isSpecialRequest 
            ? 'bg-gradient-to-br from-[#2a1b36] to-[#1a1a1a] border-purple-500/30' 
            : `${themeColors.cardBg} ${themeColors.border}`;

        return (
            <div key={order.id} className={`rounded-2xl p-0.5 relative overflow-hidden group shadow-lg transition-all duration-300 active:scale-[0.99] mb-3`}>
                
                {/* Animated Border Gradient for InTransit */}
                {order.status === OrderStatus.InTransit && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 z-10 pointer-events-none"></div>
                )}

                <div className={`${cardStyle} rounded-[20px] p-4 relative z-0 flex flex-col border`}>
                    
                    {/* Top Row: Icon + Title + Status */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0 ${isSpecialRequest ? 'bg-purple-500/20 text-purple-300' : `${config.bg} ${config.color}`}`}>
                                {isSpecialRequest ? <RocketIcon className="w-5 h-5 animate-pulse" /> : <config.icon className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                                <h3 className={`font-bold text-base truncate ${isSpecialRequest ? 'text-purple-100' : themeColors.textMain}`}>
                                    {isSpecialRequest ? 'طلب خاص' : order.merchantName}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded ${isSpecialRequest ? 'bg-purple-500/10 text-purple-300' : 'bg-white/5 text-gray-500'}`}>#{order.id}</span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        {new Date(order.createdAt).toLocaleTimeString('ar-EG-u-nu-latn', {hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md flex items-center gap-1 flex-shrink-0 ${isSpecialRequest ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : `${config.bg} ${config.border} ${config.color}`}`}>
                            {order.status === OrderStatus.InTransit && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>}
                            {config.label}
                        </div>
                    </div>

                    {/* Content Details (Compact) */}
                    {isSpecialRequest ? (
                        <div className="bg-purple-900/10 border border-purple-500/10 rounded-lg p-2.5 mb-3">
                            <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 italic">
                                "{order.notes}"
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <ShoppingCartIcon className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-gray-300">{order.items?.length || 0} منتجات</span>
                        </div>
                    )}

                    {/* Footer: Price & Delivery Info */}
                    <div className="flex justify-between items-end border-t border-white/5 pt-2 mt-auto">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 font-bold mb-0.5">الإجمالي المتوقع</span>
                            {hasPrice ? (
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-lg font-black ${isSpecialRequest ? 'text-purple-400' : 'text-white'}`}>{grandTotal > 0 ? grandTotal.toLocaleString('en-US') : order.totalPrice?.toLocaleString('en-US')}</span>
                                    <span className="text-[10px] text-gray-500 font-bold">ج.م</span>
                                </div>
                            ) : (
                                <span className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" /> بانتظار السعر
                                </span>
                            )}
                        </div>
                        
                        {order.driverId && order.status === OrderStatus.InTransit && (
                            <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 text-blue-400">
                                <TruckIconV2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">المندوب في الطريق</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderHistoryOrder = (order: Order) => {
        const config = getStatusConfig(order.status);
        const grandTotal = (order.totalPrice || 0) + (order.deliveryFee || 0);
        const isSpecial = order.type === 'shopping_order';
        
        return (
            <div key={order.id} className={`${themeColors.cardBg} rounded-xl p-3 border ${themeColors.border} shadow-sm flex items-center justify-between gap-3 mb-2`}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSpecial ? 'bg-purple-500/10 text-purple-400' : (order.status === OrderStatus.Cancelled ? 'bg-red-500/10 text-red-500' : 'bg-teal-500/10 text-teal-500')}`}>
                        {isSpecial ? <RocketIcon className="w-5 h-5" /> : (order.status === OrderStatus.Cancelled ? <XIcon className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>)}
                    </div>
                    <div className="min-w-0">
                        <h4 className={`font-bold text-sm truncate ${themeColors.textMain}`}>{isSpecial ? 'طلب خاص' : order.merchantName}</h4>
                        <div className="flex items-center gap-2 text-[10px]">
                            <span className={themeColors.textSub}>{new Date(order.createdAt).toLocaleDateString('ar-EG-u-nu-latn')}</span>
                            <span className={`px-1.5 rounded border ${config.border} ${config.color} bg-transparent font-bold`}>{config.label}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`font-mono text-sm font-black ${themeColors.textMain}`}>{grandTotal > 0 ? `${grandTotal.toLocaleString('en-US')} ج.م` : '--'}</span>
                    <button 
                        onClick={() => setOrderToDelete(order.id)}
                        className={`text-gray-600 hover:text-red-400 transition-colors p-1.5`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#1A1A1A] h-[100dvh] flex flex-col font-sans overflow-hidden">
            
            {/* Dynamic Sticky Header with Safe Area */}
            <div 
                className="absolute top-0 left-0 right-0 z-40 pt-safe px-4 pb-3 transition-all duration-300 box-content"
                style={{ 
                    backgroundColor: `rgba(26, 26, 26, ${headerOpacity})`, 
                    backdropFilter: headerOpacity > 0.5 ? 'blur(12px)' : 'none',
                    borderBottom: headerOpacity > 0.5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    boxShadow: headerOpacity > 0.5 ? '0 4px 30px rgba(0,0,0,0.1)' : 'none'
                }}
            >
                <div className="flex justify-between items-center mb-3 mt-1">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${themeColors.cardBg} rounded-full border ${themeColors.border} shadow-sm`}>
                            <ClipboardListIcon className="w-5 h-5 text-gray-200" />
                        </div>
                        <div>
                            <h1 className={`text-lg font-black ${themeColors.textMain} leading-none`}>طلباتي</h1>
                            <p className={`text-[10px] ${themeColors.textSub} font-medium mt-0.5`}>تتبع حالة طلباتك</p>
                        </div>
                    </div>
                </div>

                <div className={`flex ${themeColors.cardBg} p-1 rounded-lg shadow-inner border ${themeColors.border}`}>
                    <button
                        onClick={() => setActiveTab('current')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'current' ? 'bg-[#333] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-gray-400'}`}
                    >
                        النشطة ({currentOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'history' ? 'bg-[#333] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-gray-400'}`}
                    >
                        السجل ({historyOrders.length})
                    </button>
                </div>
            </div>

            <div 
                ref={scrollContainerRef} 
                className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 pt-36 scroll-smooth overscroll-none"
                onScroll={(e) => {
                    const opacity = Math.min(e.currentTarget.scrollTop / 60, 0.95);
                    setHeaderOpacity(opacity);
                }}
            >
                {activeTab === 'current' ? (
                    currentOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-600 min-h-[40vh]">
                            <EmptyBoxIcon className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-sm font-bold text-gray-500">لا توجد طلبات نشطة</p>
                        </div>
                    ) : (
                        <div className="animate-fadeIn pb-4">
                            {currentOrders.map(order => renderActiveOrder(order))}
                        </div>
                    )
                ) : (
                    historyOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-600 min-h-[40vh]">
                            <ClockIcon className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-sm font-bold text-gray-500">السجل فارغ</p>
                        </div>
                    ) : (
                        <div className="animate-fadeIn pb-4">
                            {historyOrders.map(order => renderHistoryOrder(order))}
                        </div>
                    )
                )}
            </div>

            {orderToDelete && (
                <ConfirmationModal
                    title="حذف الطلب"
                    message="هل أنت متأكد من حذف هذا الطلب من السجل؟"
                    onClose={() => setOrderToDelete(null)}
                    onConfirm={() => { if(orderToDelete) { onDeleteOrder(orderToDelete); setOrderToDelete(null); }}}
                    confirmButtonText="حذف"
                    confirmVariant="danger"
                />
            )}
        </div>
    );
};

export default CustomerOrders;
