import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { XIcon, CheckCircleIcon, DollarSignIcon, CalculatorIcon, CreditCardIcon, BanknoteIcon, ReceiptIcon } from '../icons';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
    onSave: (orderId: string, updates: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose, onSave }) => {
    // Determine initial status including 'collected'
    const getInitialStatus = () => {
        if (order.isCollected) return 'collected';
        if (order.isVodafoneCash) return 'vodafone';
        return order.paymentStatus || 'unpaid';
    };

    const [status, setStatus] = useState<'paid' | 'unpaid' | 'vodafone' | 'collected'>(getInitialStatus());

    // Amounts
    const [paidAmount, setPaidAmount] = useState<string>(order.paidAmount?.toString() || '');
    const [unpaidAmount, setUnpaidAmount] = useState<string>(order.unpaidAmount?.toString() || '');

    // Price Analysis
    const [originalPrice, setOriginalPrice] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [finalPrice, setFinalPrice] = useState<number>(0);

    // Calc total expected value (Delivery + Price)
    useEffect(() => {
        let total = 0;
        let disc = order.discount || 0;

        // Base Logic: 
        // We need to reconstruct the "Original Price" before discount if possible.
        // Assuming order.totalPrice IS the final price.

        if (order.totalPrice) total = order.totalPrice;

        // If we have a stored discount, the ORIGINAL was Total + Discount
        const original = total + disc;

        setFinalPrice(total);
        setDiscount(disc);
        setOriginalPrice(original);

    }, [order]);

    // Auto-fill logic when status changes
    useEffect(() => {
        if ((status === 'paid' || status === 'collected') && paidAmount === '') {
            setPaidAmount(finalPrice.toString());
            setUnpaidAmount('0');
        } else if (status === 'unpaid' && unpaidAmount === '') {
            setUnpaidAmount(finalPrice.toString());
            setPaidAmount('0');
        }
    }, [status, finalPrice]);

    const handleSave = () => {
        const updates = {
            // Fix: 'collected' (Cash) should NOT mark order as 'paid' automatically per user request.
            // It remains 'unpaid' until reconciled/received by admin.
            paymentStatus: (status === 'vodafone') ? 'paid' : (status === 'collected' ? 'unpaid' : status),
            isVodafoneCash: status === 'vodafone',
            isCollected: status === 'collected',
            paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
            unpaidAmount: unpaidAmount ? parseFloat(unpaidAmount) : 0,
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

                    {/* Order Price Details (New) */}
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-3">
                        <div className="flex justify-between items-center text-xs text-gray-400 border-b border-gray-700 pb-2">
                            <span>السعر الأصلي</span>
                            <span className="font-mono line-through text-red-400">{originalPrice.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-yellow-500 border-b border-gray-700 pb-2">
                            <span>قيمة الخصم</span>
                            <span className="font-mono">-{discount.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-sm font-bold text-white">صافي المطلوب</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono">{finalPrice.toLocaleString()} ج.م</span>
                        </div>

                        <div className="flex justify-center mt-2">
                            <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-mono">#{order.id}</span>
                        </div>
                    </div>

                    {/* Payment Status - 4 Options */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-3">حالة الدفع</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setStatus('unpaid')}
                                className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${status === 'unpaid'
                                    ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400'
                                    : 'bg-[#111] text-gray-400 hover:text-white border border-gray-700'
                                    }`}
                            >
                                <XIcon className="w-4 h-4" />
                                غير مدفوع
                            </button>
                            <button
                                onClick={() => setStatus('paid')}
                                className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${status === 'paid'
                                    ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                                    : 'bg-[#111] text-gray-400 hover:text-white border border-gray-700'
                                    }`}
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                مدفوع
                            </button>
                            <button
                                onClick={() => setStatus('vodafone')}
                                className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${status === 'vodafone'
                                    ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                                    : 'bg-[#111] text-gray-400 hover:text-white border border-gray-700'
                                    }`}
                            >
                                <DollarSignIcon className="w-4 h-4" />
                                فودافون
                            </button>
                            <button
                                onClick={() => setStatus('collected')}
                                className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${status === 'collected'
                                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                                    : 'bg-[#111] text-gray-400 hover:text-white border border-gray-700'
                                    }`}
                            >
                                <BanknoteIcon className="w-4 h-4" />
                                تم التحصيل
                            </button>
                        </div>
                    </div>

                    {/* Amounts Input Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-emerald-500 mb-1.5 text-center">المبلغ المدفوع</label>
                            <input
                                type="number"
                                value={paidAmount}
                                onChange={(e) => {
                                    setPaidAmount(e.target.value);
                                    // Logic: If I type 50 in Paid, remaining goes to Unpaid? 
                                    // Or simple override? keeping simple override for now
                                }}
                                className={`w-full bg-[#111] border border-emerald-500/30 rounded-lg py-2 px-1 text-white text-center font-mono font-bold text-lg focus:border-emerald-500 outline-none`}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-red-500 mb-1.5 text-center">المبلغ المتبقي</label>
                            <input
                                type="number"
                                value={unpaidAmount}
                                onChange={(e) => setUnpaidAmount(e.target.value)}
                                className={`w-full bg-[#111] border border-red-500/30 rounded-lg py-2 px-1 text-white text-center font-mono font-bold text-lg focus:border-red-500 outline-none`}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#111] p-4 border-t border-gray-800">
                    <button
                        onClick={handleSave}
                        className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                             ${status === 'collected' ? 'bg-blue-600 hover:bg-blue-700' :
                                status === 'vodafone' ? 'bg-purple-600 hover:bg-purple-700' :
                                    status === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        'bg-red-600 hover:bg-red-700'
                            } text-white`}
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        {status === 'collected' ? 'تأكيد التحصيل' : 'حفظ التغييرات'}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center mt-2">
                        {status === 'collected' ? 'سيتم وضع علامة "تم التحصيل" على الطلب وتسجيله كمدفوع' : 'سيتم تحديث حالة الدفع والمبالغ المالية'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
