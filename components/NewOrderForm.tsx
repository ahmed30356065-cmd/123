
import React, { useState, useRef } from 'react';
import { Customer, User } from '../types';
import { ClipboardPlusIcon, CheckCircleIcon, ClipboardListIcon } from './icons';

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
            } else {
                orderData.paymentStatus = paymentOption;
                orderData.isVodafoneCash = false;
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

                setStatus('idle');
            }, 1500);

        } catch (e) {
            console.error("NewOrderForm Error:", e);
            setStatus('idle');
            setError(`حدث خطأ أثناء إضافة الطلب. ${e instanceof Error ? e.message : ''}`);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden transition-all duration-300">

            {/* Success Overlay Animation */}
            <div
                className={`absolute inset-0 bg-gray-800 z-10 flex flex-col items-center justify-center transition-opacity duration-300 ${status === 'success' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="scale-125 transform transition-transform duration-500 animate-bounce">
                    <CheckCircleIcon className="w-20 h-20 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mt-4">تم إضافة الطلب بنجاح!</h3>
            </div>

            <h2 className="text-2xl font-bold text-neutral-100 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <ClipboardPlusIcon className="w-6 h-6 ml-3 text-red-500" />
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
                            <label htmlFor="orderNum" className="block text-xs font-bold text-neutral-400 mb-2">رقم الطلب (اختياري)</label>
                            <input
                                ref={orderNumInputRef}
                                type="text"
                                id="orderNum"
                                value={customOrderNumber}
                                onChange={(e) => setCustomOrderNumber(e.target.value)}
                                disabled={status === 'submitting'}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none disabled:opacity-50 font-mono text-center"
                                placeholder="#1234"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-400 mb-2">حالة الدفع</label>
                            <div className="flex bg-gray-700 rounded-lg p-1 border border-gray-600">
                                {([
                                    { id: 'unpaid', label: 'غير مدفوع' },
                                    { id: 'paid', label: 'مدفوع' },
                                    { id: 'vodafone_cash', label: 'فودافون كاش' }
                                ] as const).map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setPaymentOption(opt.id)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paymentOption === opt.id
                                                ? (opt.id === 'unpaid' ? 'bg-red-500 text-white' : opt.id === 'paid' ? 'bg-green-600 text-white' : 'bg-red-800 text-white')
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-2">رقم الهاتف</label>
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
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:opacity-50 text-right placeholder:text-right font-mono"
                        placeholder="يجب أن يتكون من 11 رقم"
                        dir="rtl"
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-neutral-300 mb-2">العنوان بالتفصيل</label>
                    <input
                        ref={addressInputRef}
                        type="text"
                        name="address"
                        id="address"
                        value={customer.address}
                        onChange={handleCustomerChange}
                        required
                        disabled={status === 'submitting'}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:opacity-50"
                    />
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-neutral-300 mb-2">ملاحظات (اختياري)</label>
                    <textarea
                        ref={notesInputRef}
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        disabled={status === 'submitting'}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:opacity-50"
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
