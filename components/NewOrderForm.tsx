
import React, { useState, useRef } from 'react';
import { Customer, User } from '../types';
import { ClipboardPlusIcon, CheckCircleIcon, ClipboardListIcon, PhoneIcon, MapPinIcon } from './icons';

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
            if (customOrderNumber) orderData.customOrderNumber = customOrderNumber;

            // Map the 3-way toggle to data model
            if (paymentOption === 'vodafone_cash') {
                orderData.paymentStatus = 'paid';
                orderData.isVodafoneCash = true;
                if (cashAmount) orderData.cashAmount = parseFloat(cashAmount);
            } else {
                orderData.paymentStatus = paymentOption;
                orderData.isVodafoneCash = false;
            }

            // Add payment amounts
            if (paidAmount) orderData.paidAmount = parseFloat(paidAmount);
            if (unpaidAmount) orderData.unpaidAmount = parseFloat(unpaidAmount);
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
                setCashAmount('');

                setStatus('idle');
            }, 1500);

        } catch (e) {
            console.error("NewOrderForm Error:", e);
            setStatus('idle');
            setError(`حدث خطأ أثناء إضافة الطلب. ${e instanceof Error ? e.message : ''}`);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden transition-all duration-300">

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

            <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity duration-300 ${status === 'success' ? 'opacity-0' : 'opacity-100'}`}>

                {/* Extra Fields Section - Only if Enabled */}
                {merchant?.canManageOrderDetails && (
                    <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50 space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-2 mb-2">
                            <ClipboardListIcon className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-pink-400">بيانات الطلب الإضافية</h3>
                        </div>

                        <div>
                            <label htmlFor="orderNum" className="block text-xs font-bold text-neutral-400 mb-1.5 flex items-center gap-1">
                                <ClipboardListIcon className="w-3.5 h-3.5" />
                                رقم الطلب (اختياري)
                            </label>
                            <input
                                ref={orderNumInputRef}
                                type="text"
                                id="orderNum"
                                value={customOrderNumber}
                                onChange={(e) => setCustomOrderNumber(e.target.value)}
                                disabled={status === 'submitting'}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none disabled:opacity-50 font-mono text-center text-sm"
                                placeholder="#1234"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-400 mb-1.5">حالة الدفع</label>
                            <div className="flex bg-gray-700 rounded-lg p-1 border border-gray-600 gap-1">
                                {([
                                    { id: 'unpaid', label: 'غير مدفوع', icon: '❌' },
                                    { id: 'paid', label: 'مدفوع', icon: '✓' },
                                    { id: 'vodafone_cash', label: 'كاش', icon: '💰' }
                                ] as const).map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setPaymentOption(opt.id)}
                                        className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${paymentOption === opt.id
                                            ? (opt.id === 'unpaid' ? 'bg-red-500 text-white shadow-lg' : opt.id === 'paid' ? 'bg-green-600 text-white shadow-lg' : 'bg-red-800 text-white shadow-lg')
                                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                            }`}
                                    >
                                        <span>{opt.icon}</span>
                                        <span>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentOption === 'paid' && (
                            <div className="animate-fadeIn">
                                <label htmlFor="paidAmount" className="block text-xs font-bold text-neutral-400 mb-1.5">المبلغ المدفوع (ج.م)</label>
                                <input
                                    type="number"
                                    id="paidAmount"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    disabled={status === 'submitting'}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:opacity-50 text-center text-sm"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        )}

                        {paymentOption === 'unpaid' && (
                            <div className="animate-fadeIn">
                                <label htmlFor="unpaidAmount" className="block text-xs font-bold text-neutral-400 mb-1.5">المبلغ غير المدفوع (ج.م)</label>
                                <input
                                    type="number"
                                    id="unpaidAmount"
                                    value={unpaidAmount}
                                    onChange={(e) => setUnpaidAmount(e.target.value)}
                                    disabled={status === 'submitting'}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:opacity-50 text-center text-sm"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        )}

                        {paymentOption === 'vodafone_cash' && (
                            <div className="animate-fadeIn">
                                <label htmlFor="cashAmount" className="block text-xs font-bold text-neutral-400 mb-1.5">مبلغ فودافون كاش (ج.م)</label>
                                <input
                                    type="number"
                                    id="cashAmount"
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(e.target.value)}
                                    disabled={status === 'submitting'}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none disabled:opacity-50 text-center text-sm"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        )}
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

                <div className="pt-2">
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
