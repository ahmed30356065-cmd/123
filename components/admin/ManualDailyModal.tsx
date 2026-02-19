import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, ManualDaily } from '../../types';
import { XIcon, CheckCircleIcon, CalculatorIcon, CalendarIcon } from '../icons';

interface ManualDailyModalProps {
    isOpen: boolean;
    onClose: () => void;
    drivers: User[];
    onSave: (data: { id?: string; driverId: string; date: string; count: number; note?: string; amount: number; totalDeliveryFees?: number }) => Promise<void>;
    preSelectedDriver?: User | null;
    initialData?: any | null;
}

const ManualDailyModal: React.FC<ManualDailyModalProps> = ({ isOpen, onClose, drivers, onSave, preSelectedDriver, initialData }) => {
    const [driverId, setDriverId] = useState(preSelectedDriver?.id || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [count, setCount] = useState<number | ''>('');
    const [deliveryFeePerOrder, setDeliveryFeePerOrder] = useState<number | ''>('');
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setDriverId(initialData.driverId);
            setDate(initialData.dayDate);
            setCount(initialData.ordersCount);
            setNote(initialData.note || '');
            if (initialData.totalDeliveryFees && initialData.ordersCount) {
                setDeliveryFeePerOrder(initialData.totalDeliveryFees / initialData.ordersCount);
            }
        } else if (preSelectedDriver) {
            setDriverId(preSelectedDriver.id);
            setDate(new Date().toISOString().split('T')[0]);
            setCount('');
            setDeliveryFeePerOrder('');
            setNote('');
        }
    }, [initialData, preSelectedDriver, isOpen]);

    const selectedDriver = drivers.find(d => d.id === driverId);

    const calculateAmount = () => {
        if (!selectedDriver || !count) return 0;
        const commission = selectedDriver.commissionRate || 0;
        if (selectedDriver.commissionType === 'fixed') {
            return Number(count) * commission;
        } else {
            if (!deliveryFeePerOrder) return 0;
            const totalFees = Number(count) * Number(deliveryFeePerOrder);
            return totalFees * (commission / 100);
        }
    };

    const amount = calculateAmount();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driverId || !count || !date) return;

        setIsLoading(true);
        try {
            await onSave({
                id: initialData?.id,
                driverId,
                date,
                count: Number(count),
                note,
                amount,
                totalDeliveryFees: deliveryFeePerOrder ? (Number(count) * Number(deliveryFeePerOrder)) : undefined
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-pop-in" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CalculatorIcon className="w-5 h-5 text-green-400" />
                        {initialData ? 'تعديل اليومية' : 'إضافة يومية يدوية'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 block">المندوب</label>
                        <select
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                            disabled={!!preSelectedDriver}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-green-500 disabled:opacity-50"
                            required
                        >
                            <option value="">اختر المندوب</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 block">التاريخ</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-green-500 pl-10"
                                required
                            />
                            <CalendarIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 block">عدد الطلبات</label>
                        <input
                            type="number"
                            min="1"
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-green-500 font-mono"
                            placeholder="0"
                            required
                        />
                    </div>

                    {selectedDriver && selectedDriver.commissionType === 'percentage' && (
                        <div className="space-y-2 animate-fadeIn">
                            <label className="text-xs font-bold text-yellow-500 block">سعر توصيل الطلب الواحد (للنسبة المئوية)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={deliveryFeePerOrder}
                                    onChange={(e) => setDeliveryFeePerOrder(Number(e.target.value))}
                                    className="w-full bg-[#0f172a] border border-yellow-500/50 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-yellow-500 font-mono pl-10"
                                    placeholder="مثلاً: 25"
                                    required
                                />
                                <span className="absolute left-3 top-3.5 text-xs text-gray-500 font-bold">ج.م</span>
                            </div>
                            <p className="text-[10px] text-gray-500">
                                الإجمالي: <span className="text-white font-bold">{count && deliveryFeePerOrder ? (Number(count) * Number(deliveryFeePerOrder)).toLocaleString() : 0} ج.م</span>
                                {' | '}
                                العمولة: <span className="text-green-400 font-bold">{selectedDriver.commissionRate}%</span>
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 block">ملاحظات (اختياري)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-green-500 resize-none h-20"
                            placeholder="أي ملاحظات إضافية..."
                        />
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">المبلغ المستحق (تلقائي)</span>
                        <span className="text-xl font-black text-green-400">
                            {amount.toLocaleString()} <span className="text-xs text-gray-500">ج.م</span>
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !driverId || !count}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : <CheckCircleIcon className="w-5 h-5" />}
                        {initialData ? 'تحديث البيانات' : 'حفظ اليومية'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ManualDailyModal;
