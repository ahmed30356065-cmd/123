
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, SliderImage, SliderConfig, AppTheme, Message } from '../../types';
import { SearchIcon, ClockIcon, StarIcon, TruckIconV2, UserIcon, UtensilsIcon, SparklesIcon, ChevronLeftIcon, RocketIcon, BellIcon, VerifiedIcon, CrownIcon, HeadsetIcon, MessageSquareIcon, CheckCircleIcon, TrashIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';
import AvatarFrame from '../common/AvatarFrame';

interface CustomerHomeProps {
    user: User;
    merchants: User[];
    onSelectMerchant: (merchant: User, category?: string) => void;
    sliderImages?: SliderImage[];
    sliderConfig?: SliderConfig;
    adminUser?: User;
    orders?: any[];
    onSpecialRequest: () => void;
    onOpenFavorites: () => void;
    onOpenMessages?: () => void;
    theme?: AppTheme;
    messageCount?: number;
    onOpenSupport?: () => void;
    unreadSupportCount?: number;
}

// Enhanced Default Icons
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

const BASE_CATEGORIES = [
    { id: 'all', key: 'cat_all', label: 'الكل', Icon: CategoryIcons.All },
    { id: 'restaurant', key: 'cat_restaurant', label: 'مطاعم', Icon: CategoryIcons.Restaurant },
    { id: 'market', key: 'cat_market', label: 'ماركت', Icon: CategoryIcons.Market },
    { id: 'pharmacy', key: 'cat_pharmacy', label: 'صيدلية', Icon: CategoryIcons.Pharmacy },
];

const isMerchantOpen = (merchant: User) => {
    if (!merchant.workingHours || !merchant.workingHours.start || !merchant.workingHours.end) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = merchant.workingHours.start.split(':').map(Number);
    const [endH, endM] = merchant.workingHours.end.split(':').map(Number);
    if (isNaN(startH) || isNaN(endH)) return true;
    const startTotal = startH * 60 + (startM || 0);
    const endTotal = endH * 60 + (endM || 0);
    if (endTotal < startTotal) return currentMinutes >= startTotal || currentMinutes < endTotal;
    return currentMinutes >= startTotal && currentMinutes < endTotal;
};

// --- SKELETON COMPONENT ---
const SkeletonCard = () => (
    <div className="bg-[#252525] rounded-[1.5rem] p-3 flex flex-col items-center border border-white/5 animate-pulse h-36">
        <div className="-mt-6 mb-2">
            <div className="w-14 h-14 rounded-full bg-gray-700 border-2 border-[#1A1A1A]"></div>
        </div>
        <div className="h-3 w-20 bg-gray-700 rounded-full mb-2"></div>
        <div className="h-2 w-10 bg-gray-700 rounded-full mb-3"></div>
    </div>
);

// --- MODERN COMPACT CARD COMPONENT ---
const ModernMerchantCard: React.FC<{ merchant: User, onClick: () => void, theme?: AppTheme }> = ({ merchant, onClick, theme }) => {
    const isOpen = isMerchantOpen(merchant);

    // Custom Icon Helper
    const getIcon = (key: string, DefaultIcon: any, className: string) => {
        const customIcon = theme?.customer?.icons?.[key];
        if (customIcon) return <img src={customIcon} className={`${className} object-contain`} alt={key} />;
        return <DefaultIcon className={className} />;
    };

    return (
        <button
            onClick={onClick}
            className={`group relative bg-[#252525] rounded-[1.2rem] p-3 pt-7 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 active:scale-95 shadow-md border ${!isOpen ? 'border-red-900/20 opacity-80' : 'border-white/5 hover:border-white/10'} overflow-visible h-full`}
        >
            {/* Image (Compact) */}
            <div className="absolute -top-5">
                <div className={`w-14 h-14 rounded-full p-0.5 bg-[#252525] shadow-lg ${!isOpen ? 'grayscale' : ''}`}>
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#1A1A1A] relative">
                        {merchant.storeImage ? (
                            <img src={merchant.storeImage} alt={merchant.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                                <UtensilsIcon className="w-5 h-5" />
                            </div>
                        )}
                        {!isOpen && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Title & Category */}
            <h3 className="text-white font-bold text-xs mb-0.5 leading-tight line-clamp-1 w-full mt-2">{merchant.name}</h3>
            <p className="text-gray-500 text-[9px] mb-2 font-medium">{merchant.storeCategory || 'عام'}</p>

            {/* Stats Row (Compact) */}
            <div className="flex items-center justify-center gap-1.5 w-full mt-auto">
                <div className="flex items-center gap-0.5 bg-[#1A1A1A] px-1.5 py-0.5 rounded border border-white/5">
                    <ClockIcon className="w-2.5 h-2.5 text-blue-400" />
                    <span className="text-gray-300 text-[8px] font-bold">{merchant.responseTime || '30'} د</span>
                </div>

                <div className="flex items-center gap-0.5 bg-[#1A1A1A] px-1.5 py-0.5 rounded border border-white/5">
                    {getIcon('ic_star', StarIcon, "w-2.5 h-2.5 text-yellow-500 fill-current")}
                    <span className="text-gray-300 text-[8px] font-bold">4.8</span>
                </div>
            </div>
            {merchant.hasFreeDelivery && (
                <div className="absolute top-2 right-2">
                    <TruckIconV2 className="w-2.5 h-2.5 text-green-500" />
                </div>
            )}
        </button>
    );
};

const CustomerHome: React.FC<CustomerHomeProps> = ({ user, merchants, onSelectMerchant, sliderImages = [], sliderConfig, onSpecialRequest, onOpenFavorites, adminUser, theme, messageCount = 0, onOpenMessages, onOpenSupport, unreadSupportCount = 0 }) => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [greeting, setGreeting] = useState('مرحباً');
    const [isLoading, setIsLoading] = useState(true);

    const [headerOpacity, setHeaderOpacity] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Notification Dropdown State
    const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
    const notifDropdownRef = useRef<HTMLDivElement>(null);

    useAndroidBack(() => {
        if (isNotifDropdownOpen) {
            setIsNotifDropdownOpen(false);
            return true;
        }
        return false;
    }, [isNotifDropdownOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
                setIsNotifDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollY = container.scrollTop;
            const opacity = Math.min(scrollY / 80, 0.95);
            setHeaderOpacity(opacity);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const firstName = user.name ? user.name.split(' ')[0] : 'يا غالي';
        setGreeting(`هلا، ${firstName}`);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [user.name]);

    // Robust slider checks
    const isSliderEnabled = sliderConfig?.isEnabled !== false;

    const activeImages = useMemo(() => {
        if (!sliderImages || !Array.isArray(sliderImages)) return [];
        // Loose check to handle potential string conversions or legacy data
        return sliderImages.filter(img => img && img.url && img.active !== false && String(img.active) !== 'false');
    }, [sliderImages]);

    // Dynamic Categories from Theme
    const displayCategories = useMemo(() => {
        if (theme?.customer?.categories && theme.customer.categories.length > 0) {
            const sorted = [...theme.customer.categories].sort((a, b) => a.sortOrder - b.sortOrder);
            return sorted.filter(c => c.isVisible).map(c => {
                // Correctly map default icons based on key
                let DefaultIcon = CategoryIcons.All;
                if (c.key === 'cat_restaurant') DefaultIcon = CategoryIcons.Restaurant;
                else if (c.key === 'cat_market') DefaultIcon = CategoryIcons.Market;
                else if (c.key === 'cat_pharmacy') DefaultIcon = CategoryIcons.Pharmacy;

                return {
                    id: c.id,
                    label: c.label,
                    Icon: DefaultIcon,
                    customIcon: c.icon, // URL from theme
                };
            });
        }
        return BASE_CATEGORIES;
    }, [theme?.customer?.categories]);

    // Set default active category
    useEffect(() => {
        if (displayCategories.length > 0 && !displayCategories.find(c => c.id === activeCategory)) {
            setActiveCategory(displayCategories[0].id);
        }
    }, [displayCategories, activeCategory]);

    // Reset slide to 0 if the data changes
    useEffect(() => {
        setCurrentSlide(0);
    }, [activeImages.length]);

    useEffect(() => {
        if (isSliderEnabled && activeImages.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % activeImages.length);
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [activeImages.length, isSliderEnabled]);

    const filteredMerchants = merchants.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
        let categoryMatch = true;

        // Check if active category is "all" or specific
        if (activeCategory !== 'all') {
            const activeCatObj = displayCategories.find(c => c.id === activeCategory);
            if (activeCatObj) {
                // Match merchant category label OR id
                // Most merchants save the label (e.g. "مطعم") in storeCategory
                categoryMatch = m.storeCategory === activeCatObj.label || m.storeCategory === activeCatObj.id;

                // Fallback for legacy "restaurant" etc. if needed, but strict matching is cleaner for custom cats
                if (!categoryMatch && activeCatObj.id === 'restaurant' && m.storeCategory === 'مطعم') categoryMatch = true;
                if (!categoryMatch && activeCatObj.id === 'market' && m.storeCategory === 'سوبر ماركت') categoryMatch = true;
                if (!categoryMatch && activeCatObj.id === 'pharmacy' && m.storeCategory === 'صيدلية') categoryMatch = true;
            }
        }
        return matchesSearch && categoryMatch;
    });

    const handleSlideClick = (img: SliderImage) => {
        if (img.linkedMerchantId) {
            const linkedMerchant = merchants.find(m => m.id === img.linkedMerchantId);
            if (linkedMerchant) {
                onSelectMerchant(linkedMerchant, img.linkedCategoryId);
            }
        }
    };

    const getIcon = (key: string, DefaultIcon: any, className: string) => {
        const customIcon = theme?.customer?.icons?.[key];
        if (customIcon) {
            return <img src={customIcon} className={`${className} object-contain`} alt={key} />;
        }
        return <DefaultIcon className={className} />;
    };

    // Reuse the Frame Style logic (duplicated to avoid circular deps for now, or could be utils)
    const getFrameContainerClass = (type?: string) => {
        if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0';
        switch (type) {
            case 'gold': return 'p-[2px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.4)]';
            case 'neon': return 'p-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
            case 'royal': return 'p-[2px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-sm border border-purple-500/30';
            case 'fire': return 'p-[2px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
            default: return 'p-[2px] bg-gradient-to-tr from-red-500 to-orange-500'; // Default gradient
        }
    };

    const getBadgeIcon = (type?: string) => {
        if (!type || type === 'none') return null;

        if (type?.startsWith('data:') || type?.startsWith('http')) {
            // Professional Container for Custom Images
            return (
                <div className="w-6 h-6 min-w-[1.5rem] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-sm overflow-hidden p-0.5 ml-1 backdrop-blur-sm">
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

        if (IconComponent) return <IconComponent className={`w-4 h-4 ml-1 ${styleClass}`} />;
        return null;
    };

    const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

    const totalNotifications = (unreadSupportCount || 0) + (messageCount || 0);

    const handleNotificationClick = (type: 'support' | 'message') => {
        setIsNotifDropdownOpen(false);
        if (type === 'support') {
            if (onOpenSupport) onOpenSupport();
        } else {
            if (onOpenMessages) onOpenMessages();
        }
    };

    const handleClearNotifications = () => {
        // Just visual clearing in this context, or navigating to messages to mark read
        setIsNotifDropdownOpen(false);
        if (onOpenMessages) onOpenMessages(); // Navigate to clear
    };

    return (
        <div className="h-[100dvh] flex flex-col relative overflow-hidden bg-[#1A1A1A] text-white font-sans">

            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* 1. Professional Header with Safe Area Padding */}
            <div
                className="px-5 pt-safe pb-3 absolute top-0 left-0 right-0 z-50 transition-colors duration-200 box-content will-change-transform"
                style={{
                    backgroundColor: `rgba(26, 26, 26, ${headerOpacity})`,
                    backdropFilter: `blur(${headerOpacity * 12}px)`,
                    borderBottom: `1px solid rgba(255,255,255,${headerOpacity * 0.05})`,
                    boxShadow: `0 4px 20px rgba(0,0,0,${headerOpacity * 0.1})`
                }}
            >
                <div className="flex justify-between items-center mb-3 mt-1">
                    {/* Right: User Profile (Professional Transparent Container) */}
                    <div className="flex items-center">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full pr-1 pl-4 py-1 flex items-center gap-3 shadow-lg">
                            <div className="relative">
                                <AvatarFrame
                                    frameId={user.specialFrame}
                                    size="sm"
                                    className="scale-110"
                                >
                                    <div className="w-full h-full rounded-full bg-[#1A1A1A] overflow-hidden relative z-0 flex items-center justify-center">
                                        {user.storeImage ? (
                                            <img src={user.storeImage} alt="User" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-[#252525] flex items-center justify-center">
                                                <UserIcon className="w-4 h-4 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </AvatarFrame>
                            </div>

                            <div className="flex flex-col items-start animate-fade-slide-up">
                                <span className="text-gray-300 text-[9px] font-medium mb-0.5 flex items-center gap-1 opacity-90">
                                    {greeting}،
                                    <span className="text-yellow-500 animate-pulse">✨</span>
                                </span>
                                <h1 className="text-xs font-black text-white tracking-wide leading-none flex items-center gap-1">
                                    {user.name.split(' ')[0]}
                                    {getBadgeIcon(user.specialBadge)}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Left: Professional Notification Button & Dropdown */}
                    <div className="relative" ref={notifDropdownRef}>
                        <button
                            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                            className={`relative w-10 h-10 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition-all active:scale-90 shadow-sm ${totalNotifications > 0 ? 'animate-swing' : ''}`}
                        >
                            <BellIcon className={`w-5 h-5 ${totalNotifications > 0 ? 'text-white' : 'text-gray-300'}`} />
                            {totalNotifications > 0 && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#1A1A1A] animate-pulse"></span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotifDropdownOpen && (
                            <div className="absolute top-12 left-0 w-64 bg-[#1e1e1e] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-pop-in origin-top-left">
                                <div className="p-3 border-b border-gray-700/50 bg-[#252525] flex justify-between items-center">
                                    <span className="text-xs font-bold text-white">الإشعارات</span>
                                    {totalNotifications > 0 && (
                                        <button onClick={handleClearNotifications} className="text-[10px] text-gray-400 hover:text-white transition-colors">
                                            تنظيف الكل
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                    {totalNotifications === 0 ? (
                                        <div className="text-center py-6 text-gray-500">
                                            <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-[10px]">لا توجد إشعارات جديدة</p>
                                        </div>
                                    ) : (
                                        <>
                                            {unreadSupportCount > 0 && (
                                                <button
                                                    onClick={() => handleNotificationClick('support')}
                                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-right"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0 border border-green-500/30">
                                                        <HeadsetIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-white mb-0.5">رد من الدعم الفني</p>
                                                        <p className="text-[10px] text-gray-400 truncate">لديك {unreadSupportCount} رسائل غير مقروءة</p>
                                                    </div>
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                </button>
                                            )}

                                            {messageCount !== undefined && messageCount > 0 && (
                                                <button
                                                    onClick={() => handleNotificationClick('message')}
                                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-right"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                                                        <MessageSquareIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-white mb-0.5">رسالة إدارية</p>
                                                        <p className="text-[10px] text-gray-400 truncate">لديك {messageCount} رسائل جديدة من الإدارة</p>
                                                    </div>
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compact Search Bar */}
                <div className="relative mb-1">
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none">
                        {getIcon('ic_search', SearchIcon, "w-3.5 h-3.5 text-gray-500")}
                    </div>
                    <input
                        type="text"
                        className="w-full bg-[#252525] text-white text-xs rounded-xl py-2.5 pr-9 pl-4 outline-none focus:ring-1 focus:ring-red-500/30 transition-all placeholder-gray-500 border border-white/5 shadow-inner"
                        placeholder="ابحث عن وجبتك المفضلة..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pb-28 pt-28 scroll-smooth overscroll-none relative"
                onScroll={(e) => {
                    const target = e.currentTarget;
                    const opacity = Math.min(target.scrollTop / 80, 0.95);
                    setHeaderOpacity(opacity);
                }}
            >
                {/* Add extra padding top to account for safe area and fixed header */}
                <div className="space-y-4 pt-safe">

                    {/* 2. Compact Slider - Fixed Height and Z-Index - ONLY IF ENABLED AND HAS IMAGES */}
                    {isSliderEnabled && activeImages.length > 0 && (
                        <div className="px-5 relative z-10 h-36 sm:h-40">
                            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg group cursor-pointer border border-white/5 bg-gray-800">
                                {activeImages.map((img, index) => {
                                    const linkedEntity = img.linkedMerchantId
                                        ? (img.linkedMerchantId === adminUser?.id ? adminUser : merchants.find(m => m.id === img.linkedMerchantId))
                                        : null;
                                    const isActive = index === currentSlide;

                                    return (
                                        <div
                                            key={img.id}
                                            onClick={() => handleSlideClick(img)}
                                            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out cursor-pointer ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                        >
                                            <img
                                                src={img.url}
                                                className={`w-full h-full object-cover block transition-transform duration-[10000ms] ease-linear ${isActive ? 'scale-110' : 'scale-100'}`}
                                                alt="Banner"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none"></div>

                                            {/* Linked Account Info (Bottom Right) */}
                                            {linkedEntity && (
                                                <div className="absolute bottom-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 pr-1 pl-3 py-1 rounded-full animate-fade-slide-up">
                                                        <div className="w-6 h-6 rounded-full border border-white/50 overflow-hidden bg-gray-800">
                                                            {linkedEntity.storeImage ? <img src={linkedEntity.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-1 text-gray-400" />}
                                                        </div>
                                                        <span className="text-[9px] font-bold text-white max-w-[80px] truncate">
                                                            {linkedEntity.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Text Overlay (Bottom Left) */}
                                            {img.textOverlay && (
                                                <div className="absolute bottom-3 left-3 max-w-[50%] z-20 flex flex-col items-start animate-fade-slide-up">
                                                    <div className="bg-black/30 backdrop-blur-md border border-white/10 px-2 py-1.5 rounded-lg shadow-lg">
                                                        <p className="text-white font-bold text-[10px] leading-relaxed drop-shadow-md">
                                                            {img.textOverlay}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                                    {activeImages.map((_, idx) => (
                                        <div key={idx} className={`w-1 h-1 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-3' : 'bg-white/40'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Special Request (Compact) */}
                    <div className="px-5 animate-fade-slide-up" style={{ animationDelay: '0.05s' }}>
                        <button
                            onClick={onSpecialRequest}
                            className="w-full bg-gradient-to-r from-[#2A1010] to-[#1A0B0B] rounded-2xl border border-red-500/20 p-2.5 flex items-center justify-between group active:scale-98 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                                    {/* Changed from SparklesIcon to RocketIcon as requested */}
                                    {getIcon('ic_special', RocketIcon, "w-3.5 h-3.5")}
                                </div>
                                <div className="text-right">
                                    <h3 className="text-white font-bold text-xs">طلب خاص</h3>
                                    <p className="text-gray-500 text-[9px] mt-0.5">مشاوير أو طلبات خاصة.</p>
                                </div>
                            </div>
                            <div className="text-gray-600 group-hover:text-red-500 transition-colors">
                                <ChevronLeftIcon className="w-4 h-4" />
                            </div>
                        </button>
                    </div>

                    {/* 3. Compact Categories */}
                    <div className="px-5 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                التصنيفات
                            </h3>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                            {isLoading ? (
                                [1, 2, 3, 4].map(i => <div key={i} className="h-8 w-16 bg-[#252525] rounded-xl animate-pulse"></div>)
                            ) : (
                                displayCategories.map((cat) => {
                                    const isActive = activeCategory === cat.id;
                                    const Icon = (cat as any).Icon;
                                    const customImg = (cat as any).customIcon;

                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`
                                        flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all duration-200 border
                                        ${isActive
                                                    ? 'bg-white text-black border-white shadow-sm scale-105 z-10'
                                                    : 'bg-[#252525] text-gray-400 border-transparent hover:bg-[#303030]'
                                                }
                                    `}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isActive ? 'bg-black text-white' : 'bg-white/5 text-gray-500'}`}>
                                                {customImg ? (
                                                    /* Masked Image for Color Consistency */
                                                    <div
                                                        className={`w-3 h-3 ${isActive ? 'bg-white' : 'bg-gray-500'}`}
                                                        style={{
                                                            maskImage: `url(${customImg})`,
                                                            maskSize: 'contain',
                                                            maskRepeat: 'no-repeat',
                                                            maskPosition: 'center',
                                                            WebkitMaskImage: `url(${customImg})`,
                                                            WebkitMaskSize: 'contain',
                                                            WebkitMaskRepeat: 'no-repeat',
                                                            WebkitMaskPosition: 'center'
                                                        }}
                                                    />
                                                ) : (
                                                    <Icon className="w-3 h-3" />
                                                )}
                                            </div>
                                            {cat.label}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 4. Grid (Compact Vertical Cards) */}
                    <div className="px-5 pb-10 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            {isLoading ? (
                                <>
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </>
                            ) : (
                                filteredMerchants.length > 0 ? (
                                    filteredMerchants.map((merchant) => (
                                        <ModernMerchantCard
                                            key={merchant.id}
                                            merchant={merchant}
                                            onClick={() => onSelectMerchant(merchant)}
                                            theme={theme}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-2 py-12 text-center flex flex-col items-center justify-center bg-[#252525] rounded-2xl border border-white/5 border-dashed">
                                        <SearchIcon className="w-8 h-8 text-gray-600 mb-2 opacity-50" />
                                        <p className="text-gray-400 text-[10px] font-bold">لا توجد متاجر متاحة</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerHome;
