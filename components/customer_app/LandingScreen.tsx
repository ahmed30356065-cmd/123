
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, SliderImage, SliderConfig } from '../../types';
import { ShoppingCartIcon, CarIcon, TruckIconV2, UserIcon, RocketIcon, BellIcon, HeadsetIcon, MessageSquareIcon, VerifiedIcon, CrownIcon, StarIcon, CheckCircleIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface LandingScreenProps {
    user: User;
    onNavigate: (view: string, params?: any) => void;
    sliderImages?: SliderImage[];
    sliderConfig?: SliderConfig;
    adminUser?: User;
    merchants?: User[];
    messageCount?: number;
    // New Props for Notification logic
    onOpenMessages?: () => void;
    onOpenSupport?: () => void;
    unreadSupportCount?: number;
}

const ServiceCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    colors: { bg: string; border: string; text: string; iconBg: string; accent: string };
    onClick: () => void;
    delay?: number;
}> = ({ title, description, icon, colors, onClick, delay = 0 }) => (
    <button
        onClick={onClick}
        className={`relative w-full h-32 sm:h-36 mt-4 group animate-fade-slide-up select-none`}
        style={{ animationDelay: `${delay}ms` }}
    >
        {/* Floating Icon - Outside Top */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
             <div className={`w-10 h-10 rounded-full p-1 bg-[#252525] shadow-lg group-hover:-translate-y-1 transition-transform duration-300`}>
                <div className={`w-full h-full rounded-full flex items-center justify-center ${colors.iconBg} border border-white/5`}>
                    {icon}
                </div>
             </div>
        </div>

        {/* Wrapper for Scaling Border + Body */}
        <div className="relative w-full h-full transition-all duration-300 active:scale-95 rounded-[1.2rem]">
            
            {/* Animated Border Background */}
            <div className="absolute -inset-[1px] rounded-[1.25rem] overflow-hidden z-0">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(transparent,transparent,#ff0000,#ff8000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] opacity-100"></div>
            </div>

            {/* Card Body - Clipped */}
            <div className={`relative w-full h-full bg-[#252525] rounded-[1.2rem] p-3 pt-8 flex flex-col items-center text-center overflow-hidden z-10 shadow-md group-hover:shadow-xl`}>
                
                {/* Top Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-b ${colors.accent} to-transparent opacity-10 group-hover:opacity-20 transition-opacity`}></div>

                {/* Text */}
                <div className="relative z-10 w-full mt-1">
                    <h3 className={`text-xs font-bold ${colors.text} mb-1 leading-tight group-hover:text-white transition-colors`}>{title}</h3>
                    <p className="text-[9px] text-gray-500 font-medium line-clamp-2 leading-relaxed px-1">
                        {description}
                    </p>
                </div>
                
                {/* Bottom Hover Line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 ${colors.text.replace('text-', 'bg-')} transition-all duration-500 group-hover:w-1/2 opacity-50`}></div>
            </div>
        </div>
    </button>
);

// Reuse the Frame Style logic (duplicated to avoid circular deps for now, or could be utils)
const getFrameContainerClass = (type?: string) => {
    if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0';
    switch(type) {
        case 'gold': return 'p-[2px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.5)]';
        case 'neon': return 'p-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]';
        case 'royal': return 'p-[4px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-xl border border-purple-500/30';
        case 'fire': return 'p-[4px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]';
        default: return 'p-0'; 
    }
};

const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

const LandingScreen: React.FC<LandingScreenProps> = ({ user, onNavigate, sliderImages = [], sliderConfig, adminUser, merchants = [], messageCount = 0, onOpenMessages, onOpenSupport, unreadSupportCount = 0 }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [greeting, setGreeting] = useState('أهلاً');
    
    // Header Scroll Effect State
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

    // Check if slider is enabled globally
    const isSliderEnabled = sliderConfig?.isEnabled !== false; 
    
    const activeImages = useMemo(() => {
        if (!sliderImages || !Array.isArray(sliderImages)) return [];
        return sliderImages.filter(img => img && img.url && img.active !== false);
    }, [sliderImages]);

    useEffect(() => {
        const hours = new Date().getHours();
        if (hours < 12) setGreeting('صباح الخير');
        else if (hours < 18) setGreeting('مساء الخير');
        else setGreeting('مساء النور');
    }, []);

    // Reset slide index if images change
    useEffect(() => {
        setCurrentSlide(0);
    }, [activeImages.length]);

    // Auto-play logic
    useEffect(() => {
        if (isSliderEnabled && activeImages.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % activeImages.length);
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [activeImages.length, isSliderEnabled]);

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
        switch(type) {
            case 'verified': IconComponent = VerifiedIcon; styleClass = "text-blue-400 fill-blue-500/20"; break;
            case 'vip': IconComponent = CrownIcon; styleClass = "text-yellow-400 fill-yellow-500/20"; break;
            case 'star': IconComponent = StarIcon; styleClass = "text-purple-400 fill-purple-500/20"; break;
            case 'popular': IconComponent = RocketIcon; styleClass = "text-red-400 fill-red-500/20"; break;
        }
        
        if (IconComponent) return <IconComponent className={`w-4 h-4 ml-1 ${styleClass}`} />;
        return null;
    };

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
         setIsNotifDropdownOpen(false);
         if (onOpenMessages) onOpenMessages(); 
    };

    return (
        <div className="h-full bg-[#1A1A1A] text-white flex flex-col font-sans overflow-hidden">
            
            {/* Header (Professional Redesign - Consistent with CustomerHome) */}
            <div 
                className="px-5 pt-safe pb-3 absolute top-0 left-0 right-0 z-50 transition-colors duration-200 box-content will-change-transform"
                style={{ 
                    backgroundColor: `rgba(26, 26, 26, ${headerOpacity})`, 
                    backdropFilter: `blur(${headerOpacity * 12}px)`,
                    borderBottom: `1px solid rgba(255,255,255,${headerOpacity * 0.05})`,
                    boxShadow: `0 4px 20px rgba(0,0,0,${headerOpacity * 0.1})`
                }}
            >
                <div className="flex justify-between items-center mt-1">
                    
                    {/* Right: User Profile (Professional Transparent Container) */}
                    <button onClick={() => onNavigate('profile')} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full pr-1 pl-4 py-1 flex items-center gap-3 shadow-lg active:scale-95 transition-all">
                        <div className="relative">
                            <div className={`w-9 h-9 rounded-full relative flex items-center justify-center ${!isCustomFrame(user.specialFrame) ? getFrameContainerClass(user.specialFrame) : ''}`}>
                                {isCustomFrame(user.specialFrame) && (
                                    <img src={user.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-[1.7] pointer-events-none" alt="frame" />
                                )}
                                <div className={`${isCustomFrame(user.specialFrame) ? 'w-[85%] h-[85%]' : 'w-full h-full'} rounded-full bg-[#1A1A1A] overflow-hidden relative z-0 flex items-center justify-center`}>
                                    {user.storeImage ? (
                                        <img src={user.storeImage} alt="User" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full bg-[#252525] flex items-center justify-center">
                                            <UserIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
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
                    </button>

                    {/* Left: Professional Notification Button & Dropdown */}
                    <div className="relative pointer-events-auto" ref={notifDropdownRef}>
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
                                            {unreadSupportCount !== undefined && unreadSupportCount > 0 && (
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
            </div>

            {/* Scrollable Content */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pb-20 space-y-4 relative z-0 pt-24"
                onScroll={(e) => {
                    const target = e.currentTarget;
                    const opacity = Math.min(target.scrollTop / 80, 0.95);
                    setHeaderOpacity(opacity);
                }}
            >
                
                {/* 1. Professional Slider Section */}
                {/* ONLY RENDER IF THERE ARE ACTIVE IMAGES AND SLIDER IS ENABLED */}
                {isSliderEnabled && activeImages.length > 0 && (
                    <div className="px-4 mt-3 w-full relative z-10 h-40 sm:h-44">
                        <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden shadow-2xl border border-white/5 bg-gray-800">
                            {activeImages.map((img, index) => {
                                const linkedEntity = img.linkedMerchantId 
                                    ? (img.linkedMerchantId === adminUser?.id ? adminUser : merchants.find(m => m.id === img.linkedMerchantId))
                                    : null;
                                
                                return (
                                    <div 
                                        key={img.id}
                                        onClick={() => {
                                            // Handle linking if attached
                                            if (img.linkedMerchantId) {
                                                onNavigate('store-list'); 
                                            }
                                        }}
                                        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out cursor-pointer ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        <img 
                                            src={img.url} 
                                            className="w-full h-full object-cover block" 
                                            alt="Offer" 
                                        />
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                                        
                                        {/* Linked Account Info (Bottom Right) */}
                                        {linkedEntity && (
                                            <div className="absolute bottom-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                                                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 pr-1 pl-3 py-1 rounded-full animate-fade-slide-up">
                                                    <div className="w-7 h-7 rounded-full border border-white/50 overflow-hidden bg-gray-800">
                                                        {linkedEntity.storeImage ? <img src={linkedEntity.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-1 text-gray-400" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-white max-w-[100px] truncate">
                                                        {linkedEntity.id === adminUser?.id ? 'DELI NOW' : linkedEntity.name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Text Overlay (Bottom Left) */}
                                        {img.textOverlay && (
                                            <div className="absolute bottom-3 left-3 max-w-[50%] z-20 flex flex-col items-start animate-fade-slide-up">
                                                <div className="bg-black/30 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl shadow-lg">
                                                    <p className="text-white font-bold text-xs leading-relaxed drop-shadow-md">
                                                        {img.textOverlay}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* Dots Indicator */}
                            {activeImages.length > 1 && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none">
                                    {activeImages.map((_, idx) => (
                                        <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/30 w-1'}`}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Services Grid */}
                <div className="px-4 pb-4 relative z-10">
                    <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-red-600 rounded-full"></span>
                        الخدمات المتاحة
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <ServiceCard 
                            title="اطلب أي حاجة"
                            description="مندوب خاص لكل مشاويرك"
                            icon={<RocketIcon className="w-5 h-5 text-purple-300" />}
                            colors={{ 
                                bg: 'bg-[#252525]', 
                                border: 'border-purple-500/20', 
                                text: 'text-purple-400', 
                                iconBg: 'bg-purple-500/10',
                                accent: 'from-purple-900'
                            }}
                            onClick={() => onNavigate('special-request')}
                            delay={100}
                        />

                        <ServiceCard 
                            title="المتاجر والمطاعم"
                            description="تصفح قوائم الطعام واطلب"
                            icon={<ShoppingCartIcon className="w-5 h-5 text-orange-300" />}
                            colors={{ 
                                bg: 'bg-[#252525]', 
                                border: 'border-orange-500/20', 
                                text: 'text-orange-400', 
                                iconBg: 'bg-orange-500/10',
                                accent: 'from-orange-900'
                            }}
                            onClick={() => onNavigate('store-list')}
                            delay={200}
                        />

                        <ServiceCard 
                            title="وصلني"
                            description="قريباً - مشاوير سريعة"
                            icon={<CarIcon className="w-5 h-5 text-blue-300" />}
                            colors={{ 
                                bg: 'bg-[#252525]', 
                                border: 'border-blue-500/20', 
                                text: 'text-blue-400', 
                                iconBg: 'bg-blue-500/10',
                                accent: 'from-blue-900'
                            }}
                            onClick={() => onNavigate('ride')}
                            delay={300}
                        />

                        <ServiceCard 
                            title="شحن بضائع"
                            description="قريباً - نقل وشحن"
                            icon={<TruckIconV2 className="w-5 h-5 text-green-300" />}
                            colors={{ 
                                bg: 'bg-[#252525]', 
                                border: 'border-green-500/20', 
                                text: 'text-green-400', 
                                iconBg: 'bg-green-500/10',
                                accent: 'from-green-900'
                            }}
                            onClick={() => onNavigate('transport')}
                            delay={400}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingScreen;
