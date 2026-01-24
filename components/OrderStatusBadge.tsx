
import React from 'react';
import { OrderStatus } from '../types';
import { ClockIcon, CheckCircleIcon, TruckIconV2, XIcon, UtensilsIcon, ShoppingCartIcon } from './icons';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getConfig = () => {
    switch (status) {
      case OrderStatus.WaitingMerchant:
        return {
            style: 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
            icon: <ClockIcon className="w-3.5 h-3.5" />
        };
      case OrderStatus.Preparing:
        return {
            style: 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]',
            icon: <UtensilsIcon className="w-3.5 h-3.5" />
        };
      case OrderStatus.Pending:
        return {
            style: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.15)]',
            icon: <ShoppingCartIcon className="w-3.5 h-3.5" />
        };
      case OrderStatus.InTransit:
        return {
            style: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
            icon: <TruckIconV2 className="w-3.5 h-3.5" />
        };
      case OrderStatus.Delivered:
        return {
            // Changed from Green to Teal as requested for distinction
            style: 'bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_10px_rgba(45,212,191,0.15)]',
            icon: <CheckCircleIcon className="w-3.5 h-3.5" />
        };
      case OrderStatus.Cancelled:
        return {
            style: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]',
            icon: <XIcon className="w-3.5 h-3.5" />
        };
      default:
        return {
            style: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            icon: <ClockIcon className="w-3.5 h-3.5" />
        };
    }
  };

  const config = getConfig();

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide transition-all duration-300 backdrop-blur-sm ${config.style}`}>
      {config.icon}
      {status}
    </span>
  );
};

export default OrderStatusBadge;
