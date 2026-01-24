
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Order, User, OrderStatus, Customer, Role, SupervisorPermission, Payment, AuditLog, PromoCode, Message, AppConfig } from '../../types';
import AdminOrdersScreen from '../admin/AdminOrdersScreen';
import AdminUsersScreen from '../admin/AdminUsersScreen';
import AdminWalletScreen from '../admin/AdminWalletScreen';
import { AdminReportsScreen } from '../admin/AdminReportsScreen';
import AdminBottomNav from '../admin/AdminBottomNav';
import { LogoutIconV2, ShieldCheckIcon, TicketIcon, UsersIcon, ChevronLeftIcon, UserIcon, CoinsIcon, XIcon, StoreIcon, ClockIcon, PlusIcon, ChartBarIcon, MessageSquareIcon, BellIcon, ImageIcon, HeadsetIcon, PaletteIcon, VerifiedIcon, CrownIcon, StarIcon, RocketIcon, SettingsIcon } from '../icons';
import EditUserModal from '../admin/EditUserModal';
import AddOrderModal from '../admin/AddOrderModal';
import ChangeStatusModal from '../admin/ChangeStatusModal';
import AssignDriverModal from '../admin/AssignDriverModal';
import ConfirmationModal from '../admin/ConfirmationModal';
import AuditLogsScreen from '../admin/AuditLogsScreen';
import LoyaltyScreen from '../admin/LoyaltyScreen';
import AdminMessagesScreen from '../admin/AdminMessagesScreen';
import { NotificationsScreen } from '../admin/NotificationsScreen';
import useAndroidBack from '../../hooks/useAndroidBack';
import AdminStoresScreen from '../admin/AdminStoresScreen';
import SliderSettings from '../admin/SliderSettings';
import AdminSupportScreen from '../admin/AdminSupportScreen';
import AppIconCustomizer from '../admin/AppIconCustomizer';
import * as firebaseService from '../../services/firebase';

type SupervisorView = 'orders' | 'users' | 'wallet' | 'add_order' | 'logs' | 'loyalty' | 'reports' | 'messages' | 'notifications' | 'stores' | 'slider' | 'support' | 'customizer';

interface SupervisorPanelProps {
  user: User;
  orders: Order[];
  users: User[];
  payments: Payment[];
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
    deliveryFee?: number | null // Updated Type
  }) => void;
  assignDriverAndSetStatus: (orderId: string, driverId: string, deliveryFee: number, status: OrderStatus.InTransit | OrderStatus.Delivered) => void;
  adminAddOrder: (newOrder: { customer: Customer; notes?: string; merchantId: string; } | { customer: Customer; notes?: string; merchantId: string; }[]) => void;
  adminAddUser: (newUser: { name: string; phone: string; password?: string; role: Role; commissionRate?: number; commissionType?: 'percentage' | 'fixed'; permissions?: SupervisorPermission[]; dailyLogMode?: '12_hour' | 'always_open'; storeImage?: string }) => Promise<User | void>;
  handleDriverPayment: (driverId: string) => void;
  onLogout: () => void;
  onBulkUpdate: (updates: any[]) => Promise<void>;
  auditLogs: AuditLog[];
  promoCodes: PromoCode[];
  pointsConfig: { pointsPerCurrency: number; currencyPerPoint: number; isPointsEnabled?: boolean };
  onAddPromo: (promo: PromoCode) => void;
  onDeletePromo: (id: string) => void;
  onUpdatePointsConfig: (config: any) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  messages: Message[];
  sendMessage: (messageData: { text: string; image?: string; targetRole: 'driver' | 'merchant' | 'customer'; targetIds: string[]; }) => void;
  deleteMessage: (id: string) => void;
  passwordResetRequests: { phone: string; requestedAt: Date }[];
  resolvePasswordResetRequest: (phone: string) => void;
  // Slider Props
  sliderImages: any[];
  sliderConfig: any;
  onAddSliderImage: (image: any) => void;
  onDeleteSliderImage: (id: string) => void;
  onUpdateSliderImage: (id: string, data: any) => void;
  onToggleSlider: (isEnabled: boolean) => void;
  appConfig?: AppConfig;
  currentTheme?: any;
  onUpdateTheme?: (appType: 'driver' | 'merchant' | 'customer' | 'admin', config: any) => void;
}

const SideMenuItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, isActive?: boolean, danger?: boolean }> = ({ icon, label, onClick, isActive, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden active:scale-95 mb-2 ${danger
      ? 'text-red-400 hover:bg-red-500/10'
      : isActive
        ? 'bg-cyan-600/20 text-white border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
  >
    {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-full"></div>}
    <div className={`relative z-10 transition-transform group-hover:scale-110 duration-300 ${isActive ? 'text-cyan-400' : ''}`}>
      {icon}
    </div>
    <span className={`relative z-10 font-bold text-sm ${isActive ? 'translate-x-1' : ''} transition-transform duration-300`}>{label}</span>
  </button>
);

const SupervisorPanel: React.FC<SupervisorPanelProps> = (props) => {
  const userPermissions = props.user.permissions || [];
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [statusChangeOrder, setStatusChangeOrder] = useState<Order | null>(null);
  const [assigningDriverOrder, setAssigningDriverOrder] = useState<Order | null>(null);
  const [transferOrder, setTransferOrder] = useState<Order | null>(null);
  const [statusConfirmation, setStatusConfirmation] = useState<{ order: Order; newStatus: OrderStatus } | null>(null);

  const merchants = useMemo(() => props.users.filter(u => u.role === 'merchant'), [props.users]);
  const drivers = useMemo(() => props.users.filter(u => u.role === 'driver'), [props.users]);

  const [isNavVisible, setIsNavVisible] = useState(true);

  // Calculate notifications
  const pendingUsersCount = props.users.filter(u => u.status === 'pending' && u.role !== 'admin').length;
  const pendingOrdersCount = props.orders.filter(o => o.status === OrderStatus.Pending && !o.driverId).length;
  const notificationCount = pendingUsersCount + props.passwordResetRequests.length + pendingOrdersCount;

  const getDefaultView = (): SupervisorView => {
    if (userPermissions.includes('manage_orders') || userPermissions.includes('view_orders')) return 'orders';
    if (userPermissions.includes('view_reports')) return 'reports';
    if (userPermissions.includes('view_users')) return 'users';
    if (userPermissions.includes('send_messages')) return 'messages';
    if (userPermissions.includes('manage_support')) return 'support';
    if (userPermissions.includes('manage_decorations')) return 'customizer';
    return 'orders';
  };

  const [view, setView] = useState<SupervisorView>(getDefaultView());

  useAndroidBack(() => {
    if (isSideMenuOpen) { setIsSideMenuOpen(false); return true; }
    if (statusChangeOrder) { setStatusChangeOrder(null); return true; }
    if (assigningDriverOrder) { setAssigningDriverOrder(null); return true; }
    if (transferOrder) { setTransferOrder(null); return true; }
    if (statusConfirmation) { setStatusConfirmation(null); return true; }
    if (editingUser) { setEditingUser(null); return true; }
    if (view === 'add_order' || view === 'notifications') { setView('orders'); return true; }
    if (view !== 'orders' && (userPermissions.includes('view_orders') || userPermissions.includes('manage_orders'))) { setView('orders'); return true; }
    return false;
  }, [view, editingUser, statusChangeOrder, assigningDriverOrder, transferOrder, statusConfirmation, userPermissions, isSideMenuOpen]);

  const handleBulkAssign = async (driverId: string, fee: number) => {
    if (!userPermissions.includes('manage_orders')) return;
    const pendingOrders = props.orders.filter(o => o.status === OrderStatus.Pending && !o.driverId);
    if (pendingOrders.length === 0) return;
    const updates = pendingOrders.map(o => ({ ...o, driverId, deliveryFee: fee, status: OrderStatus.InTransit }));
    await props.onBulkUpdate(updates);
    props.showNotification(`تم تعيين ${updates.length} طلب للمندوب بنجاح`, 'success');
  };

  const handleBulkDelete = async (status: OrderStatus | 'all') => {
    if (!userPermissions.includes('delete_orders')) return;
    const ordersToDelete = status === 'all'
      ? props.orders
      : props.orders.filter(o => o.status === status);

    if (ordersToDelete.length === 0) return;

    for (const order of ordersToDelete) {
      await props.deleteOrder(order.id);
    }
    props.showNotification(`تم حذف ${ordersToDelete.length} طلب بنجاح`, 'success');
  };

  const renderView = () => {
    switch (view) {
      case 'orders': return (userPermissions.includes('view_orders') || userPermissions.includes('manage_orders')) ? (
        <AdminOrdersScreen
          {...props}
          permissions={userPermissions}
          onNavigateToAdd={() => setView('add_order')}
          onOpenStatusModal={userPermissions.includes('manage_orders') ? setStatusChangeOrder : undefined}
          onBulkAssign={userPermissions.includes('manage_orders') ? handleBulkAssign : undefined}
          onBulkDelete={userPermissions.includes('delete_orders') ? handleBulkDelete : undefined}
        />
      ) : null;
      case 'reports': return userPermissions.includes('view_reports') ? <AdminReportsScreen orders={props.orders} users={props.users} payments={props.payments} /> : null;
      case 'add_order': return <AddOrderModal merchants={merchants} onClose={() => setView('orders')} onSave={async (data) => { await props.adminAddOrder(data); }} />;
      case 'notifications': return (
        <NotificationsScreen
          users={props.users.filter(u => u.role !== 'admin')}
          updateUser={props.updateUser}
          onDeleteUser={props.deleteUser}
          passwordResetRequests={props.passwordResetRequests}
          resolvePasswordResetRequest={props.resolvePasswordResetRequest}
          setEditingUser={setEditingUser}
          pendingOrders={props.orders.filter(o => o.status === OrderStatus.Pending && !o.driverId)}
          onNavigateToOrders={() => setView('orders')}
        />
      );

      case 'users':
        // Strict filter: Supervisors CANNOT see admins, but logic is handled deeper in AdminUsersScreen too
        // We pass currentUser to handle specific restrictions (e.g., editing other supervisors)
        const visibleUsers = props.users.filter(u => u.role !== 'admin');
        return userPermissions.includes('view_users') || userPermissions.includes('manage_users') ?
          <AdminUsersScreen
            {...props}
            users={visibleUsers}
            onAdminAddUser={props.adminAddUser}
            onDeleteUser={props.deleteUser}
            permissions={userPermissions}
            setEditingUser={setEditingUser}
            currentUser={props.user}
          /> : null;

      case 'stores': return userPermissions.includes('manage_stores') ? <AdminStoresScreen users={props.users} orders={props.orders} updateUser={props.updateUser} /> : null;
      case 'slider': return userPermissions.includes('manage_slider') ? <SliderSettings images={props.sliderImages} isEnabled={props.sliderConfig.isEnabled} onAddImage={props.onAddSliderImage} onDeleteImage={props.onDeleteSliderImage} onUpdateImage={props.onUpdateSliderImage} onToggleSlider={props.onToggleSlider} merchants={merchants} adminUser={undefined} /> : null;
      case 'wallet': return userPermissions.includes('view_wallet') ? <AdminWalletScreen {...props} /> : null;
      case 'logs': return userPermissions.includes('view_logs') ? <AuditLogsScreen logs={props.auditLogs} onClearLogs={() => { }} /> : null;
      case 'loyalty': return userPermissions.includes('manage_promo') ? <LoyaltyScreen promoCodes={props.promoCodes} pointsConfig={props.pointsConfig} onAddPromo={props.onAddPromo} onDeletePromo={props.onDeletePromo} onUpdatePointsConfig={props.onUpdatePointsConfig} /> : null;
      case 'messages': return userPermissions.includes('send_messages') ? <AdminMessagesScreen users={props.users.filter(u => u.role !== 'admin')} onSendMessage={props.sendMessage} messages={props.messages} deleteMessage={props.deleteMessage} /> : null;
      case 'support': return userPermissions.includes('manage_support') ? <AdminSupportScreen users={props.users} isRestricted={true} currentUser={props.user} /> : null;
      case 'customizer': return userPermissions.includes('manage_decorations') && props.currentTheme && props.onUpdateTheme ?
        <AppIconCustomizer
          onClose={() => setView('orders')}
          currentTheme={props.currentTheme}
          onUpdateTheme={props.onUpdateTheme}
          users={props.users}
          onUpdateUser={props.updateUser}
          sendNotification={firebaseService.sendExternalNotification}
          currentUser={props.user}
        /> : null;
      default: return null;
    }
  };

  const availableViews = [
    { id: 'orders', condition: userPermissions.includes('view_orders') || userPermissions.includes('manage_orders') },
    { id: 'users', condition: userPermissions.includes('view_users') || userPermissions.includes('manage_users') },
    { id: 'wallet', condition: userPermissions.includes('view_wallet') },
    { id: 'stores', condition: userPermissions.includes('manage_stores') },
    { id: 'slider', condition: userPermissions.includes('manage_slider') },
    { id: 'messages', condition: userPermissions.includes('send_messages') },
    { id: 'support', condition: userPermissions.includes('manage_support') },
    { id: 'customizer', condition: userPermissions.includes('manage_decorations') },
  ].filter(item => item.condition).map(item => item.id);

  // App Name Logic
  const appName = props.appConfig?.appName || 'GOO NOW';
  const [firstWord, ...restWords] = appName.split(' ');
  const restOfName = restWords.join(' ');

  // Helper for Frame Styles
  const getFrameContainerClass = (type?: string) => {
    if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0'; // Custom frame handles its own styling
    switch (type) {
      case 'gold': return 'p-[3px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.4)]';
      case 'neon': return 'p-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
      case 'royal': return 'p-[3px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-sm border border-purple-500/30';
      case 'fire': return 'p-[3px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
      default: return 'p-[2px] bg-gradient-to-br from-cyan-500 to-blue-600';
    }
  };

  const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

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

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* 📋 القائمة الجانبية للمشرف */}
      {isSideMenuOpen && (
        <div className="fixed inset-0 z-[60] flex justify-start animate-fadeIn" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500" onClick={() => setIsSideMenuOpen(false)}></div>
          <div className="w-[290px] h-full bg-[#111827]/60 backdrop-blur-3xl border-l border-white/10 shadow-2xl relative flex flex-col z-10 pt-safe rounded-l-[40px] overflow-hidden transform animate-slide-in-right">
            <div className="p-8 border-b border-white/5 relative flex flex-col items-center">
              <button onClick={() => setIsSideMenuOpen(false)} className="absolute top-4 left-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 active:scale-90"><XIcon className="w-5 h-5" /></button>

              {/* Avatar with Frame - Clickable to Edit */}
              <button
                onClick={() => { setEditingUser(props.user); setIsSideMenuOpen(false); }}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-4 relative group/avatar cursor-pointer transition-transform active:scale-95 ${!isCustomFrame(props.user.specialFrame) ? getFrameContainerClass(props.user.specialFrame) : ''}`}
              >
                {isCustomFrame(props.user.specialFrame) && (
                  <img src={props.user.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-[1.65] pointer-events-none" alt="frame" />
                )}
                <div className={`${isCustomFrame(props.user.specialFrame) ? 'w-[85%] h-[85%]' : 'w-full h-full'} rounded-full bg-gray-900 overflow-hidden border-2 border-white/10 flex items-center justify-center relative z-0`}>
                  {props.user.storeImage ? <img src={props.user.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-gray-500" />}

                  {/* Edit Overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <SettingsIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2 mt-2">
                <h3 className="font-black text-xl tracking-tight text-white">{props.user.name}</h3>
                {getBadgeIcon(props.user.specialBadge)}
              </div>
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] mt-1">Supervisor</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
              {userPermissions.includes('view_reports') && <SideMenuItem icon={<ChartBarIcon className="w-5 h-5" />} label="التقارير المالية" onClick={() => { setView('reports'); setIsSideMenuOpen(false); }} isActive={view === 'reports'} />}
              {userPermissions.includes('manage_support') && <SideMenuItem icon={<HeadsetIcon className="w-5 h-5" />} label="رسائل الدعم" onClick={() => { setView('support'); setIsSideMenuOpen(false); }} isActive={view === 'support'} />}
              {userPermissions.includes('view_users') && <SideMenuItem icon={<UsersIcon className="w-5 h-5" />} label="المستخدمين" onClick={() => { setView('users'); setIsSideMenuOpen(false); }} isActive={view === 'users'} />}
              {userPermissions.includes('manage_stores') && <SideMenuItem icon={<StoreIcon className="w-5 h-5" />} label="إدارة المتاجر" onClick={() => { setView('stores'); setIsSideMenuOpen(false); }} isActive={view === 'stores'} />}
              {userPermissions.includes('manage_slider') && <SideMenuItem icon={<ImageIcon className="w-5 h-5" />} label="إدارة العروض" onClick={() => { setView('slider'); setIsSideMenuOpen(false); }} isActive={view === 'slider'} />}
              {userPermissions.includes('send_messages') && <SideMenuItem icon={<MessageSquareIcon className="w-5 h-5" />} label="الرسائل" onClick={() => { setView('messages'); setIsSideMenuOpen(false); }} isActive={view === 'messages'} />}
              {userPermissions.includes('view_logs') && <SideMenuItem icon={<ShieldCheckIcon className="w-5 h-5" />} label="سجل المراقبة" onClick={() => { setView('logs'); setIsSideMenuOpen(false); }} isActive={view === 'logs'} />}
              {userPermissions.includes('manage_promo') && <SideMenuItem icon={<CoinsIcon className="w-5 h-5" />} label="الخصومات" onClick={() => { setView('loyalty'); setIsSideMenuOpen(false); }} isActive={view === 'loyalty'} />}
              {userPermissions.includes('manage_decorations') && <SideMenuItem icon={<PaletteIcon className="w-5 h-5" />} label="الهدايا والمظهر" onClick={() => { setView('customizer'); setIsSideMenuOpen(false); }} isActive={view === 'customizer'} />}
            </div>
            <div className="p-6 border-t border-white/5 bg-black/20 pb-safe">
              <SideMenuItem icon={<LogoutIconV2 className="w-5 h-5" />} label="تسجيل الخروج" onClick={props.onLogout} danger />
            </div>
          </div>
        </div>
      )}

      {view !== 'add_order' && (
        <header className="bg-gray-800/95 backdrop-blur-md border-b border-cyan-500/30 sticky top-0 z-30 shadow-lg transition-all duration-300 pt-safe rounded-b-[35px] mx-2 mt-1">
          <div className="max-w-7xl mx-auto py-3 px-4 flex justify-between items-center relative h-14">
            <button onClick={() => setIsSideMenuOpen(true)} className="flex items-center gap-3 active:scale-90 transition-transform">
              <div className={`relative w-10 h-10 flex items-center justify-center rounded-full shadow-lg ${!isCustomFrame(props.user.specialFrame) ? getFrameContainerClass(props.user.specialFrame) : ''}`}>
                {isCustomFrame(props.user.specialFrame) && (
                  <img src={props.user.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-[1.5] pointer-events-none" alt="frame" />
                )}
                <div className={`${isCustomFrame(props.user.specialFrame) ? 'w-[85%] h-[85%]' : 'w-full h-full'} rounded-full bg-gray-900 flex items-center justify-center overflow-hidden relative z-0`}>
                  {props.user.storeImage ? <img src={props.user.storeImage} className="w-full h-full object-cover" /> : <div className="text-cyan-500 font-bold text-sm">{props.user.name.charAt(0)}</div>}
                </div>
              </div>
            </button>
            <h1 className="text-2xl font-black absolute left-1/2 -translate-x-1/2 select-none">
              <span className="text-red-600">{firstWord}</span>
              <span className="text-white ml-1">{restOfName}</span>
            </h1>
            <div className="flex items-center gap-1">
              <button onClick={() => setView('notifications')} className="relative p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors">
                <BellIcon className={`w-6 h-6 ${notificationCount > 0 ? "text-yellow-500" : "text-gray-400"}`} />
                {notificationCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center bg-red-600 text-[9px] font-bold text-white rounded-full ring-2 ring-gray-800 animate-pulse">{notificationCount}</span>}
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={view === 'add_order' ? "flex-1 bg-[#111] h-full" : "flex-1 overflow-y-auto p-4 sm:p-6 pb-24 relative"}>
        {renderView()}
      </main>

      {view !== 'add_order' && availableViews.length > 0 && <AdminBottomNav activeView={view as any} onNavigate={(v) => setView(v as SupervisorView)} availableViews={availableViews} isVisible={isNavVisible} />}

      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={(id, data) => { props.updateUser(id, data); setEditingUser(null); }} isLastAdmin={false} currentUser={props.user} />}
      {statusChangeOrder && <ChangeStatusModal order={statusChangeOrder} onClose={() => setStatusChangeOrder(null)} onSelectStatus={(o, s) => { setStatusChangeOrder(null); setTimeout(() => { if (s === OrderStatus.InTransit) setAssigningDriverOrder(o); else setStatusConfirmation({ order: o, newStatus: s }); }, 150); }} onTransferOrder={(o) => { setStatusChangeOrder(null); setTimeout(() => { setTransferOrder(o); }, 100); }} />}
      {assigningDriverOrder && <AssignDriverModal order={assigningDriverOrder} drivers={drivers} targetStatus={OrderStatus.InTransit} onClose={() => setAssigningDriverOrder(null)} onSave={(d, f) => { props.assignDriverAndSetStatus(assigningDriverOrder.id, d, f, OrderStatus.InTransit); setAssigningDriverOrder(null); }} />}
      {transferOrder && <AssignDriverModal order={transferOrder} drivers={drivers} targetStatus={OrderStatus.InTransit} onClose={() => setTransferOrder(null)} onSave={(d, f) => { props.assignDriverAndSetStatus(transferOrder.id, d, f, OrderStatus.InTransit); setTransferOrder(null); }} />}
      {statusConfirmation && <ConfirmationModal title={`تأكيد تغيير الحالة`} message={`هل تؤكد تغيير حالة الطلب؟`} onClose={() => setStatusConfirmation(null)} onConfirm={() => { props.updateOrderStatus(statusConfirmation.order.id, statusConfirmation.newStatus); setStatusConfirmation(null); }} confirmVariant='primary' />}
    </div>
  );
};

export default SupervisorPanel;
