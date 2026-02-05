
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, User } from '../../types';
import { ChevronLeftIcon, SearchIcon, PlusIcon, MinusIcon, BuildingStorefrontIcon, UserIcon, PhoneIcon, MapPinIcon, ClipboardListIcon, CheckCircleIcon, XIcon, ChevronDownIcon, GridIcon, UtensilsIcon, ShoppingCartIcon, VodafoneIcon, XCircleIcon, ReceiptIcon, BanknoteIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface AddOrderModalProps {
    merchants: User[];
    onClose: () => void;
    onSave: (newOrder: any) => Promise<void> | void;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({ merchants, onClose, onSave }) => {
    // Form State
    const [customer, setCustomer] = useState<Customer>({ phone: '', address: '' });
    const [notes, setNotes] = useState('');
    const [merchantId, setMerchantId] = useState<string>('');
    const [orderCount, setOrderCount] = useState<number>(1);

    // Advanced Fields
    const [customOrderNumber, setCustomOrderNumber] = useState('');
    const [paymentOption, setPaymentOption] = useState<'unpaid' | 'paid' | 'vodafone_cash'>('unpaid');
    const [paidAmount, setPaidAmount] = useState('');
    const [unpaidAmount, setUnpaidAmount] = useState('');
    const [cashAmount, setCashAmount] = useState('');

    // UI State
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
    const [progress, setProgress] = useState(0);
    const [isMerchantSheetOpen, setIsMerchantSheetOpen] = useState(false);
    const [merchantSearchTerm, setMerchantSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // --- Back Button Logic ---
    useAndroidBack(() => {
        if (isMerchantSheetOpen) {
            setIsMerchantSheetOpen(false);
            return true;
        }
        onClose();
        return true;
    }, [isMerchantSheetOpen, onClose]);

    const openMerchantSheet = () => setIsMerchantSheetOpen(true);
    const closeMerchantSheet = () => setIsMerchantSheetOpen(false);

    const categories = useMemo(() => {
        const uniqueCats = Array.from(new Set(merchants.map(m => m.storeCategory || 'غير مصنف')));
        return ['all', ...uniqueCats];
    }, [merchants]);

    const filteredMerchants = useMemo(() => {
        return merchants.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(merchantSearchTerm.toLowerCase()) || (m.phone && m.phone.includes(merchantSearchTerm));
            const matchesCategory = selectedCategory === 'all' || (m.storeCategory || 'غير مصنف') === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [merchants, merchantSearchTerm, selectedCategory]);

    const selectedMerchant = useMemo(() => merchants.find(m => m.id === merchantId), [merchants, merchantId]);

    const handleSave = async () => {
        if (!customer.phone || !customer.address || !merchantId) {
            setError('يرجى ملء جميع الحقول المطلوبة واختيار التاجر.');
            return;
        }

        if (!/^\d{11}$/.test(customer.phone)) {
            setError('رقم الهاتف يجب أن يتكون من 11 رقم.');
            return;
        }

        const merchantName = selectedMerchant?.name || 'تاجر غير معروف';

        // Prepare Base Data with Advanced Fields
        const baseData: any = { customer: { ...customer }, notes, merchantId, merchantName };

        if (selectedMerchant?.canManageOrderDetails) {
            if (customOrderNumber) baseData.customOrderNumber = customOrderNumber;

            if (paymentOption === 'vodafone_cash') {
                if (!cashAmount || parseFloat(cashAmount) <= 0) {
                    setError('يرجى إدخال مبلغ فودافون كاش.');
                    return;
                }
                baseData.paymentStatus = 'paid';
                baseData.isVodafoneCash = true;
                baseData.cashAmount = parseFloat(cashAmount);
                baseData.totalPrice = parseFloat(cashAmount);
            } else {
                baseData.paymentStatus = paymentOption;
                baseData.isVodafoneCash = false;

                if (paymentOption === 'paid') {
                    if (!paidAmount || parseFloat(paidAmount) <= 0) {
                        setError('يرجى إدخال المبلغ المدفوع.');
                        return;
                    }
                    baseData.paidAmount = parseFloat(paidAmount);
                    baseData.totalPrice = parseFloat(paidAmount);
                }
                if (paymentOption === 'unpaid') {
                    if (!unpaidAmount || parseFloat(unpaidAmount) <= 0) {
                        setError('يرجى إدخال المبلغ المطلوب.');
                        return;
                    }
                    baseData.unpaidAmount = parseFloat(unpaidAmount);
                    baseData.totalPrice = parseFloat(unpaidAmount);
                }
            }
        }

        setError('');
        setStatus('saving');
        setProgress(0);

        try {
            if (orderCount === 1) {
                await onSave(baseData);
                setProgress(100);
            } else {
                const ordersPayload = [];
                for (let i = 0; i < orderCount; i++) {
                    ordersPayload.push({ ...baseData, customer: { ...customer } });
                }
                setProgress(50);
                await onSave(ordersPayload);
                setProgress(100);
            }

            setStatus('success');

            setTimeout(() => {
                // Reset fields
                setCustomOrderNumber('');
                setPaymentOption('unpaid');
                setPaidAmount('');
                setUnpaidAmount('');
                setCashAmount('');
                onClose();
            }, 800);

        } catch (e) {
            setStatus('idle');
            setError('حدث خطأ أثناء حفظ الطلبات.');
            console.error(e);
        }
    };

    const incrementCount = () => { if (orderCount < 1000) setOrderCount(prev => prev + 1); };
    const decrementCount = () => { if (orderCount > 1) setOrderCount(prev => prev - 1); };

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 1;
        if (val < 1) val = 1;
        if (val > 1000) val = 1000;
        setOrderCount(val);
    };

    const handleSelectMerchant = (id: string) => {
        setMerchantId(id);
        setIsMerchantSheetOpen(false);
        setMerchantSearchTerm('');
    };

    const getCategoryIcon = (cat: string) => {
        if (cat === 'restaurant' || cat === 'مطعم') return <UtensilsIcon className="w-4 h-4" />;
        if (cat === 'market' || cat === 'سوبر ماركت') return <ShoppingCartIcon className="w-4 h-4" />;
        return <GridIcon className="w-4 h-4" />;
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#111827] animate-page-enter relative overflow-hidden">

            {/* Success Overlay Animation */}
            <div
                className={`absolute inset-0 z-[60] bg-[#111827] flex flex-col items-center justify-center transition-all duration-500 ${status === 'success' ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
            >
                <div className={`relative w-32 h-32 flex items-center justify-center mb-8 transition-transform duration-700 ${status === 'success' ? 'scale-100' : 'scale-50'}`}>
                    <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                        <CheckCircleIcon className="w-20 h-20 text-white" />
                    </div>
                </div>

                <h2 className={`text-4xl font-black text-white mb-2 tracking-tight transition-all duration-500 delay-100 ${status === 'success' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    تمت الإضافة!
                </h2>
                <p className={`text-gray-400 text-lg transition-all duration-500 delay-200 ${status === 'success' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    {orderCount > 1 ? `تم إنشاء ${orderCount} طلبات جديدة بنجاح` : 'تم إنشاء الطلب الجديد بنجاح'}
                </p>
            </div>

            {/* Normal Header */}
            <div className="flex-none bg-[#1f2937]/90 backdrop-blur-md border-b border-gray-700 flex items-center justify-between px-4 shadow-lg z-20 pt-safe h-16 box-content">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={status === 'saving'}
                        className="bg-gray-800 p-2.5 rounded-full text-gray-400 hover:text-white transition-colors active:bg-gray-700 border border-gray-700"
                    >
                        <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                    </button>
                    <h2 className="text-lg font-bold text-white">إضافة طلب جديد</h2>
                </div>

                {status === 'saving' && (
                    <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                        <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-yellow-500">{progress === 100 ? 'تم' : 'جاري الحفظ...'}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth pb-4 bg-[#111827]">

                {/* Merchant Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 block px-1 uppercase tracking-wider">التاجر (المرسل)</label>
                    <button
                        onClick={openMerchantSheet}
                        disabled={status === 'saving'}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedMerchant ? 'bg-gradient-to-r from-[#1f2937] to-[#1a202c] border-red-500/50 shadow-lg shadow-red-900/10' : 'bg-[#1f2937] border-gray-700 hover:border-gray-500 hover:bg-[#2d3748]'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border ${selectedMerchant ? 'bg-[#111] border-red-500/30' : 'bg-gray-800 border-gray-600'}`}>
                                {selectedMerchant && selectedMerchant.storeImage ? (
                                    <img src={selectedMerchant.storeImage} alt={selectedMerchant.name} className="w-full h-full object-cover" />
                                ) : (
                                    <BuildingStorefrontIcon className={`w-6 h-6 ${selectedMerchant ? 'text-red-500' : 'text-gray-500'}`} />
                                )}
                            </div>
                            <div className="text-right">
                                <span className={`block font-bold text-base ${selectedMerchant ? 'text-white' : 'text-gray-400'}`}>
                                    {selectedMerchant ? selectedMerchant.name : 'اضغط لاختيار التاجر'}
                                </span>
                                {selectedMerchant ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 font-mono">{selectedMerchant.phone}</span>
                                        <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-gray-300 border border-gray-700">{selectedMerchant.storeCategory || 'عام'}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-500">اختر من القائمة</span>
                                )}
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors">
                            <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        </div>
                    </button>
                </div>

                {/* Advanced Fields for Authorized Merchants */}
                {selectedMerchant?.canManageOrderDetails && (
                    <div className="space-y-4 animate-fadeIn mb-6">
                        <div className="bg-[#1f2937] p-4 rounded-xl border border-gray-700 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
                                <BanknoteIcon className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">بيانات مالية</h3>
                            </div>

                            {/* Order Number */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1.5 block font-bold flex items-center gap-1">
                                    <ReceiptIcon className="w-3.5 h-3.5" />
                                    رقم الطلب (اختياري)
                                </label>
                                <input
                                    value={customOrderNumber}
                                    onChange={(e) => setCustomOrderNumber(e.target.value)}
                                    placeholder="#1234"
                                    className="w-full bg-[#111] border border-gray-700 rounded-xl py-2.5 px-3 text-white text-center font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-gray-600"
                                />
                            </div>

                            {/* Payment Status */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 block font-bold">حالة الدفع</label>
                                <div className="flex bg-[#111] p-1 rounded-xl border border-gray-700 gap-1">
                                    <button type="button" onClick={() => setPaymentOption('unpaid')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${paymentOption === 'unpaid' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                                        <XCircleIcon className="w-3.5 h-3.5" />
                                        غير مدفوع
                                    </button>
                                    <button type="button" onClick={() => setPaymentOption('paid')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${paymentOption === 'paid' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        مدفوع
                                    </button>
                                    <button type="button" onClick={() => setPaymentOption('vodafone_cash')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${paymentOption === 'vodafone_cash' ? 'bg-red-800 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                                        <VodafoneIcon className="w-4 h-4" />
                                        فودافون
                                    </button>
                                </div>
                            </div>

                            {/* Amounts */}
                            {paymentOption === 'unpaid' && (
                                <div className="animate-scaleIn">
                                    <label className="text-xs text-gray-400 mb-1.5 block font-bold">المبلغ المطلوب</label>
                                    <input type="number" value={unpaidAmount} onChange={(e) => setUnpaidAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#111] border border-gray-700 rounded-xl py-2.5 px-3 text-white text-center font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                                </div>
                            )}
                            {paymentOption === 'paid' && (
                                <div className="animate-scaleIn">
                                    <label className="text-xs text-gray-400 mb-1.5 block font-bold">المبلغ المدفوع</label>
                                    <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#111] border border-gray-700 rounded-xl py-2.5 px-3 text-white text-center font-mono focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" />
                                </div>
                            )}
                            {paymentOption === 'vodafone_cash' && (
                                <div className="animate-scaleIn">
                                    <label className="text-xs text-gray-400 mb-1.5 block font-bold">مبلغ فودافون كاش</label>
                                    <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#111] border border-gray-700 rounded-xl py-2.5 px-3 text-white text-center font-mono focus:border-red-800 focus:ring-1 focus:ring-red-800 outline-none" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4"></div>

                {/* Customer Details */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2 px-1 uppercase tracking-wider">
                        <UserIcon className="w-4 h-4" /> بيانات العميل (المستلم)
                    </h3>

                    <div className="space-y-3">
                        <div className="relative group">
                            <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-500 group-focus-within:text-red-500 transition-colors">
                                <PhoneIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="tel"
                                value={customer.phone}
                                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                placeholder="رقم الهاتف (11 رقم)"
                                className="w-full bg-[#1f2937] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white text-right placeholder:text-right focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all font-mono shadow-sm"
                                dir="rtl"
                                maxLength={11}
                                disabled={status === 'saving'}
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute top-4 left-4 text-gray-500 group-focus-within:text-red-500 transition-colors">
                                <MapPinIcon className="w-5 h-5" />
                            </div>
                            <textarea
                                value={customer.address}
                                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                placeholder="العنوان بالتفصيل (المنطقة، الشارع، المبنى، الشقة)..."
                                className="w-full bg-[#1f2937] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all shadow-sm resize-none h-24 leading-relaxed"
                                disabled={status === 'saving'}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

                {/* Order Details */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2 px-1 uppercase tracking-wider">
                            <ClipboardListIcon className="w-4 h-4" /> تفاصيل إضافية
                        </h3>
                    </div>

                    <div className="bg-[#1f2937] p-4 rounded-xl border border-gray-700 flex items-center justify-between shadow-sm">
                        <span className="text-sm text-gray-200 font-bold">عدد نسخ الطلب</span>
                        <div className="flex items-center gap-3 bg-[#111] p-1.5 rounded-lg border border-gray-700 shadow-inner">
                            <button
                                onClick={decrementCount}
                                disabled={status === 'saving'}
                                className="w-9 h-9 flex items-center justify-center bg-gray-800 text-white rounded-md hover:bg-gray-700 active:scale-95 transition-all"
                            >
                                <MinusIcon className="w-4 h-4" />
                            </button>
                            <div className="w-10 text-center">
                                <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={orderCount}
                                    onChange={handleCountChange}
                                    onFocus={(e) => e.target.select()}
                                    disabled={status === 'saving'}
                                    className="w-full bg-transparent text-center font-black text-xl text-white outline-none border-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <button
                                onClick={incrementCount}
                                disabled={status === 'saving'}
                                className="w-9 h-9 flex items-center justify-center bg-red-600 text-white rounded-md hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-900/20"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="ملاحظات إضافية للمندوب (اختياري)..."
                            rows={3}
                            className="w-full bg-[#1f2937] border border-gray-700 rounded-xl p-4 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none shadow-sm"
                            disabled={status === 'saving'}
                        ></textarea>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center animate-fadeIn flex items-center justify-center gap-2">
                        <XIcon className="w-5 h-5 text-red-500" />
                        <p className="text-red-400 text-sm font-bold">{error}</p>
                    </div>
                )}
            </div>

            <div className="flex-none bg-[#1f2937] border-t border-gray-700 p-4 z-20 pb-6 sm:pb-4 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
                <button
                    onClick={handleSave}
                    disabled={status === 'saving'}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-none disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none group"
                >
                    {status === 'saving' ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>جاري الإنشاء ({progress}%)</span>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">تأكيد وإنشاء</span>
                            {orderCount > 1 && <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">x{orderCount}</span>}
                            <ChevronLeftIcon className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </>
                    )}
                </button>
            </div>

            {isMerchantSheetOpen && (
                <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex flex-col animate-fadeIn">
                    <div className="flex-none p-4 pt-safe flex items-center gap-4 bg-[#1f2937] border-b border-gray-700 shadow-md z-30">
                        <button onClick={closeMerchantSheet} className="bg-gray-800 hover:bg-gray-700 text-white p-2.5 rounded-full transition-colors active:scale-95">
                            <ChevronLeftIcon className="w-6 h-6 rotate-180" />
                        </button>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white">اختر التاجر</h3>
                            <p className="text-xs text-gray-400">{filteredMerchants.length} تاجر متاح</p>
                        </div>
                    </div>

                    <div className="flex-none bg-[#1f2937] p-4 pt-2 space-y-3 border-b border-gray-800 z-20">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="بحث باسم التاجر أو الرقم..."
                                value={merchantSearchTerm}
                                onChange={(e) => setMerchantSearchTerm(e.target.value)}
                                className="w-full bg-[#111] border border-gray-700 rounded-xl py-3 pl-4 pr-11 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500 shadow-inner outline-none transition-all"
                                autoFocus
                            />
                            <SearchIcon className="absolute right-3.5 top-3.5 w-5 h-5 text-gray-500" />
                        </div>

                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat
                                        ? 'bg-red-600 text-white border-red-600 shadow-md'
                                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                                        }`}
                                >
                                    {cat === 'all' ? 'الكل' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-[#111] custom-scrollbar">
                        {filteredMerchants.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredMerchants.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleSelectMerchant(m.id)}
                                        className={`w-full flex items-center p-3 rounded-xl border transition-all active:scale-[0.98] ${merchantId === m.id
                                            ? 'bg-red-900/10 border-red-500 shadow-lg shadow-red-900/10 ring-1 ring-red-500/30'
                                            : 'bg-[#1e1e1e] border-gray-800 hover:border-gray-600 hover:bg-[#252525]'
                                            }`}
                                    >
                                        <div className="relative">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden border-2 shadow-sm ${merchantId === m.id ? 'border-red-500' : 'border-gray-700 bg-gray-800'}`}>
                                                {m.storeImage ? (
                                                    <img src={m.storeImage} alt={m.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg font-bold text-gray-500">{m.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            {merchantId === m.id && (
                                                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-[#1e1e1e] shadow-sm animate-bounce">
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mr-3 flex-1 text-right min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className={`font-bold text-sm truncate ${merchantId === m.id ? 'text-white' : 'text-gray-200'}`}>
                                                    {m.name}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{m.phone}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] bg-black/40 text-gray-400 px-2 py-0.5 rounded border border-gray-700 flex items-center gap-1">
                                                    {getCategoryIcon(m.storeCategory || '')}
                                                    {m.storeCategory || 'غير مصنف'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <BuildingStorefrontIcon className="w-16 h-16 mb-4 opacity-10" />
                                <p className="text-sm font-bold">لا يوجد تجار مطابقين للبحث</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddOrderModal;
