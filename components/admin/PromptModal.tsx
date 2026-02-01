
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, PencilIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface PromptModalProps {
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
    inputType?: 'text' | 'number';
    onClose: () => void;
    onConfirm: (value: string) => void;
    confirmButtonText?: string;
    cancelButtonText?: string;
}

const PromptModal: React.FC<PromptModalProps> = ({
    title,
    message,
    placeholder = '',
    defaultValue = '',
    inputType = 'text',
    onClose,
    onConfirm,
    confirmButtonText = 'حسناً',
    cancelButtonText = 'إلغاء',
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        // Focus input after animation
        setTimeout(() => {
            inputRef.current?.focus();
            if (defaultValue) inputRef.current?.select();
        }, 100);
    }, []);

    useAndroidBack(() => {
        handleClose();
        return true;
    });

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    };

    const handleConfirmAction = () => {
        if (!value.trim()) return; // Prevent empty if needed, or allow it
        setIsVisible(false);
        setTimeout(() => onConfirm(value), 200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleConfirmAction();
        if (e.key === 'Escape') handleClose();
    };

    return createPortal(
        <div
            className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-300 ease-out ${isVisible ? 'backdrop-blur-[2px] bg-black/60' : 'opacity-0 pointer-events-none'}`}
            onClick={handleClose}
            style={{ touchAction: 'none' }}
        >
            <div
                className={`
            w-full max-w-sm bg-[#1e293b] rounded-2xl border border-gray-700/50 shadow-2xl 
            transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden
            ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-10 opacity-0'}
        `}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 text-center">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 text-center">{message}</p>

                    <div className="relative mb-6">
                        <input
                            ref={inputRef}
                            type={inputType}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 px-4 text-white text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono text-lg"
                            dir="ltr"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleConfirmAction}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-900/30 transform transition-transform active:scale-95"
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

export default PromptModal;
