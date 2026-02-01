
import React from 'react';
import {
    TruckIconV2, UsersIcon, StoreIcon, HeadsetIcon,
    MessageSquareIcon, ImageIcon, DollarSignIcon, SettingsIcon,
    RocketIcon, ShoppingCartIcon, GamepadIcon // Added new icons
} from '../icons';

export type AdminView = 'orders' | 'users' | 'stores' | 'notifications' | 'wallet' | 'messages' | 'settings' | 'slider' | 'customizer' | 'support' | 'games';

interface AdminBottomNavProps {
    activeView: AdminView;
    onNavigate: (view: AdminView) => void;
    availableViews?: string[];
    isVisible?: boolean;
    mode?: 'light' | 'dark';
}

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeView, onNavigate, availableViews, isVisible = true, mode = 'dark' }) => {
    const allNavItems = [
        { id: 'orders', label: 'الرئيسية', icon: TruckIconV2 },
        { id: 'users', label: 'المستخدمين', icon: UsersIcon },
        { id: 'stores', label: 'المتاجر', icon: StoreIcon },
        { id: 'special', label: 'خدمة خاصة', icon: RocketIcon }, // Replaced Customer Service
        { id: 'shopping', label: 'طلبات تسوق', icon: ShoppingCartIcon }, // Replaced Messages
        { id: 'slider', label: 'العروض', icon: ImageIcon },
        { id: 'wallet', label: 'المحفظة', icon: DollarSignIcon },
        { id: 'games', label: 'الألعاب', icon: GamepadIcon },
        { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
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
        : allNavItems.filter(item => ['orders', 'users', 'stores', 'special', 'shopping', 'wallet', 'settings', 'games'].includes(item.id));

    const isLight = mode === 'light';

    return (
        <div className={`fixed left-4 right-4 z-40 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0 bottom-8' : 'translate-y-[150%] bottom-8'}`}>
            <nav
                className={`${isLight ? 'bg-white/95 border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)]' : 'bg-gray-800/95 border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.4)]'} backdrop-blur-xl border flex justify-around items-center h-[70px] rounded-[30px] px-2 transition-colors duration-300`}
            >
                {navItemsToShow.map(item => {
                    const Icon = item.icon;
                    // Strict comparison to ensure only ONE icon is active at a time
                    const isActive = activeView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            className="group relative flex-1 h-full flex flex-col items-center justify-center outline-none select-none"
                            type="button"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            <div className={`relative transition-all duration-300 ease-out p-2 rounded-2xl ${isActive ? '-translate-y-2' : 'translate-y-1'
                                }`}>
                                {/* Active Indicator Background */}
                                <div className={`absolute inset-0 bg-red-600 rounded-2xl transition-all duration-300 ${isActive ? 'opacity-100 scale-100 rotate-3' : 'opacity-0 scale-50 rotate-0'}`}></div>

                                {/* Icon: Use strict conditional classes, removed group-hover text changes to prevent sticky hover on touch */}
                                <Icon
                                    className={`w-6 h-6 transition-all duration-300 z-10 relative ${isActive
                                        ? 'text-white'
                                        : isLight ? 'text-gray-400' : 'text-gray-500'
                                        }`}
                                />
                            </div>

                            <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 absolute bottom-2 ${isActive
                                ? 'text-red-600 opacity-100 translate-y-0'
                                : `${isLight ? 'text-gray-400' : 'text-gray-500'} opacity-0 translate-y-2`
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default AdminBottomNav;
