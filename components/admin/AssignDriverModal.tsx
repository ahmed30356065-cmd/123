
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order, User, OrderStatus } from '../../types';
import { XIcon, CheckCircleIcon, SearchIcon, PhoneIcon, TruckIconV2 } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface AssignDriverModalProps {
  order: Order;
  drivers: User[];
  onClose: () => void;
  onSave: (driverId: string, deliveryFee: number) => void;
  targetStatus: OrderStatus.InTransit | OrderStatus.Delivered;
}

const AssignDriverModal: React.FC<AssignDriverModalProps> = ({ order, drivers, onClose, onSave, targetStatus }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number | string>(order.deliveryFee || '');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Use the standard hook for back button logic
  useAndroidBack(() => {
      onClose();
      return true; // Stop propagation
  }, [onClose]);
  
  const commonInputStyle = "w-full px-4 py-4 border border-gray-600 bg-[#111] text-white rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-bold text-center font-mono";

  const isTransfer = order.status === OrderStatus.InTransit && targetStatus === OrderStatus.InTransit;

  const modalTitle = isTransfer 
    ? 'نقل الطلب لمندوب آخر' 
    : targetStatus === OrderStatus.Delivered 
        ? 'إكمال توصيل الطلب' 
        : 'بدء توصيل الطلب';
  
  const saveButtonText = isTransfer
    ? 'تأكيد النقل'
    : targetStatus === OrderStatus.Delivered
        ? 'حفظ وتأكيد التوصيل'
        : 'حفظ وبدء التوصيل';

  const saveButtonColor = isTransfer ? 'bg-indigo-600 hover:bg-indigo-700' : targetStatus === OrderStatus.Delivered ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => 
      d.name.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      (d.phone && d.phone.includes(driverSearchTerm))
    );
  }, [drivers, driverSearchTerm]);


  const handleSave = () => {
    const fee = deliveryFee !== '' ? parseFloat(String(deliveryFee)) : undefined;

    if (!selectedDriverId || fee === undefined || fee < 0) {
      setError('يرجى اختيار مندوب وتحديد سعر توصيل صالح.');
      return;
    }

    setError('');
    onSave(selectedDriverId, fee);
  };

  // Render via Portal to ensure top stacking context
  return createPortal(
    <div 
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm transition-all duration-300 animate-fadeIn"
        style={{ touchAction: 'none' }}
        onClick={(e) => {
            e.stopPropagation();
            onClose();
        }}
    >
      <div 
        className="bg-[#1e293b] w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] border border-gray-700 shadow-2xl relative flex flex-col max-h-[85vh] animate-sheet-up overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#151e2d] relative z-10">
          <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl shadow-lg ${isTransfer ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  <TruckIconV2 className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-white">{modalTitle}</h3>
                  <p className="font-mono text-xs text-gray-400 mt-0.5 tracking-wider">ORDER #{order.id}</p>
              </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-[#1e293b] relative">
          
          {/* Driver Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">اختر المندوب</label>
            <div className="bg-[#111] rounded-2xl border border-gray-700 overflow-hidden shadow-sm">
                <div className="relative border-b border-gray-700">
                    <SearchIcon className="absolute top-1/2 right-4 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو الرقم..."
                        value={driverSearchTerm}
                        onChange={(e) => setDriverSearchTerm(e.target.value)}
                        className="w-full pr-12 pl-4 py-4 bg-[#111] text-white placeholder:text-gray-600 focus:outline-none transition-colors text-sm"
                    />
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredDrivers.map(d => (
                        <button
                            type="button"
                            key={d.id}
                            onClick={() => setSelectedDriverId(d.id)}
                            className={`w-full flex justify-between items-center text-right p-3 rounded-xl transition-all duration-200 border ${selectedDriverId === d.id ? 'bg-blue-600 text-white border-blue-500 shadow-md transform scale-[1.02]' : 'bg-transparent border-transparent text-gray-300 hover:bg-gray-800'}`}
                        >
                            <div>
                                <span className="font-bold block text-sm">{d.name}</span>
                                <span className={`text-xs font-mono flex items-center gap-1 mt-0.5 ${selectedDriverId === d.id ? 'text-blue-200' : 'text-gray-500'}`}>
                                    <PhoneIcon className="w-3 h-3"/>
                                    {d.phone}
                                </span>
                            </div>
                            {selectedDriverId === d.id && <CheckCircleIcon className="w-5 h-5 text-white" />}
                        </button>
                    ))}
                    {filteredDrivers.length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">لا يوجد مناديب مطابقين</div>
                    )}
                </div>
            </div>
          </div>
          
          {/* Delivery Fee Input */}
          <div className="bg-[#151e2d] p-4 rounded-2xl border border-gray-700">
            <label htmlFor="deliveryFee" className="block text-xs font-bold text-gray-400 mb-3 text-center uppercase tracking-wide">
                {isTransfer ? 'سعر التوصيل (تحديث)' : 'سعر التوصيل المستحق'}
            </label>
            <div className="relative max-w-[200px] mx-auto">
                <input 
                    type="number" 
                    id="deliveryFee" 
                    value={deliveryFee} 
                    onChange={(e) => setDeliveryFee(e.target.value)} 
                    placeholder="0" 
                    className={commonInputStyle} 
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">ج.م</span>
            </div>
          </div>
          
          {error && <div className="text-red-400 text-xs font-bold bg-red-900/20 p-3 rounded-xl border border-red-500/30 text-center animate-bounce">{error}</div>}
        </div>
        
        <div className="p-5 bg-[#151e2d] border-t border-gray-700 relative z-10">
          <button 
            type="button" 
            onClick={handleSave} 
            className={`w-full py-4 text-base font-bold text-white rounded-xl shadow-lg shadow-black/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${saveButtonColor}`}
          >
            {saveButtonText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AssignDriverModal;
