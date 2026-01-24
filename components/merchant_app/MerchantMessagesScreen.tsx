
import React, { useEffect, useState } from 'react';
import { Message } from '../../types';
import { MessageSquareIcon, ClockIcon, TrashIcon, UserIcon, BellIcon } from '../icons';
import ConfirmationModal from '../admin/ConfirmationModal';

interface MerchantMessagesScreenProps {
    messages: Message[];
    onMarkAsSeen: (id: string) => void;
    hideMessage: (id: string) => void;
}

const MerchantMessagesScreen: React.FC<MerchantMessagesScreenProps> = ({ messages, onMarkAsSeen, hideMessage }) => {
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

    useEffect(() => {
        messages.forEach(msg => {
            onMarkAsSeen(msg.id);
        });
    }, [messages, onMarkAsSeen]);

    const confirmDelete = () => {
        if (messageToDelete) {
            hideMessage(messageToDelete);
            setMessageToDelete(null);
        }
    };

    return (
        <div className="space-y-6 pb-24 animate-fadeIn p-1">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3 px-2">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-lg opacity-20 rounded-full"></div>
                    <MessageSquareIcon className="w-8 h-8 text-red-500 relative" />
                </div>
                <span>صندوق الرسائل</span>
            </h2>

            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-500 min-h-[50vh] bg-gray-800/30 rounded-3xl border border-gray-700/50 p-8 mx-2">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-inner border border-gray-700">
                        <MessageSquareIcon className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-300">لا توجد رسائل</p>
                    <p className="text-sm text-gray-500 mt-1">صندوق الوارد فارغ حالياً.</p>
                </div>
            ) : (
                <div className="space-y-5 px-2">
                    {messages.map((msg) => {
                        const formattedDate = (() => {
                            try {
                                const d = new Date(msg.createdAt);
                                if(isNaN(d.getTime())) return '';
                                return d.toLocaleString('ar-EG-u-nu-latn', { weekday: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                            } catch(e) { return ''; }
                        })();

                        return (
                            <div key={msg.id} className="relative bg-[#1e1e1e] rounded-2xl shadow-lg border border-gray-700 overflow-hidden group hover:border-gray-500 transition-colors duration-300">
                                {/* Header Bar */}
                                <div className="bg-gradient-to-r from-[#2a2a2a] to-[#1e1e1e] p-4 flex justify-between items-start border-b border-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-600/10 rounded-xl border border-purple-500/20">
                                            <UserIcon className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-white">إدارة النظام</span>
                                            <span className="text-[10px] text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/20">رسالة رسمية</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md border border-white/5">
                                        <ClockIcon className="w-3 h-3" />
                                        {formattedDate}
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-5">
                                    {msg.image && (
                                        <div className="mb-4 rounded-xl overflow-hidden border border-gray-600 bg-black">
                                            <img src={msg.image} alt="مرفق" className="w-full h-auto max-h-64 object-contain mx-auto" />
                                        </div>
                                    )}
                                    
                                    <p className="text-gray-200 text-sm leading-7 whitespace-pre-wrap">
                                        {msg.text}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="px-4 py-3 bg-[#151515] flex justify-end border-t border-gray-800">
                                    <button 
                                        onClick={() => setMessageToDelete(msg.id)}
                                        className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/5"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        <span>حذف</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirmation Modal */}
            {messageToDelete && (
                <ConfirmationModal 
                    title="حذف الرسالة"
                    message="هل أنت متأكد من رغبتك في حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء."
                    onClose={() => setMessageToDelete(null)}
                    onConfirm={confirmDelete}
                    confirmButtonText="حذف"
                    confirmVariant="danger"
                />
            )}
        </div>
    );
};

export default MerchantMessagesScreen;
