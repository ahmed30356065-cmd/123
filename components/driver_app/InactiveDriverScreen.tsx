

import React from 'react';
import { MoonIcon } from '../icons';

interface InactiveDriverScreenProps {
  onStartShift: () => void;
}

const InactiveDriverScreen: React.FC<InactiveDriverScreenProps> = ({ onStartShift }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-white h-[calc(100vh-8rem)] p-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
        <MoonIcon className="w-24 h-24 text-gray-500 relative z-10" />
      </div>
      <h2 className="text-2xl font-bold text-neutral-100 mb-2">أنت الآن خارج الخدمة</h2>
      <p className="text-neutral-400 mb-8 max-w-xs">يوميتك مغلقة حالياً. لن تظهر لك أي طلبات جديدة حتى تقوم بتسجيل يومية جديدة.</p>
      <button 
        onClick={onStartShift}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
      >
        تسجيل يومية
      </button>
    </div>
  );
};

export default InactiveDriverScreen;