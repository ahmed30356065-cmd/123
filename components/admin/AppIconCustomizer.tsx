
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    ChevronLeftIcon, UploadIcon, CheckCircleIcon, ImageIcon, 
    PlusIcon, TrashIcon, EyeIcon, EyeOffIcon, GridIcon, XIcon, PencilIcon, RefreshCwIcon,
    SettingsIcon, TicketIcon, CrownIcon, UserIcon, SearchIcon, SparklesIcon, PaletteIcon, ClockIcon, ShieldCheckIcon, ClipboardListIcon 
} from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';
import { AppTheme, CategoryItem, AppConfig, User } from '../../types';
import ConfirmationModal from './ConfirmationModal';

interface AppIconCustomizerProps {
    onClose: () => void;
    currentTheme: AppTheme;
    onUpdateTheme: (appType: 'driver' | 'merchant' | 'customer', config: any) => void;
    appConfig?: AppConfig;
    onUpdateAppConfig?: (config: AppConfig) => void;
    users: User[];
    onUpdateUser: (userId: string, data: Partial<User>) => void;
    sendNotification: (targetType: string, data: { title: string, body: string, targetId?: string, url?: string }) => void;
    currentUser?: User; // Added to check permissions
}

type CustomizerView = 'main' | 'categories' | 'decorations' | 'active_gifts';
type DecorationTab = 'frames' | 'badges';

interface CustomDecoration {
    id: string;
    label: string;
    url: string;
    type: 'frame' | 'badge';
}

// Helper Modal for Selecting a User to Gift (Updated with Duration)
const UserSelectorModal: React.FC<{
    users: User[];
    onClose: () => void;
    onSelect: (user: User, durationInDays: number | null) => void;
    title: string;
}> = ({ users, onClose, onSelect, title }) => {
    const [search, setSearch] = useState('');
    const [duration, setDuration] = useState<number | null>(7); // Default 7 days
    
    const filteredUsers = useMemo(() => {
        const lowerSearch = search.toLowerCase();
        return users.filter(u => {
            const roleName = u.role === 'driver' ? 'مندوب' : u.role === 'merchant' ? 'تاجر' : u.role === 'admin' ? 'إدارة' : 'عميل';
            return (
                u.name.toLowerCase().includes(lowerSearch) || 
                (u.phone && u.phone.includes(lowerSearch)) ||
                roleName.includes(lowerSearch)
            );
        });
    }, [users, search]);

    const durations = [
        { label: '24 ساعة', value: 1 },
        { label: '3 أيام', value: 3 },
        { label: 'أسبوع', value: 7 },
        { label: 'شهر', value: 30 },
        { label: 'دائم', value: null },
    ];

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#151e2d] rounded-t-2xl">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-yellow-400" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </div>
                
                <div className="p-4 border-b border-gray-700/50 space-y-4">
                    {/* Duration Selector */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            مدة الإهداء (صلاحية الهدية)
                        </label>
                        <div className="flex bg-[#0f172a] p-1 rounded-xl border border-gray-600 overflow-x-auto scrollbar-hide">
                            {durations.map((d) => (
                                <button
                                    key={d.label}
                                    onClick={() => setDuration(d.value)}
                                    className={`flex-1 min-w-[60px] py-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                                        duration === d.value 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="بحث بالاسم أو الرقم..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-2 pl-4 pr-10 text-white text-sm focus:border-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <button 
                                key={user.id} 
                                onClick={() => onSelect(user, duration)}
                                className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 rounded-xl transition-colors border-b border-gray-700/30 last:border-0 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                        {user.storeImage ? <img src={user.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-gray-400" />}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">{user.name}</p>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'driver' ? 'bg-orange-500' : user.role === 'merchant' ? 'bg-purple-500' : user.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                            {user.role === 'driver' ? 'مندوب' : user.role === 'merchant' ? 'تاجر' : user.role === 'admin' ? 'إدارة' : 'عميل'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg shadow-blue-900/20">إرسال</div>
                                    {duration && <span className="text-[9px] text-gray-400">{duration} يوم</span>}
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8 text-sm">لا توجد نتائج</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Replicated from CustomerHome.tsx
const CategoryIcons = {
    All: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
    ),
    Restaurant: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
            <path d="M7 2v20"></path>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
        </svg>
    ),
    Market: ({ className }: { className?: string }) => (
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
    ),
    Pharmacy: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
            <path d="M12 7v10" />
            <path d="M7 12h10" />
        </svg>
    )
};

const AppIconCustomizer: React.FC<AppIconCustomizerProps> = ({ onClose, currentTheme, onUpdateTheme, appConfig, onUpdateAppConfig, users, onUpdateUser, sendNotification, currentUser }) => {
    const [currentView, setCurrentView] = useState<CustomizerView>('main');
    const [decoTab, setDecoTab] = useState<DecorationTab>('frames');
    
    // UI States
    const [showSuccess, setShowSuccess] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Add Decoration States
    const [isAddDecorationOpen, setIsAddDecorationOpen] = useState(false);
    const [decorationName, setDecorationName] = useState('');
    const [decorationImage, setDecorationImage] = useState<string | null>(null);
    const [decorationType, setDecorationType] = useState<'frame' | 'badge'>('frame');

    // Gift States
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [itemToGift, setItemToGift] = useState<CustomDecoration | null>(null);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Layout & Categories State
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    
    // Local state for font to ensure immediate UI feedback
    const [activeFont, setActiveFont] = useState<string | undefined>(appConfig?.customFont);
    
    // Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'primary';
    } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const decorationInputRef = useRef<HTMLInputElement>(null);
    const fontInputRef = useRef<HTMLInputElement>(null);
    const [activeIconKey, setActiveIconKey] = useState<string | null>(null);
    const [previewIcon, setPreviewIcon] = useState<string | null>(null);

    useAndroidBack(() => {
        if (giftModalOpen) { setGiftModalOpen(false); return true; }
        if (confirmModal?.isOpen) { setConfirmModal(null); return true; }
        if (isAddModalOpen) { setIsAddModalOpen(false); return true; }
        if (isAddDecorationOpen) { setIsAddDecorationOpen(false); return true; }
        if (currentView !== 'main') { setCurrentView('main'); return true; }
        onClose(); return true;
    }, [currentView, isAddModalOpen, confirmModal, isAddDecorationOpen, giftModalOpen]);

    // Initialize state and sync with props
    useEffect(() => {
        setActiveFont(appConfig?.customFont);
    }, [appConfig?.customFont]);

    useEffect(() => {
        if (currentTheme.customer?.categories && currentTheme.customer.categories.length > 0) {
            setCategories(currentTheme.customer.categories);
        } else {
            // Default Initial Categories
            setCategories([
                { id: 'all', key: 'cat_all', label: 'الكل', isVisible: true, sortOrder: 0 },
                { id: 'restaurant', key: 'cat_restaurant', label: 'مطاعم', isVisible: true, sortOrder: 1 },
                { id: 'market', key: 'cat_market', label: 'ماركت', isVisible: true, sortOrder: 2 },
                { id: 'pharmacy', key: 'cat_pharmacy', label: 'صيدلية', isVisible: true, sortOrder: 3 },
            ]);
        }
    }, [currentTheme]);

    const updateThemeImmediate = (app: 'customer', updates: any) => {
        const currentAppConfig: any = currentTheme[app] || { icons: {}, splash: {}, layout: {} };
        const newConfig = {
            ...currentAppConfig,
            ...updates,
        };
        onUpdateTheme(app, newConfig);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
    };

    const handleUploadClick = (key: string) => {
        setActiveIconKey(key);
        const cat = categories.find(c => c.id === key); 
        setPreviewIcon(cat?.icon || null);
        fileInputRef.current?.click();
    };

    // Helper to resize and normalize image (ONLY for small icons)
    const processIconImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 128; 
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject('Canvas error'); return; }

                    const scale = Math.min(size / img.width, size / img.height);
                    const x = (size / 2) - (img.width / 2) * scale;
                    const y = (size / 2) - (img.height / 2) * scale;
                    
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeIconKey) {
            setIsProcessing(true);
            try {
                const processedImage = await processIconImage(file);
                // Update specific category icon
                const newCats = categories.map(c => c.id === activeIconKey ? { ...c, icon: processedImage } : c);
                setCategories(newCats);
                updateThemeImmediate('customer', { categories: newCats });
                setPreviewIcon(processedImage);
            } catch (error) {
                console.error("Error processing icon:", error);
                alert("حدث خطأ أثناء معالجة الصورة");
            } finally {
                setIsProcessing(false);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Font Management ---
    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.ttf')) {
                alert('عفواً، يجب أن يكون ملف الخط بصيغة .ttf');
                return;
            }

            setIsProcessing(true);
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Font = event.target?.result as string;
                setActiveFont(base64Font); 
                if (onUpdateAppConfig && appConfig) {
                    onUpdateAppConfig({ ...appConfig, customFont: base64Font });
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 2000);
                }
                setIsProcessing(false);
            };
            reader.onerror = () => {
                setIsProcessing(false);
                alert('فشل قراءة ملف الخط');
            };
            reader.readAsDataURL(file);
        }
        if (fontInputRef.current) fontInputRef.current.value = '';
    };

    const handleRemoveFont = () => {
        setConfirmModal({
            isOpen: true,
            title: 'إزالة الخط المخصص',
            message: 'هل أنت متأكد من إزالة الخط المخصص والعودة للخط الافتراضي؟',
            variant: 'danger',
            onConfirm: () => {
                setActiveFont(undefined);
                if (onUpdateAppConfig && appConfig) {
                    onUpdateAppConfig({ ...appConfig, customFont: '' });
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 2000);
                }
                setConfirmModal(null);
            }
        });
    };

    // --- Decoration (Frames/Badges) Management ---
    const handleDecorationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.includes('png') && !file.type.includes('gif')) {
                alert('يرجى اختيار صورة بصيغة PNG أو GIF');
                return;
            }
            
            // Use FileReader directly to preserve original quality/transparency/animation
            // Do NOT resize via canvas
            const reader = new FileReader();
            reader.onload = (event) => {
                setDecorationImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        if (decorationInputRef.current) decorationInputRef.current.value = '';
    };

    const handleAddDecoration = () => {
        if (!decorationName || !decorationImage) return;

        const newId = `${decorationType}_${Date.now()}`;
        const newDecoration: CustomDecoration = {
            id: newId,
            label: decorationName,
            url: decorationImage,
            type: decorationType
        };

        // We store all decorations in the 'customer' theme key for centralized storage
        const currentDecorations = decorationType === 'frame' 
            ? (currentTheme.customer as any).customFrames || []
            : (currentTheme.customer as any).customBadges || [];

        const updatedDecorations = [...currentDecorations, newDecoration];

        updateThemeImmediate(
            'customer',
            decorationType === 'frame' 
                ? { customFrames: updatedDecorations } 
                : { customBadges: updatedDecorations }
        );

        setDecorationName('');
        setDecorationImage(null);
        setIsAddDecorationOpen(false);
    };

    const handleDeleteDecoration = (id: string, type: 'frame' | 'badge') => {
        setConfirmModal({
            isOpen: true,
            title: `حذف ${type === 'frame' ? 'الإطار' : 'الشارة'}`,
            message: 'هل أنت متأكد من الحذف؟',
            variant: 'danger',
            onConfirm: () => {
                const currentDecorations = type === 'frame' 
                    ? (currentTheme.customer as any).customFrames || []
                    : (currentTheme.customer as any).customBadges || [];
                
                const updatedDecorations = currentDecorations.filter((d: CustomDecoration) => d.id !== id);
                
                updateThemeImmediate(
                    'customer',
                    type === 'frame' 
                        ? { customFrames: updatedDecorations } 
                        : { customBadges: updatedDecorations }
                );
                setConfirmModal(null);
            }
        });
    };

    // --- Gifting Logic ---
    const handleGiftClick = (decoration: CustomDecoration) => {
        setItemToGift(decoration);
        setGiftModalOpen(true);
    };

    const handleGiftConfirm = (user: User, durationInDays: number | null) => {
        if (!itemToGift) return;

        const updates: any = {};
        const itemName = itemToGift.type === 'frame' ? 'إطار' : 'شارة';
        
        let expiryDate = null;
        if (durationInDays) {
            const date = new Date();
            date.setDate(date.getDate() + durationInDays);
            expiryDate = date.toISOString();
        }

        if (itemToGift.type === 'frame') {
            updates.specialFrame = itemToGift.url;
            updates.specialFrameExpiry = expiryDate;
        } else {
            updates.specialBadge = itemToGift.url;
            updates.specialBadgeExpiry = expiryDate;
        }

        onUpdateUser(user.id, updates);

        const durationText = durationInDays ? `لمدة ${durationInDays} يوم` : 'بشكل دائم';
        const notificationBody = `تهانينا! حصلت على ${itemName} جديدة (${itemToGift.label}) ${durationText}. اذهب إلى ملفك الشخصي للتحقق!`;
        
        // Pass targetId explicitly to ensure private notification
        sendNotification(user.role, {
            title: "هدية مميزة! 🎁",
            body: notificationBody,
            targetId: user.id, // Direct target
            url: '/?target=profile' // Direct user to profile to see the gift
        });

        setGiftModalOpen(false);
        setItemToGift(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    // --- Category Management ---
    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const newId = `cat_${Date.now()}`;
        const newCat: CategoryItem = {
            id: newId,
            key: newId,
            label: newCategoryName,
            isVisible: true,
            sortOrder: categories.length
        };
        const updatedCats = [...categories, newCat];
        setCategories(updatedCats);
        updateThemeImmediate('customer', { categories: updatedCats });
        setNewCategoryName('');
        setIsAddModalOpen(false);
    };

    const handleDeleteCategory = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'حذف التصنيف',
            message: 'هل أنت متأكد من حذف هذا التصنيف؟',
            variant: 'danger',
            onConfirm: () => {
                const updatedCats = categories.filter(c => c.id !== id);
                setCategories(updatedCats);
                updateThemeImmediate('customer', { categories: updatedCats });
                setConfirmModal(null);
            }
        });
    };

    const handleToggleVisibility = (id: string) => {
        const updatedCats = categories.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c);
        setCategories(updatedCats);
        updateThemeImmediate('customer', { categories: updatedCats });
    };

    const handleRestoreDefaultIcon = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'استعادة الأيقونة',
            message: 'هل أنت متأكد من استعادة الأيقونة الافتراضية؟',
            variant: 'primary',
            onConfirm: () => {
                const updatedCats = categories.map(c => c.id === id ? { ...c, icon: undefined } : c);
                setCategories(updatedCats);
                updateThemeImmediate('customer', { categories: updatedCats });
                setConfirmModal(null);
            }
        });
    };

    const handleLabelChange = (id: string, newLabel: string) => {
        const updatedCats = categories.map(c => c.id === id ? { ...c, label: newLabel } : c);
        setCategories(updatedCats);
    };

    const saveCategories = () => {
        updateThemeImmediate('customer', { categories });
    };

    // Active Gifts View Logic
    const usersWithGifts = useMemo(() => {
        return users.filter(u => u.specialFrame || u.specialBadge);
    }, [users]);

    const handleRevokeGift = (user: User, type: 'frame' | 'badge') => {
         setConfirmModal({
            isOpen: true,
            title: `سحب ${type === 'frame' ? 'الإطار' : 'الشارة'}`,
            message: `هل أنت متأكد من سحب ${type === 'frame' ? 'الإطار' : 'الشارة'} من ${user.name}؟`,
            variant: 'danger',
            onConfirm: () => {
                const updates: any = {};
                if (type === 'frame') {
                    updates.specialFrame = null;
                    updates.specialFrameExpiry = null;
                } else {
                    updates.specialBadge = null;
                    updates.specialBadgeExpiry = null;
                }
                onUpdateUser(user.id, updates);
                setConfirmModal(null);
            }
        });
    };

    // Get current custom decorations from customer theme (storage)
    const currentFrames = (currentTheme.customer as any).customFrames || [];
    const currentBadges = (currentTheme.customer as any).customBadges || [];

    const getPageTitle = () => {
        switch(currentView) {
            case 'categories': return 'إدارة التصنيفات';
            case 'decorations': return 'الإطارات والشارات';
            case 'active_gifts': return 'سجل الإهداءات النشطة';
            default: return 'تخصيص المظهر';
        }
    }
    
    // Check if user is admin (only admin can delete assets)
    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="fixed inset-0 z-[60] bg-[#0f172a] text-white flex flex-col overflow-hidden animate-fadeIn">
            {/* Success Overlay */}
            {showSuccess && (
                <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-green-600 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                        <span className="font-bold text-white">تمت العملية بنجاح</span>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="flex-none px-4 pt-safe h-16 box-content flex items-center justify-between border-b border-gray-800 bg-[#1e293b]/90 backdrop-blur-md sticky top-0 z-20 shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={currentView === 'main' ? onClose : () => setCurrentView('main')} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700">
                        <ChevronLeftIcon className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="text-xl font-black tracking-wide">{getPageTitle()}</h1>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {/* BACKGROUND ELEMENT */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

                {currentView === 'main' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <div className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-8 min-h-full">
                            
                            {/* Global Settings Section (Fonts) */}
                            <div className="bg-[#1e293b]/80 backdrop-blur-sm rounded-[2rem] p-6 border border-gray-700 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <TicketIcon className="w-6 h-6 text-blue-400" />
                                                الخط المخصص
                                            </h3>
                                            {activeFont && (
                                                <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                                                    <CheckCircleIcon className="w-3 h-3" /> نشط
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            يمكنك رفع ملف خط بصيغة <code>.ttf</code> ليتم تطبيقه على جميع الواجهات في النظام بالكامل.
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button 
                                            onClick={() => fontInputRef.current?.click()}
                                            disabled={isProcessing}
                                            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                                        >
                                            {isProcessing ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <UploadIcon className="w-5 h-5" />
                                                    <span>رفع الخط (.ttf)</span>
                                                </>
                                            )}
                                        </button>
                                        
                                        {activeFont && (
                                            <button 
                                                onClick={handleRemoveFont}
                                                className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-xl transition-colors border border-red-500/20"
                                                title="إزالة الخط المخصص"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <input type="file" ref={fontInputRef} accept=".ttf" className="hidden" onChange={handleFontUpload} />
                                </div>
                            </div>

                            {/* Customization Actions Grid */}
                            <div>
                                <h2 className="text-lg font-bold text-gray-400 mb-4 px-2 flex items-center gap-2">
                                    <PaletteIcon className="w-5 h-5" />
                                    أدوات التخصيص
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <button 
                                        onClick={() => setCurrentView('categories')}
                                        className="group relative overflow-hidden bg-gradient-to-br from-cyan-900 to-blue-900 rounded-[2rem] p-8 flex items-center justify-between shadow-lg hover:shadow-cyan-500/20 transition-all active:scale-98 border border-white/5 h-40"
                                    >
                                        <div className="z-10 text-right">
                                            <h3 className="text-2xl font-black text-white mb-2 group-hover:translate-x-1 transition-transform">إدارة التصنيفات</h3>
                                            <p className="text-cyan-200 text-sm font-medium">أيقونات ومسميات الصفحة الرئيسية</p>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                            <GridIcon className="w-8 h-8 text-cyan-300" />
                                        </div>
                                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-[50px] group-hover:bg-cyan-400/30 transition-colors"></div>
                                    </button>

                                    <button 
                                        onClick={() => setCurrentView('decorations')}
                                        className="group relative overflow-hidden bg-gradient-to-br from-purple-900 to-pink-900 rounded-[2rem] p-8 flex items-center justify-between shadow-lg hover:shadow-purple-500/20 transition-all active:scale-98 border border-white/5 h-40"
                                    >
                                        <div className="z-10 text-right">
                                            <h3 className="text-2xl font-black text-white mb-2 group-hover:translate-x-1 transition-transform">الإطارات والشارات</h3>
                                            <p className="text-purple-200 text-sm font-medium">إضافة وإهداء الأوسمة للمستخدمين</p>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                            <CrownIcon className="w-8 h-8 text-purple-300" />
                                        </div>
                                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[50px] group-hover:bg-purple-400/30 transition-colors"></div>
                                    </button>
                                    
                                    {/* Active Gifts Log Button */}
                                    <button 
                                        onClick={() => setCurrentView('active_gifts')}
                                        className="group relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] p-8 flex items-center justify-between shadow-lg hover:shadow-gray-500/20 transition-all active:scale-98 border border-white/5 h-40 md:col-span-2"
                                    >
                                        <div className="z-10 text-right">
                                            <h3 className="text-2xl font-black text-white mb-2 group-hover:translate-x-1 transition-transform">سجل الإهداءات النشطة</h3>
                                            <p className="text-gray-400 text-sm font-medium">متابعة وحذف الإطارات الممنوحة</p>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                            <ClipboardListIcon className="w-8 h-8 text-white" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentView === 'active_gifts' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0f172a]">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {usersWithGifts.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 bg-gray-800/30 rounded-3xl border border-dashed border-gray-700">
                                    <SparklesIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="font-bold">لا توجد إهداءات نشطة</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {usersWithGifts.map(user => {
                                        // Calculate remaining days for frame
                                        const frameExpiry = user.specialFrameExpiry ? new Date(user.specialFrameExpiry) : null;
                                        const badgeExpiry = user.specialBadgeExpiry ? new Date(user.specialBadgeExpiry) : null;
                                        const now = new Date();
                                        
                                        const getExpiryText = (date: Date | null) => {
                                            if (!date) return 'دائم';
                                            const diffTime = date.getTime() - now.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            return diffDays > 0 ? `باقي ${diffDays} يوم` : 'منتهي';
                                        };

                                        return (
                                            <div key={user.id} className="bg-[#1e293b] p-4 rounded-2xl border border-gray-700 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                                        {user.storeImage ? <img src={user.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-gray-400" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-lg">{user.name}</h4>
                                                        <p className="text-gray-400 text-xs font-mono">{user.phone}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                                    {user.specialFrame && (
                                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3 flex-1">
                                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                                                                {user.specialFrame.startsWith('http') || user.specialFrame.startsWith('data:') ? (
                                                                    <img src={user.specialFrame} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[10px]">إطار</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs text-gray-300 font-bold">إطار</p>
                                                                <p className="text-[10px] text-yellow-500">{getExpiryText(frameExpiry)}</p>
                                                            </div>
                                                            <button onClick={() => handleRevokeGift(user, 'frame')} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                                        </div>
                                                    )}
                                                    
                                                    {user.specialBadge && (
                                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3 flex-1">
                                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                                                                 {user.specialBadge.startsWith('http') || user.specialBadge.startsWith('data:') ? (
                                                                    <img src={user.specialBadge} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[10px]">شارة</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs text-gray-300 font-bold">شارة</p>
                                                                <p className="text-[10px] text-blue-400">{getExpiryText(badgeExpiry)}</p>
                                                            </div>
                                                            <button onClick={() => handleRevokeGift(user, 'badge')} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentView === 'decorations' && (
                    <div className="flex flex-col h-full">
                        {/* Decoration Tabs (Fixed) */}
                        <div className="flex border-b border-gray-800 bg-[#151e2d] z-10 shadow-sm flex-none">
                            <button onClick={() => setDecoTab('frames')} className={`flex-1 py-4 font-bold text-sm transition-colors relative ${decoTab === 'frames' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                الإطارات (Frames)
                                {decoTab === 'frames' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>}
                            </button>
                            <button onClick={() => setDecoTab('badges')} className={`flex-1 py-4 font-bold text-sm transition-colors relative ${decoTab === 'badges' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                الشارات (Badges)
                                {decoTab === 'badges' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
                            </button>
                        </div>

                        {/* Toolbar (Fixed) */}
                        <div className="flex-none p-4 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-center">
                            <div>
                                <h3 className={`font-bold text-lg ${decoTab === 'frames' ? 'text-purple-400' : 'text-blue-400'}`}>
                                    {decoTab === 'frames' ? 'مكتبة الإطارات' : 'مكتبة الشارات'}
                                </h3>
                                <p className="text-xs text-gray-400">{decoTab === 'frames' ? 'صور GIF أو PNG شفافة.' : 'أوسمة تظهر بجانب الاسم.'}</p>
                            </div>
                            <button 
                                onClick={() => { setDecorationType(decoTab === 'frames' ? 'frame' : 'badge'); setIsAddDecorationOpen(true); }}
                                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg active:scale-95 ${decoTab === 'frames' ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'}`}
                            >
                                <PlusIcon className="w-4 h-4" /> إضافة جديد
                            </button>
                        </div>

                        {/* Grid Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0f172a]">
                            {decoTab === 'frames' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-10">
                                    {currentFrames.length > 0 ? currentFrames.map((frame: CustomDecoration) => (
                                        <div key={frame.id} className="bg-[#1e293b] p-4 rounded-xl border border-gray-700 flex flex-col items-center gap-3 relative group hover:border-purple-500 transition-colors shadow-sm">
                                            <div className="relative w-24 h-24 flex items-center justify-center">
                                                <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600">
                                                    <UserIcon className="w-10 h-10 text-gray-500" />
                                                </div>
                                                <img src={frame.url} className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10" alt={frame.label} />
                                            </div>
                                            
                                            <div className="text-center w-full">
                                                <p className="font-bold text-sm truncate w-full text-gray-200">{frame.label}</p>
                                            </div>

                                            <div className="flex gap-2 w-full justify-center">
                                                <button 
                                                    onClick={() => handleGiftClick(frame)}
                                                    className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-500/20 transition-colors flex items-center gap-1"
                                                >
                                                    <SparklesIcon className="w-3 h-3" /> إهداء
                                                </button>
                                                {currentUser?.role === 'admin' && (
                                                    <button 
                                                        onClick={() => handleDeleteDecoration(frame.id, 'frame')}
                                                        className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                        title="حذف من المكتبة"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p className="font-bold">المكتبة فارغة</p>
                                            <p className="text-xs">أضف إطارات مخصصة لتمييز المستخدمين</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pb-10">
                                    {currentBadges.length > 0 ? currentBadges.map((badge: CustomDecoration) => (
                                        <div key={badge.id} className="bg-[#1e293b] p-3 rounded-2xl border border-gray-700 flex flex-col items-center gap-3 relative group hover:border-blue-500 transition-colors shadow-sm">
                                            {/* Distinctive Container for Badge Preview */}
                                            <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-600 shadow-inner relative overflow-hidden group-hover:border-blue-500 transition-colors">
                                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <img src={badge.url} className="w-full h-full object-contain p-3 drop-shadow-md" alt={badge.label} />
                                            </div>
                                            
                                            <p className="font-bold text-xs truncate w-full text-center text-gray-200">{badge.label}</p>
                                            
                                            <div className="flex gap-2 w-full justify-center mt-auto">
                                                <button 
                                                    onClick={() => handleGiftClick(badge)}
                                                    className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-500/20 transition-colors flex-1 flex items-center justify-center gap-1"
                                                    title="إهداء"
                                                >
                                                    <SparklesIcon className="w-3 h-3" />
                                                </button>
                                                {currentUser?.role === 'admin' && (
                                                    <button 
                                                        onClick={() => handleDeleteDecoration(badge.id, 'badge')}
                                                        className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                        title="حذف من المكتبة"
                                                    >
                                                        <TrashIcon className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                                            <CrownIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p className="font-bold">المكتبة فارغة</p>
                                            <p className="text-xs">أضف شارات وأوسمة مميزة</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {currentView === 'categories' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-none p-6 border-b border-gray-800 bg-[#1a1a1a] flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-white">إدارة التصنيفات</h3>
                                <p className="text-xs text-gray-400">تعديل الأيقونات والمسميات في الصفحة الرئيسية</p>
                            </div>
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/20 active:scale-95"
                            >
                                <PlusIcon className="w-4 h-4" /> إضافة تصنيف
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#0f172a] custom-scrollbar">
                            <div className="grid gap-3 max-w-4xl mx-auto pb-10">
                                {categories.map((cat, idx) => {
                                    const DefaultIcon = cat.key === 'cat_all' ? CategoryIcons.All :
                                                        cat.key === 'cat_restaurant' ? CategoryIcons.Restaurant :
                                                        cat.key === 'cat_market' ? CategoryIcons.Market :
                                                        cat.key === 'cat_pharmacy' ? CategoryIcons.Pharmacy : GridIcon;

                                    return (
                                        <div key={cat.id} className="bg-[#1e293b] p-3 rounded-2xl border border-gray-700 flex items-center gap-4 group hover:border-gray-500 transition-colors shadow-sm">
                                            {/* Icon Uploader */}
                                            <div 
                                                onClick={() => handleUploadClick(cat.id)}
                                                className="w-14 h-14 bg-[#0f172a] rounded-xl flex items-center justify-center cursor-pointer border border-gray-600 hover:border-blue-500 relative overflow-hidden flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                                            >
                                                {isProcessing && activeIconKey === cat.id ? (
                                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                ) : cat.icon ? (
                                                    <img src={cat.icon} alt={cat.label} className="w-full h-full object-contain p-3" />
                                                ) : (
                                                    <DefaultIcon className="w-6 h-6 text-gray-500" />
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                                                    <PencilIcon className="w-4 h-4 text-white" />
                                                </div>
                                            </div>

                                            {/* Edit Label */}
                                            <div className="flex-1 min-w-0">
                                                <input 
                                                    type="text" 
                                                    value={cat.label}
                                                    onChange={(e) => handleLabelChange(cat.id, e.target.value)}
                                                    onBlur={saveCategories}
                                                    className="w-full bg-transparent text-white font-bold text-lg outline-none border-b border-transparent focus:border-blue-500 pb-1 transition-colors"
                                                />
                                                <p className="text-[10px] text-gray-500 truncate font-mono mt-1 opacity-60">ID: {cat.key}</p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                {cat.icon && (
                                                    <button 
                                                        onClick={() => handleRestoreDefaultIcon(cat.id)}
                                                        className="p-2.5 rounded-xl text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors border border-yellow-400/20"
                                                        title="استعادة الافتراضي"
                                                    >
                                                        <RefreshCwIcon className="w-4 h-4" />
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => handleToggleVisibility(cat.id)}
                                                    className={`p-2.5 rounded-xl transition-colors border ${cat.isVisible ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-gray-500 bg-gray-800 border-gray-700'}`}
                                                    title={cat.isVisible ? 'ظاهر' : 'مخفي'}
                                                >
                                                    {cat.isVisible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
                                                </button>
                                                
                                                {cat.id !== 'all' && (
                                                    <button 
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="p-2.5 rounded-xl text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors border border-red-400/20"
                                                        title="حذف"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Decoration Modal */}
            {isAddDecorationOpen && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsAddDecorationOpen(false)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-3xl border border-gray-700 shadow-2xl p-6 animate-pop-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <UploadIcon className="w-6 h-6 text-green-500" />
                            {decorationType === 'frame' ? 'إضافة إطار جديد' : 'إضافة شارة جديدة'}
                        </h3>
                        <div className="space-y-5">
                            {/* Image Preview / Upload */}
                            <div 
                                onClick={() => decorationInputRef.current?.click()}
                                className={`w-full h-40 bg-[#0f172a] border-2 border-dashed ${decorationImage ? 'border-green-500' : 'border-gray-600'} rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors group relative overflow-hidden`}
                            >
                                {decorationImage ? (
                                    <img src={decorationImage} alt="Preview" className="h-full object-contain p-4 animate-fadeIn" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-white" />
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">اضغط لرفع صورة (PNG/GIF)</span>
                                    </>
                                )}
                            </div>
                            <input ref={decorationInputRef} type="file" accept="image/png, image/gif" className="hidden" onChange={handleDecorationUpload} />

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">الاسم / الوصف</label>
                                <input 
                                    type="text" 
                                    value={decorationName}
                                    onChange={(e) => setDecorationName(e.target.value)}
                                    placeholder={decorationType === 'frame' ? "مثال: إطار ذهبي فاخر" : "مثال: شارة العميل المميز"}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3.5 text-white focus:border-green-500 outline-none transition-colors"
                                />
                            </div>
                            <button 
                                onClick={handleAddDecoration}
                                disabled={!decorationName.trim() || !decorationImage}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                حفظ الإضافة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Gift Modal */}
            {giftModalOpen && itemToGift && (
                <UserSelectorModal 
                    users={users} 
                    onClose={() => setGiftModalOpen(false)}
                    onSelect={handleGiftConfirm}
                    title={`إهداء ${itemToGift.type === 'frame' ? 'الإطار' : 'الشارة'} "${itemToGift.label}"`}
                />
            )}

            {/* Add Category Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-3xl border border-gray-700 shadow-2xl p-6 animate-pop-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <PlusIcon className="w-6 h-6 text-blue-500" />
                            إضافة تصنيف جديد
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">اسم التصنيف (سيظهر في التطبيق)</label>
                                <input 
                                    type="text" 
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="مثال: حلويات، مخبوزات..."
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3.5 text-white focus:border-blue-500 outline-none transition-colors"
                                    autoFocus
                                />
                            </div>
                            <button 
                                onClick={handleAddCategory}
                                disabled={!newCategoryName.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                إضافة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Confirmation Modal for Font/Category Deletion */}
            {confirmModal && (
                <ConfirmationModal 
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onClose={() => setConfirmModal(null)}
                    onConfirm={confirmModal.onConfirm}
                    confirmVariant={confirmModal.variant || 'primary'}
                    confirmButtonText="نعم، تنفيذ"
                />
            )}

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
    );
};

export default AppIconCustomizer;
