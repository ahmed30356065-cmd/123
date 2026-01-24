


import React, { useState } from 'react';
import { ServerStackIcon, WifiIcon, RefreshCwIcon, CloudIcon } from './icons';

const ServerMaintenanceScreen: React.FC = () => {
  return (
    <div dir="rtl" className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-6 pt-safe text-white overflow-hidden font-sans">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.33); }
          80%, 100% { opacity: 0; }
        }
        @keyframes circle-anim {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .ring-container {
            position: relative;
        }
        .ring-container::before {
            content: '';
            position: absolute;
            left: 0; top: 0;
            width: 100%; height: 100%;
            background-color: rgba(239, 68, 68, 0.3);
            border-radius: 50%;
            z-index: -1;
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .loader-ring {
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-left-color: #ef4444;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            animation: circle-anim 1.2s linear infinite;
        }
      `}</style>

      {/* Background Particles/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e293b] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">
        
        {/* Animated Icon Container */}
        <div className="relative mb-10 ring-container flex justify-center items-center">
            <div className="loader-ring absolute"></div>
            <div className="w-24 h-24 bg-[#1e293b] rounded-full flex items-center justify-center border border-gray-700 shadow-2xl">
                <ServerStackIcon className="w-12 h-12 text-red-500" />
            </div>
            
            {/* Status Indicators */}
            <div className="absolute -bottom-4 bg-[#0f172a] border border-red-500/30 px-4 py-1 rounded-full flex items-center space-x-2 space-x-reverse shadow-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-mono text-red-200 font-bold tracking-wider">OFFLINE</span>
            </div>
        </div>

        {/* Branding */}
        <h1 className="text-4xl font-black mb-4 tracking-tight">
            <span className="text-red-500">GOO</span>
            <span className="text-white"> NOW</span>
        </h1>

        {/* Main Message */}
        <div className="bg-[#1e293b]/80 backdrop-blur-md border border-gray-700/50 p-8 rounded-2xl shadow-2xl w-full transform transition-all hover:border-red-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">النظام في وضع الصيانة</h2>
            <p className="text-gray-400 text-base leading-relaxed mb-6">
                نقوم حالياً بإجراء تحديثات هامة على الخوادم وقواعد البيانات لضمان سرعة وكفاءة الخدمة.
                <br />
                <span className="text-red-400 font-medium block mt-2">سيتم استعادة الاتصال تلقائياً فور الانتهاء.</span>
            </p>

            {/* Technical Details Mockup */}
            <div className="bg-black/40 rounded-lg p-4 text-right font-mono text-xs text-gray-500 space-y-2 border border-white/5">
                <div className="flex justify-between">
                    <span>CONNECTION:</span>
                    <span className="text-red-500">PAUSED</span>
                </div>
                <div className="flex justify-between">
                    <span>DATABASE:</span>
                    <span className="text-yellow-500">SYNC_PENDING...</span>
                </div>
                <div className="flex justify-between">
                    <span>RETRY:</span>
                    <span className="text-blue-400 animate-pulse">AUTO (LISTENING)</span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center text-gray-500 text-sm">
            <WifiIcon className="w-4 h-4 ml-2 animate-pulse" />
            <span>يرجى عدم إغلاق التطبيق</span>
        </div>
      </div>
    </div>
  );
};

export default ServerMaintenanceScreen;