
import React, { useState, useRef, useEffect } from 'react';
import { Role } from '../types';
import { CameraIcon, UploadIcon, CheckCircleIcon, MapPinIcon, ChevronDownIcon, UserIcon, PhoneIcon, EyeIcon, EyeOffIcon, ClockIcon, BriefcaseIcon, UtensilsIcon, ShoppingCartIcon, PlusIcon, GridIcon, BoltIcon, TruckIconV2, XIcon, MailIcon, ChevronRightIcon, BuildingStorefrontIcon } from './icons';
import { NativeBridge } from '../utils/NativeBridge';
import useAndroidBack from '../hooks/useAndroidBack';
import ImageCropperModal from './common/ImageCropperModal';

interface SignUpScreenProps {
    onSignUp: (user: any) => Promise<{ success: boolean; message: string }>;
    onBackToLogin: () => void;
}

// قائمة الفئات مع الأيقونات والألوان
const MERCHANT_CATEGORIES = [
    { id: 'restaurant', label: 'مطعم', icon: UtensilsIcon, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'market', label: 'سوبر ماركت', icon: ShoppingCartIcon, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { id: 'pharmacy', label: 'صيدلية', icon: PlusIcon, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'bakery', label: 'مخبز/حلواني', icon: GridIcon, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { id: 'electronics', label: 'إلكترونيات', icon: BoltIcon, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { id: 'fashion', label: 'ملابس', icon: BriefcaseIcon, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { id: 'logistics', label: 'خدمات شحن', icon: TruckIconV2, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { id: 'other', label: 'أخرى', icon: GridIcon, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' },
];

const InputField = ({ icon: Icon, iconColor, colSpan = "col-span-1", ...props }: any) => (
    <div className={`relative group ${colSpan}`}>
        <div className={`absolute top-1/2 -translate-y-1/2 left-3 transition-colors pointer-events-none z-10 ${iconColor || 'text-gray-500'} group-focus-within:text-white`}>
            <Icon className="w-5 h-5" />
        </div>
        <input
            {...props}
            className={`w-full bg-[#1F2937]/50 border border-gray-700 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-[#1F2937] outline-none transition-all duration-300 ${props.className || ''}`}
        />
    </div>
);

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp, onBackToLogin }) => {
    const [step, setStep] = useState<'role-selection' | 'form' | 'otp'>('role-selection');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [otp, setOtp] = useState('');
    const [resendTimer, setResendTimer] = useState(60);
    const recaptchaVerifierRef = useRef<any>(null);

    useEffect(() => {
        NativeBridge.reportContext('signup');
    }, []);

    useEffect(() => {
        let timer: any;
        if (step === 'otp' && resendTimer > 0) {
            timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [step, resendTimer]);

    // Back Logic
    useAndroidBack(() => {
        if (isCategoryModalOpen) {
            setIsCategoryModalOpen(false);
            return true;
        }
        if (step === 'form') {
            setStep('role-selection');
            return true;
        }
        onBackToLogin();
        return true; // Go back to login instead of exiting immediately
    }, [step, onBackToLogin]);

    // Details State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'driver' | 'merchant' | 'customer'>('customer');

    // Extra Fields
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    const [image, setImage] = useState<string | null>(null);

    // Merchant Specific
    const [storeCategory, setStoreCategory] = useState<string>('restaurant');
    const [customCategory, setCustomCategory] = useState('');
    const [openTime, setOpenTime] = useState<string>('09:00');
    const [closeTime, setCloseTime] = useState<string>('23:00');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Cropper State
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRoleSelect = (selectedRole: 'driver' | 'merchant' | 'customer') => {
        setRole(selectedRole);
        setStep('form');
        setError('');
    };

    // High Quality Resizer for Profile/Store Image
    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Increase Resolution for clarity
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.9)); // High Quality 90%
                    } else {
                        reject(new Error("Canvas context error"));
                    }
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
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
        setIsImageProcessing(true);
        try {
            // Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(croppedBlob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                setImage(base64data);
                setIsImageProcessing(false);
            };
        } catch (error) {
            console.error("Error processing cropped image:", error);
            setIsImageProcessing(false);
            setError("حدث خطأ أثناء معالجة الصورة المقصوصة.");
        }
    };

    const handleSendOTP = async () => {
        setError('');
        setIsLoading(true);
        try {
            if (!recaptchaVerifierRef.current) {
                // We'll add this div in the return
                const { setupRecaptcha } = await import('../services/firebase');
                recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container');
            }

            const { signInWithPhone } = await import('../services/firebase');
            const result = await signInWithPhone(phone, recaptchaVerifierRef.current);

            if (result.success) {
                setConfirmationResult(result.confirmationResult);
                setStep('otp');
                setResendTimer(60);
            } else {
                setError(result.error || "فشل إرسال رمز التحقق.");
                // Reset recaptcha if error
                if (recaptchaVerifierRef.current) {
                    recaptchaVerifierRef.current.clear();
                    recaptchaVerifierRef.current = null;
                }
            }
        } catch (e: any) {
            console.error("SignUp Error:", e);
            // Display the ACTUAL error from Native Bridge or Firebase
            const actualError = e.error || e.message || JSON.stringify(e);
            setError(`خطأ: ${actualError}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');

        if (!otp || otp.length < 6) {
            setError('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
            return;
        }

        setIsLoading(true);
        try {
            await confirmationResult.confirm(otp);
            // If success, proceed to actual sign up
            const userData: any = {
                name,
                phone,
                password,
                role,
                storeImage: image,
                email: email || undefined,
                address: address || undefined,
            };

            if (role === 'merchant') {
                userData.storeCategory = storeCategory === 'other' ? customCategory.trim() : storeCategory;
                userData.storeName = name;
                userData.workingHours = { start: openTime, end: closeTime };
            }

            const result = await onSignUp(userData);
            if (!result.success) {
                setError(result.message);
            } else {
                setShowSuccessModal(true);
                setTimeout(() => onBackToLogin(), 4000);
            }
        } catch (err: any) {
            console.error("OTP Error:", err);
            setError("رمز التحقق غير صحيح أو منتهي الصلاحية.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !phone || !password || !confirmPassword) {
            setError('يرجى ملء جميع الحقول الأساسية.');
            return;
        }

        if (role !== 'driver' && !address.trim()) {
            setError('العنوان حقل إلزامي.');
            return;
        }

        if (!image) {
            setError(role === 'merchant' ? 'صورة المتجر مطلوبة.' : 'الصورة الشخصية مطلوبة.');
            return;
        }

        if (!/^\d{11}$/.test(phone)) {
            setError('رقم الهاتف يجب أن يتكون من 11 رقم.');
            return;
        }

        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }

        let finalCategory = storeCategory;
        if (role === 'merchant') {
            if (storeCategory === 'other') {
                if (!customCategory.trim()) {
                    setError('يرجى كتابة نوع النشاط الخاص بك.');
                    return;
                }
                finalCategory = customCategory.trim();
            }
        }

        setIsLoading(true);
        // Instead of immediate sign up, send OTP
        await handleSendOTP();
    };

    const selectedCategoryObj = MERCHANT_CATEGORIES.find(c => c.id === storeCategory) || MERCHANT_CATEGORIES[0];

    if (step === 'role-selection') {
        return (
            <div className="h-dvh flex flex-col items-center justify-center p-6 pt-safe bg-black relative overflow-hidden" dir="rtl">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="w-full max-w-sm space-y-8 relative z-10">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black text-white">إنشاء حساب جديد</h1>
                        <p className="text-gray-400 text-sm">اختر نوع الحساب للمتابعة</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleRoleSelect('customer')}
                            className="w-full group bg-[#1e293b] hover:bg-[#253347] border border-gray-700/50 hover:border-cyan-500/50 p-4 rounded-2xl flex items-center justify-between transition-all duration-300 shadow-lg hover:shadow-cyan-900/20 active:scale-95"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                    <UserIcon className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">مستخدم</h3>
                                    <p className="text-xs text-gray-500">للطلب والتسوق</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 rotate-180 transition-colors" />
                        </button>

                        <button
                            onClick={() => handleRoleSelect('driver')}
                            className="w-full group bg-[#1e293b] hover:bg-[#253347] border border-gray-700/50 hover:border-red-500/50 p-4 rounded-2xl flex items-center justify-between transition-all duration-300 shadow-lg hover:shadow-red-900/20 active:scale-95"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                    <TruckIconV2 className="w-6 h-6 text-red-500" />
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold text-white text-lg group-hover:text-red-500 transition-colors">مندوب توصيل</h3>
                                    <p className="text-xs text-gray-500">انضم لفريق التوصيل</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-red-500 rotate-180 transition-colors" />
                        </button>

                        <button
                            onClick={() => handleRoleSelect('merchant')}
                            className="w-full group bg-[#1e293b] hover:bg-[#253347] border border-gray-700/50 hover:border-purple-500/50 p-4 rounded-2xl flex items-center justify-between transition-all duration-300 shadow-lg hover:shadow-purple-900/20 active:scale-95"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                    <BuildingStorefrontIcon className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">تاجر / مطعم</h3>
                                    <p className="text-xs text-gray-500">اعرض منتجاتك للبيع</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-purple-400 rotate-180 transition-colors" />
                        </button>
                    </div>

                    <div className="text-center pt-6">
                        <button onClick={onBackToLogin} className="text-sm text-gray-500 hover:text-white transition-colors">
                            لديك حساب بالفعل؟ <span className="text-red-500 font-bold hover:underline">تسجيل الدخول</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-dvh flex flex-col text-white relative bg-black overflow-hidden" dir="rtl">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>


            {/* Cropper Modal */}
            {isCropperOpen && tempImage && (
                <ImageCropperModal
                    imageSrc={tempImage}
                    onCropComplete={handleCropComplete}
                    onClose={() => { setIsCropperOpen(false); setTempImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    aspectRatio={1} // Always square for profile/store
                />
            )}

            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-0 sm:p-4" onClick={() => setIsCategoryModalOpen(false)}>
                    <div className="bg-[#1e293b] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#0f172a]">
                            <h3 className="text-lg font-bold text-white">اختر نوع النشاط</h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"><XIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto bg-[#0f172a]">
                            <div className="grid grid-cols-2 gap-3">
                                {MERCHANT_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => { setStoreCategory(cat.id); setIsCategoryModalOpen(false); }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${storeCategory === cat.id
                                            ? `bg-[#1e293b] border-red-500 shadow-lg shadow-red-900/20`
                                            : `bg-[#1e293b]/50 border-gray-700 hover:bg-[#1e293b]`
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${storeCategory === cat.id ? 'bg-red-600 text-white' : `${cat.bg} ${cat.color}`}`}>
                                            <cat.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs font-bold ${storeCategory === cat.id ? 'text-white' : 'text-gray-400'}`}>
                                            {cat.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn p-4">
                    <div className="bg-[#1e293b] p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm border border-gray-700 w-full transform transition-all scale-100">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 ring-2 ring-green-500/50 shadow-lg shadow-green-900/20 animate-bounce">
                            <CheckCircleIcon className="w-10 h-10 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">تم إنشاء الحساب بنجاح!</h3>
                        <div className="space-y-3 mb-6 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                            <p className="text-gray-300 text-sm font-medium">حسابك الآن <span className="text-yellow-400 font-bold text-base">قيد المراجعة</span> من قبل الإدارة.</p>
                            <p className="text-gray-400 text-xs">يرجى الانتظار لحين الموافقة على طلبك وتفعيل الحساب. سيتم إشعارك قريباً.</p>
                        </div>

                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-green-500 rounded-full animate-progress" style={{ animationDuration: '4s' }}></div>
                        </div>
                        <p className="text-gray-500 text-sm mt-2">جاري التحويل لصفحة الدخول...</p>
                    </div>
                </div>
            )}

            {/* Header - Added pt-safe to respect status bar */}
            <div className="px-5 pt-safe pb-2 flex-none relative">
                <button
                    onClick={() => setStep(step === 'otp' ? 'form' : 'role-selection')}
                    className="absolute top-safe-offset right-5 p-1 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors z-20"
                    style={{ top: 'calc(var(--safe-area-top) + 1.25rem)' }}
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        {step === 'otp' ? 'تأكيد الرقم' : (role === 'driver' ? 'حساب مندوب' : role === 'merchant' ? 'حساب تاجر' : 'حساب مستخدم')}
                        <span className="text-red-500">.</span>
                    </h1>
                </div>
            </div>

            <div className="flex-1 px-5 flex flex-col relative z-10 min-h-0 pt-2">
                {step === 'otp' ? (
                    <div className="flex-1 flex flex-col justify-center animate-fadeIn">
                        <div className="text-center mb-8 space-y-3">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                <PhoneIcon className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">التحقق من الهاتف</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                أرسلنا رمز المكون من 6 أرقام إلى الرقم <br />
                                <span className="text-white font-mono dir-ltr">{phone}</span>
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <div className="absolute top-1/2 -translate-y-1/2 left-3 text-emerald-500">
                                    <CheckCircleIcon className="w-5 h-5" />
                                </div>
                                <input
                                    type="tel"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full bg-[#1F2937]/50 border border-gray-700 rounded-xl py-4 pl-10 pr-4 text-center text-2xl font-black text-white tracking-[0.5em] placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    maxLength={6}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-center">
                                    <p className="text-red-400 text-xs font-bold">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <button
                                    onClick={() => handleVerifyAndSubmit()}
                                    disabled={isLoading || otp.length < 6}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center text-lg"
                                >
                                    {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'تأكيد الرمز'}
                                </button>

                                <div className="text-center">
                                    {resendTimer > 0 ? (
                                        <p className="text-xs text-gray-500">إعادة إرسال الرمز خلال <span className="text-emerald-500 font-bold">{resendTimer}</span> ثانية</p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendOTP}
                                            className="text-xs text-emerald-500 font-bold hover:underline"
                                        >
                                            إعادة إرسال الرمز الآن
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            <div className="flex justify-center mb-6 mt-4">
                                {role === 'merchant' ? (
                                    <div
                                        onClick={() => !isImageProcessing && fileInputRef.current?.click()}
                                        className={`relative w-full h-36 rounded-2xl border border-dashed cursor-pointer overflow-hidden group flex items-center justify-center shadow-lg transition-all ${image ? 'border-transparent' : 'border-gray-600 bg-[#1e293b] hover:border-red-500'}`}
                                    >
                                        {/* Water Ripple Effect - Fixed Alignment */}
                                        {isImageProcessing && (
                                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                <div className="grid place-items-center">
                                                    <div className="col-start-1 row-start-1 w-20 h-20 border-4 border-blue-400/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                                    <div className="col-start-1 row-start-1 w-12 h-12 bg-blue-500 rounded-full opacity-75 animate-ping"></div>
                                                    <div className="col-start-1 row-start-1 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center z-10 shadow-lg shadow-blue-500/50">
                                                        <UploadIcon className="w-6 h-6 text-white animate-bounce" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {image ? (
                                            <>
                                                <img src={image} alt="Store" className="w-full h-full object-cover opacity-70" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <CameraIcon className="w-8 h-8 text-white p-1.5 bg-black/50 rounded-full" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400 group-hover:text-white transition-colors">
                                                <CameraIcon className="w-8 h-8 mb-2" />
                                                <span className="text-xs font-bold">إضافة صورة المتجر</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => !isImageProcessing && fileInputRef.current?.click()}
                                        className={`w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative shadow-lg group hover:border-red-500 transition-all ${image ? 'border-red-500' : 'border-gray-600 bg-[#1e293b]'}`}
                                    >
                                        {/* Water Ripple Effect - Fixed Alignment */}
                                        {isImageProcessing && (
                                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                <div className="grid place-items-center">
                                                    <div className="col-start-1 row-start-1 w-14 h-14 border-4 border-blue-400/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                                    <div className="col-start-1 row-start-1 w-8 h-8 bg-blue-500 rounded-full opacity-75 animate-ping"></div>
                                                    <div className="col-start-1 row-start-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center z-10 shadow-lg shadow-blue-500/50">
                                                        <UploadIcon className="w-4 h-4 text-white animate-bounce" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {image ? (
                                            <img src={image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400 group-hover:text-white">
                                                <CameraIcon className="w-8 h-8 mb-1" />
                                                <span className="text-[10px]">صورة شخصية</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CameraIcon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </div>

                            <div className="flex flex-col gap-4">
                                <InputField
                                    icon={UserIcon}
                                    iconColor="text-cyan-500"
                                    type="text"
                                    value={name}
                                    onChange={(e: any) => setName(e.target.value)}
                                    placeholder={role === 'merchant' ? "اسم المتجر" : "الاسم الكامل"}
                                />
                                <InputField
                                    icon={PhoneIcon}
                                    iconColor="text-emerald-500"
                                    type="tel"
                                    value={phone}
                                    onChange={(e: any) => setPhone(e.target.value)}
                                    placeholder="رقم الهاتف (11 رقم)"
                                    maxLength={11}
                                    className="text-right placeholder:text-right"
                                    dir="rtl"
                                />

                                {role !== 'driver' && (
                                    <>
                                        <InputField icon={MapPinIcon} iconColor="text-rose-500" type="text" value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="العنوان بالتفصيل" />
                                        <InputField icon={MailIcon} iconColor="text-purple-500" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="البريد الإلكتروني (اختياري)" />
                                    </>
                                )}

                                {role === 'driver' && (
                                    <InputField icon={MailIcon} iconColor="text-purple-500" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="البريد الإلكتروني (اختياري)" />
                                )}

                                {role === 'merchant' && (
                                    <div className="flex flex-col gap-3 bg-[#1e293b]/50 p-3 rounded-xl border border-gray-700/50">
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryModalOpen(true)}
                                            className="bg-[#0f172a] border border-gray-700 rounded-xl py-3.5 px-4 text-white flex justify-between items-center text-sm hover:border-gray-500 transition-colors w-full"
                                        >
                                            <div className="flex items-center gap-3">
                                                <selectedCategoryObj.icon className={`w-4 h-4 ${selectedCategoryObj.color}`} />
                                                <span>{selectedCategoryObj.label}</span>
                                            </div>
                                            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                        </button>

                                        {storeCategory === 'other' && (
                                            <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="اكتب نوع النشاط..." className="bg-[#0f172a] border border-gray-700 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-red-500 w-full" />
                                        )}

                                        <div className="flex items-center gap-2 bg-[#0f172a] border border-gray-700 rounded-xl px-3 py-2">
                                            <ClockIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                            <span className="text-xs text-gray-400">ساعات العمل:</span>
                                            <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="bg-transparent text-white text-xs flex-1 text-center outline-none" />
                                            <span className="text-gray-500">-</span>
                                            <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="bg-transparent text-white text-xs flex-1 text-center outline-none" />
                                        </div>
                                    </div>
                                )}

                                <div className="relative group">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-3 z-20 text-gray-500">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="الرقم السري (6 أحرف على الأقل)" className="w-full bg-[#1F2937]/50 border border-gray-700 rounded-xl py-3.5 pl-4 pr-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                                </div>

                                <div className="relative group">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-3 z-20 text-gray-500">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تأكيد الرقم السري" className="w-full bg-[#1F2937]/50 border border-gray-700 rounded-xl py-3.5 pl-4 pr-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                                </div>

                                {error && (
                                    <div className="mt-2 text-center">
                                        <p className="text-red-500 text-xs font-bold">{error}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 pb-10">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
                                >
                                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'إنشاء الحساب'}
                                </button>

                                <div className="text-center mt-4">
                                    <button type="button" onClick={onBackToLogin} className="text-xs text-gray-500 hover:text-white transition-colors">
                                        لديك حساب بالفعل؟ <span className="text-red-500 font-bold hover:underline">تسجيل الدخول</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
            <div id="recaptcha-container"></div>
        </div>
    );
};

export default SignUpScreen;
