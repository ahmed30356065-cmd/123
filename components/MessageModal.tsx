import React from 'react';
import { Message } from '../types';
import { XIcon } from './icons';

interface MessageModalProps {
    message: Message;
    onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm text-white" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-neutral-100">رسالة من الإدارة</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {message.image && (
                        <img 
                            src={message.image}
                            alt="مرفق"
                            className="w-full h-auto rounded-md object-contain"
                        />
                    )}
                    <p className="text-neutral-200 whitespace-pre-wrap">{message.text}</p>
                </div>
                 <div className="bg-gray-900 px-4 py-3 flex justify-end rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageModal;