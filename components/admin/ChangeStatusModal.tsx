
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderStatus } from '../../types';
import { XIcon, RouteIcon, ClockIcon, CheckCircleIcon, UserIcon, UtensilsIcon, RocketIcon, ShoppingCartIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface ChangeStatusModalProps {
  order: Order;
  onClose: () => void;
  onSelectStatus: (order: Order, newStatus: OrderStatus) => void;
  onTransferOrder?: (order: Order) => void;
}

const StatusButton: React.FC<{
    status: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    subLabel: string;
}> = ({ status, icon, color, onClick, subLabel }) => (
    <button
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={`w-full text-right p-4 rounded-xl flex items-center space-x-4 space-x-reverse transition-all duration-200 border border-gray-700 bg-gray-900 active:bg-gray-800 group relative z-10 ${color}`}
    >
        <div className="p-3 bg-white/5 rounded-full group-active:bg-white/10 transition-colors pointer-events-none">
            {icon}
        </div>
        <div className="pointer-events-none">
            <p className="font-bold text-neutral-100 text-md">{status}</p>
            <p className="text-xs text-neutral-400">{subLabel}</p>
        </div>
    </button>
);

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ order, onClose, onSelectStatus, onTransferOrder }) => {
    
    // Use the custom hook for consistent back handling
    useAndroidBack(() => {
        onClose();
        return true; // Stop propagation
    }, [onClose]);

    const isShoppingOrder = order.type === 'shopping_order';

    // Define options with dynamic labels based on order type
    const statusOptions: { status: OrderStatus; icon: React.ReactNode; color: string; label: string; sub: string }[] = [
        { 
            status: OrderStatus.WaitingMerchant, 
            icon: isShoppingOrder ? <RocketIcon className="w-6 h-6 text-purple-400" /> : <ClockIcon className="w-6 h-6 text-purple-400" />, 
            color: 'hover:border-purple-500/50', 
            label: isShoppingOrder ? 'قبول الطلب' : OrderStatus.WaitingMerchant,
            sub: isShoppingOrder ? 'الموافقة على الطلب وبدء المعالجة' : 'بانتظار قبول التاجر'
        },
        { 
            status: OrderStatus.Preparing, 
            icon: <UtensilsIcon className="w-6 h-6 text-orange-400" />, 
            color: 'hover:border-orange-500/50', 
            label: isShoppingOrder ? 'جاري التجهيز' : OrderStatus.Preparing,
            sub: isShoppingOrder ? 'البدء في شراء/تجهيز الطلبات' : 'الطلب قيد التحضير'
        },
        { 
            status: OrderStatus.Pending, 
            icon: <ShoppingCartIcon className="w-6 h-6 text-yellow-400" />, 
            color: 'hover:border-yellow-500/50', 
            label: isShoppingOrder ? 'طلب مندوب' : OrderStatus.Pending,
            sub: isShoppingOrder ? 'الطلب جاهز، بانتظار تعيين سائق' : 'بانتظار تعيين مندوب'
        },
        { 
            status: OrderStatus.InTransit, 
            icon: <RouteIcon className="w-6 h-6 text-sky-400" />, 
            color: 'hover:border-sky-500/50', 
            label: OrderStatus.InTransit,
            sub: 'الطلب خرج للتوصيل'
        },
        { 
            status: OrderStatus.Delivered, 
            icon: <CheckCircleIcon className="w-6 h-6 text-green-400" />, 
            color: 'hover:border-green-500/50', 
            label: OrderStatus.Delivered,
            sub: 'تم تسليم الطلب بنجاح'
        },
        { 
            status: OrderStatus.Cancelled, 
            icon: <XIcon className="w-6 h-6 text-red-400" />, 
            color: 'hover:border-red-500/50', 
            label: OrderStatus.Cancelled,
            sub: 'إلغاء الطلب نهائياً'
        },
    ];
    
    // Filter logic based on Order Type
    const availableStatuses = statusOptions.filter(opt => {
        // 1. Hide current status
        if (opt.status === order.status) return false;

        // ** NEW LOGIC: Prevent direct jump from Pending -> Delivered **
        if (order.status === OrderStatus.Pending && opt.status === OrderStatus.Delivered) {
            return false;
        }

        // 2. Logic for Shopping Orders (Special Requests)
        // Flow: Waiting(Accept) -> Preparing -> Pending(Request Driver) -> InTransit -> Delivered
        if (isShoppingOrder) {
            return true; // Show all options for shopping orders to allow full control
        } 
        
        // 3. Logic for Standard Orders (Merchant Orders)
        // Flow: Pending(Wait Driver) -> InTransit -> Delivered
        // Hide "WaitingMerchant" and "Preparing" as these are Merchant-side statuses
        else {
            return opt.status !== OrderStatus.WaitingMerchant && opt.status !== OrderStatus.Preparing;
        }
    });

    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ 
                backgroundColor: 'rgba(0,0,0,0.85)', 
                backdropFilter: 'blur(2px)',
                touchAction: 'none' 
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }}
        >
            <div 
                className="bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-gray-700 shadow-2xl relative flex flex-col max-h-[85vh] animate-sheet-up" 
                onClick={(e) => {
                    e.stopPropagation(); 
                }}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-100">تغيير حالة الطلب</h3>
                        <p className="font-mono text-xs text-red-400 mt-0.5 tracking-wider">
                            {isShoppingOrder ? 'طلب خاص ' : 'طلب عادي '} 
                            #{order.id}
                        </p>
                    </div>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }} 
                        className="text-neutral-400 hover:text-white p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 bg-gray-800">
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-sm text-neutral-400 font-medium">الحالة الحالية:</p>
                        <span className="font-bold text-white bg-gray-700 px-3 py-1 rounded-full text-xs border border-gray-600 shadow-sm">{order.status}</span>
                    </div>

                    {/* Transfer Order Option - Only for InTransit */}
                    {order.status === OrderStatus.InTransit && onTransferOrder && (
                        <div className="mb-2">
                            <StatusButton 
                                status="نقل الطلب لمندوب آخر"
                                subLabel="تغيير المندوب واستكمال التوصيل"
                                icon={<UserIcon className="w-6 h-6 text-indigo-400" />}
                                color="bg-indigo-900/10 border-indigo-500/30 hover:bg-indigo-900/20"
                                onClick={() => onTransferOrder(order)}
                            />
                            <div className="flex items-center gap-2 my-4 opacity-50">
                                <div className="h-px bg-gray-600 flex-1"></div>
                                <span className="text-[10px] text-gray-400 font-bold">أو تغيير الحالة</span>
                                <div className="h-px bg-gray-600 flex-1"></div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {availableStatuses.map(opt => (
                            <StatusButton 
                                key={opt.status}
                                status={opt.label}
                                subLabel={opt.sub}
                                icon={opt.icon}
                                color={opt.color}
                                onClick={() => onSelectStatus(order, opt.status)}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Cancel Button */}
                <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-2xl">
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="w-full py-3.5 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition-colors border border-gray-600 active:bg-gray-600"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ChangeStatusModal;
