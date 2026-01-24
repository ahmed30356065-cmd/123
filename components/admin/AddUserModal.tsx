
import React, { useState, useRef, useMemo } from 'react';
import { Role, SupervisorPermission } from '../../types';
import { ChevronLeftIcon, CameraIcon, UploadIcon, MapPinIcon, SettingsIcon, StoreIcon, GridIcon, ClockIcon, UtensilsIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface AddUserModalProps {
    onClose: () => void;
    onSave: (newUser: { name: string; phone: string; password?: string; role: Role; commissionRate?: number; commissionType?: 'percentage' | 'fixed'; permissions?: SupervisorPermission[], dailyLogMode?: '12_hour' | 'always_open', storeImage?: string, address?: string, maxConcurrentOrders?: number, storeCategory?: string, canShowDeliveryTime?: boolean, canManageMenu?: boolean }) => Promise<void> | void;
    initialRole: Role;
    appName?: string;
    currentUserRole?: Role; // New Prop to check permissions
    currentUserPermissions?: SupervisorPermission[];
}

const MERCHANT_CATEGORIES = [
    { id: 'restaurant', label: 'مطعم' },
    { id: 'market', label: 'سوبر ماركت' },
    { id: 'pharmacy', label: 'صيدلية' },
    { id: 'bakery', label: 'مخبز/حلواني' },
    { id: 'electronics', label: 'إلكترونيات' },
    { id: 'fashion', label: 'ملابس' },
    { id: 'logistics', label: 'خدمات شحن' },
    { id: 'other', label: 'أخرى' },
];

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSave, initialRole, appName, currentUserRole, currentUserPermissions }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<Role>(initialRole);

    // Driver Specific
    const [commissionRate, setCommissionRate] = useState<number>(25); // Default to 25%
    const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
    const [dailyLogMode, setDailyLogMode] = useState<'12_hour' | 'always_open'>('always_open'); // Default set to always_open as requested
    const [isLimitUnlimited, setIsLimitUnlimited] = useState(true);
    const [maxOrders, setMaxOrders] = useState<number>(1);

    // Merchant Specific
    const [storeCategory, setStoreCategory] = useState<string>('restaurant');
    const [canShowDeliveryTime, setCanShowDeliveryTime] = useState(false);
    const [canManageMenu, setCanManageMenu] = useState(true);

    // Supervisor Specific
    const [permissions, setPermissions] = useState<SupervisorPermission[]>([]);

    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [isImageProcessing, setIsImageProcessing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayedAppName = appName || 'GOO NOW';

    // Hook for back button
    useAndroidBack(() => {
        onClose();
        return true;
    }, [onClose]);

    const commonInputStyle = "w-full px-4 py-3 bg-[#252525] border border-[#333] text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors";

    const permissionOptions: { id: SupervisorPermission, label: string }[] = [
        { id: 'view_orders', label: 'عرض الطلبات' },
        { id: 'manage_orders', label: 'إدارة الطلبات' },
        { id: 'view_reports', label: 'عرض التقارير' },
        { id: 'view_users', label: 'عرض المستخدمين' },
        { id: 'manage_users', label: 'إدارة المستخدمين' },
        { id: 'view_wallet', label: 'عرض المحفظة' },
        { id: 'manage_supervisors', label: 'إدارة المشرفين' },
    ];

    const handlePermissionChange = (permission: SupervisorPermission) => {
        setPermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        );
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsImageProcessing(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // High Quality Profile Pic
                    const MAX_WIDTH = 1024;
                    const scaleSize = MAX_WIDTH / img.width;

                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        // Simulate water effect delay slightly
                        setTimeout(() => {
                            setImage(canvas.toDataURL('image/jpeg', 0.9));
                            setIsImageProcessing(false);
                        }, 800);
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!name || !phone || !password || !role) {
            setError('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }

        if (!/^\d{11}$/.test(phone)) {
            setError('رقم الهاتف يجب أن يتكون من 11 رقم.');
            return;
        }

        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.');
            return;
        }

        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        setError('');

        const newUser: any = {
            name,
            phone,
            password,
            role,
            storeImage: image || undefined,
            address: (role !== 'driver' && address) ? address : undefined
        };

        if (role === 'driver') {
            newUser.commissionRate = commissionRate;
            newUser.commissionType = commissionType;
            newUser.dailyLogMode = dailyLogMode;
            newUser.maxConcurrentOrders = isLimitUnlimited ? undefined : maxOrders;
        }
        if (role === 'merchant') {
            newUser.storeCategory = storeCategory;
            newUser.canShowDeliveryTime = canShowDeliveryTime;
            newUser.canManageMenu = canManageMenu;
        }
        if (role === 'supervisor') {
            newUser.permissions = permissions;
        }

        setIsSaving(true);
        try {
            await onSave(newUser);
            onClose(); // Close immediately on success
        } catch (e) {
            setIsSaving(false);
        }
    };

    // Filter Roles: Supervisors cannot create Admins or other Supervisors
    const availableRoles: { id: Role; label: string; }[] = useMemo(() => {
        const allRoles: { id: Role; label: string; }[] = [
            { id: 'driver', label: 'مندوب' },
            { id: 'merchant', label: 'تاجر' },
            { id: 'customer', label: 'عميل' },
            { id: 'supervisor', label: 'مشرف' },
            { id: 'admin', label: 'مدير' },
        ];

        if (currentUserRole === 'supervisor') {
            const hasPerm = currentUserPermissions?.includes('manage_supervisors');
            return allRoles.filter(r => r.id !== 'admin' && (hasPerm || r.id !== 'supervisor'));
        }
        return allRoles;
    }, [currentUserRole, currentUserPermissions]);


    return (
        <div className="fixed inset-0 bg-[#111] z-[60] overflow-y-auto animate-fadeIn flex flex-col">

            {/* Header - Updated */}
            <div className="flex-none bg-[#1a1a1a] border-b border-[#333] px-4 pt-safe h-16 box-content flex items-center justify-between sticky top-0 z-20 shadow-lg">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="bg-[#252525] p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ChevronLeftIcon className="w-6 h-6 rotate-180" />
                    </button>
                    <h2 className="text-xl font-bold text-white">إضافة مستخدم جديد</h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>

            <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-8 pb-20">

                {/* Image Section */}
                <div className="flex flex-col items-center">
                    <div
                        onClick={() => !isImageProcessing && fileInputRef.current?.click()}
                        className="relative cursor-pointer border-2 border-dashed border-gray-600 hover:border-red-500 transition-colors bg-[#252525] w-32 h-32 rounded-full flex items-center justify-center overflow-hidden group shadow-xl"
                    >
                        {/* Water Ripple Effect Overlay */}
                        {isImageProcessing && (
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

                        {image ? (
                            <img src={image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <CameraIcon className="w-10 h-10 mb-1" />
                                <span className="text-xs">صورة</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <UploadIcon className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">اضغط لإضافة صورة شخصية أو شعار</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Basic Info */}
                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4 shadow-sm h-fit">
                        <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-2 flex items-center gap-2">
                            <span className="w-1 h-5 bg-red-500 rounded-full"></span>
                            البيانات الأساسية
                        </h3>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">الدور (Role)</label>
                            <div className="flex flex-wrap gap-2">
                                {availableRoles.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id)}
                                        className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${role === r.id ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">الاسم الكامل</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={commonInputStyle} placeholder={role === 'merchant' ? 'اسم المتجر' : 'مثال: أحمد محمد'} />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">رقم الهاتف</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${commonInputStyle} text-right placeholder:text-right`} placeholder="01xxxxxxxxx" dir="rtl" />
                        </div>

                        {role !== 'driver' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">العنوان</label>
                                <div className="relative">
                                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={`${commonInputStyle} pl-10`} placeholder="العنوان بالتفصيل" />
                                    <MapPinIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                </div>
                            </div>
                        )}

                        {role === 'merchant' && (
                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">فئة المتجر</label>
                                    <div className="relative">
                                        <select
                                            value={storeCategory}
                                            onChange={(e) => setStoreCategory(e.target.value)}
                                            className={`${commonInputStyle} appearance-none`}
                                        >
                                            {MERCHANT_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <GridIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Merchant Permissions */}
                                <div className="bg-[#252525] p-3 rounded-xl border border-[#333] space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={canManageMenu}
                                            onChange={e => setCanManageMenu(e.target.checked)}
                                            className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="flex items-center gap-2 text-sm text-gray-200">
                                            <UtensilsIcon className="w-4 h-4 text-orange-400" />
                                            السماح بإدارة المنيو
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={canShowDeliveryTime}
                                            onChange={e => setCanShowDeliveryTime(e.target.checked)}
                                            className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="flex items-center gap-2 text-sm text-gray-200">
                                            <ClockIcon className="w-4 h-4 text-blue-400" />
                                            عرض وقت التوصيل في السجل
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Login Info */}
                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4 shadow-sm h-fit">
                        <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-2 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                            بيانات الدخول
                        </h3>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">كلمة المرور</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={commonInputStyle} placeholder="******" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">تأكيد كلمة المرور</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={commonInputStyle} placeholder="******" />
                        </div>
                    </div>

                    {/* Role Specific Settings */}
                    {role === 'driver' && (
                        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-6 shadow-sm md:col-span-2">
                            <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-2 flex items-center gap-2">
                                <SettingsIcon className="w-5 h-5 text-orange-500" />
                                إعدادات المندوب
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Daily Log Mode */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">نظام اليومية</label>
                                    <div className="flex bg-[#252525] p-1 rounded-xl border border-[#333]">
                                        {[
                                            { value: '12_hour', label: 'كل 12 ساعة' },
                                            { value: 'always_open', label: 'مفتوح دائماً' },
                                        ].map((mode) => (
                                            <button
                                                key={mode.value}
                                                type="button"
                                                onClick={() => setDailyLogMode(mode.value as '12_hour' | 'always_open')}
                                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${dailyLogMode === mode.value ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Limit */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">عدد الطلبات المسموح بها (قيد التوصيل)</label>
                                    <div className="bg-[#252525] p-4 rounded-xl border border-[#333]">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-white font-medium">عدد غير محدود</span>
                                            <button
                                                onClick={() => setIsLimitUnlimited(!isLimitUnlimited)}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isLimitUnlimited ? 'bg-green-600' : 'bg-gray-600'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isLimitUnlimited ? 'translate-x-0' : '-translate-x-6'}`}></div>
                                            </button>
                                        </div>
                                        <div className={`overflow-hidden transition-all duration-300 ${isLimitUnlimited ? 'max-h-0 opacity-50' : 'max-h-20 opacity-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={maxOrders}
                                                    onChange={(e) => setMaxOrders(parseInt(e.target.value))}
                                                    className="flex-1 accent-orange-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                                    disabled={isLimitUnlimited}
                                                />
                                                <div className="bg-black/30 px-3 py-1 rounded-lg border border-[#444] min-w-[3rem] text-center font-bold text-white">
                                                    {maxOrders}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2">لن يستقبل المندوب طلبات جديدة إذا وصل للحد الأقصى.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Commission */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-400 mb-2">نسبة عمولة {displayedAppName}</label>
                                    <div className="bg-[#252525] p-4 rounded-xl border border-[#333] space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">نسبة مئوية</p>
                                            <div className="flex gap-2">
                                                {[0, 25, 50].map((rate) => (
                                                    <button
                                                        key={`perc-${rate}`}
                                                        type="button"
                                                        onClick={() => { setCommissionType('percentage'); setCommissionRate(rate); }}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all ${commissionType === 'percentage' && commissionRate === rate ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'
                                                            }`}
                                                    >
                                                        {rate}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">مبلغ ثابت (ج.م)</p>
                                            <div className="flex gap-2">
                                                {[5, 10, 15, 20].map((rate) => (
                                                    <button
                                                        key={`fixed-${rate}`}
                                                        type="button"
                                                        onClick={() => { setCommissionType('fixed'); setCommissionRate(rate); }}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all ${commissionType === 'fixed' && commissionRate === rate ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'
                                                            }`}
                                                    >
                                                        {rate}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {role === 'supervisor' && (
                        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4 shadow-sm md:col-span-2">
                            <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-2">صلاحيات المشرف</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {permissionOptions.map(opt => (
                                    <label key={opt.id} className="flex items-center space-x-3 space-x-reverse p-4 bg-[#252525] rounded-xl cursor-pointer hover:bg-[#303030] transition-colors border border-transparent hover:border-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={permissions.includes(opt.id)}
                                            onChange={() => handlePermissionChange(opt.id)}
                                            className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 accent-red-600"
                                        />
                                        <span className="text-sm font-bold text-gray-200">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-xl text-center font-bold">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};
export default AddUserModal;
