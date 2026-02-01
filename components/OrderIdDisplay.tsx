import React from 'react';
import { Order } from '../types';

interface OrderIdDisplayProps {
    order: Order;
    className?: string;
    showHash?: boolean;
}

/**
 * Displays order ID with archive month label if applicable
 * Example: "ORD-5 (فبراير 2024)" for archived orders
 * Example: "ORD-5" for active orders
 */
export const OrderIdDisplay: React.FC<OrderIdDisplayProps> = ({ order, className = '', showHash = true }) => {
    const displayId = showHash ? `#${order.id}` : order.id;

    if (order.isArchived && order.archiveMonth) {
        return (
            <span className={className}>
                {displayId}
                <span className="text-[0.7em] opacity-70 ml-1">({order.archiveMonth})</span>
            </span>
        );
    }

    return <span className={className}>{displayId}</span>;
};

export default OrderIdDisplay;
