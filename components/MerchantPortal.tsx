


import React, { useState, useEffect, useMemo } from 'react';
import NewOrderForm from './NewOrderForm';
import OrderList from './OrderList';
import MenuManager from './merchant_app/MenuManager';
import MerchantIncomingOrders from './merchant_app/MerchantIncomingOrders';
import MerchantMessagesScreen from './merchant_app/MerchantMessagesScreen';
import MerchantProfileScreen from './merchant_app/MerchantProfileScreen';
import { Order, User, Customer, Message, OrderStatus } from '../types';
import MerchantBottomNav from './merchant_app/MerchantBottomNav';
import MessageModal from './MessageModal';
import { setAndroidRole } from '../utils/NativeBridge';
import { MessageSquareIcon, UserIcon, BellIcon } from './icons';
import useAndroidBack from '../hooks/useAndroidBack';

interface MerchantPortalProps {
  merchant: User;
  orders: Order[];
  users: User[];
  addOrder: (orderData: { customer: Customer, notes?: string }) => void;
  messages: Message[];
  seenMessageIds: string[];
  markMessageAsSeen: (messageId: string) => void;
  hideMessage: (messageId: string) => void;
  deletedMessageIds: string[];
  onUpdateUser?: (userId: string, data: Partial<User>) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onUpdateOrder?: (orderId: string, data: Partial<Order>) => void;
  onLogout: () => void;
}

type MerchantPage = 'home' | 'history' | 'menu' | 'incoming' | 'messages' | 'profile';

const MerchantPortal: React.FC<MerchantPortalProps> = ({
  merchant, orders, users, addOrder, messages, seenMessageIds, markMessageAsSeen, hideMessage, deletedMessageIds, onUpdateUser, onUpdateOrderStatus, onUpdateOrder, onLogout
}) => {
  const [page, setPage] = useState<MerchantPage>('home');
  const [messageToShow, setMessageToShow] = useState<Message | null>(null);

  useEffect(() => { setAndroidRole('merchant', merchant.id); }, [merchant.id]);

  useAndroidBack(() => {
    if (messageToShow) { setMessageToShow(null); return true; }
    if (page !== 'home') { setPage('home'); return true; }
    return false;
  }, [page, messageToShow]);

  const merchantOrders = useMemo(() => orders.filter(order => order.merchantId === merchant.id), [orders, merchant.id]);
  const incomingCount = useMemo(() => merchantOrders.filter(o => o.status === OrderStatus.WaitingMerchant).length, [merchantOrders]);

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col">
      <header className="flex-none border-b border-gray-700 flex justify-between items-center bg-gray-900 z-30 shadow-md pt-safe px-4 h-16 box-content">
        <button onClick={() => setPage('profile')} className="w-9 h-9 rounded-full overflow-hidden border border-gray-600">
          {merchant.storeImage ? <img src={merchant.storeImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gray-400" /></div>}
        </button>
        <h1 className="text-xl font-bold font-sans"><span className="text-red-500">GOO</span> NOW</h1>
        <button onClick={() => setPage('incoming')} className="relative p-2"><BellIcon className="w-6 h-6" />{incomingCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce"></span>}</button>
      </header>
      <div className="flex-1 overflow-y-auto pb-24 p-4 hardware-accelerated">
        {page === 'home' && <div className="max-w-2xl mx-auto space-y-6"><NewOrderForm addOrder={addOrder} /></div>}
        {page === 'incoming' && <MerchantIncomingOrders orders={merchantOrders} onUpdateStatus={onUpdateOrderStatus || (() => { })} />}
        {page === 'history' && <OrderList orders={merchantOrders} users={users} viewingMerchant={merchant} onUpdateOrder={onUpdateOrder} />}
        {page === 'menu' && <MenuManager merchant={merchant} onUpdateMerchant={onUpdateUser || (() => { })} />}
        {page === 'messages' && <MerchantMessagesScreen messages={messages.filter(m => !deletedMessageIds.includes(m.id) && m.targetRole === 'merchant')} onMarkAsSeen={markMessageAsSeen} hideMessage={hideMessage} />}
        {page === 'profile' && <MerchantProfileScreen merchant={merchant} onLogout={onLogout} onUpdateUser={onUpdateUser || (() => { })} />}
      </div>
      <MerchantBottomNav activePage={page as any} onNavigate={(p) => setPage(p as MerchantPage)} />
    </div>
  );
};

export default MerchantPortal;