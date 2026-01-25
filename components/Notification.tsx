
import React, { useEffect, useRef } from 'react';
import { BellIcon, XIcon, CheckCircleIcon, TruckIconV2, UtensilsIcon, MessageSquareIcon, ShoppingCartIcon } from './icons';

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'info';
    id?: number;
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    // Keep a ref to onClose to ensure we always call the latest function (though usually stable)
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        // Simple, robust timer. 
        // 4 seconds -> Disappear.
        const timer = setTimeout(() => {
            onCloseRef.current();
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    // --- Smart Style Detection based on Message Content ---
    const getSmartStyle = () => {
        const lowerMsg = message?.toLowerCase() || '';

        // 1. New Order (طلب جديد) - Gold/Amber Theme
        if (lowerMsg.includes('طلب جديد') || lowerMsg.includes('new order') || lowerMsg.includes('طلب')) {
            return {
                icon: <ShoppingCartIcon className="h-5 w-5 text-amber-900" />,
                bgClass: 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500',
                textClass: 'text-amber-950',
                borderClass: 'border-amber-300/50',
                shadowClass: 'shadow-[0_8px_30px_rgb(251,191,36,0.4)]',
                glowClass: 'bg-yellow-400',
                title: 'تحديث الطلبات'
            };
        }

        // 2. Preparing (جاري التحضير) - Purple/Blue Theme
        if (lowerMsg.includes('جاري التحضير') || lowerMsg.includes('preparing')) {
            return {
                icon: <UtensilsIcon className="h-5 w-5 text-indigo-100" />,
                bgClass: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600',
                textClass: 'text-white',
                borderClass: 'border-indigo-400/50',
                shadowClass: 'shadow-[0_8px_30px_rgb(99,102,241,0.4)]',
                glowClass: 'bg-indigo-400',
                title: 'تحديث الحالة'
            };
        }

        // 3. Admin Message (رسالة من الإدارة) - Rose/Red Theme
        if (lowerMsg.includes('رسالة') || lowerMsg.includes('admin') || lowerMsg.includes('إدارة')) {
            return {
                icon: <MessageSquareIcon className="h-5 w-5 text-rose-100" />,
                bgClass: 'bg-gradient-to-r from-rose-500 via-red-500 to-red-600',
                textClass: 'text-white',
                borderClass: 'border-rose-400/50',
                shadowClass: 'shadow-[0_8px_30px_rgb(244,63,94,0.4)]',
                glowClass: 'bg-rose-400',
                title: 'تنبيه إداري'
            };
        }

        // 4. Delivery/In Transit (جاري التوصيل) - Sky/Cyan Theme
        if (lowerMsg.includes('توصيل') || lowerMsg.includes('طريق') || lowerMsg.includes('transit')) {
            return {
                icon: <TruckIconV2 className="h-5 w-5 text-cyan-900" />,
                bgClass: 'bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500',
                textClass: 'text-cyan-950',
                borderClass: 'border-cyan-300/50',
                shadowClass: 'shadow-[0_8px_30px_rgb(34,211,238,0.4)]',
                glowClass: 'bg-cyan-400',
                title: 'حالة التوصيل'
            };
        }

        // 5. Success - Green Theme
        if (type === 'success') {
            return {
                icon: <CheckCircleIcon className="h-5 w-5 text-emerald-900" />,
                bgClass: 'bg-gradient-to-r from-emerald-300 via-green-400 to-green-500',
                textClass: 'text-emerald-950',
                borderClass: 'border-emerald-300/50',
                shadowClass: 'shadow-[0_8px_30px_rgb(52,211,153,0.4)]',
                glowClass: 'bg-emerald-400',
                title: 'تم بنجاح'
            };
        }

        // 6. Error - Red Theme
        if (type === 'error') {
            return {
                icon: <XIcon className="h-5 w-5 text-white" />,
                bgClass: 'bg-gradient-to-r from-red-500 to-red-700',
                textClass: 'text-white',
                borderClass: 'border-red-400/50',
                shadowClass: 'shadow-[0_8px_30px_rgb(239,68,68,0.4)]',
                glowClass: 'bg-red-500',
                title: 'تنبيه'
            };
        }

        // 7. Default/Info - Dark Glass Theme
        return {
            icon: <BellIcon className="h-5 w-5 text-white" />,
            bgClass: 'bg-[#1a1a1a]/90 backdrop-blur-xl',
            textClass: 'text-white',
            borderClass: 'border-white/10',
            shadowClass: 'shadow-2xl',
            glowClass: 'bg-white',
            title: 'إشعار'
        };
    };

    const style = getSmartStyle();

    // Standard fixed styling, simplified animation
    // Removed Portal to ensure simpler tree, z-index should handle it.
    return (
        <div
            dir="rtl"
            className="fixed top-6 left-0 right-0 mx-auto z-[9999] w-fit max-w-[92%] min-w-[320px] sm:min-w-[350px] animate-fadeInDown"
        >
            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeInDown {
                    animation: fadeInDown 0.3s ease-out forwards;
                }
            `}</style>

            <div className={`
                relative flex items-center justify-between gap-4 p-1.5 pr-2 rounded-full 
                ${style.bgClass} ${style.borderClass} border ${style.shadowClass}
                shadow-2xl cursor-pointer
            `}
                onClick={onClose} // Allow clicking entire toast to dismiss
            >
                {/* Left Section: Content */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon Circle */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-inner`}>
                            {style.icon}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className={`flex flex-col ${style.textClass}`}>
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-80 leading-none mb-0.5">
                            {style.title}
                        </span>
                        <span className="text-sm font-bold leading-tight line-clamp-2">
                            {message}
                        </span>
                    </div>
                </div>

                {/* Right Section: Close Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        bg-black/10 hover:bg-black/20 transition-colors backdrop-blur-sm
                        ${style.textClass}
                    `}
                >
                    <XIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Progress Bar (Optional Visual Cue) */}
            <div className="absolute bottom-1 left-4 right-4 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 animate-progress origin-left" style={{ animationDuration: '4s' }}></div>
            </div>
            <style>{`
                @keyframes progress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                .animate-progress {
                    animation: progress linear forwards;
                }
            `}</style>
        </div>
    );
};

export default Notification;
