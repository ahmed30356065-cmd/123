
import React, { useEffect } from 'react';
import { WifiOffIcon, RefreshCwIcon } from './icons';
import { NativeBridge } from '../utils/NativeBridge';

const OfflineScreen: React.FC = () => {

  // Monitor return of connection to trigger Splash
  useEffect(() => {
    const checkConnection = setInterval(() => {
      if (navigator.onLine) {
        clearInterval(checkConnection);
        // 1. Show Native Splash
        if (window.AndroidSplash && window.AndroidSplash.showSplash) {
          window.AndroidSplash.showSplash();
        }
        // 2. Reload App to Start Fresh
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }, 2000); // Check every 2s in case event listener fails or to be robust

    const handleOnline = () => {
      if (window.AndroidSplash && window.AndroidSplash.showSplash) {
        window.AndroidSplash.showSplash();
      }
      setTimeout(() => {
        window.location.reload();
      }, 300);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      clearInterval(checkConnection);
      window.removeEventListener('online', handleOnline);
    }
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      if (window.AndroidSplash && window.AndroidSplash.showSplash) {
        window.AndroidSplash.showSplash();
      }
      window.location.reload();
    } else {
      // Pulse effect or 'Still Offline' toast could go here
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center p-6 pt-safe text-white overflow-hidden font-sans">
      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes floating {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        .ripple-container {
            position: relative;
            width: 140px;
            height: 140px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .ripple-circle {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid rgba(239, 68, 68, 0.5); /* Red-500 */
            animation: ripple 2s infinite cubic-bezier(0, 0.2, 0.8, 1);
        }
        .ripple-circle:nth-child(2) { animation-delay: -0.5s; }
        .ripple-circle:nth-child(3) { animation-delay: -1s; }
        
        .wifi-icon-container {
            animation: floating 3s ease-in-out infinite;
        }
      `}</style>

      {/* Background Gradient & Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">

        {/* Animated Icon Section */}
        <div className="mb-10 ripple-container">
          <div className="ripple-circle"></div>
          <div className="ripple-circle"></div>
          <div className="ripple-circle"></div>
          <div className="w-24 h-24 bg-[#1e293b] rounded-full flex items-center justify-center border-4 border-[#334155] shadow-2xl z-10 wifi-icon-container">
            <WifiOffIcon className="w-12 h-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-4xl font-black mb-2 tracking-tight text-white drop-shadow-lg">
          انقطع الاتصال
        </h1>
        <p className="text-red-400 font-bold text-lg mb-6 uppercase tracking-widest opacity-90">
          No Internet Connection
        </p>

        <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-[280px] mx-auto border-t border-gray-700/50 pt-6">
          تعذر الاتصال بالخادم. يرجى التحقق من شبكة الواي فاي أو بيانات الجوال. سيتم إعادة الاتصال تلقائياً فور توفر الشبكة.
        </p>

        {/* Action Button */}
        <button
          onClick={handleRetry}
          className="group relative w-full overflow-hidden rounded-2xl bg-red-600 p-[2px] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-100 transition-opacity duration-500 group-hover:opacity-100"></div>
          <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-[#0f172a] px-8 py-4 transition-all duration-200 group-hover:bg-transparent group-hover:text-white">
            <RefreshCwIcon className={`w-5 h-5 ${navigator.onLine ? 'animate-spin' : ''} text-red-500 group-hover:text-white transition-colors`} />
            <span className="font-bold text-lg text-white">إعادة المحاولة</span>
          </div>
        </button>

        {/* Footer Info */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-500">
          <div className="h-1 w-12 bg-gray-500 rounded-full mb-2"></div>
          <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-500">
            System Offline Mode
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineScreen;
