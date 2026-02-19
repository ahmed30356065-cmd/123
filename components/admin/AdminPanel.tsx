import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Order, User, OrderStatus, Customer, Role, SupervisorPermission, Message, Payment, SliderImage, SliderConfig, AppTheme, AuditLog, PromoCode, SupportChat, AppConfig, ManualDaily } from '../../types';
import AdminOrdersScreen from './AdminOrdersScreen';
import AdminUsersScreen from './AdminUsersScreen';
import AdminStoresScreen from './AdminStoresScreen';
import { NotificationsScreen } from './NotificationsScreen';
import AdminWalletScreen from './AdminWalletScreen';
import AdminMessagesScreen from './AdminMessagesScreen';
import { AdminReportsScreen } from './AdminReportsScreen';
import SystemSettings from './SystemSettings';
import SliderSettings from './SliderSettings';
import AddOrderModal from './AddOrderModal';
import AdminBottomNav, { AdminView } from './AdminBottomNav';
import { BellIcon, LogoutIconV2, RefreshCwIcon, UsersIcon, MessageSquareIcon, PaletteIcon, XIcon, ChevronLeftIcon, UserIcon, ShieldCheckIcon, TicketIcon, CoinsIcon, MoonIcon, SunIcon, StoreIcon, ImageIcon, SettingsIcon, ChartBarIcon, HeadsetIcon, VerifiedIcon, CrownIcon, StarIcon, RocketIcon, TruckIconV2, DollarSignIcon, GamepadIcon } from '../icons';
import EditUserModal from './EditUserModal';
import UserDetailsModal from './UserDetailsModal';
import ChangeStatusModal from './ChangeStatusModal';
import AssignDriverModal from './AssignDriverModal';
import ConfirmationModal from './ConfirmationModal';
import AppIconCustomizer from './AppIconCustomizer';
import AuditLogsScreen from './AuditLogsScreen';
import LoyaltyScreen from './LoyaltyScreen';
import AdminSupportScreen from './AdminSupportScreen';
import GamesManager from './GamesManager';
import PaymentModal from './PaymentModal';
import useAndroidBack from '../../hooks/useAndroidBack';
import * as firebaseService from '../../services/firebase';
import PullToRefresh from '../common/PullToRefresh';
import AvatarFrame from '../common/AvatarFrame';

interface AdminPanelProps {
    user: User;
    orders: Order[];
    users: User[];

    payments: Payment[];
    manualDailies?: ManualDaily[];
    updateUser: (userId: string, updatedData: Partial<User>) => void;
    deleteUser: (userId: string) => void;
    deleteOrder: (orderId: string) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    editOrder: (orderId: string, updatedData: {
        customer: Customer,
        notes?: string,
        merchantId: string,
        merchantName: string, // Updated Type
        driverId?: string | null, // Updated Type
        deliveryFee?: number | null, // Updated Type
        status?: OrderStatus,
        paymentStatus?: 'paid' | 'unpaid',
        paidAmount?: number,
        unpaidAmount?: number,
        isVodafoneCash?: boolean
    }) => void;
    assignDriverAndSetStatus: (orderId: string, driverId: string, deliveryFee: number, status: OrderStatus.InTransit | OrderStatus.Delivered) => void;
    adminAddOrder: (newOrder: Partial<Order> | Partial<Order>[]) => Promise<void> | void;
    adminAddUser: (newUser: { name: string; phone: string; password?: string; role: Role; commissionRate?: number; commissionType?: 'percentage' | 'fixed'; permissions?: SupervisorPermission[]; dailyLogMode?: '12_hour' | 'always_open'; storeImage?: string }) => Promise<User | void>;
    passwordResetRequests: { phone: string; requestedAt: Date }[];
    resolvePasswordResetRequest: (phone: string) => void;
    sendMessage: (messageData: { text: string; image?: string; targetRole: 'driver' | 'merchant' | 'customer'; targetIds: string[]; }) => void;
    messages: Message[];
    deleteMessage: (id: string) => void;
    handleDriverPayment: (driverId: string) => void;
    onLogout: () => void;
    showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    sliderImages: SliderImage[];
    sliderConfig: SliderConfig;
    onAddSliderImage: (image: SliderImage) => void;
    onDeleteSliderImage: (id: string) => void;
    onUpdateSliderImage: (id: string, data: Partial<SliderImage>) => void;
    onToggleSlider: (isEnabled: boolean) => void;
    currentTheme: AppTheme;
    onUpdateTheme: (appType: 'driver' | 'merchant' | 'customer' | 'admin', config: any) => void;
    onBulkUpdate: (updates: any[]) => Promise<void>;
    auditLogs: AuditLog[];
    onClearLogs: () => void;
    onUndo: (log: AuditLog) => Promise<boolean>;
    promoCodes: PromoCode[];
    pointsConfig: { pointsPerCurrency: number; currencyPerPoint: number; isPointsEnabled?: boolean };
    onAddPromo: (promo: PromoCode) => void;
    onDeletePromo: (id: string) => void;
    onUpdatePointsConfig: (config: any) => void;
    appConfig?: AppConfig;
    onUpdateAppConfig: (conf: Partial<AppConfig>) => void;
    onFactoryReset?: () => void;
    logAction: (actionType: 'create' | 'update' | 'delete' | 'financial', target: string, details: string) => void;
    onDeletePayment: (paymentId: string) => void;
    getNewId?: () => Promise<string>; // Added prop
}

const SideMenuItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, isActive?: boolean, danger?: boolean }> = ({ icon, label, onClick, isActive, danger }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden active:scale-95 mb-2 ${danger
            ? 'text-red-400 hover:bg-red-500/10'
            : isActive
                ? 'bg-red-600/20 text-white border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
    >
        {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-600 rounded-l-full"></div>}
        <div className={`relative z-10 transition-transform group-hover:scale-110 duration-300 ${isActive ? 'text-red-500' : ''}`}>{icon}</div>
        <span className={`relative z-10 font-bold text-sm ${isActive ? 'translate-x-1' : ''} transition-transform duration-300`}>{label}</span>
    </button>
);

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [view, setView] = useState<AdminView | 'add_order' | 'logs' | 'loyalty' | 'reports' | 'support' | 'games'>('orders');
    const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [statusChangeOrder, setStatusChangeOrder] = useState<Order | null>(null);
    const [assigningDriverOrder, setAssigningDriverOrder] = useState<Order | null>(null);
    const [transferOrder, setTransferOrder] = useState<Order | null>(null);
    const [statusConfirmation, setStatusConfirmation] = useState<{ order: Order; newStatus: OrderStatus } | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'all' | 'single' | 'status', target?: any, message: string } | null>(null);

    useEffect(() => {
        const handleNav = (e: any) => {
            const { target, id } = e.detail;
            if (target === 'orders' || (target === 'order' && id)) setView('orders');
            else if (target === 'users') setView('users');
            else if (target === 'reports') setView('reports');
            else if (target === 'messages') setView('messages');
            else if (target === 'stores') setView('stores');
            else if (target === 'notifications') setView('notifications');
            else if (target === 'support') setView('support');
        };
        window.addEventListener('app-navigation', handleNav);
        return () => window.removeEventListener('app-navigation', handleNav);
    }, []);
    const [unreadSupportChats, setUnreadSupportChats] = useState<SupportChat[]>([]);

    // Navigation visibility state
    const [bulkDriverId, setBulkDriverId] = useState('');
    const [bulkFee, setBulkFee] = useState('');

    const [editingPaymentOrder, setEditingPaymentOrder] = useState<Order | null>(null);

    const handleUpdatePayment = (orderId: string, updates: any) => {
        // We use editOrder to push updates
        // Note: editOrder in props needs to support these new fields.
        // We updated the interface above.
        const order = props.orders.find(o => o.id === orderId);
        if (!order) return;

        props.editOrder(orderId, {
            customer: order.customer, // Required by signature
            merchantId: order.merchantId, // Required by signature
            merchantName: order.merchantName, // Required by signature
            ...updates
        });
    };

    const handleOpenPaymentModal = (order: Order) => {
        setEditingPaymentOrder(order);
    };

    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Subscribe to support chats to update notification badge
    useEffect(() => {
        const unsub = firebaseService.subscribeToCollection('support_chats', (data) => {
            const unread = (data as SupportChat[]).filter(c => c.unreadCount > 0);
            setUnreadSupportChats(unread);
        });
        return () => unsub();
    }, []);

    // 🔄 Sync URL with View State
    // If notification opens with ?target=messages, switch view automatically
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('target');

        if (target) {
            if (target === 'messages') setView('messages');
            else if (target === 'orders' || target === 'order') setView('orders');
            else if (target === 'notifications') setView('notifications');
            // Add other mappings as needed
        }
    }, [window.location.search]); // Listen to location changes

    // 🛡️ Logic for Android Back Button: Popups -> Menu -> Home -> Exit
    useAndroidBack(() => {
        // 1. Modals (Popups) - Close topmost first
        if (statusConfirmation) { setStatusConfirmation(null); return true; }
        if (deleteConfirmation) { setDeleteConfirmation(null); return true; }
        if (editingPaymentOrder) { setEditingPaymentOrder(null); return true; }
        if (assigningDriverOrder) { setAssigningDriverOrder(null); return true; }
        if (transferOrder) { setTransferOrder(null); return true; }
        if (statusChangeOrder) { setStatusChangeOrder(null); return true; }
        if (editingUser) { setEditingUser(null); return true; }
        if (viewingUser) { setViewingUser(null); return true; }

        // 2. Side Menu
        if (isSideMenuOpen) { setIsSideMenuOpen(false); return true; }

        // 3. Navigation - Return to Home (Orders) if on other tabs
        if (view !== 'orders') { setView('orders'); return true; }

        // 4. Default - Exit App
        return false;
    }, [isSideMenuOpen, editingUser, viewingUser, statusChangeOrder, assigningDriverOrder, transferOrder, statusConfirmation, deleteConfirmation, editingPaymentOrder, view]);

    const realAdminData = useMemo(() => props.users.find(u => u.id === props.user.id) || props.user, [props.users, props.user]);
    const currentAdminMode = props.currentTheme?.admin?.mode || 'dark';

    // Calculate notifications
    const pendingUsersCount = props.users.filter(u => u.status === 'pending' && u.role !== 'admin').length;
    const pendingOrdersCount = props.orders.filter(o => o.status === OrderStatus.Pending).length;
    const unreadChatsCount = unreadSupportChats.length;
    const notificationCount = pendingUsersCount + props.passwordResetRequests.length + pendingOrdersCount + unreadChatsCount;

    const drivers = useMemo(() => props.users.filter(u => u.role === 'driver'), [props.users]);
    const merchants = useMemo(() => props.users.filter(u => u.role === 'merchant'), [props.users]);

    // Memoized handlers to prevent child re-renders
    const handleNavigateToAdd = useCallback(() => setView('add_order'), []);
    const handleOpenStatusModal = useCallback((order: Order) => setStatusChangeOrder(order), []);

    const handleBulkAssign = useCallback(async (driverId: string, fee: number) => {
        const pendingOrders = props.orders.filter(o => o.status === OrderStatus.Pending && !o.driverId);
        if (pendingOrders.length === 0) return;

        const updates = pendingOrders.map(o => ({
            id: o.id,
            driverId,
            deliveryFee: fee,
            status: OrderStatus.InTransit
        }));

        await props.onBulkUpdate(updates);

        // Optimize: Single Log + Single Notification
        const driver = props.users.find(u => u.id === driverId);
        const driverName = driver ? driver.name : 'المندوب';

        props.logAction('update', 'الطلبات', `تم تعيين ${updates.length} طلب دفعة واحدة للمندوب ${driverName}`);
        props.showNotification(`تم تعيين ${updates.length} طلب للمندوب بنجاح`, 'success');

        // Single Notification to Driver
        if (driver) {
            firebaseService.sendExternalNotification('driver', {
                title: "مجموعة طلبات جديدة 📦",
                body: `تم إسناد ${updates.length} طلب جديد إليك. يرجى مراجعة التطبيق.`,
                targetId: driverId,
                url: `/?target=orders`
            });
        }
    }, [props.orders, props.onBulkUpdate, props.showNotification, props.users, props.logAction]);

    const handleBulkStatusUpdate = useCallback(async (status: OrderStatus) => {
        let updates: any[] = [];

        if (status === OrderStatus.Pending) {
            // Reset to Pending: Active orders (InTransit, Preparing, WaitingMerchant) -> Pending
            // Only touch active/live orders that are NOT delivered or cancelled
            const targets = props.orders.filter(o =>
                o.status !== OrderStatus.Pending &&
                o.status !== OrderStatus.Delivered &&
                o.status !== OrderStatus.Cancelled
            );
            updates = targets.map(o => ({
                id: o.id,
                status: OrderStatus.Pending,
                driverId: null, // Clear driver
                deliveryFee: null // Clear fee if resetting to pending
            }));
        } else if (status === OrderStatus.Delivered) {
            // Complete: InTransit -> Delivered
            const targets = props.orders.filter(o => o.status === OrderStatus.InTransit);
            updates = targets.map(o => ({
                id: o.id,
                status: OrderStatus.Delivered,
                deliveredAt: new Date()
            }));
        }

        if (updates.length > 0) {
            await props.onBulkUpdate(updates);
            props.showNotification(`تم تحديث حالة ${updates.length} طلب بنجاح`, 'success');
        } else {
            props.showNotification('لا توجد طلبات قابلة للتحديث', 'info');
        }
    }, [props.orders, props.onBulkUpdate, props.showNotification]);

    const handleBulkDelete = useCallback(async (status: OrderStatus | 'all') => {
        const ordersToDelete = status === 'all'
            ? props.orders.filter(o => !o.isArchived) // Only delete non-archived orders
            : props.orders.filter(o => o.status === status && !o.isArchived);

        if (ordersToDelete.length === 0) {
            props.showNotification('لا توجد طلبات للحذف', 'info');
            return;
        }

        // Professional Confirmation Modal
        const message = status === 'all'
            ? `⚠️ سيتم حذف ${ordersToDelete.length} طلب نهائيًا من قاعدة البيانات!\n\nهذا الإجراء سيقوم بتنظيف جميع البيانات وإعادة تعيين العداد للطلب رقم 1.\n\nهل أنت متأكد؟`
            : `سيتم حذف ${ordersToDelete.length} طلب (${status}) نهائيًا.\n\nهل أنت متأكد؟`;

        setDeleteConfirmation({
            type: status === 'all' ? 'all' : 'status',
            target: status, // pass status to execute function
            message: message
        });

    }, [props.orders, setDeleteConfirmation]);

    const executeDelete = async () => {
        if (!deleteConfirmation) return;

        const { type, target } = deleteConfirmation;
        let ordersToDelete: Order[] = [];

        if (type === 'all') {
            ordersToDelete = props.orders.filter(o => !o.isArchived);
        } else if (type === 'status') {
            ordersToDelete = props.orders.filter(o => o.status === target && !o.isArchived);
        }

        // Just in case
        if (ordersToDelete.length === 0) {
            setDeleteConfirmation(null);
            return;
        }

        try {
            // Batch delete for efficiency (Firestore limit: 500 per batch)
            const BATCH_SIZE = 400;
            const chunks = [];
            for (let i = 0; i < ordersToDelete.length; i += BATCH_SIZE) {
                chunks.push(ordersToDelete.slice(i, i + BATCH_SIZE));
            }

            // Delete in batches
            for (const chunk of chunks) {
                await Promise.all(chunk.map(order => props.deleteOrder(order.id)));
            }

            if (type === 'all') {
                // RESET COUNTERS in correct path
                await firebaseService.updateData('settings', 'counters', {
                    'ORD-': 0,
                    'S-': 0,
                    'lastId': 0 // Old counter key just in case
                });

                // Refresh Local State if prop exists
                if (props.onFactoryReset) {
                    props.onFactoryReset();
                }
            }

            props.showNotification(
                `✅ تم حذف ${ordersToDelete.length} طلب بنجاح من قاعدة البيانات`,
                'success'
            );
        } catch (error) {
            console.error('Bulk delete error:', error);
            props.showNotification('❌ حدث خطأ أثناء الحذف', 'error');
        } finally {
            setDeleteConfirmation(null);
        }
    };

    // ✅ FIX: Driver-Only Notification Logic
    const handleConfirmStatusChange = useCallback(async () => {
        if (!statusConfirmation) return;

        const { order, newStatus } = statusConfirmation;

        // 1. Perform the update
        props.updateOrderStatus(order.id, newStatus);

        // 2. Notify Driver ONLY
        // (Notification logic moved to backend/App.tsx centralized handler)
        // if (order.driverId && newStatus !== OrderStatus.Pending && order.driverId !== 'waiting') { ... }

        setStatusConfirmation(null);
    }, [statusConfirmation, props.updateOrderStatus]);

    // App Name Split Logic
    const appTitleParts = props.appConfig?.appName.split(' ') || ['GOO', 'NOW'];
    const firstTitlePart = appTitleParts[0];
    const restTitleParts = appTitleParts.slice(1).join(' ');
    const fullAppName = props.appConfig?.appName || 'GOO NOW';

    const handleRefresh = async () => {
        // Since we are using Firestore real-time listeners (useAppData), 
        // a "refresh" is mostly visual to reassure the user.
        // However, we can use this to force check connection or just wait.
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1500);
        });
    };

    const renderView = () => {
        const permissions = realAdminData.permissions;

        switch (view) {
            case 'orders': return (
                <AdminOrdersScreen
                    orders={props.orders} users={props.users}
                    deleteOrder={props.deleteOrder} updateOrderStatus={props.updateOrderStatus}
                    editOrder={props.editOrder} assignDriverAndSetStatus={props.assignDriverAndSetStatus}
                    adminAddOrder={props.adminAddOrder} onOpenStatusModal={handleOpenStatusModal}
                    onOpenPaymentModal={handleOpenPaymentModal}
                    onNavigateToAdd={handleNavigateToAdd}
                    onBulkAssign={handleBulkAssign}
                    onBulkStatusUpdate={handleBulkStatusUpdate}
                    onBulkDelete={handleBulkDelete}
                    appName={fullAppName}
                    currentUser={props.user}
                    permissions={permissions}
                />
            );
            case 'reports': return <AdminReportsScreen orders={props.orders} users={props.users} payments={props.payments} currentUser={props.user} manualDailies={props.manualDailies} permissions={permissions} />;
            case 'add_order': return <AddOrderModal merchants={merchants} onClose={() => setView('orders')} onSave={(order) => props.adminAddOrder(order as any)} getNewId={props.getNewId} />;
            case 'users': return <AdminUsersScreen users={props.users} updateUser={props.updateUser} onDeleteUser={props.deleteUser} onAdminAddUser={props.adminAddUser} setEditingUser={setEditingUser} onViewUser={setViewingUser} appName={fullAppName} currentUser={props.user} permissions={permissions} />;
            case 'stores': return <AdminStoresScreen users={props.users} orders={props.orders} updateUser={props.updateUser} permissions={permissions} />;
            case 'notifications': return <NotificationsScreen users={props.users} updateUser={props.updateUser} onDeleteUser={props.deleteUser} passwordResetRequests={props.passwordResetRequests} resolvePasswordResetRequest={props.resolvePasswordResetRequest} setEditingUser={setEditingUser} pendingOrders={props.orders.filter(o => o.status === OrderStatus.Pending && !o.driverId)} onNavigateToOrders={() => setView('orders')} unreadChats={unreadSupportChats} onNavigateToSupport={() => setView('support')} />;
            case 'wallet': return <AdminWalletScreen orders={props.orders} users={props.users} payments={props.payments} updateUser={props.updateUser} handleDriverPayment={props.handleDriverPayment} onDeletePayment={props.onDeletePayment} currentUser={props.user} manualDailies={props.manualDailies} logAction={props.logAction} permissions={permissions} />;
            case 'messages': return <AdminMessagesScreen users={props.users} onSendMessage={props.sendMessage} messages={props.messages} deleteMessage={props.deleteMessage} />;
            case 'slider': return <SliderSettings images={props.sliderImages} isEnabled={props.sliderConfig.isEnabled} onAddImage={props.onAddSliderImage} onDeleteImage={props.onDeleteSliderImage} onUpdateImage={props.onUpdateSliderImage} onToggleSlider={props.onToggleSlider} merchants={merchants} adminUser={props.user} />;
            case 'customizer': return <AppIconCustomizer currentTheme={props.currentTheme} onUpdateTheme={props.onUpdateTheme} onClose={() => setView('orders')} appConfig={props.appConfig} onUpdateAppConfig={props.onUpdateAppConfig} users={props.users} onUpdateUser={props.updateUser} sendNotification={firebaseService.sendExternalNotification} currentUser={props.user} />;
            case 'logs': return <AuditLogsScreen logs={props.auditLogs} onClearLogs={props.onClearLogs} onUndo={props.onUndo} />;
            case 'loyalty': return <LoyaltyScreen promoCodes={props.promoCodes} pointsConfig={props.pointsConfig} onAddPromo={props.onAddPromo} onDeletePromo={props.onDeletePromo} onUpdatePointsConfig={props.onUpdatePointsConfig} />;
            case 'support': return <AdminSupportScreen users={props.users} currentUser={props.user} onBack={() => setView('orders')} />;
            case 'settings': return <SystemSettings orders={props.orders} users={props.users} editOrder={props.editOrder} onSuccess={() => window.location.reload()} onDisconnect={() => window.location.reload()} appConfig={props.appConfig} onUpdateAppConfig={props.onUpdateAppConfig} currentUser={props.user} onFactoryReset={props.onFactoryReset} />;
            case 'games': return <GamesManager appConfig={props.appConfig} onUpdateAppConfig={props.onUpdateAppConfig!} />;
            default: return null;
        }
    };

    // Helper for Frame Styles - Added here for Admin Profile
    const getFrameContainerClass = (type?: string) => {
        if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0'; // Custom frame handles its own styling

        switch (type) {
            case 'gold': return 'p-[3px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.4)]';
            case 'neon': return 'p-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
            case 'royal': return 'p-[3px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-sm border border-purple-500/30';
            case 'fire': return 'p-[3px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
            default: return 'p-[2px] bg-gradient-to-br from-red-600 to-red-800'; // Default Admin Red
        }
    };

    // Enhanced Badge Display Container
    const getBadgeIcon = (type?: string) => {
        if (!type || type === 'none') return null;

        if (type?.startsWith('data:') || type?.startsWith('http')) {
            // Professional Container for Custom Images
            return (
                <div className="w-8 h-8 min-w-[2rem] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-sm overflow-hidden p-0.5 ml-2 backdrop-blur-sm">
                    <img src={type} className="w-full h-full object-contain drop-shadow-sm" alt="badge" />
                </div>
            );
        }

        // Standard Icons
        let IconComponent = null;
        let styleClass = '';

        switch (type) {
            case 'verified': IconComponent = VerifiedIcon; styleClass = "text-blue-400 fill-blue-500/20"; break;
            case 'vip': IconComponent = CrownIcon; styleClass = "text-yellow-400 fill-yellow-500/20"; break;
            case 'star': IconComponent = StarIcon; styleClass = "text-purple-400 fill-purple-500/20"; break;
            case 'popular': IconComponent = RocketIcon; styleClass = "text-red-400 fill-red-500/20"; break;
            case 'admin-badge': IconComponent = SettingsIcon; styleClass = "text-red-500"; break;
            case 'mod-badge': IconComponent = ShieldCheckIcon; styleClass = "text-green-500"; break;
        }

        if (IconComponent) {
            return <IconComponent className={`w-5 h-5 ${styleClass}`} />;
        }
        return null;
    };

    const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

    // Logic to determine if we are in "Full Screen" mode (e.g., Support Screen)
    const isFullScreenMode = view === 'support';

    return (
        <div className={`flex flex-col h-screen overflow-hidden ${currentAdminMode === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
            {/* 📋 القائمة الجانبية */}
            {isSideMenuOpen && (
                <div className="fixed inset-0 z-[100] flex justify-start animate-fadeIn" dir="rtl">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500" onClick={() => setIsSideMenuOpen(false)}></div>
                    {/* Added pt-safe to sidebar */}
                    <div className={`w-[290px] h-full ${currentAdminMode === 'light' ? 'bg-white/90' : 'bg-gray-900/80'} backdrop-blur-2xl border-l border-white/10 shadow-2xl relative flex flex-col z-10 pt-safe rounded-l-[40px] overflow-hidden transform transition-transform duration-300 animate-slide-in-right`}>
                        <div className="p-8 border-b border-white/5 flex flex-col items-center relative">
                            <button onClick={() => setIsSideMenuOpen(false)} className="absolute top-4 left-4 p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 transition-all duration-300 shadow-sm active:scale-90 z-50">
                                <XIcon className="w-5 h-5" />
                            </button>

                            {/* Avatar with Frame - Clickable to Edit */}
                            <button
                                onClick={() => { setEditingUser(realAdminData); setIsSideMenuOpen(false); }}
                                className="relative w-24 h-24 flex items-center justify-center rounded-full shadow-2xl mb-4 group/avatar cursor-pointer transition-transform active:scale-95"
                            >
                                <AvatarFrame
                                    frameId={realAdminData.specialFrame}
                                    size="lg"
                                >
                                    <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden border-2 border-white/10 flex items-center justify-center relative z-0">
                                        {realAdminData.storeImage ? <img src={realAdminData.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-gray-500" />}

                                        {/* Edit Overlay */}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                            <SettingsIcon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </AvatarFrame>
                            </button>

                            <div className="flex items-center gap-2">
                                <h3 className={`font-black text-xl tracking-tight ${currentAdminMode === 'light' ? 'text-gray-900' : 'text-white'}`}>{realAdminData.name}</h3>
                                {getBadgeIcon(realAdminData.specialBadge)}
                            </div>
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mt-1">Administrator</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                            <div className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">القائمة الرئيسية</div>
                            {/* New items added as requested */}
                            <SideMenuItem icon={<TruckIconV2 className="w-5 h-5" />} label="إدارة الطلبات" onClick={() => { setView('orders'); setIsSideMenuOpen(false); }} isActive={view === 'orders'} />
                            <SideMenuItem icon={<ChartBarIcon className="w-5 h-5" />} label="التقارير المفصلة" onClick={() => { setView('reports'); setIsSideMenuOpen(false); }} isActive={view === 'reports'} />
                            <SideMenuItem icon={<DollarSignIcon className="w-5 h-5" />} label="المحفظة والتسويات" onClick={() => { setView('wallet'); setIsSideMenuOpen(false); }} isActive={view === 'wallet'} />
                            <SideMenuItem icon={<HeadsetIcon className="w-5 h-5" />} label="الدعم الفني (Chat)" onClick={() => { setView('support'); setIsSideMenuOpen(false); }} isActive={view === 'support'} />
                            <SideMenuItem icon={<UsersIcon className="w-5 h-5" />} label="إدارة المستخدمين" onClick={() => { setView('users'); setIsSideMenuOpen(false); }} isActive={view === 'users'} />
                            <SideMenuItem icon={<StoreIcon className="w-5 h-5" />} label="إدارة المتاجر" onClick={() => { setView('stores'); setIsSideMenuOpen(false); }} isActive={view === 'stores'} />
                            <SideMenuItem icon={<BellIcon className="w-5 h-5" />} label="مركز الإشعارات" onClick={() => { setView('notifications'); setIsSideMenuOpen(false); }} isActive={view === 'notifications'} />
                            <SideMenuItem icon={<ShieldCheckIcon className="w-5 h-5" />} label="سجل المراقبة" onClick={() => { setView('logs'); setIsSideMenuOpen(false); }} isActive={view === 'logs'} />
                            <SideMenuItem icon={<TicketIcon className="w-5 h-5" />} label="الخصومات والولاء" onClick={() => { setView('loyalty'); setIsSideMenuOpen(false); }} isActive={view === 'loyalty'} />
                            <SideMenuItem icon={<MessageSquareIcon className="w-5 h-5" />} label="إرسال رسائل" onClick={() => { setView('messages'); setIsSideMenuOpen(false); }} isActive={view === 'messages'} />
                            <SideMenuItem icon={<ImageIcon className="w-5 h-5" />} label="إدارة العروض" onClick={() => { setView('slider'); setIsSideMenuOpen(false); }} isActive={view === 'slider'} />
                            <SideMenuItem icon={<PaletteIcon className="w-5 h-5" />} label="تخصيص المظهر" onClick={() => { setView('customizer'); setIsSideMenuOpen(false); }} isActive={view === 'customizer'} />
                            <SideMenuItem icon={<SettingsIcon className="w-5 h-5" />} label="الإعدادات السحابية" onClick={() => { setView('settings'); setIsSideMenuOpen(false); }} isActive={view === 'settings'} />
                            <SideMenuItem icon={<GamepadIcon className="w-5 h-5" />} label="إدارة الألعاب" onClick={() => { setView('games'); setIsSideMenuOpen(false); }} isActive={view === 'games'} />
                        </div>
                        <div className="p-6 border-t border-white/5 bg-black/20 pb-safe">
                            <SideMenuItem icon={<LogoutIconV2 className="w-5 h-5" />} label="تسجيل الخروج" onClick={props.onLogout} danger />
                        </div>
                    </div>
                </div>
            )}

            {/* Hide Header in Full Screen Mode (e.g. Support Chat) */}
            {!isFullScreenMode && view !== 'add_order' && (
                // Header with pt-safe and top-0 sticky
                <header className={`${currentAdminMode === 'light' ? 'bg-white/95' : 'bg-gray-800/95'} backdrop-blur-md border-b border-red-500/20 sticky top-0 z-30 shadow-xl pt-safe rounded-b-[35px] mx-2 mt-1 transition-all duration-300`}>
                    <div className="max-w-7xl mx-auto py-3 px-4 flex justify-between items-center relative h-14">
                        <button onClick={() => setIsSideMenuOpen(true)} className="flex items-center gap-3 active:scale-95 transition-transform group focus:outline-none">
                            <div className="relative">
                                <AvatarFrame
                                    frameId={realAdminData.specialFrame}
                                    size="sm"
                                    className="scale-110"
                                >
                                    <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden relative z-0 border border-white/10 ${currentAdminMode === 'light' ? 'bg-gray-100' : 'bg-gray-700'}`}>
                                        {realAdminData.storeImage ? (
                                            <img src={realAdminData.storeImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-red-500 font-black text-sm">{realAdminData.name.charAt(0)}</div>
                                        )}
                                    </div>
                                </AvatarFrame>
                            </div>
                        </button>
                        <h1 className="text-xl font-black absolute left-1/2 -translate-x-1/2 select-none">
                            <span className="text-red-600">{firstTitlePart}</span>
                            <span className={currentAdminMode === 'light' ? 'text-gray-900 ml-1' : 'text-white ml-1'}>{restTitleParts}</span>
                        </h1>

                        <div className="flex items-center gap-1">
                            <button onClick={() => setView('notifications')} className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <BellIcon className={`w-6 h-6 ${notificationCount > 0 ? "text-yellow-500" : "text-gray-400"}`} />
                                {notificationCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center bg-red-600 text-[9px] font-bold text-white rounded-full ring-2 ring-gray-800 animate-pulse">{notificationCount}</span>}
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <main
                className={view === 'add_order' ? "flex-1 bg-[#111] h-full" : isFullScreenMode ? "flex-1 h-full relative" : "flex-1 overflow-hidden relative p-4 sm:p-6 pb-24"}
            >
                {/* 
                    Smooth View Transitions 
                    Using 'key' allows the component to re-mount and trigger entry animations 
                */}
                <div key={view} className="h-full animate-fade-in-up hardware-accelerated">
                    {/* 🔥 Performance Optimization: Keep Orders Screen Mounted! */}
                    {/* Each View gets its OWN PullToRefresh instance to ensure independent scrolling state */}

                    <div className={`h-full ${view === 'orders' ? 'block' : 'hidden'}`}>
                        <PullToRefresh onRefresh={handleRefresh}>
                            <AdminOrdersScreen
                                orders={props.orders} users={props.users}
                                deleteOrder={props.deleteOrder} updateOrderStatus={props.updateOrderStatus}
                                editOrder={props.editOrder} assignDriverAndSetStatus={props.assignDriverAndSetStatus}
                                adminAddOrder={props.adminAddOrder} onOpenStatusModal={handleOpenStatusModal}
                                onOpenPaymentModal={handleOpenPaymentModal}
                                onNavigateToAdd={handleNavigateToAdd}
                                onBulkAssign={handleBulkAssign}
                                onBulkStatusUpdate={handleBulkStatusUpdate}
                                onBulkDelete={handleBulkDelete}
                                appName={fullAppName}
                                currentUser={props.user}
                                viewMode="default"
                            />
                        </PullToRefresh>
                    </div>

                    <div className={`h-full ${view === 'shopping' ? 'block' : 'hidden'}`}>
                        <PullToRefresh onRefresh={handleRefresh}>
                            <AdminOrdersScreen
                                orders={props.orders} users={props.users}
                                deleteOrder={props.deleteOrder} updateOrderStatus={props.updateOrderStatus}
                                editOrder={props.editOrder} assignDriverAndSetStatus={props.assignDriverAndSetStatus}
                                adminAddOrder={props.adminAddOrder} onOpenStatusModal={handleOpenStatusModal}
                                onOpenPaymentModal={handleOpenPaymentModal}
                                onNavigateToAdd={handleNavigateToAdd}
                                onBulkAssign={handleBulkAssign}
                                onBulkStatusUpdate={handleBulkStatusUpdate}
                                onBulkDelete={handleBulkDelete}
                                appName={fullAppName}
                                currentUser={props.user}
                                viewMode="shopping"
                            />
                        </PullToRefresh>
                    </div>

                    <div className={`h-full ${view === 'special' ? 'block' : 'hidden'}`}>
                        <PullToRefresh onRefresh={handleRefresh}>
                            <AdminOrdersScreen
                                orders={props.orders} users={props.users}
                                deleteOrder={props.deleteOrder} updateOrderStatus={props.updateOrderStatus}
                                editOrder={props.editOrder} assignDriverAndSetStatus={props.assignDriverAndSetStatus}
                                adminAddOrder={props.adminAddOrder} onOpenStatusModal={handleOpenStatusModal}
                                onOpenPaymentModal={handleOpenPaymentModal}
                                onNavigateToAdd={handleNavigateToAdd}
                                onBulkAssign={handleBulkAssign}
                                onBulkStatusUpdate={handleBulkStatusUpdate}
                                onBulkDelete={handleBulkDelete}
                                appName={fullAppName}
                                currentUser={props.user}
                                viewMode="special"
                            />
                        </PullToRefresh>
                    </div>

                    {/* Other views wrapped in individual PullToRefresh instances */}
                    {view === 'users' && (
                        <div className="h-full">
                            <PullToRefresh onRefresh={handleRefresh}>
                                <AdminUsersScreen users={props.users} updateUser={props.updateUser} onDeleteUser={props.deleteUser} onAdminAddUser={props.adminAddUser} setEditingUser={setEditingUser} onViewUser={setViewingUser} appName={fullAppName} currentUser={props.user} />
                            </PullToRefresh>
                        </div>
                    )}

                    {/* Wrappers for other views to ensure independent scrolling */}
                    {view === 'reports' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><AdminReportsScreen orders={props.orders} users={props.users} payments={props.payments} currentUser={props.user} manualDailies={props.manualDailies} /></PullToRefresh></div>}
                    {view === 'add_order' && <AddOrderModal merchants={merchants} onClose={() => setView('orders')} onSave={props.adminAddOrder} getNewId={props.getNewId} />}
                    {view === 'stores' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><AdminStoresScreen users={props.users} orders={props.orders} updateUser={props.updateUser} /></PullToRefresh></div>}
                    {view === 'notifications' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><NotificationsScreen users={props.users} updateUser={props.updateUser} onDeleteUser={props.deleteUser} passwordResetRequests={props.passwordResetRequests} resolvePasswordResetRequest={props.resolvePasswordResetRequest} setEditingUser={setEditingUser} pendingOrders={props.orders.filter(o => o.status === OrderStatus.Pending && !o.driverId)} onNavigateToOrders={() => setView('orders')} unreadChats={unreadSupportChats} onNavigateToSupport={() => setView('support')} /></PullToRefresh></div>}
                    {view === 'wallet' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><AdminWalletScreen orders={props.orders} users={props.users} payments={props.payments} updateUser={props.updateUser} handleDriverPayment={props.handleDriverPayment} onDeletePayment={props.onDeletePayment} currentUser={props.user} manualDailies={props.manualDailies} logAction={props.logAction} /></PullToRefresh></div>}
                    {view === 'messages' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><AdminMessagesScreen users={props.users} onSendMessage={props.sendMessage} messages={props.messages} deleteMessage={props.deleteMessage} /></PullToRefresh></div>}
                    {view === 'slider' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><SliderSettings images={props.sliderImages} isEnabled={props.sliderConfig.isEnabled} onAddImage={props.onAddSliderImage} onDeleteImage={props.onDeleteSliderImage} onUpdateImage={props.onUpdateSliderImage} onToggleSlider={props.onToggleSlider} merchants={merchants} adminUser={props.user} /></PullToRefresh></div>}
                    {view === 'customizer' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><AppIconCustomizer currentTheme={props.currentTheme} onUpdateTheme={props.onUpdateTheme} onClose={() => setView('orders')} appConfig={props.appConfig} onUpdateAppConfig={props.onUpdateAppConfig} users={props.users} onUpdateUser={props.updateUser} sendNotification={firebaseService.sendExternalNotification} currentUser={props.user} /></PullToRefresh></div>}
                    {view === 'logs' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><AuditLogsScreen logs={props.auditLogs} onClearLogs={props.onClearLogs} onUndo={props.onUndo} /></PullToRefresh></div>}
                    {view === 'loyalty' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><LoyaltyScreen promoCodes={props.promoCodes} pointsConfig={props.pointsConfig} onAddPromo={props.onAddPromo} onDeletePromo={props.onDeletePromo} onUpdatePointsConfig={props.onUpdatePointsConfig} /></PullToRefresh></div>}
                    {view === 'support' && <AdminSupportScreen users={props.users} currentUser={props.user} onBack={() => setView('orders')} />}
                    {view === 'settings' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><SystemSettings orders={props.orders} users={props.users} editOrder={props.editOrder} onSuccess={() => window.location.reload()} onDisconnect={() => window.location.reload()} appConfig={props.appConfig} onUpdateAppConfig={props.onUpdateAppConfig} currentUser={props.user} /></PullToRefresh></div>}
                    {view === 'games' && <div className="h-full"><PullToRefresh onRefresh={handleRefresh}><GamesManager appConfig={props.appConfig} onUpdateAppConfig={props.onUpdateAppConfig!} /></PullToRefresh></div>}
                </div>
            </main>

            {/* Hide Bottom Nav in Full Screen Mode */}
            {!isFullScreenMode && view !== 'add_order' && <AdminBottomNav activeView={view as AdminView} onNavigate={(v) => setView(v)} isVisible={isNavVisible} mode={currentAdminMode} />}

            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={(id, data) => { props.updateUser(id, data); setEditingUser(null); }} isLastAdmin={editingUser.role === 'admin'} isPrimaryAdmin={editingUser.id === '5'} appName={fullAppName} currentUser={props.user} />}
            {viewingUser && <UserDetailsModal user={viewingUser} onClose={() => setViewingUser(null)} onApprove={(id, data) => { props.updateUser(id, data); setViewingUser(null); }} onDelete={(id) => { props.deleteUser(id); setViewingUser(null); }} />}
            {statusChangeOrder && <ChangeStatusModal order={statusChangeOrder} onClose={() => setStatusChangeOrder(null)} onSelectStatus={(o, s) => { setStatusChangeOrder(null); setTimeout(() => { if (s === OrderStatus.InTransit) setAssigningDriverOrder(o); else setStatusConfirmation({ order: o, newStatus: s }); }, 150); }} onTransferOrder={(o) => { setStatusChangeOrder(null); setTimeout(() => { setTransferOrder(o); }, 100); }} />}
            {assigningDriverOrder && <AssignDriverModal order={assigningDriverOrder} drivers={drivers} targetStatus={OrderStatus.InTransit} onClose={() => setAssigningDriverOrder(null)} onSave={(d, f) => { props.assignDriverAndSetStatus(assigningDriverOrder.id, d, f, OrderStatus.InTransit); setAssigningDriverOrder(null); }} />}
            {transferOrder && <AssignDriverModal order={transferOrder} drivers={drivers} targetStatus={OrderStatus.InTransit} onClose={() => setTransferOrder(null)} onSave={(d, f) => { props.assignDriverAndSetStatus(transferOrder.id, d, f, OrderStatus.InTransit); setTransferOrder(null); }} />}

            {editingPaymentOrder && (
                <PaymentModal
                    order={editingPaymentOrder}
                    onClose={() => setEditingPaymentOrder(null)}
                    onSave={handleUpdatePayment}
                />
            )}

            {statusConfirmation && <ConfirmationModal title={`تأكيد تغيير الحالة`} message={`هل تؤكد تغيير حالة الطلب؟`} onClose={() => setStatusConfirmation(null)} onConfirm={handleConfirmStatusChange} confirmVariant={statusConfirmation.newStatus === OrderStatus.Delivered ? 'success' : 'primary'} />}
            {deleteConfirmation && <ConfirmationModal title={deleteConfirmation.type === 'all' ? "حذف الكل ⚠️" : "تأكيد الحذف"} message={deleteConfirmation.message} onClose={() => setDeleteConfirmation(null)} onConfirm={executeDelete} confirmVariant="danger" confirmButtonText="نعم، حذف نهائي" cancelButtonText="تراجع" />}
        </div>
    );
};

export default AdminPanel;
