
import React, { useEffect, useState } from 'react';
import { Message } from '../../types';
import { MessageSquareIcon, ClockIcon, TrashIcon, UserIcon, BellIcon, VerifiedIcon, CheckCircleIcon } from '../icons';
import ConfirmationModal from '../admin/ConfirmationModal';

interface DriverMessagesScreenProps {
    messages: Message[];
    onMarkAsSeen: (messageId: string) => void;
    hideMessage: (messageId: string) => void;
    appName?: string;
}

const DriverMessagesScreen: React.FC<DriverMessagesScreenProps> = ({ messages, onMarkAsSeen, hideMessage, appName = 'GOO NOW' }) => {
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [localHiddenIds, setLocalHiddenIds] = useState<string[]>([]);
    
    // Automatically mark visible messages as seen when the screen loads or messages update
    useEffect(() => {
        messages.forEach(msg => {
            onMarkAsSeen(msg.id);
        });
    }, [messages, onMarkAsSeen]);

    const confirmDelete = () => {
        if (messageToDelete) {
            // Optimistic Update: Hide immediately
            setLocalHiddenIds(prev => [...prev, messageToDelete]);
            // Call server
            hideMessage(messageToDelete);
            setMessageToDelete(null);
        }
    };

    const visibleMessages = messages.filter(m => !localHiddenIds.includes(m.id)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="p-4 space-y-6 animate-fadeIn pb-24">
            {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-500 min-h-[60vh]">
                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <MessageSquareIcon className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-300 mb-2">لا توجد رسائل</h3>
                    <p className="text-sm text-gray-500 max-w-xs">صندوق الوارد فارغ حالياً. ستظهر هنا أي تنبيهات أو تعليمات من الإدارة.</p>
                </div>
            ) : (
                visibleMessages.map((msg) => {
                    const formattedDate = (() => {
                        try {
                            const d = new Date(msg.createdAt);
                            if(isNaN(d.getTime())) return '';
                            return d.toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                        } catch(e) { return ''; }
                    })();

                    return (
                        <div key={msg.id} className="group relative bg-[#252525] rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-600 hover:-translate-y-1">
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-red-600/80"></div>
                            
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center border-b border-white/5 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg border border-red-500/30 text-white">
                                            <BellIcon className="w-5 h-5" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full border-2 border-[#252525] p-0.5">
                                            <VerifiedIcon className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white leading-tight flex items-center gap-1.5">
                                            {appName}
                                            <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded border border-blue-500/20">Official</span>
                                        </h4>
                                        <span className="text-[10px] text-gray-400 font-medium">إدارة العمليات</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-lg border border-white/5">
                                    <ClockIcon className="w-3 h-3 text-gray-500" />
                                    <span className="text-[10px] text-gray-400 font-mono pt-0.5">{formattedDate}</span>
                                </div>
                            </div>
                            
                            {/* Body */}
                            <div className="p-5">
                                {msg.image && (
                                    <div className="mb-4 rounded-xl overflow-hidden border border-gray-600/50 shadow-md bg-black/20">
                                        <img src={msg.image} alt="مرفق" className="w-full h-48 object-contain transition-transform duration-500 group-hover:scale-105" />
                                    </div>
                                )}
                                
                                <p className="text-gray-200 text-sm leading-7 whitespace-pre-wrap font-medium">
                                    {msg.text}
                                </p>
                            </div>

                            {/* Footer / Actions */}
                            <div className="px-4 py-3 bg-black/20 flex justify-between items-center border-t border-white/5">
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <CheckCircleIcon className="w-3 h-3 text-green-500" />
                                    تمت القراءة
                                </span>
                                <button 
                                    onClick={() => setMessageToDelete(msg.id)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200 text-xs font-bold group/btn"
                                >
                                    <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 -translate-x-2 group-hover/btn:translate-x-0">حذف الرسالة</span>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Confirmation Modal */}
            {messageToDelete && (
                <ConfirmationModal 
                    title="حذف الإشعار"
                    message="هل أنت متأكد من رغبتك في حذف هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء."
                    onClose={() => setMessageToDelete(null)}
                    onConfirm={confirmDelete}
                    confirmButtonText="حذف نهائي"
                    confirmVariant="danger"
                />
            )}
        </div>
    );
};

export default DriverMessagesScreen;
