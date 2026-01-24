
import React, { useState } from 'react';
import { Order } from '../../types';
import { XIcon, CheckCircleIcon } from '../icons';

interface AcceptOrderModalProps {
  order: Order;
  onClose: () => void;
  onConfirm: (deliveryFee: number) => void;
}

const AcceptOrderModal: React.FC<AcceptOrderModalProps> = ({ order, onClose, onConfirm }) => {
  const [fee, setFee] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const deliveryFee = parseFloat(fee);
    if (isNaN(deliveryFee) || deliveryFee <= 0) {
      setError('الرجاء إدخال سعر توصيل صحيح.');
      return;
    }
    setError('');
    onConfirm(deliveryFee);
  };

  const isFeeValid = fee !== '' && !isNaN(parseFloat(fee)) && parseFloat(fee) > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-sm text-white border border-gray-700 transform animate-modal-enter overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-red-500 animate-pulse" />
              قبول الطلب
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors">
            <XIcon className="w-6 h-6 hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            <p className="text-sm text-gray-300 leading-relaxed text-center">
                أنت على وشك قبول الطلب <span className="font-mono text-red-400 font-bold bg-red-900/20 px-1 rounded">{order.id}</span>.
                <br/>
                الرجاء تحديد سعر التوصيل للمتابعة.
            </p>
            
          <div className="animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="deliveryFee" className="block text-sm font-bold text-gray-400 mb-2 text-center">سعر التوصيل (EGP)</label>
            <div className="relative">
                <input 
                    type="number"
                    id="deliveryFee"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl font-bold text-white transition-all shadow-inner"
                    required
                    autoFocus
                />
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm font-bold text-center bg-red-900/20 p-2 rounded-lg border border-red-500/20 animate-pulse">{error}</p>}
        </div>
        
        <div className="bg-gray-900/80 px-4 py-4 flex flex-row-reverse gap-3 rounded-b-2xl border-t border-gray-700">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isFeeValid}
            className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-4 py-3 text-base font-bold text-white sm:w-auto sm:text-sm transition-all 
                ${isFeeValid 
                    ? 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 active:scale-95' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'}`}
          >
            تأكيد القبول
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-600 shadow-sm px-4 py-3 bg-gray-700 text-base font-bold text-gray-300 hover:bg-gray-600 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-all active:scale-95"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptOrderModal;
