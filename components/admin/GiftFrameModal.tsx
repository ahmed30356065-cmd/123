
import React, { useState } from 'react';
import { FRAMES } from '../common/AvatarFrame'; // Import detailed definition
import AvatarFrame from '../common/AvatarFrame';
import { CheckCircleIcon, XIcon, TrashIcon } from '../icons';
import { User } from '../../types';

interface GiftFrameModalProps {
    user: User;
    onClose: () => void;
    onSave: (userId: string, frameId: string | undefined) => void;
}

const GiftFrameModal: React.FC<GiftFrameModalProps> = ({ user, onClose, onSave }) => {
    const [selectedFrame, setSelectedFrame] = useState<string | undefined>(user.specialFrame);

    const handleSave = () => {
        onSave(user.id, selectedFrame);
        onClose();
    };

    const handleRemove = () => {
        onSave(user.id, undefined); // Or null/empty string depending on backend
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">إهداء إطار مميز</h2>
                        <p className="text-gray-400 text-sm mt-1">تخصيص مظهر المستخدم: <span className="text-white font-bold">{user.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {/* Option: No Frame */}
                        <button
                            onClick={() => setSelectedFrame(undefined)}
                            className={`relative group rounded-2xl p-4 border transition-all duration-300 flex flex-col items-center gap-3 ${selectedFrame === undefined ? 'bg-red-500/10 border-red-500' : 'bg-gray-900 border-gray-700 hover:border-gray-600'}`}
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                                <span className="text-xs text-gray-400">لا يوجد</span>
                            </div>
                            <span className={`text-sm font-bold ${selectedFrame === undefined ? 'text-red-400' : 'text-gray-400'}`}>افتراضي</span>
                            {selectedFrame === undefined && (
                                <div className="absolute top-2 right-2 bg-red-500 rounded-full p-0.5">
                                    <CheckCircleIcon className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </button>

                        {/* Available Frames */}
                        {Object.entries(FRAMES).map(([id, config]) => {
                            const isSelected = selectedFrame === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setSelectedFrame(id)}
                                    className={`relative group rounded-2xl p-4 border transition-all duration-300 flex flex-col items-center gap-3 ${isSelected ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}
                                >
                                    <AvatarFrame frameId={id} size="md" className={isSelected ? 'scale-110 transition-transform' : ''}>
                                        <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-300">
                                            {user.name.charAt(0)}
                                        </div>
                                    </AvatarFrame>
                                    <span className={`text-sm font-bold ${isSelected ? 'text-red-400' : 'text-gray-400'}`}>{config.name}</span>

                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-0.5 shadow-lg">
                                            <CheckCircleIcon className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-700/50 flex gap-3 bg-gray-800/50 rounded-b-3xl">
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        حفظ التغييرات
                    </button>
                    {user.specialFrame && (
                        <button
                            onClick={handleRemove}
                            className="px-4 bg-gray-700 hover:bg-red-900/40 text-gray-300 hover:text-red-400 border border-gray-600 hover:border-red-500/50 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <TrashIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">إزالة الإطار</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GiftFrameModal;
