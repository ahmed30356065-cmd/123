import React from 'react';
import { BellIcon, XIcon } from './icons';

interface PermissionRequestProps {
    onEnable: () => void;
    onDismiss: () => void;
}

const PermissionRequest: React.FC<PermissionRequestProps> = ({ onEnable, onDismiss }) => {
    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-[9999] animate-slide-up">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <BellIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-sm mb-1">تفعيل التنبيهات</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            اسمح للتطبيق بإرسال إشعارات عندما تصلك طلبات جديدة لضمان عدم تفويت أي شيء.
                        </p>
                    </div>
                    <button onClick={onDismiss} className="text-gray-500 hover:text-white transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex gap-2 mr-12">
                    <button
                        onClick={onEnable}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex-1"
                    >
                        تفعيل الآن
                    </button>
                    <button
                        onClick={onDismiss}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex-1"
                    >
                        ليس الآن
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default PermissionRequest;
