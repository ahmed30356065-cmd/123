
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, ExclamationTriangleIcon, CheckCircleIcon, TrashIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmVariant?: 'danger' | 'success' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    title,
    message,
    onClose,
    onConfirm,
    confirmButtonText = 'تأكيد',
    cancelButtonText = 'إلغاء',
    confirmVariant = 'primary',
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    useAndroidBack(() => {
        handleClose();
        return true;
    });

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200); // Wait for exit animation
    };

    const handleConfirmAction = () => {
        setIsVisible(false);
        setTimeout(onConfirm, 200);
    };

    const getIcon = () => {
        switch (confirmVariant) {
            case 'danger': return <TrashIcon className="w-8 h-8 text-red-500 animate-bounce" />;
            case 'success': return <CheckCircleIcon className="w-8 h-8 text-green-500 animate-pulse" />;
            default: return <ExclamationTriangleIcon className="w-8 h-8 text-blue-500 animate-pulse" />;
        }
    };

    const getButtonStyles = () => {
        switch (confirmVariant) {
            case 'danger': return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-900/30';
            case 'success': return 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 shadow-green-900/30';
            default: return 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-900/30';
        }
    };

    return createPortal(
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ease-out ${isVisible ? 'backdrop-blur-[2px] bg-black/60' : 'opacity-0 pointer-events-none'}`}
            onClick={handleClose}
            style={{ touchAction: 'none' }} // Prevent scrolling background
        >
            <div
                className={`
            w-full max-w-sm bg-[#1e293b] rounded-2xl border border-gray-700/50 shadow-2xl 
            transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden
            ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-10 opacity-0'}
        `}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${confirmVariant === 'danger' ? 'from-red-500 via-orange-500 to-red-500' : confirmVariant === 'success' ? 'from-green-500 via-emerald-500 to-green-500' : 'from-blue-500 via-cyan-500 to-blue-500'}`}></div>

                <div className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-full bg-[#0f172a] border border-gray-700 shadow-inner`}>
                            {getIcon()}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">{message}</p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleConfirmAction}
                            className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg transform transition-transform active:scale-95 ${getButtonStyles()}`}
                        >
                            {confirmButtonText}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 px-4 rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-bold text-sm border border-gray-600/50 transition-colors active:scale-95"
                        >
                            {cancelButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationModal;
