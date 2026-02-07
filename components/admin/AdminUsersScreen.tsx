
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, SupervisorPermission } from '../../types';
import ConfirmationModal from './ConfirmationModal';
import AddUserModal from './AddUserModal';
import UserCard from './UserCard';
import { UsersIcon, UserPlusIcon, SearchIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface AdminUsersScreenProps {
  users: User[];
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  onAdminAddUser: (newUser: { name: string; phone: string; password?: string; role: Role; commissionRate?: number; commissionType?: 'percentage' | 'fixed'; permissions?: SupervisorPermission[], dailyLogMode?: '12_hour' | 'always_open', storeImage?: string }) => Promise<User | void>;
  setEditingUser: (user: User | null) => void;
  onViewUser?: (user: User | null) => void;
  permissions?: SupervisorPermission[];
  appName?: string;
  currentUser?: User; // Pass current user to check restrictions
}

type UserTab = 'drivers' | 'merchants' | 'customers' | 'supervisors' | 'admins' | 'blocked';

const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({ users, updateUser, onDeleteUser, onAdminAddUser, setEditingUser, onViewUser, permissions, appName, currentUser }) => {
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [blockingUser, setBlockingUser] = useState<User | null>(null);
  const [unblockingUser, setUnblockingUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<UserTab>('drivers');
  const [searchQuery, setSearchQuery] = useState('');

  const canManage = !permissions || permissions.includes('manage_users');
  const isSupervisor = currentUser?.role === 'supervisor';

  const { drivers, merchants, customers, supervisors, admins, blocked } = useMemo(() => {
    // Only include non-blocked users in role-specific lists
    const activeUsers = users.filter(u => u.status !== 'blocked');
    const blockedUsers = users.filter(u => u.status === 'blocked');

    const canViewSupervisors = !isSupervisor || (permissions && permissions.includes('manage_supervisors'));

    const drivers = activeUsers.filter(u => u.role === 'driver');
    const merchants = activeUsers.filter(u => u.role === 'merchant');
    const customers = activeUsers.filter(u => u.role === 'customer');
    const supervisors = activeUsers.filter(u => u.role === 'supervisor' && canViewSupervisors);
    const admins = activeUsers.filter(u => u.role === 'admin');

    return { drivers, merchants, customers, supervisors, admins, blocked: blockedUsers };
  }, [users, isSupervisor, permissions]);

  const TABS: { id: UserTab; label: string; data: User[]; color: string }[] = useMemo(() => {
    const canViewSupervisors = !isSupervisor || (permissions && permissions.includes('manage_supervisors'));

    const tabs: { id: UserTab; label: string; data: User[]; color: string }[] = [
      { id: 'drivers', label: 'المناديب', data: drivers, color: 'text-orange-400' },
      { id: 'merchants', label: 'التجار', data: merchants, color: 'text-purple-400' },
      { id: 'customers', label: 'العملاء', data: customers, color: 'text-blue-400' },
    ];

    if (canViewSupervisors) {
      tabs.push({ id: 'supervisors', label: 'المشرفون', data: supervisors, color: 'text-yellow-400' });
    }

    // Only show Admins tab if NOT a supervisor
    if (!isSupervisor) {
      tabs.push({ id: 'admins', label: 'المديرون', data: admins, color: 'text-red-400' });
    }

    tabs.push({ id: 'blocked', label: 'المحظورين', data: blocked, color: 'text-red-500' });

    return tabs;
  }, [drivers, merchants, customers, supervisors, admins, blocked, isSupervisor, permissions]);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  const usersToDisplay = useMemo(() => {
    const list = currentTab.data;
    if (!searchQuery) return list;
    return list.filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      u.id.includes(searchQuery)
    );
  }, [currentTab, searchQuery]);

  const tabToDisplay = currentTab.label;

  // --- Logic for Supervisor Restrictions ---
  const canEditUser = (targetUser: User) => {
    if (!canManage) return false;
    if (!currentUser) return true; // Fallback for Admins who might not pass currentUser (though they should)

    // Admin can edit anyone
    if (currentUser.role === 'admin') return true;

    // Supervisor Logic
    if (currentUser.role === 'supervisor') {
      // Cannot edit self, other supervisors, or admins
      if (targetUser.id === currentUser.id) return false;
      if (targetUser.role === 'admin' || targetUser.role === 'supervisor') return false;
      // Can edit drivers, merchants, customers
      return true;
    }

    return false;
  };

  // --- Back Button Logic ---
  useAndroidBack(() => {
    if (isAddModalOpen) { setIsAddModalOpen(false); return true; }
    if (deletingUser) { setDeletingUser(null); return true; }
    if (blockingUser) { setBlockingUser(null); return true; }
    if (unblockingUser) { setUnblockingUser(null); return true; }
    return false;
  }, [isAddModalOpen, deletingUser, blockingUser, unblockingUser]);

  const pushModalState = (modalName: string) => {
    try {
      window.history.pushState({ view: 'users', modal: modalName }, '', window.location.pathname);
    } catch (e) { }
  };

  const closeModal = () => {
    if (window.history.state?.modal) {
      window.history.back();
    } else {
      setIsAddModalOpen(false);
      setDeletingUser(null);
      setBlockingUser(null);
      setUnblockingUser(null);
    }
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!event.state?.modal) {
        setIsAddModalOpen(false);
        setDeletingUser(null);
        setBlockingUser(null);
        setUnblockingUser(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const confirmDeleteUser = () => {
    if (deletingUser) {
      onDeleteUser(deletingUser.id);
    }
    closeModal();
  };

  const confirmBlockUser = () => {
    if (blockingUser) {
      updateUser(blockingUser.id, { status: 'blocked' });
    }
    closeModal();
  };

  const confirmUnblockUser = () => {
    if (unblockingUser) {
      updateUser(unblockingUser.id, { status: 'active' });
    }
    closeModal();
  };

  const handleSaveUser = async (data: any) => {
    const createdUser = await onAdminAddUser(data);
    closeModal();
    if (createdUser && onViewUser) {
      setTimeout(() => {
        onViewUser(createdUser);
      }, 100);
    }
  }

  return (
    <div className="space-y-6 pb-32 animate-fadeIn relative w-full overflow-x-hidden">

      {/* Header & Tabs Container (Not Sticky anymore) */}
      <div className="pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">

        {/* 1. Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl border border-gray-700/50 shadow-lg mb-4 mt-1">

          {/* Search Bar */}
          <div className="relative w-full md:w-auto md:flex-1 max-w-md">
            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder={`بحث في ${tabToDisplay}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/80 text-white text-sm rounded-xl py-2.5 pr-10 pl-4 border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-gray-500"
            />
          </div>

          {/* Add Button */}
          {canManage && activeTab !== 'blocked' && (
            <button
              onClick={() => { pushModalState('addUser'); setIsAddModalOpen(true); }}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-red-900/30 transition-all active:scale-95 group"
            >
              <div className="bg-white/20 p-1 rounded-full group-hover:rotate-90 transition-transform duration-300">
                <UserPlusIcon className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">إضافة مستخدم</span>
            </button>
          )}
        </div>

        {/* 2. Modern Tabs */}
        <div className="relative">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2 sm:gap-3 bg-gray-900/95">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const isBlockedTab = tab.id === 'blocked';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                        relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border
                        ${isActive
                      ? isBlockedTab ? 'bg-red-900/40 text-red-200 border-red-500 shadow-md transform scale-105 z-10' : 'bg-gray-800 text-white border-gray-600 shadow-md transform scale-105 z-10'
                      : 'bg-gray-800/40 text-gray-400 border-transparent hover:bg-gray-800/80 hover:text-gray-200'
                    }
                      `}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? (isBlockedTab ? 'bg-red-500 animate-pulse' : 'bg-red-500 animate-pulse') : 'bg-gray-600'}`}></span>
                  {tab.label}
                  <span className={`mr-1 px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/10 text-white' : 'bg-black/20 text-gray-500'}`}>
                    {tab.data.length}
                  </span>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className={`absolute bottom-0 left-3 right-3 h-0.5 ${isBlockedTab ? 'bg-red-500' : 'bg-red-500'} rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Users Grid */}
      {usersToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up mt-2">
          {usersToDisplay.map((user, index) => {
            const isEditable = canEditUser(user);
            return (
              <div
                key={user.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-slide-up"
              >
                <UserCard
                  user={user}
                  onEdit={isEditable ? setEditingUser : undefined}
                  onDelete={isEditable ? (u) => { pushModalState('deleteUser'); setDeletingUser(u); } : undefined}
                  onApprove={isEditable ? (id) => updateUser(id, { status: 'active' }) : undefined}
                  onBlock={isEditable ? (u) => { pushModalState('blockUser'); setBlockingUser(u); } : undefined}
                  onUnblock={isEditable ? (u) => { pushModalState('unblockUser'); setUnblockingUser(u); } : undefined}
                  isPrimaryAdmin={user.id === '5'}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-800/30 rounded-3xl border border-dashed border-gray-700/50 mt-4">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <UsersIcon className="w-10 h-10 text-gray-600 opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-gray-300">لا يوجد مستخدمين</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchQuery ? `لا توجد نتائج مطابقة لـ "${searchQuery}"` : `قائمة ${tabToDisplay} فارغة حالياً.`}
          </p>
          {canManage && !searchQuery && activeTab !== 'blocked' && (
            <button
              onClick={() => { pushModalState('addUser'); setIsAddModalOpen(true); }}
              className="mt-6 text-red-400 hover:text-red-300 text-sm font-bold underline underline-offset-4"
            >
              إضافة {tabToDisplay.slice(0, -1)} جديد
            </button>
          )}
        </div>
      )}

      {/* 4. Modals */}
      {deletingUser && (
        <ConfirmationModal
          title="حذف المستخدم نهائياً"
          message={`أنت على وشك حذف حساب ${getRoleLabel(deletingUser.role)}: ${deletingUser.name}. هل أنت متأكد؟`}
          onConfirm={confirmDeleteUser}
          onClose={closeModal}
          confirmButtonText="تأكيد الحذف"
          cancelButtonText="تراجع"
          confirmVariant="danger"
        />
      )}

      {blockingUser && (
        <ConfirmationModal
          title="حظر المستخدم"
          message={`هل أنت متأكد من حظر حساب ${blockingUser.name}؟ سيتم منعه من الدخول واستخدام التطبيق فوراً.`}
          onConfirm={confirmBlockUser}
          onClose={closeModal}
          confirmButtonText="حظر الحساب"
          cancelButtonText="إلغاء"
          confirmVariant="danger"
        />
      )}

      {unblockingUser && (
        <ConfirmationModal
          title="فك الحظر"
          message={`هل أنت متأكد من فك الحظر عن حساب ${unblockingUser.name}؟ سيتمكن من استخدام التطبيق مرة أخرى.`}
          onConfirm={confirmUnblockUser}
          onClose={closeModal}
          confirmButtonText="فك الحظر"
          cancelButtonText="إلغاء"
          confirmVariant="success"
        />
      )}

      {isAddModalOpen && (
        <AddUserModal
          onClose={closeModal}
          onSave={handleSaveUser}
          initialRole={activeTab === 'customers' ? 'customer' : (activeTab === 'admins' ? 'admin' : (activeTab.slice(0, -1) as Role))}
          appName={appName}
          currentUserRole={currentUser?.role}
          currentUserPermissions={permissions}
        />
      )}
    </div>
  );
};

// Helper for Arabic role labels in modal message
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'driver': return 'المندوب';
    case 'merchant': return 'التاجر';
    case 'admin': return 'المدير';
    case 'supervisor': return 'المشرف';
    case 'customer': return 'العميل';
    default: return 'المستخدم';
  }
}

export default AdminUsersScreen;
