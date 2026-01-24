
import React, { useState } from 'react';
import { User } from '../types';
import { XIcon, LogoutIconV2, SettingsIcon, ChevronLeftIcon, UserIcon, PhoneIcon } from './icons';

interface MerchantProfileModalProps {
    merchant: User;
    onClose: () => void;
    onLogout: () => void;
    onUpdateUser: (userId: string, data: Partial<User>) => void;
}

type View = 'menu' | 'settings';

const MerchantProfileModal: React.FC<MerchantProfileModalProps> = ({ merchant, onClose, onLogout, onUpdateUser }) => {
    const [view, setView] = useState<View>('menu');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleSavePassword = () => {
        if (!newPassword || newPassword.length < 6) {
            setMessage({ text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'كلمتا المرور غير متطابقتين.', type: 'error' });
            return;
        }

        // Update user password immediately in the database/state
        onUpdateUser(merchant.id, { password: newPassword });
        
        setMessage({ text: 'تم تحديث كلمة المرور بنجاح.', type: 'success' });
        
        // Reset fields and return to menu after a short delay
        setTimeout(() => {
            setView('menu');
            setNewPassword('');
            setConfirmPassword('');
            setMessage(null);
        }, 1500);
    };

    const handleLogoutClick = () => {
        // Close the profile modal first
        onClose();
        // Then trigger the logout confirmation in the main app
        setTimeout(() => {
            onLogout();
        }, 100);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-sm text-white overflow-hidden border border-gray-700" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#222]">
                    <div className="flex items-center">
                        {view === 'settings' && (
                            <button onClick={() => { setView('menu'); setMessage(null); }} className="ml-2 text-gray-400 hover:text-white">
                                <ChevronLeftIcon className="w-6 h-6 rotate-180" />
                            </button>
                        )}
                        <h3 className="text-lg font-bold">
                            {view === 'menu' ? 'الملف الشخصي' : 'الإعدادات'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 bg-gray-700/50 rounded-full">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {view === 'menu' ? (
                        <div className="space-y-6">
                            {/* User Info Card */}
                            <div className="flex items-center space-x-4 space-x-reverse bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <div className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border border-gray-600">
                                    {merchant.storeImage ? (
                                        <img src={merchant.storeImage} alt={merchant.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">{merchant.name}</p>
                                    <div className="flex items-center text-sm text-gray-400 mt-1">
                                        <PhoneIcon className="w-3 h-3 ml-1" />
                                        <span className="font-mono">{merchant.phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Actions */}
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setView('settings')}
                                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 group"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-blue-500/10 rounded-lg ml-3">
                                            <SettingsIcon className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <span className="font-medium text-gray-200 group-hover:text-white">تغيير كلمة المرور</span>
                                    </div>
                                    <ChevronLeftIcon className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                                </button>

                                <button 
                                    onClick={handleLogoutClick}
                                    className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30 group"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-500/20 rounded-lg ml-3">
                                            <LogoutIconV2 className="w-6 h-6 text-red-500" />
                                        </div>
                                        <span className="font-medium text-red-400 group-hover:text-red-300">تسجيل الخروج</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Settings View (Change Password) */
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400 mb-4">قم بإدخال كلمة المرور الجديدة أدناه لحفظها في حسابك.</p>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور الجديدة</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none placeholder-gray-500"
                                    placeholder="أدخل كلمة المرور"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">تأكيد كلمة المرور</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none placeholder-gray-500"
                                    placeholder="أعد إدخال كلمة المرور"
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm font-medium text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button 
                                onClick={handleSavePassword}
                                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
                            >
                                حفظ التغييرات
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MerchantProfileModal;
