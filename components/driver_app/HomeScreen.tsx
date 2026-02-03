
import React from 'react';
import { Order, User, AppTheme } from '../../types';
import OrdersScreen from './OrdersScreen';
import InactiveDriverScreen from './InactiveDriverScreen';

interface HomeScreenProps {
  driver: User;
  users: User[];
  standardNewOrders: Order[];
  delinowNewOrders: Order[];
  inTransitOrders: Order[];
  onViewOrder: (order: Order) => void;
  onUpdateUser: (userId: string, updatedData: Partial<User>) => void;
  activeTab: 'home' | 'in-transit' | 'delinow';
  customStartShift?: () => void;
  theme?: AppTheme;
  isLoading?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  const { activeTab, users } = props;

  const handleStartShift = () => {
    if (props.customStartShift) {
      props.customStartShift();
    } else {
      props.onUpdateUser(props.driver.id, { dailyLogStatus: 'active', dailyLogStartedAt: new Date() });
    }
  }

  // Force show inactive screen if shift is closed
  if (props.driver.dailyLogMode === '12_hour' && props.driver.dailyLogStatus !== 'active') {
    return <InactiveDriverScreen onStartShift={handleStartShift} />;
  }

  return (
    <div className="bg-[#1A1A1A] min-h-full">
      {activeTab === 'home' && (
        <OrdersScreen
          orders={props.standardNewOrders}
          users={users}
          listType="new"
          onViewOrder={props.onViewOrder}
          theme={props.theme}
          isLoading={props.isLoading}
        />
      )}

      {activeTab === 'in-transit' && (
        <OrdersScreen
          orders={props.inTransitOrders}
          users={users}
          listType="in-transit"
          onViewOrder={props.onViewOrder}
          theme={props.theme}
          // Intentionally not passing isLoading to in-transit, as they are local.
          // But consistency is good.
          isLoading={props.isLoading}
        />
      )}

      {activeTab === 'delinow' && (
        <OrdersScreen
          orders={props.delinowNewOrders}
          users={users}
          listType="new"
          onViewOrder={props.onViewOrder}
          theme={props.theme}
          isLoading={props.isLoading}
        />
      )}
    </div>
  );
};

export default HomeScreen;
