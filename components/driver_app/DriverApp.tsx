
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, User, OrderStatus, Message, AppTheme, AppConfig } from '../../types';
import HomeScreen from './HomeScreen';
import WalletScreen from './WalletScreen';
import BottomNav from './BottomNav';
import OrderDetailsScreen from './OrderDetailsScreen';
import { UserIcon, BellIcon, VerifiedIcon, CrownIcon, StarIcon, RocketIcon, ClockIcon, TrashIcon, CheckCircleIcon } from '../icons';
import DriverProfileModal from './DriverProfileModal';
import OrderLimitModal from './OrderLimitModal';
import { setAndroidRole, NativeBridge } from '../../utils/NativeBridge';
import useAndroidBack from '../../hooks/useAndroidBack';

import PullToRefresh from '../common/PullToRefresh';
import GamesScreen from './GamesScreen';
import GamePlayer from './GamePlayer';

type HomeTab = 'home' | 'in-transit' | 'delinow';
type View = 'home' | 'wallet' | 'games';

const getTimestamp = (d: any) => d ? new Date(d).getTime() : 0;

interface DriverAppProps {
    driver: User;
    users: User[];
    orders: Order[];
    messages: Message[];
    onUpdateUser: (u: User) => Promise<void>;
    appTheme: AppTheme;
    appConfig?: AppConfig;
    initialRoute?: { target: string; id?: string };
    deletedMessageIds: string[];
    markMessageAsSeen: (id: string) => void;
    hideMessage: (id: string) => void;
}

const DriverApp: React.FC<DriverAppProps> = (props) => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [activeHomeTab, setActiveHomeTab] = useState<HomeTab>('home');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [activeGameUrl, setActiveGameUrl] = useState<string | null>(null);



    // Notification Dropdown State
    const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
    const notifDropdownRef = useRef<HTMLDivElement>(null);

    // App Name Logic
    const appName = props.appConfig?.appName || 'GOO NOW';
    const [firstWord, ...restWords] = appName.split(' ');
    const restOfName = restWords.join(' ');
    const tabName = appName;

    useEffect(() => {
        if (props.initialRoute?.target === 'order' && props.initialRoute.id) {
            const order = props.orders.find(o => o.id === props.initialRoute?.id);
            if (order) {
                setSelectedOrder(order);
                // Auto switch tab if order is active
                if (order.status === OrderStatus.InTransit) setActiveHomeTab('in-transit');
            }
        } else if (props.initialRoute?.target === 'messages') {
            // Instead of changing view, open dropdown
            setIsNotifDropdownOpen(true);
        }
    }, [props.initialRoute, props.orders]);

    useEffect(() => { setAndroidRole('driver', props.driver.id); }, [props.driver.id]);

    useEffect(() => {
        NativeBridge.reportContext(currentView);
    }, [currentView]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
                setIsNotifDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useAndroidBack(() => {
        if (isNotifDropdownOpen) { setIsNotifDropdownOpen(false); return true; }
        if (activeGameUrl) { setActiveGameUrl(null); return true; }
        if (activeGameUrl) { setActiveGameUrl(null); return true; }
        if (isProfileModalOpen) { setIsProfileModalOpen(false); return true; }
        if (showLimitModal) { setShowLimitModal(false); return true; }
        if (selectedOrder) { setSelectedOrder(null); return true; }

        if (currentView !== 'home') {
            setCurrentView('home'); return true;
        }
        if (activeHomeTab !== 'home') { setActiveHomeTab('home'); return true; }

        return false;
        return false;
    }, [isProfileModalOpen, showLimitModal, selectedOrder, currentView, activeHomeTab, isNotifDropdownOpen, activeGameUrl]);

    // High-performance filtering and sorting
    const { standardNewOrders, delinowNewOrders, inTransitOrders } = useMemo(() => {
        const pending: Order[] = [];
        const active: Order[] = [];
        const myId = props.driver.id;

        // Single pass filtering
        for (const o of props.orders) {
            if (o.status === OrderStatus.Pending && !o.driverId) {
                pending.push(o);
            } else if (o.driverId === myId && o.status === OrderStatus.InTransit) {
                active.push(o);
            }
        }

        // Updated Sorting Logic:
        // Pending (New) Orders: Oldest First (FIFO) so old orders are prioritized at the top
        pending.sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt));

        // Active Orders: Oldest First (FIFO)
        active.sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt));

        return {
            standardNewOrders: pending.filter(o => o.type !== 'shopping_order'),
            delinowNewOrders: pending.filter(o => o.type === 'shopping_order'),
            inTransitOrders: active
        };
    }, [props.orders, props.driver.id]);

    // Filter messages for dropdown
    const driverMessages = useMemo(() =>
        props.messages.filter(m =>
            m.targetRole === 'driver' &&
            (m.targetId === 'all' || m.targetId === props.driver.id) &&
            !props.deletedMessageIds.includes(m.id) &&
            !m.deletedBy?.includes(props.driver.id)
        ).sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt)),
        [props.messages, props.driver.id, props.deletedMessageIds]);

    const unseenMessagesCount = useMemo(() =>
        driverMessages.filter(m => !m.readBy?.includes(props.driver.id)).length,
        [driverMessages, props.driver.id]);

    // Mark messages as seen when dropdown opens
    useEffect(() => {
        if (isNotifDropdownOpen) {
            driverMessages.forEach(msg => {
                if (!msg.readBy?.includes(props.driver.id)) {
                    props.markMessageAsSeen(msg.id);
                }
            });
        }
    }, [isNotifDropdownOpen, driverMessages, props.driver.id]);

    const getFrameContainerClass = (type?: string) => {
        if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0';
        switch (type) {
            case 'gold': return 'p-[2px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.4)]';
            case 'neon': return 'p-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
            case 'royal': return 'p-[2px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-sm border border-purple-500/30';
            case 'fire': return 'p-[2px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
            default: return 'p-0';
        }
    };

    const getBadgeIcon = (type?: string) => {
        if (!type || type === 'none') return null;

        if (type?.startsWith('data:') || type?.startsWith('http')) {
            return (
                <div className="w-7 h-7 min-w-[1.75rem] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-sm overflow-hidden p-0.5 ml-2 backdrop-blur-sm">
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

    const handleClearNotifications = () => {
        // Just visual clearing/marking all as deleted locally if desired, 
        // but usually "Clear All" in dropdown context might mean mark as read or delete all.
        // For safety, let's just close the dropdown.
        setIsNotifDropdownOpen(false);
    };

    const handleRefresh = async () => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                // Sound removed per user request
                resolve();
            }, 1500);
        });
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-[#1A1A1A] text-white overflow-hidden" dir="rtl">
            {isProfileModalOpen && <DriverProfileModal driver={props.driver} onClose={() => setIsProfileModalOpen(false)} onLogout={props.onLogout} onUpdateUser={props.onUpdateUser} currentTheme={props.appTheme} onUpdateTheme={props.onUpdateTheme} />}
            {showLimitModal && <OrderLimitModal onClose={() => setShowLimitModal(false)} currentCount={inTransitOrders.length} maxLimit={props.driver.maxConcurrentOrders || 0} />}
            {showLimitModal && <OrderLimitModal onClose={() => setShowLimitModal(false)} currentCount={inTransitOrders.length} maxLimit={props.driver.maxConcurrentOrders || 0} />}

            {selectedOrder ? (
                <div className="fixed inset-0 bg-[#1A1A1A] z-50 flex flex-col animate-fadeIn">
                    <header className="flex-none flex bg-[#1A1A1A] border-b border-gray-800 h-14 items-center px-4 pt-safe box-content">
                        <button onClick={() => setSelectedOrder(null)} className="text-white flex items-center p-2"><span className="text-2xl ml-2 rotate-180">&#10140;</span><span className="font-bold">رجوع</span></button>
                        <div className="flex-1 text-center font-bold">تفاصيل الطلب</div>
                    </header>
                    <OrderDetailsScreen order={selectedOrder} users={props.users} listType={selectedOrder.status === OrderStatus.InTransit ? 'in-transit' : 'new'} driver={props.driver} onAcceptOrder={(oid, did, fee) => { props.onAcceptOrder(oid, did, fee); setSelectedOrder(null); }} onUpdateStatus={(id, s) => { props.onUpdateOrderStatus(id, s); setSelectedOrder(null); }} onBack={() => setSelectedOrder(null)} theme={props.appTheme} />
                </div>
            ) : (
                <>
                    <header className="flex-none bg-[#1A1A1A] z-30 border-b border-gray-800 h-14 flex justify-between items-center px-4 pt-safe box-content relative">
                        <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 bg-white/5 py-1 px-3 rounded-full hover:bg-white/10 transition-colors">
                            <div className={`relative flex items-center justify-center rounded-full ${!isCustomFrame(props.driver.specialFrame) ? getFrameContainerClass(props.driver.specialFrame) : ''}`}>
                                {isCustomFrame(props.driver.specialFrame) && (
                                    <img src={props.driver.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-125 pointer-events-none" alt="frame" />
                                )}
                                <div className={`${isCustomFrame(props.driver.specialFrame) ? 'w-8 h-8' : 'w-8 h-8'} rounded-full overflow-hidden border border-white/20 relative z-0 flex items-center justify-center`}>
                                    {props.driver.storeImage ? <img src={props.driver.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 m-1.5" />}
                                </div>
                            </div>
                            <span className="text-sm font-bold truncate max-w-[80px]">{props.driver.name}</span>
                            {getBadgeIcon(props.driver.specialBadge)}
                        </button>
                        <h1 className="text-xl font-bold">
                            <span className="text-red-500">{firstWord}</span>
                            <span className="text-white ml-1">{restOfName}</span>
                        </h1>

                        {/* Notification Bell with Dropdown */}
                        <div className="relative" ref={notifDropdownRef}>
                            <button
                                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                                className={`relative p-2 transition-colors ${isNotifDropdownOpen ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                <BellIcon className={`w-6 h-6`} />
                                {unseenMessagesCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse border border-[#1A1A1A]"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotifDropdownOpen && (
                                <div className="absolute top-12 left-0 w-80 bg-[#1e1e1e] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-pop-in origin-top-left">
                                    <div className="p-3 border-b border-gray-700/50 bg-[#252525] flex justify-between items-center">
                                        <span className="text-xs font-bold text-white">الإشعارات</span>
                                        {driverMessages.length > 0 && (
                                            <button onClick={handleClearNotifications} className="text-[10px] text-gray-400 hover:text-white transition-colors">
                                                إغلاق
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                        {driverMessages.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-[10px]">لا توجد إشعارات جديدة</p>
                                            </div>
                                        ) : (
                                            driverMessages.map((msg) => {
                                                const formattedDate = (() => {
                                                    try {
                                                        const d = new Date(msg.createdAt);
                                                        if (isNaN(d.getTime())) return '';
                                                        return d.toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                                                    } catch (e) { return ''; }
                                                })();

                                                return (
                                                    <div key={msg.id} className="group relative bg-[#252525] rounded-xl border border-gray-700/50 shadow-sm overflow-hidden p-3 transition-all hover:bg-[#2a2a2a]">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
                                                                    <BellIcon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-bold text-white leading-tight">إدارة العمليات</h4>
                                                                    <span className="text-[9px] text-gray-500 font-mono">{formattedDate}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); props.hideMessage(msg.id); }}
                                                                className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {/* Body */}
                                                        <div>
                                                            {msg.image && (
                                                                <div className="mb-2 rounded-lg overflow-hidden border border-gray-600/30">
                                                                    <img src={msg.image} alt="مرفق" className="w-full h-32 object-contain bg-black/40" />
                                                                </div>
                                                            )}
                                                            <p className="text-gray-300 text-xs leading-relaxed font-medium">
                                                                {msg.text}
                                                            </p>
                                                        </div>

                                                        {/* Seen Status */}
                                                        <div className="mt-2 flex items-center gap-1 text-[9px] text-gray-500">
                                                            <CheckCircleIcon className="w-2.5 h-2.5 text-green-500" />
                                                            <span>تمت القراءة</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </header>

                    {currentView === 'home' && (
                        <div className="flex-none px-3 py-2">
                            <div className="flex bg-[#2A2A2A] rounded-xl p-1 border border-gray-700">
                                <button onClick={() => setActiveHomeTab('home')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeHomeTab === 'home' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>جديدة ({standardNewOrders.length})</button>
                                <button onClick={() => setActiveHomeTab('in-transit')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeHomeTab === 'in-transit' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>نشطة ({inTransitOrders.length})</button>
                                <button onClick={() => setActiveHomeTab('delinow')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeHomeTab === 'delinow' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>{tabName} ({delinowNewOrders.length})</button>
                            </div>
                        </div>
                    )}

                    <main className="flex-1 overflow-hidden relative">
                        <PullToRefresh onRefresh={handleRefresh} className="pb-36">
                            {currentView === 'home' && <HomeScreen driver={props.driver} users={props.users} standardNewOrders={standardNewOrders} delinowNewOrders={delinowNewOrders} inTransitOrders={inTransitOrders} onViewOrder={setSelectedOrder} onUpdateUser={props.onUpdateUser} activeTab={activeHomeTab} theme={props.appTheme} />}
                            {currentView === 'wallet' && <WalletScreen driver={props.driver} orders={props.orders} users={props.users} />}
                            {currentView === 'games' && <GamesScreen driver={props.driver} appConfig={props.appConfig} onBack={() => setCurrentView('home')} onPlayGame={(url) => setActiveGameUrl(url)} />}
                        </PullToRefresh>
                    </main>
                    <BottomNav activePage={currentView} onNavigate={(v) => setCurrentView(v as View)} messageCount={unseenMessagesCount} theme={props.appTheme} appConfig={props.appConfig} />
                </>
            )}
        </div>
    );
};

export default DriverApp;
