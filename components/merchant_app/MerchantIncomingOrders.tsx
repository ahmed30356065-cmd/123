
import React, { useState } from 'react';
import { Order, OrderStatus, AppTheme, User } from '../../types';
import { ClockIcon, CheckCircleIcon, ShoppingCartIcon, XIcon, EmptyBoxIcon, ImageIcon, UserIcon } from '../icons';
import ConfirmationModal from '../admin/ConfirmationModal';

interface MerchantIncomingOrdersProps {
    orders: Order[];
    onUpdateStatus: (orderId: string, status: OrderStatus) => void;
    theme?: AppTheme;
    users?: User[]; // Accept users to find customer details for frames
}

const MerchantIncomingOrders: React.FC<MerchantIncomingOrdersProps> = ({ orders, onUpdateStatus, theme, users }) => {
    const [orderToReject, setOrderToReject] = useState<string | null>(null);

    const incomingOrders = orders.filter(o => 
        o.status === OrderStatus.WaitingMerchant || 
        o.status === OrderStatus.Preparing
    ).sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeA - timeB;
    });

    if (incomingOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 min-h-[60vh]">
                {theme?.merchant?.icons?.img_empty_list ? (
                    <img src={theme.merchant.icons.img_empty_list} className="w-24 h-24 mb-6 object-contain" alt="Empty" />
                ) : (
                    <EmptyBoxIcon className="w-24 h-24 mb-6 opacity-20" />
                )}
                <h3 className="text-xl font-bold text-neutral-300 mb-2">لا توجد طلبات واردة</h3>
                <p className="text-sm text-gray-400">الطلبات الجديدة من التطبيق ستظهر هنا للموافقة عليها.</p>
            </div>
        );
    }

    const CustomIcon = ({ name, Default, className }: { name: string, Default: any, className?: string }) => {
        const src = theme?.merchant?.icons?.[name];
        if (src) return <img src={src} className={`${className} object-contain`} alt={name} />;
        return <Default className={className} />;
    };

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

    const handleConfirmReject = () => {
        if (orderToReject) {
            onUpdateStatus(orderToReject, OrderStatus.Cancelled);
            setOrderToReject(null);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-gray-700 pb-4">
                <div className="relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-20"></span>
                    <CustomIcon name="ic_notification" Default={ShoppingCartIcon} className="w-8 h-8 text-red-500 relative" />
                </div>
                طلبات تحتاج انتباهك ({incomingOrders.length})
            </h2>

            {incomingOrders.map(order => {
                const isWaiting = order.status === OrderStatus.WaitingMerchant;
                const formattedTime = new Date(order.createdAt).toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric' });
                
                // Attempt to find the full user object for the customer to get the frame (Safe lookup)
                const customerUser = users?.find(u => u.phone === order.customer?.phone);

                return (
                    <div key={order.id} className={`rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${isWaiting ? 'bg-gray-800 border-purple-500/50 shadow-purple-900/10' : 'bg-gray-800 border-orange-500/50 shadow-orange-900/10'}`}>
                        {/* Header */}
                        <div className={`p-4 flex justify-between items-center ${isWaiting ? 'bg-gradient-to-r from-purple-900/40 to-gray-800' : 'bg-gradient-to-r from-orange-900/40 to-gray-800'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-sm ${isWaiting ? 'bg-purple-600' : 'bg-orange-600'}`}>
                                    {isWaiting ? 'طلب جديد' : 'جاري التحضير'}
                                </span>
                                <span className="text-gray-300 text-sm font-mono font-semibold tracking-wider">#{order.id}</span>
                            </div>
                            <div className="flex items-center text-gray-400 text-xs bg-black/20 px-2 py-1 rounded-lg">
                                <CustomIcon name="ic_time" Default={ClockIcon} className="w-3.5 h-3.5 ml-1.5" />
                                {formattedTime}
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-5 border-b border-gray-700/50">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    {/* Customer Avatar with Frame */}
                                    <div className={`relative w-10 h-10 flex items-center justify-center rounded-full ${!isCustomFrame(customerUser?.specialFrame) ? getFrameContainerClass(customerUser?.specialFrame) : ''}`}>
                                        {isCustomFrame(customerUser?.specialFrame) && (
                                            <img src={customerUser?.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-125 pointer-events-none" alt="frame" />
                                        )}
                                        <div className={`${isCustomFrame(customerUser?.specialFrame) ? 'w-[85%] h-[85%]' : 'w-full h-full'} rounded-full bg-gray-700/50 flex items-center justify-center overflow-hidden border border-gray-600 relative z-0`}>
                                            {customerUser?.storeImage ? (
                                                <img src={customerUser.storeImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-0.5">العميل</p>
                                        <p className="text-white font-bold text-lg">{order.customer?.name || 'عميل تطبيق'}</p>
                                        <p className="text-gray-500 text-sm font-mono dir-ltr text-right">{order.customer?.phone || ''}</p>
                                    </div>
                                </div>
                                <div className="text-left bg-gray-700/30 p-2 rounded-lg border border-gray-600/30">
                                    <p className="text-gray-400 text-xs mb-1">الإجمالي</p>
                                    <p className="text-green-400 font-bold text-xl">{order.totalPrice?.toLocaleString('en-US')} <span className="text-xs">ج.م</span></p>
                                </div>
                            </div>
                            {order.notes && (
                                <div className="mt-4 bg-red-900/10 border border-red-500/20 p-3 rounded-lg">
                                    <p className="text-xs text-red-400 font-bold mb-1">ملاحظات العميل:</p>
                                    <p className="text-sm text-gray-300">{order.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Items List (Visual) */}
                        <div className="p-5 space-y-3 bg-[#1a1a1a]/50">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">قائمة الأصناف ({order.items?.length || 0})</p>
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex gap-4 bg-[#252525] p-3 rounded-xl border border-gray-700/50 items-center">
                                    {/* Product Image */}
                                    <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-600">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                {theme?.merchant?.icons?.img_default_product ? (
                                                    <img src={theme.merchant.icons.img_default_product} className="w-6 h-6 object-contain" />
                                                ) : <ImageIcon className="w-6 h-6 opacity-50" />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-white font-bold text-sm truncate pl-2">{item.name}</h4>
                                        </div>
                                        <p className="text-gray-400 text-xs">{item.price.toLocaleString('en-US')} ج.م للوحدة</p>
                                        <p className="text-green-500 font-bold text-sm mt-1">
                                            الإجمالي: {(item.price * item.quantity).toLocaleString('en-US')} ج.م
                                        </p>
                                    </div>

                                    {/* Quantity Badge */}
                                    <div className="flex flex-col items-center justify-center bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 min-w-[3.5rem]">
                                        <span className="text-[10px] text-gray-400 mb-0.5">الكمية</span>
                                        <span className="text-xl font-black text-white">{item.quantity}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-gray-800 border-t border-gray-700">
                            <div className="flex gap-3">
                                {isWaiting ? (
                                    <>
                                        <button 
                                            onClick={() => setOrderToReject(order.id)}
                                            className="flex-1 bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-400 py-3.5 rounded-xl font-bold transition-colors border border-gray-600 hover:border-red-500/50 flex items-center justify-center gap-2"
                                        >
                                            {theme?.merchant?.icons?.btn_delete && <img src={theme.merchant.icons.btn_delete} className="w-4 h-4 object-contain" />}
                                            رفض الطلب
                                        </button>
                                        <button 
                                            onClick={() => onUpdateStatus(order.id, OrderStatus.Preparing)}
                                            className="flex-[2] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-purple-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 border border-purple-500/20"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" />
                                            قبول وبدء التجهيز
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => onUpdateStatus(order.id, OrderStatus.Pending)}
                                        className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 border border-orange-500/20"
                                    >
                                        <ShoppingCartIcon className="w-5 h-5" />
                                        تم التجهيز (طلب مندوب)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Confirmation Modal for Rejection */}
            {orderToReject && (
                <ConfirmationModal
                    title="رفض الطلب"
                    message="هل أنت متأكد من رغبتك في رفض هذا الطلب؟ سيتم إشعار العميل بذلك."
                    onClose={() => setOrderToReject(null)}
                    onConfirm={handleConfirmReject}
                    confirmButtonText="تأكيد الرفض"
                    confirmVariant="danger"
                />
            )}
        </div>
    );
};

export default MerchantIncomingOrders;
