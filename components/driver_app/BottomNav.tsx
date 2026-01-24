
import React from 'react';
import { DollarSignIcon, HomeIcon } from '../icons';
import { AppTheme } from '../../types';

interface BottomNavProps {
    activePage: string;
    onNavigate: (page: string) => void;
    messageCount?: number;
    theme?: AppTheme;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate, messageCount = 0, theme }) => {
    const navItems = [
        { id: 'home', key: 'nav_home', label: 'الرئيسية' , icon: HomeIcon },
        { id: 'wallet', key: 'nav_wallet', label: 'المحفظة' , icon: DollarSignIcon },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#333] flex justify-around items-end h-[90px] z-40 pb-6 safe-area-pb transition-all duration-300">
            {navItems.map(item => {
                const DefaultIcon = item.icon;
                const customIconData = theme?.driver?.icons?.[item.key];
                const isActive = activePage === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="group relative flex-1 h-full flex flex-col items-center justify-center outline-none select-none"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {/* Active Indicator Line */}
                        <span 
                            className={`absolute top-0 w-10 h-1 rounded-b-full bg-red-500 transition-all duration-500 ease-out ${
                                isActive ? 'opacity-100 shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-x-100' : 'opacity-0 scale-x-0'
                            }`}
                        ></span>

                        {/* Icon Container with Animation */}
                        <div className={`relative transition-all duration-300 ease-out p-1.5 rounded-2xl ${
                            isActive ? '-translate-y-1.5' : 'group-active:scale-90 translate-y-1'
                        }`}>
                            {/* Ambient Glow */}
                            <div className={`absolute inset-0 bg-red-500/10 blur-xl rounded-full transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
                            
                            {customIconData ? (
                                <img 
                                    src={customIconData} 
                                    key={customIconData} // Force re-render on change
                                    alt={item.label} 
                                    className={`w-6 h-6 object-contain z-10 relative ${isActive ? 'drop-shadow-md' : 'grayscale opacity-70'}`} 
                                />
                            ) : (
                                <DefaultIcon 
                                    className={`w-6 h-6 transition-all duration-300 z-10 relative ${
                                        isActive 
                                        ? 'text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]' 
                                        : 'text-gray-500 group-hover:text-gray-300'
                                    }`} 
                                />
                            )}
                        </div>

                        {/* Label */}
                        <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${
                            isActive 
                            ? 'text-white translate-y-0 opacity-100' 
                            : 'text-gray-500 group-hover:text-gray-400 translate-y-1'
                        }`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
