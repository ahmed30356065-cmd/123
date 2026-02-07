
import React, { useState, useRef, useMemo } from 'react';
import { User, SupervisorPermission, Role } from '../../types';
import { ChevronLeftIcon, CameraIcon, UploadIcon, EyeIcon, EyeOffIcon, MapPinIcon, SettingsIcon, TruckIconV2, GridIcon, ShieldCheckIcon, UtensilsIcon, ClockIcon, ChartBarIcon, MessageSquareIcon, TicketIcon, HeadsetIcon, StoreIcon, UsersIcon, CheckCircleIcon, ClipboardListIcon, BanknoteIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: (userId: string, updatedData: Partial<User>) => void;
    isLastAdmin: boolean;
    isPrimaryAdmin?: boolean;
    appName?: string;
    currentUser?: User; // New prop to check permissions
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

const PERMISSION_GROUPS: {
    title: string;
    icon: React.ReactNode;
    permissions: { id: SupervisorPermission; label: string; desc?: string }[]
}[] = [
        {
            title: 'إدارة الطلبات',
            icon: <TruckIconV2 className="w-5 h-5 text-blue-400" />,
            permissions: [
                { id: 'view_orders', label: 'عرض الطلبات', desc: 'مشاهدة قائمة الطلبات والتفاصيل' },
                { id: 'manage_orders', label: 'إدارة الطلبات', desc: 'تغيير الحالة وتعيين المناديب' },
                { id: 'delete_orders', label: 'حذف الطلبات', desc: 'إمكانية حذف الطلبات من السجل' },
            ]
        },
        {
            title: 'المستخدمين والمتاجر',
            icon: <UsersIcon className="w-5 h-5 text-purple-400" />,
            permissions: [
                { id: 'view_users', label: 'عرض المستخدمين', desc: 'مشاهدة قوائم العملاء والمناديب' },
                { id: 'manage_users', label: 'إدارة المستخدمين', desc: 'تعديل البيانات وحظر الحسابات' },
                { id: 'manage_stores', label: 'إدارة المتاجر', desc: 'تعديل بيانات المتاجر والقوائم' },
                { id: 'manage_supervisors', label: 'إدارة المشرفين', desc: 'صلاحية تعيين مشرفين جدد' },
            ]
        },
        {
            title: 'المالية والتقارير',
            icon: <ChartBarIcon className="w-5 h-5 text-green-400" />,
            permissions: [
                { id: 'view_reports', label: 'التقارير والإحصائيات', desc: 'الوصول للوحة الإحصائيات' },
                { id: 'view_wallet', label: 'المحفظة والتسويات', desc: 'إدارة المحافظ المالية للمناديب' },
                { id: 'view_logs', label: 'سجل المراقبة', desc: 'مشاهدة سجلات النشاط' },
                { id: 'manage_advanced_financials', label: 'إدارة المدفوعات المتقدمة', desc: 'تعديل الأسعار وحالات الدفع بشكل كامل' },
            ]

        },
        {
            title: 'التسويق والمحتوى',
            icon: <TicketIcon className="w-5 h-5 text-yellow-400" />,
            permissions: [
                { id: 'manage_promo', label: 'الخصومات والولاء', desc: 'إدارة الكوبونات والنقاط' },
                { id: 'manage_slider', label: 'إدارة العروض', desc: 'التحكم في صور السلايدر' },
                { id: 'send_messages', label: 'إرسال إشعارات', desc: 'إرسال رسائل جماعية' },
                { id: 'manage_decorations', label: 'إهداء الأوسمة والإطارات', desc: 'منح وسحب الإطارات والشارات للمستخدمين' },
            ]
        },
        {
            title: 'الدعم الفني',
            icon: <HeadsetIcon className="w-5 h-5 text-indigo-400" />,
            permissions: [
                { id: 'manage_support', label: 'الرد على الرسائل', desc: 'استقبال والرد على شات الدعم' },
                { id: 'delete_support_messages', label: 'حذف المحادثات', desc: 'صلاحية حذف رسائل الشات' },
            ]
        }
    ];

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, isLastAdmin, isPrimaryAdmin, appName, currentUser }) => {
    // Determine if the current viewer is an Admin
    const viewerIsAdmin = currentUser?.role === 'admin';

    // DEBUG LOGGING
    console.log('[EditUserModal] Viewer Role:', currentUser?.role, 'Is Admin?', viewerIsAdmin);
    console.log('[EditUserModal] Target User:', user.name, user.role);

    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || '');
    const [address, setAddress] = useState(user.address || '');
    const [status, setStatus] = useState(user.status);
    const [role, setRole] = useState(user.role);

    // Password Logic:
    // If Viewer is Admin: Show existing password (if available).
    // If Viewer is Supervisor: Show empty field (they can only set new one).
    // DOUBLE CHECK: Ensure we don't accidentally show it if logic fails
    const initialPassword = (viewerIsAdmin && currentUser?.role === 'admin') ? (user.password || '') : '';
    const [password, setPassword] = useState(initialPassword);
    const [confirmPassword, setConfirmPassword] = useState(''); // Always empty initially for confirmation
    const [showPassword, setShowPassword] = useState(false);

    // Driver Specific
    const [commissionRate, setCommissionRate] = useState(user.commissionRate || 0);
    const [commissionType, setCommissionType] = useState(user.commissionType || 'percentage');
    const [incentivesActive, setIncentivesActive] = useState(user.incentivesActive || false);
    const [dailyLogMode, setDailyLogMode] = useState<'12_hour' | 'always_open'>(user.dailyLogMode || '12_hour');
    const [isLimitUnlimited, setIsLimitUnlimited] = useState(user.maxConcurrentOrders === undefined || user.maxConcurrentOrders === null);
    const [maxOrders, setMaxOrders] = useState<number>(user.maxConcurrentOrders || 1);

    // Supervisor & Merchant
    const [permissions, setPermissions] = useState<SupervisorPermission[]>(user.permissions || []);
    const [openTime, setOpenTime] = useState<string>(user.workingHours?.start || '09:00');
    const [closeTime, setCloseTime] = useState<string>(user.workingHours?.end || '23:00');

    // Merchant Extra Settings
    const [hasFreeDelivery, setHasFreeDelivery] = useState(user.hasFreeDelivery || false);
    const [responseTime, setResponseTime] = useState(user.responseTime || '');
    const [storeCategory, setStoreCategory] = useState(user.storeCategory || 'restaurant');
    const [canShowDeliveryTime, setCanShowDeliveryTime] = useState(user.canShowDeliveryTime || false);
    const [canManageMenu, setCanManageMenu] = useState(user.canManageMenu !== false);
    const [canManageOrderDetails, setCanManageOrderDetails] = useState(user.canManageOrderDetails || false);

    const [canManageAdvancedFinancials, setCanManageAdvancedFinancials] = useState(user.canManageAdvancedFinancials || false);

    // Fixed Delivery Fee
    const [isFixedDeliveryFeeEnabled, setIsFixedDeliveryFeeEnabled] = useState(user.isFixedDeliveryFeeEnabled || false);
    const [fixedDeliveryFee, setFixedDeliveryFee] = useState(user.fixedDeliveryFee?.toString() || '');

    const [error, setError] = useState('');
    const [image, setImage] = useState<string | null>(user.storeImage || null);
    const [isImageProcessing, setIsImageProcessing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayedAppName = appName || 'GOO NOW';

    useAndroidBack(() => {
        onClose();
        return true;
    }, [onClose]);

    const commonInputStyle = "w-full px-4 py-3 bg-[#252525] border border-[#333] text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors";

    // Dynamic Roles based on permission (Supervisor cannot make someone Admin)
    const availableRoles = useMemo(() => {
        const roles: { id: Role; label: string; }[] = [
            { id: 'customer', label: 'مستخدم' },
            { id: 'driver', label: 'مندوب' },
            { id: 'merchant', label: 'تاجر' },
            { id: 'supervisor', label: 'مشرف' },
            { id: 'admin', label: 'مدير' },
        ];

        if (currentUser?.role === 'supervisor') {
            const hasSupervisorPerm = currentUser.permissions?.includes('manage_supervisors');
            return roles.filter(r => r.id !== 'admin' && (hasSupervisorPerm || r.id !== 'supervisor'));
        }

        return roles;
    }, [currentUser?.role, currentUser?.permissions]);

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
                    const MAX_WIDTH = 1024;
                    const scaleSize = MAX_WIDTH / img.width;

                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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

    const handleSave = () => {
        if (!name) { setError('حقل الاسم لا يمكن أن يكون فارغاً.'); return; }

        // Allow relaxed validation for ANY admin account or the primary '5' account
        const isAdminAccount = String(user.id) === '5' || user.role === 'admin';

        if (isAdminAccount) {
            // Precise condition for Admin: Allow single digit (length >= 1)
            if (!phone || phone.trim().length < 1) {
                setError('رقم الهاتف مطلوب للمدير.'); return;
            }
            // Admin password can be short (e.g. "1") if it's being changed
            if (password !== undefined && password !== '' && password.length < 1) {
                setError('كلمة المرور لا يمكن أن تكون فارغة.'); return;
            }
        } else {
            // Strict Validation for everyone else
            if (phone && !/^\d{11}$/.test(phone)) {
                setError('رقم الهاتف يجب أن يتكون من 11 رقم.'); return;
            }
            if (password && password.length < 6) {
                setError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.'); return;
            }
        }

        // Check confirmation only if password field has content (meaning it's being changed or set)
        if (password && password !== confirmPassword && !viewerIsAdmin) {
            // If Admin is viewing, they see the existing password, so confirmation isn't strictly required unless they change it.
            // But for Supervisors setting new password, confirmation is mandatory if they type anything.
            if (password !== (user.password || '') || !viewerIsAdmin) {
                if (password !== confirmPassword) {
                    setError('كلمتا المرور غير متطابقتين.');
                    return;
                }
            }
        }
        setError('');

        const updatedData: Partial<User> = {
            name, phone, status, role,
            storeImage: image || undefined,
            address: (role !== 'driver' && address) ? address : undefined,
        };

        if (password) updatedData.password = password;

        if (role === 'driver') {
            updatedData.commissionRate = commissionRate;
            updatedData.commissionType = commissionType;
            updatedData.incentivesActive = incentivesActive;
            updatedData.dailyLogMode = dailyLogMode;
            updatedData.maxConcurrentOrders = isLimitUnlimited ? null : maxOrders;
        }

        if (role === 'merchant') {
            updatedData.workingHours = { start: openTime, end: closeTime };
            updatedData.hasFreeDelivery = hasFreeDelivery;
            updatedData.responseTime = responseTime;
            updatedData.storeCategory = storeCategory;
            updatedData.canShowDeliveryTime = canShowDeliveryTime;
            updatedData.canManageMenu = canManageMenu;
            updatedData.canManageOrderDetails = canManageOrderDetails;
            updatedData.canManageOrderDetails = canManageOrderDetails;
            updatedData.canManageAdvancedFinancials = canManageAdvancedFinancials;
            updatedData.isFixedDeliveryFeeEnabled = isFixedDeliveryFeeEnabled;
            if (isFixedDeliveryFeeEnabled && fixedDeliveryFee) {
                updatedData.fixedDeliveryFee = parseFloat(fixedDeliveryFee);
            } else {
                updatedData.fixedDeliveryFee = 0;
            }
        }

        if (role === 'supervisor') {
            updatedData.permissions = permissions;
        }

        if (role === 'driver' && isLimitUnlimited) {
            (updatedData as any).maxConcurrentOrders = null;
        }

        onSave(user.id, updatedData);
        onClose();
    };

    const isAdminAccount = String(user.id) === '5' || user.role === 'admin';
    const isSupervisorSelfEdit = currentUser?.role === 'supervisor' && currentUser?.id === user.id;

    return (
        <div className="fixed inset-0 bg-[#111] z-[60] overflow-y-auto animate-fadeIn flex flex-col">

            {/* Header */}
            <div className="flex-none bg-[#1a1a1a] border-b border-[#333] px-4 pt-safe h-16 box-content flex items-center justify-between sticky top-0 z-20 shadow-lg">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="bg-[#252525] p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ChevronLeftIcon className="w-6 h-6 rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white">تعديل المستخدم</h2>
                        <p className="text-xs text-gray-500 font-mono">{user.id}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md"
                >
                    حفظ التغييرات
                </button>
            </div>

            <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-8 pb-20">
                {/* Image & Preview Section */}
                <div className="flex flex-col items-center">
                    <div
                        onClick={() => !isImageProcessing && fileInputRef.current?.click()}
                        className={`relative cursor-pointer rounded-full flex items-center justify-center overflow-hidden group shadow-xl transition-all duration-300 w-36 h-36 border-2 border-gray-700`}
                    >
                        <div className="w-full h-full rounded-full overflow-hidden bg-[#252525] relative border-2 border-[#111]">
                            {isImageProcessing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            {image ? (
                                <img src={image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
                                    <CameraIcon className="w-10 h-10 mb-1" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <UploadIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" className="absolute opacity-0 w-0 h-0 pointer-events-none" onChange={handleImageUpload} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Basic Info */}
                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4 shadow-sm h-fit">
                        <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-2 flex items-center gap-2">
                            <span className="w-1 h-5 bg-red-500 rounded-full"></span>
                            البيانات الأساسية
                        </h3>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">الاسم الكامل</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={commonInputStyle} />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">
                                {isAdminAccount ? 'رقم الهاتف (المدير)' : 'رقم الهاتف'}
                            </label>
                            <input
                                type={isAdminAccount ? 'text' : 'tel'}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={`${commonInputStyle} ${!isAdminAccount ? 'text-right placeholder:text-right' : ''}`}
                                dir="rtl"
                                placeholder={isAdminAccount ? 'يمكن أن يكون رقم واحد (مثال: 5)' : '01xxxxxxxxx'}
                            />
                        </div>

                        {(!isSupervisorSelfEdit && role !== 'driver') && (
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">العنوان</label>
                                <div className="relative">
                                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={`${commonInputStyle} pl-10`} placeholder="العنوان بالتفصيل" />
                                    <MapPinIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                </div>
                            </div>
                        )}

                        {!isSupervisorSelfEdit && (
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">الدور (Role)</label>
                                <div className={`flex flex-wrap gap-2 ${isLastAdmin || isPrimaryAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {availableRoles.map(r => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setRole(r.id)}
                                            disabled={isLastAdmin || isPrimaryAdmin}
                                            className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${role === r.id ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isSupervisorSelfEdit && (
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">حالة الحساب</label>
                                <div className={`flex bg-[#252525] p-1 rounded-xl border border-[#333] ${isPrimaryAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {([
                                        { value: 'active', label: 'نشط' },
                                        { value: 'pending', label: 'قيد المراجعة' },
                                        { value: 'inactive', label: 'غير نشط' },
                                        { value: 'blocked', label: 'محظور' },
                                        { value: 'suspended', label: 'معلق' },
                                    ] as const).filter(s => {
                                        // 🛑 RESTRICTION: Only Admins can set "Suspended"
                                        // Supervisors can only see it if the user is ALREADY suspended.
                                        if (s.value === 'suspended') {
                                            const isAdmin = currentUser?.role === 'admin';
                                            const isAlreadySuspended = status === 'suspended';
                                            return isAdmin || isAlreadySuspended;
                                        }
                                        return true;
                                    }).map((s) => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => {
                                                // Prevent supervisors from changing FROM suspended TO something else?
                                                // Taking the request literally: "change status... to suspended... only for admin".
                                                // If they are already suspended, and supervisor clicks 'active', that is "change status... FROM suspended".
                                                // We will allow unsuspending ideally, but let's stick to the prompt's implied "Control is for Admin".
                                                // If current status is 'suspended' and user is NOT admin, prevent changes?
                                                if (status === 'suspended' && currentUser?.role !== 'admin') {
                                                    return; // Locked
                                                }
                                                setStatus(s.value);
                                            }}
                                            disabled={isPrimaryAdmin || (status === 'suspended' && s.value !== 'suspended' && currentUser?.role !== 'admin')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${status === s.value ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'} ${(status === 'suspended' && currentUser?.role !== 'admin' && s.value !== 'suspended') ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Login & Security */}
                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4 shadow-sm h-fit">
                        <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-2 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                            الأمان وكلمة المرور
                        </h3>
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-400 mb-2">
                                {viewerIsAdmin ? 'كلمة المرور الحالية' : 'تعيين كلمة مرور جديدة'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${commonInputStyle} pr-10`}
                                    placeholder={viewerIsAdmin ? (isAdminAccount ? 'يمكن أن تكون رقم واحد' : '******') : 'اتركه فارغاً لعدم التغيير'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 left-0 px-3 flex items-center text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {isAdminAccount && viewerIsAdmin && <p className="text-[10px] text-green-400 mt-2 font-bold">حساب الإدارة: يسمح برقم هاتف وكلمة مرور من خانة واحدة.</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">تأكيد كلمة المرور</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={commonInputStyle}
                                placeholder={viewerIsAdmin ? '******' : 'أعد كتابة كلمة المرور الجديدة'}
                            />
                        </div>
                    </div>

                    {/* Merchant Settings */}
                    {role === 'merchant' && (
                        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4 shadow-sm md:col-span-2">
                            <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-2 flex items-center gap-2">
                                <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                                إعدادات المتجر
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block text-center">يفتح في</label>
                                    <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="w-full bg-[#252525] border border-[#333] rounded-xl p-3 text-white text-center font-mono text-lg focus:border-purple-500 outline-none" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block text-center">يغلق في</label>
                                    <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="w-full bg-[#252525] border border-[#333] rounded-xl p-3 text-white text-center font-mono text-lg focus:border-purple-500 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">فئة المتجر</label>
                                    <div className="relative">
                                        <select value={storeCategory} onChange={(e) => setStoreCategory(e.target.value)} className={`${commonInputStyle} appearance-none`}>
                                            {MERCHANT_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <GridIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">سرعة الاستجابة (نص)</label>
                                    <input type="text" value={responseTime} onChange={e => setResponseTime(e.target.value)} className={commonInputStyle} placeholder="مثال: 15 دقيقة" />
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 pt-2 border-t border-[#333]">
                                <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-[#333]">
                                    <div className="flex items-center gap-2">
                                        <TruckIconV2 className="w-4 h-4 text-green-500" />
                                        <label htmlFor="freeDelivery" className="text-sm font-bold text-white">تفعيل التوصيل المجاني</label>
                                    </div>
                                    <input id="freeDelivery" type="checkbox" checked={hasFreeDelivery} onChange={(e) => setHasFreeDelivery(e.target.checked)} className="h-5 w-5 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500" />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-[#333]">
                                    <div className="flex items-center gap-2">
                                        <UtensilsIcon className="w-4 h-4 text-orange-400" />
                                        <label className="text-sm font-bold text-white">السماح بإدارة المنيو</label>
                                    </div>
                                    <input type="checkbox" checked={canManageMenu} onChange={(e) => setCanManageMenu(e.target.checked)} className="h-5 w-5 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500" />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-[#333]">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-blue-400" />
                                        <label className="text-sm font-bold text-white">عرض وقت التوصيل (في السجل)</label>
                                    </div>
                                    <input type="checkbox" checked={canShowDeliveryTime} onChange={(e) => setCanShowDeliveryTime(e.target.checked)} className="h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-[#333]">
                                    <div className="flex items-center gap-2">
                                        <ClipboardListIcon className="w-4 h-4 text-pink-400" />
                                        <label className="text-sm font-bold text-white">إدارة تفاصيل الطلب (الأسعار)</label>
                                    </div>
                                    <input type="checkbox" checked={canManageOrderDetails} onChange={(e) => setCanManageOrderDetails(e.target.checked)} className="h-5 w-5 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-[#333]">
                                <div className="flex items-center gap-2">
                                    <BanknoteIcon className="w-4 h-4 text-emerald-400" />
                                    <label className="text-sm font-bold text-white">لوحة المدفوعات المتقدمة</label>
                                </div>
                                <input type="checkbox" checked={canManageAdvancedFinancials} onChange={(e) => setCanManageAdvancedFinancials(e.target.checked)} className="h-5 w-5 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500" />
                            </div>

                            {/* Fixed Delivery Fee Setting */}
                            <div className="p-3 bg-[#252525] rounded-xl border border-[#333] space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TruckIconV2 className="w-4 h-4 text-cyan-400" />
                                        <label className="text-sm font-bold text-white">تثبيت قيمة التوصيل</label>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isFixedDeliveryFeeEnabled}
                                        onChange={(e) => setIsFixedDeliveryFeeEnabled(e.target.checked)}
                                        className="h-5 w-5 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                                    />
                                </div>

                                {isFixedDeliveryFeeEnabled && (
                                    <div className="animate-fadeIn pt-2 border-t border-gray-700">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5">قيمة التوصيل الثابتة (ج.م)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={fixedDeliveryFee}
                                                onChange={(e) => setFixedDeliveryFee(e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg py-2 px-3 text-white text-center font-bold focus:border-cyan-500 outline-none"
                                                placeholder="0"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">ج.م</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    )}

                    {/* Driver Settings */}
                    {role === 'driver' && (
                        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-6 shadow-sm md:col-span-2">
                            <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-2 flex items-center gap-2">
                                <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                                إعدادات المندوب المتقدمة
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Log Mode */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">نظام العمل</label>
                                    <div className="flex bg-[#252525] p-1 rounded-xl border border-[#333]">
                                        {[{ value: '12_hour', label: 'ورديات' }, { value: 'always_open', label: 'مفتوح' }].map((mode) => (
                                            <button key={mode.value} type="button" onClick={() => setDailyLogMode(mode.value as any)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${dailyLogMode === mode.value ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>{mode.label}</button>
                                        ))}
                                    </div>
                                </div>
                                {/* Max Orders */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">حد الطلبات النشطة</label>
                                    <div className="bg-[#252525] p-4 rounded-xl border border-[#333] flex items-center justify-between">
                                        <span className="text-sm text-white font-medium">{isLimitUnlimited ? 'غير محدود' : maxOrders}</span>
                                        <button onClick={() => setIsLimitUnlimited(!isLimitUnlimited)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isLimitUnlimited ? 'bg-green-600' : 'bg-gray-600'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isLimitUnlimited ? 'translate-x-0' : '-translate-x-6'}`}></div>
                                        </button>
                                    </div>
                                    {!isLimitUnlimited && (
                                        <input type="range" min="1" max="10" value={maxOrders} onChange={(e) => setMaxOrders(parseInt(e.target.value))} className="w-full mt-2 accent-orange-500 h-2 bg-gray-700 rounded-lg appearance-none" />
                                    )}
                                </div>
                                {/* Commission */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-400 mb-2">نسبة عمولة {displayedAppName}</label>
                                    <div className="bg-[#252525] p-4 rounded-xl border border-[#333] space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">نسبة مئوية</p>
                                            <div className="flex gap-2">
                                                {[0, 25, 50].map((rate) => (
                                                    <button key={`perc-${rate}`} type="button" onClick={() => { setCommissionType('percentage'); setCommissionRate(rate); }} className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all ${commissionType === 'percentage' && commissionRate === rate ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}>{rate}%</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">مبلغ ثابت (ج.م)</p>
                                            <div className="flex gap-2">
                                                {[5, 10, 15, 20].map((rate) => (
                                                    <button key={`fixed-${rate}`} type="button" onClick={() => { setCommissionType('fixed'); setCommissionRate(rate); }} className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all ${commissionType === 'fixed' && commissionRate === rate ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}>{rate}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Supervisor Settings - Enhanced */}
                    {(role === 'supervisor' && !isSupervisorSelfEdit) && (
                        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4 shadow-sm md:col-span-2">
                            <h3 className="text-lg font-bold text-white border-b border-[#333] pb-3 mb-4 flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-yellow-500" />
                                صلاحيات المشرف
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PERMISSION_GROUPS.map((group, idx) => (
                                    <div key={idx} className="bg-[#222] p-4 rounded-xl border border-[#333]">
                                        <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                            {group.icon}
                                            {group.title}
                                        </h4>
                                        <div className="space-y-2">
                                            {group.permissions.map(opt => (
                                                <label key={opt.id} className="flex items-start gap-3 p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer group">
                                                    <div className="relative flex items-center mt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={permissions.includes(opt.id)}
                                                            onChange={() => handlePermissionChange(opt.id)}
                                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-600 bg-gray-800 transition-all checked:border-yellow-500 checked:bg-yellow-500"
                                                        />
                                                        <CheckCircleIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{opt.label}</p>
                                                        {opt.desc && <p className="text-[10px] text-gray-500">{opt.desc}</p>}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {error && <p className="text-red-400 font-bold text-center bg-red-900/20 p-3 rounded-xl border border-red-500/30">{error}</p>}
            </div>
        </div >
    );
};
export default EditUserModal;
