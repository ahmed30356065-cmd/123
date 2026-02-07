
import React, { useState, useRef } from 'react';
import { User, AppTheme } from '../../types';
import { XIcon, LogoutIconV2, SettingsIcon, ChevronLeftIcon, UserIcon, PhoneIcon, ClockIcon, CheckCircleIcon, MoonIcon, SunIcon, CameraIcon, EyeIcon, EyeOffIcon, VerifiedIcon, CrownIcon, StarIcon, RocketIcon, UploadIcon, ShieldCheckIcon } from '../icons';
import ImageCropperModal from '../common/ImageCropperModal';

interface DriverProfileModalProps {
    driver: User;
    onClose: () => void;
    onLogout: () => void;
    onUpdateUser: (userId: string, data: Partial<User>) => void;
    onUpdateTheme?: (config: any) => void;
    currentTheme?: AppTheme;
}

const ProfileMenuItem: React.FC<{ icon: React.ReactNode, label: string, subLabel?: string, onClick?: () => void, danger?: boolean, active?: boolean, disabled?: boolean }> = ({ icon, label, subLabel, onClick, danger, active, disabled }) => (
    <button
        onClick={disabled ? undefined : onClick}
        className={`w-full flex items-center justify-between p-4 rounded-xl border border-transparent transition-all ${disabled ? 'cursor-default opacity-80' : 'active:scale-[0.98]'} ${danger ? 'bg-red-900/10 hover:bg-red-900/20 text-red-500' : 'bg-[#252525] hover:bg-[#303030] text-white hover:border-[#333]'}`}
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-full ${danger ? 'bg-red-500/10' : active ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-300'}`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 ${danger ? 'text-red-500' : ''}` })}
            </div>
            <div className="text-right">
                <p className={`font-bold text-sm ${danger ? 'text-red-400' : 'text-gray-200'}`}>{label}</p>
                {subLabel && <p className={`text-xs mt-0.5 ${active ? 'text-green-400' : 'text-gray-500'}`}>{subLabel}</p>}
            </div>
        </div>
        {!danger && !disabled && <ChevronLeftIcon className="w-5 h-5 text-gray-600" />}
        {disabled && active && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
    </button>
);

const DriverProfileModal: React.FC<DriverProfileModalProps> = ({ driver, onClose, onLogout, onUpdateUser, onUpdateTheme, currentTheme }) => {
    const [view, setView] = useState<'menu' | 'settings'>('menu');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [image, setImage] = useState<string | null>(driver.storeImage || null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cropper State
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);

    const isShiftActive = driver.dailyLogStatus === 'active';
    const isAlwaysOpen = driver.dailyLogMode === 'always_open';

    const handleSavePassword = () => {
        if (!newPassword || newPassword.length < 6) {
            setMessage({ text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'كلمتا المرور غير متطابقتين.', type: 'error' });
            return;
        }
        onUpdateUser(driver.id, { password: newPassword });
        setMessage({ text: 'تم تحديث كلمة المرور بنجاح.', type: 'success' });
        setTimeout(() => {
            setView('menu');
            setNewPassword('');
            setConfirmPassword('');
            setMessage(null);
        }, 1500);
    };

    const handleShiftAction = () => {
        // If mode is 'always_open', driver cannot change status (it's enforced by admin)
        if (driver.dailyLogMode === 'always_open') return;

        // If mode is '12_hour', toggle between active and closed
        const newStatus = driver.dailyLogStatus === 'active' ? 'closed' : 'active';
        const updates: any = { dailyLogStatus: newStatus };

        // If activating, reset the start time
        if (newStatus === 'active') {
            updates.dailyLogStartedAt = new Date();
        }

        onUpdateUser(driver.id, updates);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setIsCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsProcessing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(croppedBlob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                setImage(base64data);
                onUpdateUser(driver.id, { storeImage: base64data });
                setIsProcessing(false);
                setIsCropperOpen(false);
                setTempImage(null);
            };
        } catch (error) {
            console.error("Error processing cropped image:", error);
            setIsProcessing(false);
        }
    };

    const getFrameContainerClass = (type?: string) => {
        if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0'; // Custom Frame handles styling itself
        switch (type) {
            case 'gold': return 'p-[4px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_15px_rgba(252,246,186,0.5)]';
            case 'neon': return 'p-[4px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]';
            case 'royal': return 'p-[4px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-xl border border-purple-500/30';
            case 'fire': return 'p-[4px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]';
            default: return 'p-0';
        }
    };

    const getBadgeIcon = (type?: string) => {
        if (!type || type === 'none') return null;

        if (type?.startsWith('data:') || type?.startsWith('http')) {
            return (
                <div className="w-8 h-8 min-w-[2rem] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-sm overflow-hidden p-0.5 ml-2 backdrop-blur-sm">
                    <img src={type} className="w-full h-full object-contain drop-shadow-sm" alt="badge" />
                </div>
            );
        }

        let IconComponent = null;
        let styleClass = '';
        switch (type) {
            case 'verified': IconComponent = VerifiedIcon; styleClass = "text-blue-400 fill-blue-500/20"; break;
            case 'vip': IconComponent = CrownIcon; styleClass = "text-yellow-400 fill-yellow-500/20"; break;
            case 'star': IconComponent = StarIcon; styleClass = "text-purple-400 fill-purple-500/20"; break;
            case 'popular': IconComponent = RocketIcon; styleClass = "text-red-400 fill-red-500/20"; break;
        }

        if (IconComponent) {
            return <IconComponent className={`w-6 h-6 ml-2 ${styleClass}`} />;
        }
        return null;
    };

    const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1a1a1a] w-full sm:max-w-md h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#333] shadow-2xl flex flex-col relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-[#333]">
                    {view === 'settings' ? (
                        <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white flex items-center gap-1">
                            <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                            <span className="text-sm font-bold">رجوع</span>
                        </button>
                    ) : (
                        <h3 className="text-xl font-bold text-white">الملف الشخصي</h3>
                    )}
                    <button onClick={onClose} className="bg-[#252525] p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#333] transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {view === 'menu' ? (
                        <div className="space-y-8">
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    {/* Frame */}
                                    <div className={`relative w-24 h-24 flex items-center justify-center rounded-full ${!isCustomFrame(driver.specialFrame) ? getFrameContainerClass(driver.specialFrame) : ''}`}>
                                        {isCustomFrame(driver.specialFrame) && (
                                            <img src={driver.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-[1.7] pointer-events-none" alt="frame" />
                                        )}
                                        <div className={`${isCustomFrame(driver.specialFrame) ? 'w-[85%] h-[85%]' : 'w-24 h-24'} bg-[#252525] rounded-full flex items-center justify-center border-4 border-[#1a1a1a] shadow-xl overflow-hidden relative group z-0`}>
                                            {/* Water Ripple Effect Overlay */}
                                            {isProcessing && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
                                                    <div className="relative">
                                                        <div className="w-8 h-8 bg-blue-500 rounded-full opacity-75 animate-ping absolute top-0 left-0"></div>
                                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-blue-500/50">
                                                            <UploadIcon className="w-4 h-4 text-white animate-bounce" />
                                                        </div>
                                                        <div className="w-14 h-14 border-4 border-blue-400/30 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                                    </div>
                                                </div>
                                            )}

                                            {image ? (
                                                <img src={image} alt={driver.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-10 h-10 text-gray-500" />
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full border-4 border-[#1a1a1a] shadow-lg active:scale-95 z-20"
                                    >
                                        <CameraIcon className="w-4 h-4" />
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="absolute opacity-0 w-0 h-0 pointer-events-none" onChange={handleImageUpload} />
                                </div>
                                <div className="flex items-center gap-2 mt-3 justify-center">
                                    <h2 className="text-2xl font-bold text-white">{driver.name}</h2>
                                    {getBadgeIcon(driver.specialBadge)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-orange-500/10 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/20">مندوب توصيل</span>
                                    <span className="text-gray-500 font-mono text-xs">{driver.phone}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wider">نظام العمل</h3>

                                {isAlwaysOpen ? (
                                    <ProfileMenuItem
                                        icon={<ShieldCheckIcon />}
                                        label="النظام: مفتوح دائماً"
                                        subLabel="الحساب نشط بشكل دائم (لا يمكن إغلاقه)"
                                        onClick={() => { }}
                                        active={true}
                                        disabled={true}
                                    />
                                ) : (
                                    <ProfileMenuItem
                                        icon={<ClockIcon />}
                                        label={isShiftActive ? 'إغلاق اليومية (إنهاء الدوام)' : 'فتح اليومية (بدء العمل)'}
                                        subLabel="نظام 12 ساعة - اضغط لتغيير الحالة"
                                        onClick={handleShiftAction}
                                        active={isShiftActive}
                                        danger={isShiftActive} // Make it look like a danger action to close shift
                                    />
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wider">الإعدادات</h3>
                                <ProfileMenuItem
                                    icon={<SettingsIcon />}
                                    label="تغيير كلمة المرور"
                                    onClick={() => setView('settings')}
                                />
                                <ProfileMenuItem
                                    icon={<LogoutIconV2 />}
                                    label="تسجيل الخروج"
                                    danger
                                    onClick={() => { onClose(); onLogout(); }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                    <SettingsIcon className="w-8 h-8 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">تغيير كلمة المرور</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">كلمة المرور الجديدة</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[#252525] border border-[#333] rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                            placeholder="******"
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-4 text-gray-500 hover:text-white">
                                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">تأكيد كلمة المرور</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-[#252525] border border-[#333] rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                        placeholder="******"
                                    />
                                </div>
                            </div>
                            {message && <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</div>}
                            <button onClick={handleSavePassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4">حفظ التغييرات</button>
                        </div>
                    )}
                </div>
            </div>
            {isCropperOpen && tempImage && (
                <ImageCropperModal
                    imageSrc={tempImage}
                    onCropComplete={handleCropComplete}
                    onClose={() => { setIsCropperOpen(false); setTempImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    aspectRatio={1}
                />
            )}
        </div>
    );
};

export default DriverProfileModal;
