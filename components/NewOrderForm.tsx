import React, { useState, useRef } from 'react';
import { Customer, User } from '../types';
import { PhoneIcon, WhatsAppIcon, UserIcon, ClockIcon, ShoppingCartIcon, RocketIcon, CheckCircleIcon, TruckIconV2, BanknoteIcon, XCircleIcon, ChartBarIcon, SearchIcon, ClipboardListIcon, CalendarIcon, EmptyBoxIcon, VodafoneIcon, MapPinIcon, ReceiptIcon, ClipboardPlusIcon } from './icons';

interface NewOrderFormProps {
    addOrder: (order: { customer: Customer, notes?: string, customOrderNumber?: string, paymentStatus?: 'paid' | 'unpaid', isVodafoneCash?: boolean }) => Promise<void> | void;
    merchant?: User;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ addOrder, merchant }) => {
    const [customer, setCustomer] = useState<Customer>({ phone: '', address: '' });
    const [notes, setNotes] = useState('');

    // New Fields State
    const [customOrderNumber, setCustomOrderNumber] = useState('');
    const [paymentOption, setPaymentOption] = useState<'unpaid' | 'paid' | 'vodafone_cash'>('unpaid');
    const [paidAmount, setPaidAmount] = useState('');
    const [unpaidAmount, setUnpaidAmount] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [deliveryDiscount, setDeliveryDiscount] = useState(''); // New Discount Field

    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    // Use refs for inputs to clear them bypassing React render cycle for instant visual feedback
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const notesInputRef = useRef<HTMLTextAreaElement>(null);
    const orderNumInputRef = useRef<HTMLInputElement>(null);

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            // Enforce numeric only and max length 11
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length <= 11) {
                setCustomer({ ...customer, phone: numericValue });
            }
        } else {
            setCustomer({ ...customer, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!customer.phone || !customer.address) {
            setError('يرجى ملء رقم الهاتف والعنوان.');
            return;
        }

        if (!/^\d{11}$/.test(customer.phone)) {
            setError('رقم هاتف العميل يجب أن يتكون من 11 رقم.');
            return;
        }

        // 1. Lock UI
        setError('');
        setStatus('submitting');

        // 2. Capture data
        const orderData: any = { customer: { ...customer }, notes };

        if (merchant?.canManageOrderDetails) {
            // Validation for Custom Fields
            if (!customOrderNumber.trim()) {
                setError('يرجى إدخال رقم الطلب.');
                setStatus('idle');
                return;
            }

            if (customOrderNumber) orderData.customOrderNumber = customOrderNumber;

            // Map the 3-way toggle to data model
            if (paymentOption === 'vodafone_cash') {
                if (!cashAmount || parseFloat(cashAmount) <= 0) {
                    setError('يرجى إدخال مبلغ فودافون كاش.');
                    setStatus('idle');
                    return;
                }
                orderData.paymentStatus = 'paid';
                orderData.isVodafoneCash = true;
                if (cashAmount) orderData.cashAmount = parseFloat(cashAmount);
            } else {
                orderData.paymentStatus = paymentOption;
                orderData.isVodafoneCash = false;

                if (paymentOption === 'paid' && (!paidAmount || parseFloat(paidAmount) <= 0)) {
                    setError('يرجى إدخال المبلغ المدفوع.');
                    setStatus('idle');
                    return;
                }
                if (paymentOption === 'unpaid' && (!unpaidAmount || parseFloat(unpaidAmount) <= 0)) {
                    setError('يرجى إدخال المبلغ المطلوب (غير المدفوع).');
                    setStatus('idle');
                    return;
                }
            }


            // Add payment amounts and calculate totalPrice
            if (paidAmount) {
                const val = parseFloat(paidAmount);
                orderData.paidAmount = val;
                if (paymentOption === 'paid') orderData.totalPrice = val;
            }
            if (unpaidAmount) {
                const val = parseFloat(unpaidAmount);
                orderData.unpaidAmount = val;
                if (paymentOption === 'unpaid') orderData.totalPrice = val;
            }
            if (cashAmount) {
                const val = parseFloat(cashAmount);
                orderData.cashAmount = val;
                if (paymentOption === 'vodafone_cash') orderData.totalPrice = val;
            }

            // Apply Discount if exists
            if (deliveryDiscount && parseFloat(deliveryDiscount) > 0) {
                const discount = parseFloat(deliveryDiscount);
                const currentTotal = orderData.totalPrice || 0;

                if (discount > currentTotal) {
                    setError(`قيمة الخصم (${discount}) أكبر من المبلغ الإجمالي (${currentTotal})`);
                    setStatus('idle');
                    return;
                }

                orderData.totalPrice = Math.max(0, currentTotal - discount);
                orderData.discount = discount; // Optional: if backend supports saving discount value
            }
        }

        // 3. Process
        try {
            await addOrder(orderData);

            // 4. Show Success Animation
            setStatus('success');

            // 5. Reset Form Logic after delay
            setTimeout(() => {
                if (phoneInputRef.current) phoneInputRef.current.value = '';
                if (addressInputRef.current) addressInputRef.current.value = '';
                if (notesInputRef.current) notesInputRef.current.value = '';
                if (orderNumInputRef.current) orderNumInputRef.current.value = '';

                setCustomer({ phone: '', address: '' });
                setNotes('');
                setCustomOrderNumber('');
                setPaymentOption('unpaid'); // Reset to default
                setPaidAmount('');
                setUnpaidAmount('');
                setPaymentOption('unpaid'); // Reset to default
                setPaidAmount('');
                setUnpaidAmount('');
                setCashAmount('');
                setDeliveryDiscount('');

                setStatus('idle');
            }, 300);

        } catch (e) {
            console.error("NewOrderForm Error:", e);
            setStatus('idle');
            setError(`حدث خطأ أثناء إضافة الطلب. ${e instanceof Error ? e.message : ''}`);
        }
    };

    return (
        <div className="bg-gray-800 p-2 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden transition-all duration-300">

            {/* Success Overlay Animation */}
            <div
                className={`absolute inset-0 bg-gray-800 z-10 flex flex-col items-center justify-center transition-opacity duration-300 ${status === 'success' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="scale-125 transform transition-transform duration-500 animate-bounce">
                    <CheckCircleIcon className="w-20 h-20 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mt-4">تم إضافة الطلب بنجاح!</h3>
            </div>

            <h2 className="text-xl font-bold text-neutral-100 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <ClipboardPlusIcon className="w-5 h-5 ml-2 text-red-500" />
                    <span>إنشاء طلب جديد</span>
                </div>
            </h2>

            <form onSubmit={handleSubmit} className={`space-y-2 transition-opacity duration-300 ${status === 'success' ? 'opacity-0' : 'opacity-100'}`}>

                {/* Extra Fields Section - Compact Layout */}
                {merchant?.canManageOrderDetails && (
                    <div className="bg-gray-700/30 p-2.5 rounded-xl border border-gray-600/50 space-y-3 animate-fadeIn">

                        {/* 1. Payment Status (Full Width) */}
                        <div>
                            <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 opacity-80">حالة الدفع</label>
                            <div className="flex bg-gray-700 rounded-lg p-1 border border-gray-600 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPaymentOption('unpaid')}
                                    className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${paymentOption === 'unpaid'
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                        }`}
                                >
                                    <XCircleIcon className="w-3.5 h-3.5" />
                                    <span>غير مدفوع</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentOption('paid')}
                                    className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${paymentOption === 'paid'
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                        }`}
                                >
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                    <span>مدفوع</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentOption('vodafone_cash')}
                                    className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${paymentOption === 'vodafone_cash'
                                        ? 'bg-red-800 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                        }`}
                                >
                                    <VodafoneIcon className="w-3.5 h-3.5" />
                                    <span>فودافون</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Compact Row (Order # | Price | Discount) */}
                        <div className="grid grid-cols-3 gap-2">

                            {/* Order Number */}
                            <div>
                                <label htmlFor="orderNum" className="block text-[10px] font-bold text-neutral-400 mb-1 text-center">رقم الطلب</label>
                                <input
                                    ref={orderNumInputRef}
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    id="orderNum"
                                    value={customOrderNumber}
                                    onChange={(e) => setCustomOrderNumber(e.target.value)}
                                    disabled={status === 'submitting'}
                                    className="w-full px-1 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 outline-none disabled:opacity-50 font-mono text-center text-xs font-bold"
                                    placeholder="#"
                                />
                            </div>

                            {/* Price (Dynamic based on Status) */}
                            <div>
                                <label className="block text-[10px] font-bold text-emerald-400 mb-1 text-center">السعر</label>
                                {paymentOption === 'paid' && (
                                    <input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        disabled={status === 'submitting'}
                                        className="w-full px-1 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-neutral-600 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-center text-xs font-bold"
                                        placeholder="0"
                                    />
                                )}
                                {paymentOption === 'unpaid' && (
                                    <input
                                        type="number"
                                        value={unpaidAmount}
                                        onChange={(e) => setUnpaidAmount(e.target.value)}
                                        disabled={status === 'submitting'}
                                        className="w-full px-1 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-neutral-600 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none text-center text-xs font-bold"
                                        placeholder="0"
                                    />
                                )}
                                {paymentOption === 'vodafone_cash' && (
                                    <input
                                        type="number"
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                        disabled={status === 'submitting'}
                                        className="w-full px-1 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-neutral-600 focus:ring-1 focus:ring-red-800 focus:border-red-800 outline-none text-center text-xs font-bold"
                                        placeholder="0"
                                    />
                                )}
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="block text-[10px] font-bold text-yellow-400 mb-1 text-center">الخصم</label>
                                <input
                                    type="number"
                                    value={deliveryDiscount}
                                    onChange={(e) => setDeliveryDiscount(e.target.value)}
                                    disabled={status === 'submitting'}
                                    className="w-full px-1 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-yellow-400 placeholder:text-neutral-600 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:opacity-50 text-center text-xs font-bold"
                                    placeholder="0"
                                />
                            </div>

                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
                        <PhoneIcon className="w-4 h-4 text-blue-400" />
                        رقم الهاتف
                    </label>
                    <div className="relative">
                        <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            ref={phoneInputRef}
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={11}
                            name="phone"
                            id="phone"
                            value={customer.phone}
                            onChange={handleCustomerChange}
                            required
                            disabled={status === 'submitting'}
                            className="w-full pl-3 pr-10 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:opacity-50 text-right placeholder:text-right font-mono text-sm"
                            placeholder="يجب أن يتكون من 11 رقم"
                            dir="rtl"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4 text-green-400" />
                        العنوان بالتفصيل
                    </label>
                    <div className="relative">
                        <MapPinIcon className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
                        <input
                            ref={addressInputRef}
                            type="text"
                            name="address"
                            id="address"
                            value={customer.address}
                            onChange={handleCustomerChange}
                            required
                            disabled={status === 'submitting'}
                            className="w-full pl-3 pr-10 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:opacity-50 text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
                        <ClipboardListIcon className="w-4 h-4 text-yellow-400" />
                        ملاحظات (اختياري)
                    </label>
                    <textarea
                        ref={notesInputRef}
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        disabled={status === 'submitting'}
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:opacity-50 text-sm"
                    ></textarea>
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <div className="pt-2 pb-4">
                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full flex justify-center items-center bg-red-600 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {status === 'submitting' ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2"></div>
                                <span>جارى اضافة الطلب...</span>
                            </>
                        ) : (
                            <>
                                <ClipboardPlusIcon className="w-5 h-5 ml-2" />
                                <span>إضافة الطلب</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewOrderForm;
