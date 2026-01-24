import React from 'react';
import { HomeIcon, ClipboardListIcon } from '../icons';

type MerchantPage = 'home' | 'history';

interface MerchantBottomNavProps {
    activePage: MerchantPage;
    onNavigate: (page: MerchantPage) => void;
}

const MerchantBottomNav: React.FC<MerchantBottomNavProps> = ({ activePage, onNavigate }) => {
    const navItems = [
        { id: 'home', label: 'الرئيسية', icon: <HomeIcon className="w-6 h-6 mb-1" /> },
        { id: 'history', label: 'السجل', icon: <ClipboardListIcon className="w-6 h-6 mb-1" /> },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#2A2A2A] border-t border-gray-700 shadow-lg flex justify-around items-center h-16 z-20">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id as MerchantPage)}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${activePage === item.id ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                    aria-current={activePage === item.id ? 'page' : undefined}
                >
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default MerchantBottomNav;