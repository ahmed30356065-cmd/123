
import React from 'react';
import { Order, User, AppTheme } from '../../types';
import { EmptyBoxIcon } from '../icons';
import DriverOrderCard from './DriverOrderCard';

interface OrdersScreenProps {
  orders: Order[];
  users: User[];
  listType: 'new' | 'in-transit';
  onViewOrder: (order: Order) => void;
  theme?: AppTheme;
  isLoading?: boolean;
}

const SkeletonCard = () => (
  <div className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-700/50 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/5 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-3 w-32 bg-white/10 rounded"></div>
          <div className="h-2 w-20 bg-white/5 rounded"></div>
        </div>
      </div>
      <div className="h-6 w-16 bg-white/5 rounded-full"></div>
    </div>
    <div className="space-y-3 my-4">
      <div className="h-2 w-full bg-white/5 rounded"></div>
      <div className="h-2 w-3/4 bg-white/5 rounded"></div>
    </div>
    <div className="flex gap-2 mt-4">
      <div className="flex-1 h-10 bg-white/10 rounded-lg"></div>
      <div className="flex-1 h-10 bg-white/5 rounded-lg"></div>
    </div>
  </div>
);

const EmptyState: React.FC<{ customImage?: string }> = ({ customImage }) => (
  <div className="flex flex-col items-center justify-center text-center text-gray-500 min-h-[60vh]">
    <div className="relative mb-4 opacity-50">
      {customImage ? (
        <img src={customImage} alt="Empty" className="w-40 h-40 object-contain" />
      ) : (
        <svg className="w-40 h-40" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(239, 68, 68)', stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>
          <path d="M 50,5 L 95,27.5 L 95,72.5 L 50,95 L 5,72.5 L 5,27.5 Z" fill="url(#grad1)" fillOpacity="0.1" />
          <path d="M 50,5 L 95,27.5 L 50,50 L 5,27.5 Z" fill="url(#grad1)" fillOpacity="0.15" />
          <path d="M 95,27.5 L 95,72.5 L 50,50 Z" fill="url(#grad1)" fillOpacity="0.1" />
          <path d="M 5,27.5 L 5,72.5 L 50,50 Z" fill="url(#grad1)" fillOpacity="0.2" />
          <g transform="translate(35, 30) scale(1.2)">
            <EmptyBoxIcon />
          </g>
        </svg>
      )}
    </div>
    <h3 className="text-lg font-semibold text-neutral-400 mt-2">لا يوجد طلبات لعرضها</h3>
  </div>
);

const OrdersScreen: React.FC<OrdersScreenProps> = ({ orders, users, onViewOrder, theme, isLoading }) => {

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (orders.length === 0) {
    return <EmptyState customImage={theme?.driver?.icons?.img_empty_orders} />;
  }

  return (
    <div className="p-4 space-y-3">
      {orders.map((order, index) => (
        <div
          key={order.id}
          className="animate-fade-in-up hardware-accelerated"
          className="animate-fade-in-up hardware-accelerated"
          // Removed artificial delay to meet "Lightning Speed" requirement
          style={{ animationDelay: '0ms' }}
        >
          <DriverOrderCard
            order={order}
            users={users}
            onViewDetails={() => onViewOrder(order)}
            theme={theme}
          />
        </div>
      ))}
    </div>
  );
};

export default OrdersScreen;
