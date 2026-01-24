
import React, { useState, useEffect, useMemo } from 'react';
import { User, Order, SupportChat } from '../../types';
import { UserIcon, CheckCircleIcon, TrashIcon, BellIcon, PencilIcon, TruckIconV2, ClockIcon, ChevronLeftIcon, MapPinIcon, ShoppingCartIcon, SparklesIcon, MessageSquareIcon, HeadsetIcon, StoreIcon, ChatIcon } from '../icons';
import UserDetailsModal from './UserDetailsModal';
import ConfirmationModal from './ConfirmationModal';

interface NotificationsScreenProps {
  users: User[];
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  passwordResetRequests: { phone: string; requestedAt: Date }[];
  resolvePasswordResetRequest: (phone: string) => void;
  setEditingUser: (user: User) => void;
  pendingOrders?: Order[];
  onNavigateToOrders?: () => void;
  unreadChats?: SupportChat[];
  onNavigateToSupport?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ 
    users, 
    updateUser, 
    onDeleteUser, 
    passwordResetRequests, 
    resolvePasswordResetRequest, 
    setEditingUser,
    pendingOrders = [],
    onNavigateToOrders,
    unreadChats = [],
    onNavigateToSupport
}) => {
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userToReject, setUserToReject] = useState<User | null>(null);

  const pendingUsers = users.filter(user => user.status === 'pending' && user.role !== 'admin');
  
  // Filter merchants who have Free Delivery enabled (Notification for Review)
  const freeDeliveryMerchants = useMemo(() => 
    users.filter(u => u.role === 'merchant' && u.hasFreeDelivery), 
  [users]);
  
  // --- Back Button Logic ---
  useEffect(() => {
      const handlePopState = (event: PopStateEvent) => {
          if (!event.state?.modal) {
              setViewingUser(null);
              setUserToReject(null);
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const pushModalState = () => {
      try {
        window.history.pushState({ view: 'notifications', modal: 'userDetails' }, '', window.location.pathname);
      } catch (e) {}
  };

  const closeModal = () => {
      if (window.history.state?.modal) {
          window.history.back();
      } else {
          setViewingUser(null);
          setUserToReject(null);
      }
  };

  const getRoleName = (role: string) => {
      switch (role) {
          case 'merchant': return 'تاجر';
          case 'driver': return 'سائق';
          default: return role;
      }
  }

  const handleResetPassword = (phone: string) => {
    const userToEdit = users.find(u => u.phone === phone);
    if (userToEdit) {
        setEditingUser(userToEdit);
        resolvePasswordResetRequest(phone);
    }
  };

  const confirmRejectUser = () => {
      if (userToReject) {
          onDeleteUser(userToReject.id);
          closeModal();
      }
  };

  const hasNotifications = pendingUsers.length > 0 || passwordResetRequests.length > 0 || pendingOrders.length > 0 || unreadChats.length > 0 || freeDeliveryMerchants.length > 0;

  if (!hasNotifications) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-15rem)]">
        <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse ring-1 ring-white/10">
            <BellIcon className="w-12 h-12 text-gray-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-300">كل شيء هادئ!</h3>
        <p className="text-gray-500 mt-2">لا توجد إشعارات جديدة تتطلب انتباهك.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 max-w-5xl mx-auto px-2 animate-fadeIn pb-24">
        
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-700/50">
            <div className="p-3.5 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg shadow-red-900/20">
                <BellIcon className="w-7 h-7 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-white tracking-wide">مركز الإشعارات</h1>
                <p className="text-gray-400 text-sm font-medium">تابع آخر المستجدات والطلبات المعلقة</p>
            </div>
        </div>

        {/* 0. Support Messages Section (Redesigned) */}
        {unreadChats.length > 0 && (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                        <HeadsetIcon className="w-5 h-5" />
                        رسائل جديدة ({unreadChats.length})
                    </h2>
                    {onNavigateToSupport && (
                        <button onClick={onNavigateToSupport} className="text-xs font-bold text-green-500 hover:text-green-400 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                            عرض الكل
                            <ChevronLeftIcon className="w-3 h-3" />
                        </button>
                    )}
                </div>
                
                <div className="grid gap-3">
                    {unreadChats.map(chat => (
                        <div key={chat.id} onClick={onNavigateToSupport} className="relative bg-[#1a1a1a] rounded-2xl p-4 shadow-lg border-r-4 border-r-green-500 border-y border-l border-gray-700 hover:border-gray-500 transition-all cursor-pointer group overflow-hidden">
                             {/* Background accent */}
                             <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-green-500/10 to-transparent pointer-events-none"></div>

                             <div className="flex items-start gap-4 relative z-10">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600 group-hover:border-green-500 transition-colors">
                                         <UserIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#1a1a1a]">
                                        {chat.unreadCount}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-white text-base truncate">{chat.userName}</h3>
                                        <span className="text-[10px] text-gray-500 font-mono bg-black/30 px-2 py-0.5 rounded">
                                            {new Date(chat.lastUpdated).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    
                                    {/* Message Preview Bubble */}
                                    <div className="mt-2 bg-[#252525] p-2 rounded-lg rounded-tr-none border border-gray-700 inline-block max-w-full">
                                        <p className="text-gray-300 text-sm line-clamp-1 flex items-center gap-2">
                                            <ChatIcon className="w-3 h-3 text-green-400 flex-shrink-0" />
                                            {chat.lastMessage || 'مرفق صورة أو رسالة صوتية'}
                                        </p>
                                    </div>
                                </div>
                             </div>

                             <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="bg-green-600 text-white p-1.5 rounded-full shadow-lg">
                                     <ChevronLeftIcon className="w-4 h-4" />
                                 </button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {/* 0.5 Merchant Free Delivery Requests */}
        {freeDeliveryMerchants.length > 0 && (
            <div className="space-y-4 animate-fade-slide-up">
                <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(192,132,252,0.5)]"></span>
                    <TruckIconV2 className="w-5 h-5" />
                    طلبات تفعيل توصيل مجاني ({freeDeliveryMerchants.length})
                </h2>
                
                <div className="grid gap-3">
                    {freeDeliveryMerchants.map(merchant => (
                         <div key={merchant.id} className="relative bg-gradient-to-r from-[#2c1a36] to-[#1a1a1a] rounded-2xl p-0.5 shadow-lg group">
                             <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500 rounded-r-full"></div>
                             
                             <div className="bg-[#1a1a1a] rounded-[14px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 shadow-inner">
                                        {merchant.storeImage ? (
                                            <img src={merchant.storeImage} className="w-full h-full object-cover rounded-xl" alt="Store" />
                                        ) : (
                                            <StoreIcon className="w-7 h-7" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white text-lg">{merchant.name}</h3>
                                            <span className="bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded font-bold">طلب جديد</span>
                                        </div>
                                        <p className="text-gray-400 text-sm mt-1">يرغب في تفعيل <span className="text-white font-bold">التوصيل المجاني</span> لعملائه.</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button 
                                        onClick={() => { pushModalState(); setViewingUser(merchant); }}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors border border-gray-600"
                                    >
                                        مراجعة المتجر
                                    </button>
                                    <button 
                                        onClick={() => updateUser(merchant.id, { hasFreeDelivery: false })}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors border border-red-500/10"
                                    >
                                        إلغاء التفعيل
                                    </button>
                                </div>
                             </div>
                         </div>
                    ))}
                </div>
            </div>
        )}

        {/* 1. New Orders Section (Gold Theme) */}
        {pendingOrders.length > 0 && (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
                        <TruckIconV2 className="w-5 h-5" />
                        طلبات بانتظار التعيين ({pendingOrders.length})
                    </h2>
                    {onNavigateToOrders && (
                        <button onClick={onNavigateToOrders} className="text-xs font-bold text-yellow-500 hover:text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                            إدارة الكل
                            <ChevronLeftIcon className="w-3 h-3" />
                        </button>
                    )}
                </div>
                
                <div className="grid gap-3">
                    {pendingOrders.map(order => {
                        const isSpecialRequest = order.type === 'shopping_order';
                        const formattedTime = (() => {
                            try {
                                const d = new Date(order.createdAt);
                                if (isNaN(d.getTime())) return '';
                                return d.toLocaleString('ar-EG', { hour: 'numeric', minute: 'numeric' });
                            } catch (e) { return ''; }
                        })();

                        // Different style for special requests
                        const cardBg = isSpecialRequest ? 'bg-[#2a1b2e]' : 'bg-[#1a1a1a]';
                        const borderColor = isSpecialRequest ? 'border-purple-500/30' : 'border-yellow-500/20';
                        const iconBg = isSpecialRequest ? 'bg-purple-500/20' : 'bg-yellow-500/10';
                        const glow = isSpecialRequest ? 'shadow-purple-900/10' : 'shadow-yellow-900/10';

                        return (
                            <div key={order.id} className={`group relative p-0.5 rounded-2xl shadow-lg hover:${glow} transition-all duration-300 ${isSpecialRequest ? 'bg-gradient-to-br from-purple-900/40 to-[#252525]' : 'bg-gradient-to-br from-[#1e1e1e] to-[#252525]'}`}>
                                <div className={`absolute inset-0 bg-gradient-to-r ${isSpecialRequest ? 'from-purple-500/20' : 'from-yellow-500/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none`}></div>
                                <div className={`relative ${cardBg} rounded-[14px] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 h-full border ${borderColor}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner border border-white/5 flex-shrink-0 ${iconBg}`}>
                                            {isSpecialRequest ? <SparklesIcon className="w-6 h-6 text-purple-400 animate-pulse" /> : '📦'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`font-bold text-lg ${isSpecialRequest ? 'text-purple-300' : 'text-white'}`}>
                                                    {isSpecialRequest ? 'طلب خدمة خاصة' : order.merchantName}
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono tracking-wider border ${isSpecialRequest ? 'bg-purple-500/10 text-purple-200 border-purple-500/20' : 'bg-yellow-500/10 text-yellow-200 border-yellow-500/20'}`}>{order.id}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5 leading-tight">
                                                <MapPinIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" /> 
                                                {order.customer.address}
                                            </p>
                                            {isSpecialRequest && (
                                                <p className="text-[10px] text-purple-400 mt-1 bg-purple-900/20 px-2 py-0.5 rounded inline-block">
                                                    بانتظار تعيين مندوب وتحديد السعر
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                                        <div className="text-xs font-bold text-gray-400 bg-black/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-white/5">
                                            <ClockIcon className="w-3.5 h-3.5" /> {formattedTime}
                                        </div>
                                        {onNavigateToOrders && (
                                            <button onClick={onNavigateToOrders} className={`${isSpecialRequest ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20' : 'bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/20'} text-white text-xs font-bold px-5 py-2 rounded-lg shadow-lg transition-all active:scale-95 whitespace-nowrap`}>
                                                تعيين مندوب
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* 2. Pending Users Section (Blue Theme) */}
        {pendingUsers.length > 0 && (
            <div className="space-y-4">
                 <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
                    <UserIcon className="w-5 h-5" />
                    طلبات تسجيل جديدة ({pendingUsers.length})
                 </h2>
                 <div className="grid gap-3">
                    {pendingUsers.map(user => (
                        <div key={user.id} className="relative overflow-hidden bg-[#1a1a1a] rounded-2xl border border-blue-500/20 p-0.5 group shadow-lg">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 z-10"></div>
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            
                            <div className="bg-[#1e1e1e] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-0">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-blue-500/30 shadow-md">
                                            <UserIcon className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm border border-[#1e1e1e]">
                                            {getRoleName(user.role)}
                                        </div>
                                    </div>
                                    <div className="text-right flex-1">
                                        <h3 className="font-bold text-white text-lg">{user.name}</h3>
                                        <p className="text-gray-400 font-mono text-sm tracking-wide bg-black/20 inline-block px-2 rounded mt-1">{user.phone}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => { pushModalState(); setViewingUser(user); }} className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-bold transition-colors border border-gray-600">
                                        تفاصيل
                                    </button>
                                    <button onClick={() => updateUser(user.id, { status: 'active' })} className="flex-1 sm:flex-none px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center gap-1.5">
                                        <CheckCircleIcon className="w-4 h-4" /> قبول
                                    </button>
                                    <button 
                                        onClick={() => { pushModalState(); setUserToReject(user); }} 
                                        className="px-3.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/10"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        )}
        
        {/* 3. Password Reset Section (Red Theme) */}
        {passwordResetRequests.length > 0 && (
            <div className="space-y-4">
                 <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
                    <PencilIcon className="w-5 h-5" />
                    طلبات إعادة تعيين كلمة المرور
                 </h2>
                 <div className="grid gap-3">
                    {passwordResetRequests.map(req => {
                        const user = users.find(u => u.phone === req.phone);
                        if (!user) return null;

                        return (
                            <div key={req.phone} className="bg-gradient-to-r from-red-900/20 to-[#1a1a1a] border border-red-500/30 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/10 rounded-full text-red-400 border border-red-500/20">
                                        <PencilIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-lg">{user.name}</p>
                                        <p className="text-xs text-red-300 font-mono mt-0.5">{user.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleResetPassword(req.phone)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-900/20 transition-all active:scale-95"
                                    >
                                        تغيير
                                    </button>
                                     <button
                                        onClick={() => resolvePasswordResetRequest(req.phone)}
                                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                 </div>
            </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {viewingUser && (
        <UserDetailsModal
          user={viewingUser}
          onClose={closeModal}
          onApprove={(id, data) => { updateUser(id, data); closeModal(); }}
          onDelete={(id) => { setUserToReject(viewingUser); }} // Forward delete action to confirmation
        />
      )}

      {/* Rejection/Deletion Confirmation */}
      {userToReject && (
          <ConfirmationModal 
            title="رفض الطلب وحذف المستخدم"
            message={`هل أنت متأكد من رفض طلب تسجيل "${userToReject.name}"؟ سيتم حذف البيانات نهائياً.`}
            onClose={() => setUserToReject(null)}
            onConfirm={confirmRejectUser}
            confirmButtonText="نعم، حذف ورفض"
            confirmVariant="danger"
            cancelButtonText="تراجع"
          />
      )}
    </>
  );
};
