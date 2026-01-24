
import React, { useState, useRef } from 'react';
import { User, AppTheme } from '../../types';
import { LogoutIconV2, SettingsIcon, UserIcon, PhoneIcon, ChevronLeftIcon, BuildingStorefrontIcon, ClockIcon, CameraIcon, MoonIcon, SunIcon, EyeIcon, EyeOffIcon, CheckCircleIcon, VerifiedIcon, CrownIcon, StarIcon, RocketIcon, UploadIcon, TruckIconV2 } from '../icons';
import ConfirmationModal from '../admin/ConfirmationModal';
import { sendExternalNotification } from '../../services/firebase';

interface MerchantProfileScreenProps {
    merchant: User;
    onLogout: () => void;
    onUpdateUser: (userId: string, data: Partial<User>) => void;
    onUpdateTheme?: (config: any) => void;
    currentTheme?: AppTheme;
}

const ProfileMenuItem: React.FC<{ icon: React.ReactNode, label: string, subLabel?: string, onClick?: () => void, danger?: boolean, active?: boolean }> = ({ icon, label, subLabel, onClick, danger, active }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 rounded-xl border border-transparent transition-all active:scale-[0.98] ${danger ? 'bg-red-900/10 hover:bg-red-900/20 text-red-500' : 'bg-[#252525] hover:bg-[#303030] text-white hover:border-[#333]'}`}
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
        {!danger && <ChevronLeftIcon className="w-5 h-5 text-gray-600" />}
    </button>
);

const MerchantProfileScreen: React.FC<MerchantProfileScreenProps> = ({ merchant, onLogout, onUpdateUser, onUpdateTheme, currentTheme }) => {
    const [view, setView] = useState<'menu' | 'settings' | 'hours'>('menu');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [openTime, setOpenTime] = useState(merchant.workingHours?.start || '09:00');
    const [closeTime, setCloseTime] = useState(merchant.workingHours?.end || '23:00');
    const [image, setImage] = useState<string | null>(merchant.storeImage || null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // State for Free Delivery Confirmation
    const [showFreeDeliveryConfirm, setShowFreeDeliveryConfirm] = useState(false);

    const handleSavePassword = () => {
        if (!newPassword || newPassword.length < 6) {
            setMessage({ text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'كلمتا المرور غير متطابقتين.', type: 'error' });
            return;
        }
        onUpdateUser(merchant.id, { password: newPassword });
        setMessage({ text: 'تم تحديث كلمة المرور بنجاح.', type: 'success' });
        setTimeout(() => {
            setView('menu');
            setNewPassword('');
            setConfirmPassword('');
            setMessage(null);
        }, 1500);
    };

    const handleSaveHours = () => {
        onUpdateUser(merchant.id, { workingHours: { start: openTime, end: closeTime } });
        setMessage({ text: 'تم تحديث ساعات العمل بنجاح.', type: 'success' });
        setTimeout(() => { setView('menu'); setMessage(null); }, 1500);
    };

    const handleToggleFreeDeliveryClick = () => {
        if (!merchant.hasFreeDelivery) {
            // If activating, show confirmation modal
            setShowFreeDeliveryConfirm(true);
        } else {
            // If deactivating, do it immediately
            onUpdateUser(merchant.id, { hasFreeDelivery: false });
        }
    };

    const confirmActivateFreeDelivery = () => {
        onUpdateUser(merchant.id, { hasFreeDelivery: true });

        // Notify Admin
        sendExternalNotification('admin', {
            title: "🔔 تفعيل خدمة توصيل مجاني",
            body: `قام التاجر "${merchant.name}" بتفعيل خدمة التوصيل المجاني. يرجى المراجعة والترتيب.`,
            url: '/?target=stores',
            targetId: 'all' // Sends to generic admin topic
        });

        setShowFreeDeliveryConfirm(false);
    };

    // New High Quality Processor
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200; // Better for store profile/cover
                    const scaleSize = MAX_WIDTH / img.width;

                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        const result = canvas.toDataURL('image/jpeg', 0.9);
                        setTimeout(() => {
                            setImage(result);
                            onUpdateUser(merchant.id, { storeImage: result });
                            setIsProcessing(false);
                        }, 800);
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const getFrameContainerClass = (type?: string) => {
        if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0';
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
            // Professional Container for Custom Images
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
        <div className="pb-24 animate-fadeIn">
            <div className="flex items-center gap-4 py-4 mb-2">
                {view !== 'menu' ? (
                    <button onClick={() => setView('menu')} className="bg-[#252525] p-2 rounded-full text-gray-400 hover:text-white"><ChevronLeftIcon className="w-6 h-6 rotate-180" /></button>
                ) : <div className="w-10"></div>}
                <h2 className="text-2xl font-bold text-white flex-1 text-center">
                    {view === 'menu' ? 'الملف الشخصي' : view === 'settings' ? 'الإعدادات' : 'ساعات العمل'}
                </h2>
                <div className="w-10"></div>
            </div>

            {view === 'menu' && (
                <div className="space-y-8">
                    <div className="flex flex-col items-center">
                        <div className={`relative w-full aspect-video max-h-48 rounded-2xl overflow-hidden bg-[#252525] border-2 border-[#333] shadow-lg group ${!isCustomFrame(merchant.specialFrame) ? getFrameContainerClass(merchant.specialFrame) : ''}`}>
                            {isCustomFrame(merchant.specialFrame) && (
                                <img src={merchant.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain pointer-events-none border-4 border-transparent" alt="frame" />
                            )}
                            <div className={`${isCustomFrame(merchant.specialFrame) ? 'w-[92%] h-[92%] m-auto' : 'w-full h-full'} overflow-hidden rounded-xl relative z-0 flex items-center justify-center`}>
                                {/* Water Ripple Effect Overlay */}
                                {isProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-blue-500 rounded-full opacity-75 animate-ping absolute top-0 left-0"></div>
                                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-blue-500/50">
                                                <UploadIcon className="w-6 h-6 text-white animate-bounce" />
                                            </div>
                                            <div className="w-20 h-20 border-4 border-blue-400/30 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                        </div>
                                    </div>
                                )}

                                {image ? <img src={image} alt={merchant.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><BuildingStorefrontIcon className="w-12 h-12" /></div>}
                                <button onClick={() => !isProcessing && fileInputRef.current?.click()} className="absolute bottom-3 left-3 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95 z-20"><CameraIcon className="w-4 h-4" />تغيير الغلاف</button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="absolute opacity-0 w-0 h-0 pointer-events-none" onChange={handleImageUpload} />
                            </div>
                        </div>
                        <div className="mt-4 text-center flex items-center gap-2 justify-center">
                            <h3 className="text-2xl font-bold text-white">{merchant.name}</h3>
                            {getBadgeIcon(merchant.specialBadge)}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wider">الترويج</h3>
                        <ProfileMenuItem
                            icon={<TruckIconV2 />}
                            label="خدمة التوصيل المجاني"
                            subLabel={merchant.hasFreeDelivery ? 'مفعلة حالياً للعملاء' : 'غير مفعلة (اضغط للتفعيل)'}
                            onClick={handleToggleFreeDeliveryClick}
                            active={merchant.hasFreeDelivery}
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wider">إعدادات المتجر</h3>
                        <ProfileMenuItem icon={<ClockIcon />} label="مواعيد العمل" subLabel={merchant.workingHours ? `${merchant.workingHours.start} - ${merchant.workingHours.end}` : 'غير محدد'} onClick={() => setView('hours')} />
                        <ProfileMenuItem icon={<SettingsIcon />} label="تغيير كلمة المرور" onClick={() => setView('settings')} />
                        <ProfileMenuItem icon={<LogoutIconV2 />} label="تسجيل الخروج" danger onClick={() => setShowLogoutConfirm(true)} />
                    </div>
                </div>
            )}

            {view === 'hours' && (
                <div className="bg-[#252525] p-6 rounded-2xl border border-[#333] space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-gray-400 mb-2 text-center">يفتح في</label><input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="w-full px-2 py-4 bg-[#1a1a1a] border border-[#333] rounded-xl text-white text-center font-mono text-lg outline-none" /></div>
                        <div><label className="block text-xs font-bold text-gray-400 mb-2 text-center">يغلق في</label><input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="w-full px-2 py-4 bg-[#1a1a1a] border border-[#333] rounded-xl text-white text-center font-mono text-lg outline-none" /></div>
                    </div>
                    {message && <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</div>}
                    <button onClick={handleSaveHours} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">حفظ المواعيد</button>
                </div>
            )}

            {view === 'settings' && (
                <div className="bg-[#252525] p-6 rounded-2xl border border-[#333] space-y-6 animate-fadeIn">
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-400 mb-2 mr-1">كلمة المرور الجديدة</label><div className="relative"><input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-white outline-none" placeholder="******" /><button onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-4 text-gray-500">{showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button></div></div>
                        <div><label className="block text-xs font-bold text-gray-400 mb-2 mr-1">تأكيد كلمة المرور</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-white outline-none" placeholder="******" /></div>
                    </div>
                    {message && <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</div>}
                    <button onClick={handleSavePassword} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">حفظ التغييرات</button>
                </div>
            )}

            {showLogoutConfirm && (
                <ConfirmationModal
                    title="تسجيل الخروج"
                    message="هل أنت متأكد أنك تريد تسجيل الخروج؟"
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={() => { setShowLogoutConfirm(false); onLogout(); }}
                    confirmButtonText="نعم، خروج"
                    cancelButtonText="تراجع"
                    confirmVariant="danger"
                />
            )}

            {showFreeDeliveryConfirm && (
                <ConfirmationModal
                    title="تفعيل التوصيل المجاني"
                    message="هل أنت متأكد من رغبتك في تفعيل خدمة التوصيل المجاني لعملائك؟ سيتم إخطار الإدارة فور التأكيد للتواصل معك وترتيب التفاصيل."
                    onClose={() => setShowFreeDeliveryConfirm(false)}
                    onConfirm={confirmActivateFreeDelivery}
                    confirmButtonText="تأكيد التفعيل"
                    cancelButtonText="إلغاء"
                    confirmVariant="success"
                />
            )}
        </div>
    );
};

export default MerchantProfileScreen;
