
import React, { useState } from 'react';
import { Order, User, OrderStatus, Customer, Role, SupervisorPermission, Payment } from '../types';
import AdminOrdersScreen from './admin/AdminOrdersScreen';
import AdminUsersScreen from './admin/AdminUsersScreen';
import AdminWalletScreen from './admin/AdminWalletScreen';
import AdminBottomNav from './admin/AdminBottomNav';
import { LogoutIconV2 } from './icons';
import EditUserModal from './admin/EditUserModal';

type SupervisorView = 'orders' | 'users' | 'wallet';

interface SupervisorPanelProps {
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
  adminAddUser: (newUser: { name: string; phone: string; password?: string; role: Role; commissionRate?: number; commissionType?: 'percentage' | 'fixed'; permissions?: SupervisorPermission[]; dailyLogMode?: '12_hour' | 'always_open'; storeImage?: string }) => Promise<User | void>;
  handleDriverPayment: (driverId: string) => void;
  onLogout: () => void;
}


const SupervisorPanel: React.FC<SupervisorPanelProps> = (props) => {
  const userPermissions = props.user.permissions || [];
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const getDefaultView = (): SupervisorView => {
    if (userPermissions.includes('view_orders')) return 'orders';
    if (userPermissions.includes('view_users')) return 'users';
    if (userPermissions.includes('view_wallet')) return 'wallet';
    return 'orders'; 
  }

  const [view, setView] = useState<SupervisorView>(getDefaultView());

  const renderView = () => {
    switch (view) {
      case 'orders':
        return userPermissions.includes('view_orders') ? <AdminOrdersScreen 
            {...props}
            permissions={userPermissions}
        /> : null;
      case 'users':
        // Supervisors should only see drivers and merchants
        const visibleUsers = props.users.filter(u => u.role === 'driver' || u.role === 'merchant');
        return userPermissions.includes('view_users') ? <AdminUsersScreen 
            {...props}
            users={visibleUsers}
            onAdminAddUser={props.adminAddUser}
            onDeleteUser={props.deleteUser}
            permissions={userPermissions}
            setEditingUser={setEditingUser}
        /> : null;
      case 'wallet':
        return userPermissions.includes('view_wallet') ? <AdminWalletScreen 
            {...props}
        /> : null;
      default:
        return null;
    }
  };

  const availableViews = [
    { id: 'orders', condition: userPermissions.includes('view_orders') },
    { id: 'users', condition: userPermissions.includes('view_users') },
    { id: 'wallet', condition: userPermissions.includes('view_wallet') },
  ].filter(item => item.condition).map(item => item.id);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <button onClick={props.onLogout} className="text-neutral-400 hover:text-red-500 transition-colors">
            <LogoutIconV2 className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">
            <span className="text-red-500">DELI</span>
            <span className="text-white"> NOW</span>
          </h1>
          <div className="w-6"/>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20">
        {renderView()}
      </main>

      {availableViews.length > 0 && (
         <AdminBottomNav 
            activeView={view as any} 
            onNavigate={(v) => setView(v as SupervisorView)}
            availableViews={availableViews}
        />
      )}

      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(id, data) => {
            props.updateUser(id, data);
            setEditingUser(null);
          }}
          isLastAdmin={false}
        />
      )}
    </div>
  );
};

export default SupervisorPanel;
