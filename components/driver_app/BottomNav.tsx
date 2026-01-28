
import React from 'react';
import { HomeIcon, WalletIcon } from '../icons';
import { AppTheme } from '../../types';

interface BottomNavProps {
    activePage: string;
    onNavigate: (page: string) => void;
    messageCount: number;
    theme: AppTheme;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate, messageCount, theme }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#333] flex justify-around items-end h-[80px] z-40 pb-5 safe-area-pb transition-all duration-300">
            {/* Home */}
            <button
                onClick={() => onNavigate('home')}
                className="group relative flex-1 h-full flex flex-col items-center justify-center outline-none select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className={`relative transition-all duration-300 ease-out p-1.5 rounded-2xl ${activePage === 'home' ? '-translate-y-1.5' : 'translate-y-1'}`}>
                    <HomeIcon className={`w-6 h-6 transition-all duration-300 ${activePage === 'home' ? 'text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]' : 'text-gray-500'}`} />
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${activePage === 'home' ? 'text-white' : 'text-gray-500'}`}>
                    الرئيسية
                </span>
            </button>

            {/* Games */}
            <button
                onClick={() => onNavigate('games')}
                className="group relative flex-1 h-full flex flex-col items-center justify-center outline-none select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className={`relative transition-all duration-300 ease-out p-1.5 rounded-2xl ${activePage === 'games' ? '-translate-y-1.5 scale-110' : 'translate-y-1'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 transition-all duration-300 ${activePage === 'games' ? 'text-purple-500 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]' : 'text-gray-500'}`}>
                        <line x1="6" y1="12" x2="10" y2="12"></line>
                        <line x1="8" y1="10" x2="8" y2="14"></line>
                        <line x1="15" y1="13" x2="15.01" y2="13"></line>
                        <line x1="18" y1="11" x2="18.01" y2="11"></line>
                        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    </svg>
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${activePage === 'games' ? 'text-white' : 'text-gray-500'}`}>
                    ألعاب
                </span>
            </button>

            {/* Wallet */}
            <button
                onClick={() => onNavigate('wallet')}
                className="group relative flex-1 h-full flex flex-col items-center justify-center outline-none select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className={`relative transition-all duration-300 ease-out p-1.5 rounded-2xl ${activePage === 'wallet' ? '-translate-y-1.5' : 'translate-y-1'}`}>
                    <WalletIcon className={`w-6 h-6 transition-all duration-300 ${activePage === 'wallet' ? 'text-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]' : 'text-gray-500'}`} />
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${activePage === 'wallet' ? 'text-white' : 'text-gray-500'}`}>
                    المحفظة
                </span>
            </button>
        </nav>
    );
};

export default BottomNav;
