
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
}

const EmptyState: React.FC<{ customImage?: string }> = ({ customImage }) => (
    <div className="flex flex-col items-center justify-center text-center text-gray-500 min-h-[60vh]">
        <div className="relative mb-4 opacity-50">
            {customImage ? (
                <img src={customImage} alt="Empty" className="w-40 h-40 object-contain" />
            ) : (
                <svg className="w-40 h-40" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.5}} />
                      <stop offset="100%" style={{stopColor: 'rgb(239, 68, 68)', stopOpacity: 0.5}} />
                    </linearGradient>
                  </defs>
                  <path d="M 50,5 L 95,27.5 L 95,72.5 L 50,95 L 5,72.5 L 5,27.5 Z" fill="url(#grad1)" fillOpacity="0.1"/>
                  <path d="M 50,5 L 95,27.5 L 50,50 L 5,27.5 Z" fill="url(#grad1)" fillOpacity="0.15"/>
                  <path d="M 95,27.5 L 95,72.5 L 50,50 Z" fill="url(#grad1)" fillOpacity="0.1"/>
                  <path d="M 5,27.5 L 5,72.5 L 50,50 Z" fill="url(#grad1)" fillOpacity="0.2"/>
                  <g transform="translate(35, 30) scale(1.2)">
                    <EmptyBoxIcon />
                  </g>
                </svg>
            )}
        </div>
        <h3 className="text-lg font-semibold text-neutral-400 mt-2">لا يوجد طلبات لعرضها</h3>
    </div>
);

const OrdersScreen: React.FC<OrdersScreenProps> = ({ orders, users, onViewOrder, theme }) => {

  if (orders.length === 0) {
    return <EmptyState customImage={theme?.driver?.icons?.img_empty_orders} />;
  }

  return (
    <div className="p-4 space-y-3">
       {orders.map(order => (
          <DriverOrderCard 
            key={order.id}
            order={order}
            users={users}
            onViewDetails={() => onViewOrder(order)}
            theme={theme}
          />
       ))}
    </div>
  );
};

export default OrdersScreen;
