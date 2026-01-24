import React, { useEffect, useState } from 'react';
import { BellIcon, XIcon, CheckCircleIcon } from './icons';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      const exitTimer = setTimeout(onClose, 400); // Match animation duration
      return () => clearTimeout(exitTimer);
    }, 4500); // 4.5s visible, 0.5s exit animation

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 400);
  };

  const typeStyles = {
    success: {
      icon: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
      barColor: 'bg-green-500',
    },
    error: {
      icon: <XIcon className="h-6 w-6 text-red-400" />,
      barColor: 'bg-red-500',
    },
    info: {
      icon: <BellIcon className="h-6 w-6 text-blue-400" />,
      barColor: 'bg-blue-500',
    },
  };
  
  const { icon, barColor } = typeStyles[type];

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -120%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 0); opacity: 1; }
          to { transform: translate(-50%, -120%); opacity: 0; }
        }
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slide-down { animation: slideDown 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
        .animate-progress { animation: progress 4.5s linear forwards; }
      `}</style>
      <div
        dir="rtl"
        className={`fixed top-5 left-1/2 z-50 w-full max-w-sm bg-gray-800 text-white rounded-lg shadow-2xl pointer-events-auto ring-1 ring-white/10 overflow-hidden ${exiting ? 'animate-slide-up' : 'animate-slide-down'}`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">{icon}</div>
            <div className="mr-3 w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-100">{message}</p>
            </div>
            <div className="mr-4 flex-shrink-0 flex">
              <button onClick={handleClose} className="rounded-md inline-flex text-neutral-400 hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500">
                <span className="sr-only">إغلاق</span>
                <XIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 ${barColor} animate-progress`}></div>
      </div>
    </>
  );
};

export default Notification;