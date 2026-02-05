import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { XIcon, CheckCircleIcon, DollarSignIcon, CalculatorIcon, CreditCardIcon } from '../icons';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
    onSave: (orderId: string, updates: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose, onSave }) => {
    const [status, setStatus] = useState<'paid' | 'unpaid' | 'vodafone'>(order.isVodafoneCash ? 'vodafone' : (order.paymentStatus || 'unpaid'));

    // Amounts
    const [paidAmount, setPaidAmount] = useState<string>(order.paidAmount?.toString() || '');
    const [unpaidAmount, setUnpaidAmount] = useState<string>(order.unpaidAmount?.toString() || '');
    const [totalValue, setTotalValue] = useState<number>(0);

    // Calc total expected value (Delivery + Price)
    useEffect(() => {
        let total = 0;
        if (order.deliveryFee) total += order.deliveryFee;
        if (order.totalPrice) total += order.totalPrice;
        if (order.regionPrice && !order.deliveryFee) total += order.regionPrice; // Fallback
        setTotalValue(total);
    }, [order]);

    // Auto-fill logic when status changes
    useEffect(() => {
        if (status === 'paid' && paidAmount === '') {
            setPaidAmount(totalValue.toString());
            setUnpaidAmount('0');
        } else if (status === 'unpaid' && unpaidAmount === '') {
            setUnpaidAmount(totalValue.toString());
            setPaidAmount('0');
        }
    }, [status, totalValue]);

    const handleSave = () => {
        const updates = {
            paymentStatus: status === 'vodafone' ? 'paid' : status,
            isVodafoneCash: status === 'vodafone',
            paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
            unpaidAmount: unpaidAmount ? parseFloat(unpaidAmount) : 0,
            isCollected: status === 'vodafone' ? false : false // Explicitly un-collect on any change from here
        };
        onSave(order.id, updates);
        onClose();
    };

    const commonInputStyle = "w-full px-4 py-3 border border-gray-600 bg-[#111] text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-lg font-mono font-bold text-center";

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#1f2937] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#111] px-5 py-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CreditCardIcon className="w-5 h-5 text-emerald-400" />
                        تحديث حالة الدفع
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* Order Summary */}
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-center">
                        <p className="text-gray-400 text-xs mb-1">إجمالي مطلوب (توصيل + منتجات)</p>
                        <p className="text-2xl font-black text-white font-mono">{totalValue.toLocaleString()} ج.م</p>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">#{order.id}</p>
                    </div>

                    {/* Payment Status - 3 Options */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-3">حالة الدفع</label>
                        <div className="grid grid-cols-3 gap-2 bg-[#111] p-1.5 rounded-xl border border-gray-700">
                            <button
                                onClick={() => setStatus('paid')}
                                className={`py-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${status === 'paid'
                                    ? 'bg-emerald-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                مدفوع
                            </button>
                            <button
                                onClick={() => setStatus('unpaid')}
                                className={`py-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${status === 'unpaid'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <XIcon className="w-4 h-4" />
                                غير مدفوع
                            </button>
                            <button
                                onClick={() => setStatus('vodafone')}
                                className={`py-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${status === 'vodafone'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <DollarSignIcon className="w-4 h-4" />
                                فودافون
                            </button>
                        </div>
                    </div>

                    {/* Single Amount Field */}
                    <div>
                        <label className="block text-xs font-bold text-cyan-400 mb-2">المبلغ الإجمالي (Total Amount)</label>
                        <input
                            type="number"
                            value={paidAmount}
                            onChange={(e) => {
                                const val = e.target.value;
                                setPaidAmount(val);
                                // Auto-update based on status
                                if (status === 'paid' || status === 'vodafone') {
                                    setUnpaidAmount('0');
                                } else {
                                    setUnpaidAmount(val);
                                    setPaidAmount('0');
                                }
                            }}
                            className={`${commonInputStyle} focus:ring-cyan-500 focus:border-cyan-500`}
                            placeholder="0"
                        />
                        <p className="text-[10px] text-gray-500 mt-2 text-center">
                            {status === 'paid' || status === 'vodafone' ? '✓ سيتم تسجيل المبلغ كمدفوع بالكامل' : '⚠ سيتم تسجيل المبلغ كمتبقي'}
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-[#111] p-4 border-t border-gray-800">
                    <button
                        onClick={handleSave}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        حفظ التغييرات
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
