
import React from 'react';
import { XIcon, ExclamationTriangleIcon } from '../icons';

interface OrderLimitModalProps {
    onClose: () => void;
    currentCount: number;
    maxLimit: number;
}

const OrderLimitModal: React.FC<OrderLimitModalProps> = ({ onClose, currentCount, maxLimit }) => {
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1a1a1a] w-full max-w-sm rounded-3xl border border-red-500/30 shadow-2xl overflow-hidden relative flex flex-col items-center p-8 text-center" onClick={(e) => e.stopPropagation()}>
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-full">
                    <XIcon className="w-5 h-5" />
                </button>

                {/* Animation Container */}
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                    <div className="relative bg-gradient-to-br from-red-600 to-red-800 w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 border-red-400/50">
                        <ExclamationTriangleIcon className="w-10 h-10 text-white animate-pulse" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">عفواً، وصلت للحد الأقصى!</h2>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    لا يمكنك قبول المزيد من الطلبات في الوقت الحالي.
                    <br />
                    لديك <span className="text-red-400 font-bold">{currentCount}</span> طلبات نشطة والحد المسموح هو <span className="text-white font-bold bg-gray-700 px-2 rounded">{maxLimit}</span>.
                </p>

                <div className="w-full bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
                    <p className="text-xs text-gray-500 mb-2">حالة الطلبات الحالية</p>
                    <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full w-full shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse"></div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs font-mono font-bold">
                        <span className="text-white">{currentCount} / {maxLimit}</span>
                        <span className="text-red-400">ممتلئ</span>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-transform active:scale-95 shadow-lg"
                >
                    حسناً، فهمت
                </button>
            </div>
        </div>
    );
};

export default OrderLimitModal;
