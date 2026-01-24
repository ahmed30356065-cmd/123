
import React, { useState, useEffect, useMemo } from 'react';
import { User, SliderImage, SliderConfig } from '../types';
import { ShoppingCartIcon, CarIcon, TruckIconV2, UserIcon, RocketIcon } from './icons';

interface LandingScreenProps {
    user: User;
    onNavigate: (view: string, params?: any) => void;
    sliderImages?: SliderImage[];
    sliderConfig?: SliderConfig;
    adminUser?: User;
    merchants?: User[];
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
        className={`relative w-full h-32 sm:h-36 mt-4 group animate-fade-slide-up`}
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

        {/* Card Body - Clipped */}
        <div className={`relative w-full h-full bg-[#252525] rounded-[1.2rem] p-3 pt-8 flex flex-col items-center text-center overflow-hidden border border-white/5 group-hover:border-white/10 shadow-md group-hover:shadow-xl transition-all duration-300 active:scale-95`}>
            
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
    </button>
);

// Reuse the Frame Style logic (duplicated to avoid circular deps for now, or could be utils)
const getFrameContainerClass = (type?: string) => {
    switch(type) {
        case 'gold': return 'p-[2px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.4)]';
        case 'neon': return 'p-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
        case 'royal': return 'p-[2px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-sm border border-purple-500/30';
        case 'fire': return 'p-[2px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
        default: return 'p-[2px] bg-gradient-to-tr from-red-500 to-orange-500'; // Default gradient
    }
};

const LandingScreen: React.FC<LandingScreenProps> = ({ user, onNavigate, sliderImages = [], sliderConfig, adminUser, merchants = [] }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [greeting, setGreeting] = useState('أهلاً');
    
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

    return (
        <div className="h-full bg-[#1A1A1A] text-white flex flex-col font-sans overflow-hidden">
            
            {/* Header (Professional Redesign) */}
            <div className="flex-none pt-safe px-6 pb-4 flex justify-between items-center bg-[#1A1A1A] z-40 border-b border-white/5 relative">
                <div className="flex flex-col animate-fade-slide-up">
                    <span className="text-gray-400 text-xs font-medium mb-1 flex items-center gap-1 opacity-80">
                        {greeting}، 
                        <span className="text-yellow-500">✨</span>
                    </span>
                    <h1 className="text-2xl font-black text-white tracking-wide leading-none">
                        {user.name.split(' ')[0]} 👋
                    </h1>
                </div>
                
                {/* Profile Button with Dynamic Frame */}
                <button 
                    onClick={() => onNavigate('profile')}
                    className="relative group"
                >
                    <div className={`w-12 h-12 rounded-full shadow-lg group-active:scale-95 transition-transform ${getFrameContainerClass(user.specialFrame)}`}>
                        <div className="w-full h-full rounded-full bg-[#1A1A1A] p-[2px] overflow-hidden">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                                {user.storeImage ? (
                                    <img src={user.storeImage} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#252525] flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Online/Status Indicator */}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full border border-[#1A1A1A]"></div>
                    </div>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-20 space-y-4 relative z-0">
                
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