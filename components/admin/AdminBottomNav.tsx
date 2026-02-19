
import React from 'react';
import {
    TruckIconV2, UsersIcon, StoreIcon, HeadsetIcon,
    MessageSquareIcon, ImageIcon, DollarSignIcon, SettingsIcon,
    RocketIcon, ShoppingCartIcon, GamepadIcon // Added new icons
} from '../icons';

export type AdminView = 'orders' | 'users' | 'stores' | 'notifications' | 'wallet' | 'messages' | 'settings' | 'slider' | 'customizer' | 'support' | 'games' | 'shopping' | 'special';

interface AdminBottomNavProps {
    activeView: AdminView;
    onNavigate: (view: AdminView) => void;
    availableViews?: string[];
    isVisible?: boolean;
    mode?: 'light' | 'dark';
}

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeView, onNavigate, availableViews, isVisible = true, mode = 'dark' }) => {
    // قم بتغيير هذه القيمة إلى 'v1' للعودة للتصميم القديم
    const navVersion: string = 'v4';

    const allNavItems = [
        { id: 'orders', label: 'الرئيسية', icon: TruckIconV2, color: 'rgb(239, 68, 68)' },
        { id: 'users', label: 'المستخدمين', icon: UsersIcon, color: 'rgb(59, 130, 246)' },
        { id: 'stores', label: 'المتاجر', icon: StoreIcon, color: 'rgb(168, 85, 247)' },
        { id: 'special', label: 'خدمة خاصة', icon: RocketIcon, color: 'rgb(245, 158, 11)' },
        { id: 'shopping', label: 'تسوق', icon: ShoppingCartIcon, color: 'rgb(16, 185, 129)' },
        { id: 'slider', label: 'العروض', icon: ImageIcon, color: 'rgb(236, 72, 153)' },
        { id: 'wallet', label: 'المحفظة', icon: DollarSignIcon, color: 'rgb(34, 197, 94)' },
        { id: 'games', label: 'الألعاب', icon: GamepadIcon, color: 'rgb(99, 102, 241)' },
        { id: 'settings', label: 'الإعدادات', icon: SettingsIcon, color: 'rgb(107, 114, 128)' },
    ];

    const handleNavigation = (viewId: string) => {
        try {
            onNavigate(viewId as AdminView);
        } catch (e: any) {
            console.error("Navigation error:", e);
        }
    };

    const navItemsToShow = availableViews
        ? allNavItems.filter(item => availableViews.includes(item.id))
        : allNavItems.filter(item => ['orders', 'users', 'special', 'shopping', 'wallet', 'settings'].includes(item.id));

    const isLight = mode === 'light';

    // --- التصميم القديم (V1) ---
    if (navVersion === 'v1') {
        return (
            <div className={`fixed left-4 right-4 z-40 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0 bottom-8' : 'translate-y-[150%] bottom-8'}`}>
                <nav className={`${isLight ? 'bg-white/95 border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)]' : 'bg-gray-800/95 border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.4)]'} backdrop-blur-xl border flex justify-around items-center h-[70px] rounded-[30px] px-2 transition-colors duration-300`}>
                    {navItemsToShow.map(item => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button key={item.id} onClick={() => handleNavigation(item.id)} className="group relative flex-1 h-full flex flex-col items-center justify-center outline-none select-none" type="button">
                                <div className={`relative transition-all duration-300 ease-out p-2 rounded-2xl ${isActive ? '-translate-y-2' : 'translate-y-1'}`}>
                                    <div className={`absolute inset-0 bg-red-600 rounded-2xl transition-all duration-300 ${isActive ? 'opacity-100 scale-100 rotate-3' : 'opacity-0 scale-50 rotate-0'}`}></div>
                                    <Icon className={`w-6 h-6 transition-all duration-300 z-10 relative ${isActive ? 'text-white' : isLight ? 'text-gray-400' : 'text-gray-500'}`} />
                                </div>
                                <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 absolute bottom-2 ${isActive ? 'text-red-600 opacity-100 translate-y-0' : `${isLight ? 'text-gray-400' : 'text-gray-500'} opacity-0 translate-y-2`}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        );
    }

    // --- التصميم العصري (V2) ---
    if (navVersion === 'v2') {
        return (
            <div className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isVisible ? 'bottom-6 opacity-100 translate-y-0' : 'bottom-0 opacity-0 translate-y-20 pointer-events-none'}`}>
                <nav className={`
                    relative flex items-center gap-1 p-2 rounded-[24px] border
                    ${isLight
                        ? 'bg-white/70 border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
                        : 'bg-zinc-900/80 border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
                    } backdrop-blur-2xl
                `}>
                    {navItemsToShow.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                className={`
                                    relative flex items-center justify-center p-3 rounded-[18px] transition-all duration-500 group
                                    ${isActive ? 'flex-[1.5] px-5' : 'flex-1'}
                                `}
                            >
                                {/* Active Bloom Effect */}
                                {isActive && (
                                    <div className={`absolute inset-0 rounded-[18px] bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse`} />
                                )}

                                <div className="relative z-10 flex items-center gap-2">
                                    <Icon
                                        className={`
                                            w-5 h-5 transition-all duration-500
                                            ${isActive ? 'text-white scale-110' : 'text-zinc-500 group-hover:text-zinc-300'}
                                        `}
                                    />
                                    {isActive && (
                                        <span className="text-[11px] font-black text-white whitespace-nowrap animate-fadeIn">
                                            {item.label}
                                        </span>
                                    )}
                                </div>

                                {/* Hover Indicator */}
                                {!isActive && (
                                    <div className="absolute inset-0 rounded-[18px] bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        );
    }

    // --- التصميم الفائق المطور (V3) ---
    if (navVersion === 'v3') {
        const activeIndex = navItemsToShow.findIndex(item => item.id === activeView);
        const itemWidth = 100 / navItemsToShow.length;

        return (
            <div className={`fixed left-4 right-4 sm:left-auto sm:right-auto sm:w-fit sm:min-w-[400px] sm:left-1/2 sm:-translate-x-1/2 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'bottom-8 translate-y-0 opacity-100' : 'bottom-0 translate-y-20 opacity-0 pointer-events-none'}`}>
                <nav className={`
                    relative flex items-center p-1.5 rounded-[32px] border overflow-hidden
                    ${isLight
                        ? 'bg-white/80 border-white/50 shadow-[0_15px_40px_rgba(0,0,0,0.06)]'
                        : 'bg-black/40 border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
                    } backdrop-blur-3xl
                `}>
                    {/* Sliding Background Indicator */}
                    <div
                        className="absolute h-[calc(100%-12px)] rounded-full bg-gradient-to-r from-red-600 to-red-500 shadow-[0_10px_20px_rgba(239,68,68,0.4)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0"
                        style={{
                            width: `calc(${itemWidth}% - 12px)`,
                            left: `calc(${activeIndex * itemWidth}% + 6px)`,
                            opacity: activeIndex === -1 ? 0 : 1
                        }}
                    />

                    {navItemsToShow.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                className="relative flex-1 flex flex-col items-center justify-center py-3.5 px-2 rounded-full transition-all duration-500 group outline-none select-none z-10"
                            >
                                <Icon
                                    className={`
                                        w-5 h-5 transition-all duration-500
                                        ${isActive
                                            ? 'text-white scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
                                            : isLight ? 'text-gray-400 group-hover:text-gray-600' : 'text-gray-500 group-hover:text-gray-300'
                                        }
                                        ${!isActive && 'group-active:scale-90'}
                                    `}
                                />
                                <span className={`
                                    mt-1.5 text-[9px] font-black uppercase tracking-tighter transition-all duration-500
                                    ${isActive ? 'text-white' : isLight ? 'text-gray-400' : 'text-gray-500'}
                                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 scale-50'}
                                `}>
                                    {item.label}
                                </span>

                                {/* Hover Spot Effect */}
                                {!isActive && (
                                    <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        );
    }

    // --- التصميم المستقبلي الفائق (V5 - Liquid Motion Island) ---
    if (navVersion === 'v5') {
        const activeIndex = navItemsToShow.findIndex(item => item.id === activeView);
        const itemWidth = 100 / navItemsToShow.length;
        const activeItem = navItemsToShow.find(item => item.id === activeView) || navItemsToShow[0];
        const activeColor = (activeItem as any).color;

        return (
            <div className={`fixed left-1/2 -translate-x-1/2 z-[70] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${isVisible ? 'bottom-8 scale-100 opacity-100' : 'bottom-0 scale-90 opacity-0 pointer-events-none'}`}>
                <nav className={`
                    relative flex items-center p-1.5 rounded-[35px] border gap-1 min-w-[320px] max-w-[95vw] shadow-2xl
                    ${isLight
                        ? 'bg-white/60 border-white/50 shadow-gray-200/50'
                        : 'bg-zinc-900/60 border-white/10 shadow-black'
                    } backdrop-blur-3xl overflow-hidden
                `}>
                    {/* Floating Liquid Background */}
                    <div
                        className="absolute h-[calc(100%-12px)] rounded-full transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] z-0"
                        style={{
                            width: `calc(${itemWidth}% - 8px)`,
                            left: `calc(${activeIndex * itemWidth}% + 4px)`,
                            background: `linear-gradient(135deg, ${activeColor}, ${activeColor}dd)`,
                            boxShadow: `0 8px 25px ${activeColor}44, 0 0 15px ${activeColor}22`,
                            opacity: activeIndex === -1 ? 0 : 1
                        }}
                    >
                        {/* Gloss Detail */}
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-full blur-[2px]" />
                    </div>

                    {navItemsToShow.map((item, idx) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                className={`
                                    relative flex-1 flex flex-col items-center justify-center h-14 rounded-full transition-all duration-700 group outline-none select-none z-10
                                    ${isActive ? 'cursor-default' : 'hover:bg-white/5 cursor-pointer'}
                                `}
                            >
                                <div className={`relative transition-all duration-700 ${isActive ? '-translate-y-1 scale-110' : 'translate-y-0 scale-100'}`}>
                                    <Icon
                                        className={`
                                            w-6 h-6 transition-all duration-700 
                                            ${isActive
                                                ? 'text-white'
                                                : isLight ? 'text-zinc-400 opacity-70' : 'text-zinc-500 opacity-60'
                                            }
                                        `}
                                    />
                                    {isActive && (
                                        <div
                                            className="absolute -inset-2 blur-xl opacity-60 animate-pulse pointer-events-none"
                                            style={{ backgroundColor: item.color }}
                                        />
                                    )}
                                </div>

                                <span className={`
                                    absolute bottom-1.5 text-[9px] font-black tracking-wider uppercase transition-all duration-700
                                    ${isActive ? 'text-white opacity-100 translate-y-0 scale-100' : 'text-transparent opacity-0 translate-y-2 scale-50'}
                                `}>
                                    {item.label}
                                </span>

                                {/* Ripple/Glow effect on click */}
                                <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-20 bg-white transition-opacity duration-150" />
                            </button>
                        );
                    })}
                </nav>
            </div>
        );
    }

    // --- التصميم الأسطوري الأحدث (V4 - Crystal Dynamic Island) ---
    const activeItem = navItemsToShow.find(item => item.id === activeView) || navItemsToShow[0];
    const activeColor = (activeItem as any).color || 'rgb(239, 68, 68)';

    return (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[60] transition-all duration-700 ease-[cubic-bezier(0.2,0,0,1)] ${isVisible ? 'bottom-8 scale-100 opacity-100' : 'bottom-0 scale-90 opacity-0 pointer-events-none'}`}>
            <nav className={`
                relative flex items-center p-1.5 sm:p-2 rounded-[24px] sm:rounded-[30px] border gap-1 sm:gap-2 max-w-[95vw] sm:max-w-none
                ${isLight
                    ? 'bg-white/40 border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)]'
                    : 'bg-black/40 border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.5)]'
                } backdrop-blur-3xl
            `}>
                {/* Dynamic Inner Glow */}
                <div
                    className="absolute inset-x-0 bottom-0 h-px transition-all duration-700 opacity-50"
                    style={{ background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)` }}
                />

                {navItemsToShow.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const itemColor = (item as any).color;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            className={`
                                relative flex items-center justify-center h-12 sm:h-14 rounded-[18px] sm:rounded-[22px] transition-all duration-700 group
                                ${isActive ? 'px-3 sm:px-6 bg-white/10' : 'px-2 sm:px-4 hover:bg-white/5'}
                            `}
                        >
                            {/* Floating Orb Detail */}
                            {isActive && (
                                <div
                                    className="absolute -top-1 w-1 h-1 rounded-full animate-pulse transition-all duration-700"
                                    style={{ backgroundColor: itemColor, boxShadow: `0 0 10px ${itemColor}` }}
                                />
                            )}

                            <div className="flex items-center gap-1.5 sm:gap-2.5">
                                <div className="relative">
                                    <Icon
                                        className={`
                                            w-5 h-5 sm:w-6 sm:h-6 transition-all duration-700
                                            ${isActive ? 'scale-110' : 'text-gray-500 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}
                                        `}
                                        style={{ color: isActive ? itemColor : undefined }}
                                    />
                                    {isActive && (
                                        <div
                                            className="absolute inset-0 blur-md opacity-40 animate-pulse pointer-events-none"
                                            style={{ backgroundColor: itemColor }}
                                        />
                                    )}
                                </div>

                                {isActive && (
                                    <span className="text-[10px] sm:text-[11px] font-black tracking-wide text-white whitespace-nowrap animate-fadeIn">
                                        {item.label}
                                    </span>
                                )}
                            </div>

                            {/* Hover Status */}
                            {!isActive && (
                                <div
                                    className="absolute inset-0 rounded-[18px] sm:rounded-[22px] transition-all duration-500 opacity-0 group-hover:opacity-10"
                                    style={{ backgroundColor: itemColor }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default AdminBottomNav;
