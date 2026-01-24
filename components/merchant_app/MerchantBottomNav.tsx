
import React from 'react';
import { HomeIcon, ClipboardListIcon, UtensilsIcon, MessageSquareIcon } from '../icons';
import { AppTheme } from '../../types';

type MerchantPage = 'home' | 'history' | 'menu' | 'incoming' | 'messages';

interface MerchantBottomNavProps {
    activePage: MerchantPage;
    onNavigate: (page: MerchantPage) => void;
    messageCount?: number;
    theme?: AppTheme;
    showMenu?: boolean;
}

const MerchantBottomNav: React.FC<MerchantBottomNavProps> = ({ activePage, onNavigate, messageCount = 0, theme, showMenu = true }) => {
    const navItems = [
        { id: 'home', key: 'nav_home', label: 'الرئيسية', icon: HomeIcon },
        { id: 'messages', key: 'nav_messages', label: 'الرسائل', icon: MessageSquareIcon },
        ...(showMenu ? [{ id: 'menu', key: 'nav_menu', label: 'المنيو', icon: UtensilsIcon }] : []),
        { id: 'history', key: 'nav_history', label: 'السجل', icon: ClipboardListIcon },
    ];

    return (
        <div 
            className="fixed left-4 right-4 z-40 transition-transform duration-300 ease-in-out"
            style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
            <nav className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex justify-around items-center h-[70px] rounded-[30px] px-2 safe-area-pb">
                {navItems.map(item => {
                    const DefaultIcon = item.icon;
                    const customIconData = theme?.merchant?.icons?.[item.key];
                    const isActive = activePage === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as MerchantPage)}
                            className="group relative flex-1 h-full flex flex-col items-center justify-center outline-none select-none"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {/* Icon Container with Animation */}
                            <div className={`relative transition-all duration-300 ease-out p-1.5 rounded-2xl ${
                                isActive ? '-translate-y-2' : 'translate-y-1' // Removed group-active scaling to reduce visual clutter on touch
                            }`}>
                                {/* Ambient Glow */}
                                <div className={`absolute inset-0 bg-red-500/20 blur-xl rounded-full transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
                                
                                {customIconData ? (
                                    <img 
                                        src={customIconData} 
                                        key={customIconData} 
                                        alt={item.label} 
                                        className={`w-6 h-6 object-contain z-10 relative ${isActive ? 'drop-shadow-md' : 'grayscale opacity-70'}`} 
                                    />
                                ) : (
                                    <div className="relative z-10">
                                        <DefaultIcon 
                                            // Explicitly handle color classes, avoid hover states for color on touch devices
                                            className={`w-6 h-6 transition-all duration-300 ${
                                                isActive 
                                                ? 'text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]' 
                                                : 'text-gray-500'
                                            }`} 
                                        />
                                    </div>
                                )}

                                {/* Message Badge */}
                                {item.id === 'messages' && messageCount > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-gray-900 animate-pulse z-20 shadow-sm">
                                        {messageCount}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 absolute bottom-2 ${
                                isActive 
                                ? 'text-white translate-y-0 opacity-100' 
                                : 'text-gray-500 translate-y-2 opacity-0'
                            }`}>
                                {item.label}
                            </span>
                            
                            {/* Active Dot */}
                            {isActive && (
                                <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default MerchantBottomNav;
