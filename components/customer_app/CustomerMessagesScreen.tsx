
import React, { useEffect, useState, useRef } from 'react';
import { Message, AppTheme } from '../../types';
import { MessageSquareIcon, ClockIcon, TrashIcon, BellIcon } from '../icons';
import ConfirmationModal from '../admin/ConfirmationModal';

interface CustomerMessagesScreenProps {
    messages: Message[];
    onMarkAsSeen: (id: string) => void;
    hideMessage: (id: string) => void;
    appTheme?: AppTheme;
}

const CustomerMessagesScreen: React.FC<CustomerMessagesScreenProps> = ({ messages, onMarkAsSeen, hideMessage, appTheme }) => {
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    
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

    // Theme Logic
    const isDarkMode = appTheme?.customer?.mode !== 'light';
    const themeColors = {
        bg: isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50',
        text: isDarkMode ? 'text-white' : 'text-gray-900',
        subText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        card: isDarkMode ? 'bg-[#1e293b]' : 'bg-white',
        border: isDarkMode ? 'border-white/5' : 'border-gray-200',
        headerBg: isDarkMode ? 'bg-[#0f172a]/95' : 'bg-white/95',
        footerBg: isDarkMode ? 'bg-[#181818]' : 'bg-gray-50',
        footerBorder: isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-200',
    };

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
        <div className={`h-[100dvh] ${themeColors.bg} flex flex-col animate-fadeIn overflow-hidden relative`}>
            
            {/* Dynamic Sticky Header */}
            <div 
                className={`absolute top-0 left-0 right-0 z-40 pt-safe px-4 pb-4 flex items-center justify-between transition-all duration-300 pointer-events-none border-b box-content h-14 ${headerOpacity > 0.5 ? themeColors.border : 'border-transparent'}`}
                style={{ 
                    backgroundColor: isDarkMode ? `rgba(15, 23, 42, ${headerOpacity})` : `rgba(255, 255, 255, ${headerOpacity})`,
                    backdropFilter: headerOpacity > 0.5 ? 'blur(12px)' : 'none',
                    boxShadow: headerOpacity > 0.5 ? '0 4px 30px rgba(0,0,0,0.1)' : 'none'
                }}
            >
                <div className="flex items-center gap-3 mt-2 pointer-events-auto">
                    <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-lg shadow-red-900/30">
                        <MessageSquareIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className={`text-xl font-black ${themeColors.text} leading-none`}>مركز الرسائل</h1>
                        <p className={`text-xs ${themeColors.subText} font-medium mt-1`}>تنبيهات وتحديثات من الإدارة</p>
                    </div>
                </div>
            </div>

            <div 
                ref={scrollContainerRef} 
                className={`flex-1 overflow-y-auto p-4 space-y-5 pb-24 pt-24 ${themeColors.bg} overscroll-none`}
                onScroll={(e) => {
                    const opacity = Math.min(e.currentTarget.scrollTop / 60, 0.95);
                    setHeaderOpacity(opacity);
                }}
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 h-[70vh]">
                        <div className={`w-24 h-24 ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'} rounded-full flex items-center justify-center mb-6 border ${isDarkMode ? 'border-[#333]' : 'border-gray-200'} shadow-xl`}>
                            <BellIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className={`text-xl font-bold ${themeColors.text} mb-2`}>لا توجد رسائل جديدة</h3>
                        <p className={`text-sm ${themeColors.subText} max-w-xs leading-relaxed`}>
                            سنقوم بإعلامك هنا عند وجود تحديثات هامة أو عروض خاصة لك.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const formattedDate = new Date(msg.createdAt).toLocaleDateString('ar-EG-u-nu-latn', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        });

                        return (
                            <div key={msg.id} className="flex flex-col gap-2">
                                {/* Date Separator-like appearance */}
                                <div className="self-center">
                                    <span className={`text-[10px] ${themeColors.subText} ${isDarkMode ? 'bg-[#1E1E1E] border-[#333]' : 'bg-gray-200 border-gray-300'} px-2 py-0.5 rounded-full border`}>{formattedDate}</span>
                                </div>

                                <div className={`${themeColors.card} rounded-2xl rounded-tr-sm border ${themeColors.border} shadow-lg overflow-hidden relative group`}>
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                                                <BellIcon className="w-3 h-3 text-white" />
                                            </div>
                                            <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>إشعار من التطبيق</span>
                                        </div>

                                        {msg.image && (
                                            <div className={`mb-4 rounded-xl overflow-hidden border ${isDarkMode ? 'border-[#444]' : 'border-gray-200'} shadow-inner`}>
                                                <img src={msg.image} alt="مرفق" className="w-full h-auto" />
                                            </div>
                                        )}
                                        
                                        <p className={`${themeColors.text} text-sm leading-relaxed whitespace-pre-wrap font-medium`}>
                                            {msg.text}
                                        </p>
                                    </div>

                                    <div className={`${themeColors.footerBg} p-2 flex justify-between items-center border-t ${themeColors.footerBorder}`}>
                                        <span className={`text-[10px] ${themeColors.subText} px-2`}>تمت المشاهدة</span>
                                        <button 
                                            onClick={() => setMessageToDelete(msg.id)}
                                            className={`p-2 text-gray-500 hover:text-red-500 ${isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-100'} rounded-full transition-all`}
                                            title="حذف"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Confirmation Modal */}
            {messageToDelete && (
                <ConfirmationModal 
                    title="حذف الرسالة"
                    message="هل أنت متأكد من حذف هذه الرسالة؟"
                    onClose={() => setMessageToDelete(null)}
                    onConfirm={confirmDelete}
                    confirmButtonText="حذف"
                    confirmVariant="danger"
                />
            )}
        </div>
    );
};

export default CustomerMessagesScreen;
