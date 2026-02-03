
import React, { useState, useRef } from 'react';
import { Customer } from '../types';
import { ClipboardPlusIcon, CheckCircleIcon } from './icons';

interface NewOrderFormProps {
    addOrder: (order: { customer: Customer, notes?: string }) => Promise<void> | void;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ addOrder }) => {
    const [customer, setCustomer] = useState<Customer>({ phone: '', address: '' });
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    // Use refs for inputs to clear them bypassing React render cycle for instant visual feedback
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const notesInputRef = useRef<HTMLTextAreaElement>(null);

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
        const orderData = { customer: { ...customer }, notes };

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
                setCustomer({ phone: '', address: '' });
                setNotes('');
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
