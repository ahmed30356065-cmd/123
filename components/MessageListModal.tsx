
import React from 'react';
import { Message } from '../types';
import { XIcon, MessageSquareIcon, ClockIcon } from './icons';

interface MessageListModalProps {
    messages: Message[];
    onClose: () => void;
    role: 'driver' | 'merchant';
}

const MessageListModal: React.FC<MessageListModalProps> = ({ messages, onClose, role }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md text-white flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-900/50 rounded-t-xl">
                    <div className="flex items-center text-neutral-100">
                        <MessageSquareIcon className="w-6 h-6 ml-2 text-red-500" />
                        <h3 className="text-lg font-bold">صندوق الرسائل</h3>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors p-1 bg-gray-700 rounded-full">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto space-y-4 flex-1">
                    {messages.length === 0 ? (
                        <div className="text-center py-10 flex flex-col items-center justify-center text-gray-500">
                            <MessageSquareIcon className="w-12 h-12 mb-3 opacity-30" />
                            <p>لا توجد رسائل في الأرشيف.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const formattedDate = (() => {
                                try {
                                    const d = new Date(msg.createdAt);
                                    if(isNaN(d.getTime())) return '';
                                    return d.toLocaleString('ar-EG', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                                } catch(e) { return ''; }
                            })();

                            return (
                                <div key={msg.id} className="bg-[#2A2A2A] p-4 rounded-lg border border-gray-700 shadow-sm hover:border-gray-600 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-red-400/80 bg-red-900/20 px-2 py-0.5 rounded">{role === 'driver' ? 'الإدارة' : 'الإدارة'}</span>
                                        <div className="text-xs text-gray-500 flex items-center">
                                            <ClockIcon className="w-3 h-3 ml-1" />
                                            {formattedDate}
                                        </div>
                                    </div>
                                    
                                    {msg.image && (
                                        <div className="mb-3 rounded-lg overflow-hidden border border-gray-700">
                                            <img src={msg.image} alt="مرفق" className="w-full h-48 object-cover" />
                                        </div>
                                    )}
                                    
                                    <p className="text-neutral-200 text-sm whitespace-pre-wrap leading-relaxed">
                                        {msg.text}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-900/50 border-t border-gray-700 rounded-b-xl flex justify-center">
                    <span className="text-xs text-gray-500">
                        {messages.length} {messages.length === 1 ? 'رسالة' : 'رسائل'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MessageListModal;
