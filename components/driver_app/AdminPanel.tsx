








import React, { useState } from 'react';
import { Order, User, OrderStatus, Customer, Role, SupervisorPermission, Message, Payment } from '../../types';
import AdminOrdersScreen from './AdminOrdersScreen';
import AdminUsersScreen from './AdminUsersScreen';
import { NotificationsScreen } from './NotificationsScreen';
import AdminBottomNav from './AdminBottomNav';
import { BellIcon, LogoutIconV2, RefreshCwIcon } from '../icons';
import AdminWalletScreen from './AdminWalletScreen';
import EditUserModal from './EditUserModal';
import AdminMessagesScreen from './AdminMessagesScreen';

type AdminView = 'orders' | 'users' | 'notifications' | 'wallet' | 'messages';

interface AdminPanelProps {
  user: User;
  orders: Order[];
  users: User[];
  payments: Payment[];
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  deleteOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  editOrder: (orderId: string, updatedData: { customer: Customer, notes?: string, merchantId: string, driverId?: string, deliveryFee?: number }) => void;
  assignDriverAndSetStatus: (orderId: string, driverId: string, deliveryFee: number, status: OrderStatus.InTransit | OrderStatus.Delivered) => void;
  adminAddOrder: (newOrder: { customer: Customer; notes?: string; merchantId: string; }) => void;
  adminAddUser: (newUser: { name: string; phone: string; password?: string; role: Role; commissionRate?: number; commissionType?: 'percentage' | 'fixed'; permissions?: SupervisorPermission[]; dailyLogMode?: '12_hour' | 'always_open' }) => void;
  onLogout: () => void;
  passwordResetRequests: { phone: string; requestedAt: Date }[];
  resolvePasswordResetRequest: (phone: string) => void;
  sendMessage: (messageData: { text: string; image?: string; targetRole: 'driver' | 'merchant'; targetId: string; }) => void;
  handleDriverPayment: (driverId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [view, setView] = useState<AdminView>('orders');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const pendingUsersCount = props.users.filter(u => u.status === 'pending' && u.role !== 'admin').length;
  const notificationCount = pendingUsersCount + props.passwordResetRequests.length;
  
  const isLastAdmin = props.users.filter(u => u.role === 'admin').length === 1;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullPosition, setPullPosition] = useState(0);
  const [startY, setStartY] = useState(0);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (isRefreshing) return;
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    const mainElement = e.currentTarget;
    if (mainElement.scrollTop === 0 && !isRefreshing) {
        const pullDistance = e.touches[0].clientY - startY;
        if (pullDistance > 0) {
            e.preventDefault(); 
            setPullPosition(pullDistance);
        }
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing) return;
    if (pullPosition > PULL_THRESHOLD) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setPullPosition(0);
      }, 1500);
    } else {
      setPullPosition(0);
    }
  };


  const handleSaveEditUser = (userId: string, updatedData: Partial<User>) => {
    if (userId === props.user.id && updatedData.role && updatedData.role !== 'admin') {
        props.updateUser(userId, updatedData);
        props.onLogout();
    } else {
        props.updateUser(userId, updatedData);
    }
    setEditingUser(null);
  };

  const renderView = () => {
    switch (view) {
      case 'orders':
        return <AdminOrdersScreen 
            orders={props.orders}
            users={props.users}
            deleteOrder={props.deleteOrder}
            updateOrderStatus={props.updateOrderStatus}
            editOrder={props.editOrder}
            assignDriverAndSetStatus={props.assignDriverAndSetStatus}
            adminAddOrder={props.adminAddOrder}
        />;
      case 'users':
        return <AdminUsersScreen 
            users={props.users} 
            updateUser={props.updateUser}
            onDeleteUser={props.deleteUser}
            onAdminAddUser={props.adminAddUser}
            setEditingUser={setEditingUser}
        />;
      case 'notifications':
        return <NotificationsScreen 
            users={props.users} 
            updateUser={props.updateUser} 
            onDeleteUser={props.deleteUser}
            passwordResetRequests={props.passwordResetRequests}
            resolvePasswordResetRequest={props.resolvePasswordResetRequest}
            setEditingUser={(user) => setEditingUser(user)}
        />;
      case 'wallet':
        return <AdminWalletScreen 
            orders={props.orders} 
            users={props.users} 
            payments={props.payments}
            updateUser={props.updateUser} 
            handleDriverPayment={props.handleDriverPayment}
        />;
      case 'messages':
        return <AdminMessagesScreen users={props.users} onSendMessage={props.sendMessage} />;
      default:
        return <AdminOrdersScreen {...props} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <button onClick={props.onLogout} className="text-neutral-400 hover:text-red-500 transition-colors">
            <LogoutIconV2 className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">
            <span className="text-red-500">GOO</span>
            <span className="text-white"> NOW</span>
          </h1>
          <button onClick={() => setView('notifications')} className="relative text-neutral-400 hover:text-red-500 transition-colors">
            <BellIcon className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-gray-800">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </header>
      
      <main 
        className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 relative"
        onTouchStart={view === 'orders' ? handleTouchStart : undefined}
        onTouchMove={view === 'orders' ? handleTouchMove : undefined}
        onTouchEnd={view === 'orders' ? handleTouchEnd : undefined}
        >
        <div 
            className="absolute top-[-50px] left-0 right-0 h-[50px] flex justify-center items-center pointer-events-none transition-transform duration-300 z-0"
            style={{
                transform: `translateY(${isRefreshing ? 50 + 20 : Math.min(pullPosition, PULL_THRESHOLD * 1.5)}px)`,
                opacity: isRefreshing || pullPosition > 20 ? 1 : 0
            }}
        >
            <div className="bg-gray-800 p-3 rounded-full shadow-lg border border-gray-700">
                <RefreshCwIcon 
                    className={`w-6 h-6 text-white transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
                    style={{
                        transform: isRefreshing ? 'none' : `rotate(${(pullPosition / PULL_THRESHOLD) * 360}deg)`
                    }}
                />
            </div>
        </div>
        {renderView()}
      </main>

      <AdminBottomNav activeView={view} onNavigate={setView} />
      
      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEditUser}
          isLastAdmin={editingUser.role === 'admin' && isLastAdmin}
          isPrimaryAdmin={editingUser.id === '5'}
        />
      )}
    </div>
  );
};

export default AdminPanel;