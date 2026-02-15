import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { XIcon, CheckCircleIcon, CreditCardIcon, BanknoteIcon, VodafoneIcon } from '../icons';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
    onSave: (orderId: string, updates: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose, onSave }) => {
    // Determine initial status
    const getInitialStatus = () => {
        if (order.isCollected) return 'collected';
        if (order.isVodafoneCash) return 'vodafone';
        return order.paymentStatus || 'unpaid';
    };

    const [status, setStatus] = useState<'paid' | 'unpaid' | 'vodafone' | 'collected'>(getInitialStatus());

    // New Logic: Two main inputs "Price" (Total) and "Discount"
    // Paid Amount is calculated automatically (Price - Discount)

    // Initial State Setup
    const [priceInput, setPriceInput] = useState<string>('');
    const [discountInput, setDiscountInput] = useState<string>('');

    // Derived values for display
    const [netAmount, setNetAmount] = useState<number>(0);

    useEffect(() => {
        // Initialize from order data
        // If order.totalPrice represents the FINAL price (after discount in old logic),
        // we need to reverse engineer or use what we have.
        // Let's assume order.totalPrice is the BASE price we want to edit.
        // OR if previously modified, maybe we stored originalPrice?
        // Let's stick to: Input 1 = Total Price (Before Discount), Input 2 = Discount.

        let initialPrice = order.totalPrice || 0;
        let initialDiscount = order.discount || 0;

        // If we have a stored "originalPrice" maybe use that? 
        // For now, let's assume order.totalPrice + order.discount = Original Price if logic was consistent.
        // But user wants to SET the price. So let's just load current values.

        // If previously edited with this new logic:
        // Price = paidAmount + discount (if paid fully)

        // Let's load straightforward:
        setPriceInput((initialPrice + initialDiscount).toString());
        setDiscountInput(initialDiscount.toString());

    }, [order]);

    // Calculate Net Amount whenever inputs change
    useEffect(() => {
        const p = parseFloat(priceInput) || 0;
        const d = parseFloat(discountInput) || 0;
        setNetAmount(Math.max(0, p - d));
    }, [priceInput, discountInput]);

    const handleSave = () => {
        const p = parseFloat(priceInput) || 0;
        const d = parseFloat(discountInput) || 0;
        const finalNet = Math.max(0, p - d);

        const updates = {
            paymentStatus: (status === 'vodafone') ? 'paid' : (status === 'collected' ? 'unpaid' : status),
            isVodafoneCash: status === 'vodafone',
            isCollected: status === 'collected',

            // Core Financial Updates
            totalPrice: finalNet, // The actual money expected (Price - Discount)
            discount: d,          // The discount amount

            // Payment fields (Auto-calculated)
            // If status is PAID or COLLECTED or VODAFONE, we assume full amount is paid/collected
            paidAmount: (status === 'paid' || status === 'collected' || status === 'vodafone') ? finalNet : 0,
            unpaidAmount: (status === 'unpaid') ? finalNet : 0,
        };

        onSave(order.id, updates);
        onClose();
    };

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

                    {/* Net Amount Display */}
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-center">
                        <span className="block text-xs text-gray-400 mb-1">صافي المطلوب (بعد الخصم)</span>
                        <span className="text-3xl font-black text-emerald-400 font-mono tracking-wider">{netAmount.toLocaleString()} ج.م</span>
                    </div>

                    {/* Inputs Section: Price & Discount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-blue-400 mb-1.5 text-center">السعر (قبل الخصم)</label>
                            <input
                                type="number"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                                className="w-full bg-[#111] border border-blue-500/30 rounded-lg py-2 px-1 text-white text-center font-mono font-bold text-lg focus:border-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-red-400 mb-1.5 text-center">قيمة الخصم</label>
                            <input
                                type="number"
                                value={discountInput}
                                onChange={(e) => setDiscountInput(e.target.value)}
                                className="w-full bg-[#111] border border-red-500/30 rounded-lg py-2 px-1 text-white text-center font-mono font-bold text-lg focus:border-red-500 outline-none"
                                placeholder="0"
                            />
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
                                <VodafoneIcon className="w-4 h-4" />
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
                        {status === 'collected' ? 'سيتم وضع علامة "تم التحصيل" على الطلب وتسجيله كمدفوع' : 'سيتم تحديث سجل التاجر والمبالغ المالية'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
