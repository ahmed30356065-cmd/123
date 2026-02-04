
import React, { useState, useEffect, useMemo } from 'react';
import NewOrderForm from '../NewOrderForm';
import OrderList from '../OrderList';
import MenuManager from './MenuManager';
import MerchantIncomingOrders from './MerchantIncomingOrders';
import MerchantMessagesScreen from './MerchantMessagesScreen';
import MerchantProfileScreen from './MerchantProfileScreen';
import { Order, User, Customer, Message, OrderStatus, AppTheme, AppConfig } from '../../types';
import MerchantBottomNav from './MerchantBottomNav';
import MessageModal from '../MessageModal';
import { setAndroidRole, NativeBridge } from '../../utils/NativeBridge';
import { MessageSquareIcon, UserIcon, BellIcon, VerifiedIcon, CrownIcon, StarIcon, RocketIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface MerchantPortalProps {
  merchant: User;
  orders: Order[];
  users: User[];
  addOrder: (orderData: { customer: Customer, notes?: string, customOrderNumber?: string, paymentStatus?: 'paid' | 'unpaid', isVodafoneCash?: boolean }) => void;
  messages: Message[];
  seenMessageIds: string[];
  markMessageAsSeen: (messageId: string) => void;
  hideMessage: (messageId: string) => void;
  deletedMessageIds: string[];
  onUpdateUser?: (userId: string, data: Partial<User>) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onUpdateOrder?: (orderId: string, data: Partial<Order>) => void;
  onLogout: () => void;
  appTheme: AppTheme;
  onUpdateTheme?: (config: any) => void;
  initialRoute?: { target: string; id?: string } | null;
  appConfig?: AppConfig;
}

type MerchantPage = 'home' | 'history' | 'menu' | 'incoming' | 'messages' | 'profile';

const MerchantPortal: React.FC<MerchantPortalProps> = ({
  merchant, orders, users, addOrder, messages, seenMessageIds, markMessageAsSeen, hideMessage, deletedMessageIds, onUpdateUser, onUpdateOrderStatus, onUpdateOrder, onLogout, appTheme, onUpdateTheme, initialRoute, appConfig
}) => {
  const [page, setPage] = useState<MerchantPage>('home');
  const [messageToShow, setMessageToShow] = useState<Message | null>(null);

  const canManageMenu = merchant.canManageMenu !== false; // Default true

  useEffect(() => {
    if (initialRoute?.target === 'incoming' || initialRoute?.target === 'orders') setPage('incoming');
    else if (initialRoute?.target === 'messages') setPage('messages');
    else if (initialRoute?.target === 'profile') setPage('profile');
  }, [initialRoute]);

  useEffect(() => { setAndroidRole('merchant', merchant.id); }, [merchant.id]);

  // Report Context to Android
  useEffect(() => {
    NativeBridge.reportContext(page);
  }, [page]);

  useAndroidBack(() => {
    // 1. Modals (High Priority)
    if (messageToShow) { setMessageToShow(null); return true; }

    // 2. Navigation
    if (page !== 'home') { setPage('home'); return true; }

    // 3. Home -> Exit
    return false;
  }, [page, messageToShow]);

  const merchantOrders = useMemo(() => orders.filter(order => order.merchantId === merchant.id), [orders, merchant.id]);
  const incomingCount = useMemo(() => merchantOrders.filter(o => o.status === OrderStatus.WaitingMerchant).length, [merchantOrders]);
  const merchantMessages = useMemo(() => messages.filter(m => !deletedMessageIds.includes(m.id) && m.targetRole === 'merchant').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [messages, deletedMessageIds]);
  const unseenMessagesCount = useMemo(() => merchantMessages.filter(m => !m.readBy?.includes(merchant.id)).length, [merchantMessages, merchant.id]);

  // Frame Helper
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

  const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

  const renderPage = () => {
    switch (page) {
      case 'home': return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
          <NewOrderForm addOrder={addOrder} merchant={merchant} />
          {incomingCount > 0 && (
            <button onClick={() => setPage('incoming')} className="w-full bg-purple-600/20 border border-purple-500 text-purple-200 p-4 rounded-xl flex justify-between items-center animate-pulse">
              <span className="font-bold">لديك {incomingCount} طلبات جديدة</span>
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-black">عرض</span>
            </button>
          )}
        </div>
      );
      case 'incoming': return <MerchantIncomingOrders orders={merchantOrders} onUpdateStatus={onUpdateOrderStatus || (() => { })} theme={appTheme} users={users} />;
      case 'history': return <OrderList orders={merchantOrders} users={users} viewingMerchant={merchant} onUpdateOrder={onUpdateOrder} />;
      case 'menu': return canManageMenu ? <MenuManager merchant={merchant} onUpdateMerchant={onUpdateUser || (() => { })} /> : null;
      case 'messages': return <MerchantMessagesScreen messages={merchantMessages} onMarkAsSeen={markMessageAsSeen} hideMessage={hideMessage} />;
      case 'profile': return <MerchantProfileScreen merchant={merchant} onLogout={onLogout} onUpdateUser={onUpdateUser || (() => { })} onUpdateTheme={onUpdateTheme} currentTheme={appTheme} />;
      default: return null;
    }
  };

  // App Name Logic
  const appName = appConfig?.appName || 'GOO NOW';
  const [firstWord, ...restWords] = appName.split(' ');
  const restOfName = restWords.join(' ');

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col">
      {/* Header updated with pt-safe and box-content */}
      <header className="flex-none border-b border-gray-700 flex justify-between items-center bg-gray-900 z-30 shadow-md pt-safe px-4 h-16 box-content">
        <div className="flex items-center">
          <button onClick={() => setPage('profile')} className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-95 ${!isCustomFrame(merchant.specialFrame) ? getFrameContainerClass(merchant.specialFrame) : ''}`}>
            {isCustomFrame(merchant.specialFrame) && (
              <img src={merchant.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-125 pointer-events-none" alt="frame" />
            )}
            <div className={`${isCustomFrame(merchant.specialFrame) ? 'w-[85%] h-[85%]' : 'w-full h-full'} rounded-full overflow-hidden border border-gray-600 relative z-0 flex items-center justify-center ${page === 'profile' ? 'ring-2 ring-red-500' : ''}`}>
              {merchant.storeImage ? <img src={merchant.storeImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gray-400" /></div>}
            </div>
          </button>
          {/* Badge removed from header as per request */}
        </div>

        <h1 className="text-xl font-bold font-sans">
          <span className="text-red-500">{firstWord}</span>
          <span className="text-white ml-1">{restOfName}</span>
        </h1>
        <button onClick={() => setPage('incoming')} className="relative p-2"><BellIcon className={`w-6 h-6 ${incomingCount > 0 ? "text-yellow-400" : "text-gray-400"}`} />{incomingCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce"></span>}</button>
      </header>
      <div className="flex-1 overflow-y-auto pb-24 p-4 hardware-accelerated">{messageToShow && <MessageModal message={messageToShow} onClose={() => { markMessageAsSeen(messageToShow.id); setMessageToShow(null); }} />}{renderPage()}</div>
      <MerchantBottomNav activePage={page as any} onNavigate={(p) => setPage(p as MerchantPage)} messageCount={unseenMessagesCount} theme={appTheme} showMenu={canManageMenu} />
    </div>
  );
};

export default MerchantPortal;
