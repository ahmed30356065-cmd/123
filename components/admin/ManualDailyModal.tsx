import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { XIcon, CheckCircleIcon, CalculatorIcon, CalendarIcon, TruckIconV2 } from '../icons';

interface ManualDailyModalProps {
    isOpen: boolean;
    onClose: () => void;
    drivers: User[];
    onSave: (data: { driverId: string; date: string; count: number; note?: string; amount: number }) => Promise<void>;
    preSelectedDriver?: User | null;
}

const ManualDailyModal: React.FC<ManualDailyModalProps> = ({ isOpen, onClose, drivers, onSave, preSelectedDriver }) => {
    const [driverId, setDriverId] = useState(preSelectedDriver?.id || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [count, setCount] = useState<number | ''>('');
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (preSelectedDriver) setDriverId(preSelectedDriver.id);
    }, [preSelectedDriver]);

    const selectedDriver = drivers.find(d => d.id === driverId);

    // Calculate Amount
    const calculateAmount = () => {
        if (!selectedDriver || !count) return 0;
        const commission = selectedDriver.commissionRate || 0;
        if (selectedDriver.commissionType === 'fixed') {
            return Number(count) * commission;
        } else {
            // For percentage, we can't calculate exact amount without total order value.
            // Requirement says: "number of orders". 
            // Usually "Daily" implies fixed fee per order.
            // If percentage, this feature might be ambiguous. 
            // We will assume "Partial Daily" or "Fixed Daily" logic mostly applies to Fixed Commission.
            // BUT: If the user insists on adding "Daily" for percentage driver, what is the amount?
            // Maybe they manually enter amount? 
            // For now, let's Stick to the requested: "Add Daily Paid... and calculate automatically".
            // If percentage, maybe we assume an average? No, that's dangerous.
            // Let's assume this feature is primarily for Fixed Commission drivers or "Entries" that represent a specific debt.
            // If percentage, return 0 or show warning?
            // Let's leave it as 0 for percentage and maybe allow manual override?
            // "استخرج تلقائي انت المستحقات" -> Auto calculate. 
            // If commission is percentage, we can't auto-calculate from COUNT alone.
            return 0;
        }
    };

    const amount = calculateAmount();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driverId || !count || !date) return;

        setIsLoading(true);
        try {
            await onSave({
                driverId,
                date,
                count: Number(count),
                note,
                amount
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-pop-in" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CalculatorIcon className="w-5 h-5 text-green-400" />
                        إضافة يومية يدوية
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Driver Selection */}
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

                    {/* Date */}
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

                    {/* Orders Count */}
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

                    {/* Note */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 block">ملاحظات (اختياري)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-green-500 resize-none h-20"
                            placeholder="أي ملاحظات إضافية..."
                        />
                    </div>

                    {/* Calculated Amount Display */}
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">المبلغ المستحق (تلقائي)</span>
                        <span className="text-xl font-black text-green-400">
                            {amount.toLocaleString()} <span className="text-xs text-gray-500">ج.م</span>
                        </span>
                    </div>

                    {selectedDriver && selectedDriver.commissionType !== 'fixed' && (
                        <div className="text-[10px] text-yellow-500 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                            تنويه: هذا المندوب يعمل بنظام النسبة المئوية. لا يمكن حساب المبلغ تلقائياً بدقة بناءً على العدد فقط. سيتم تسجيل القيمة كـ 0 ج.م أو يرجى مراجعة السياسة.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !driverId || !count}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : <CheckCircleIcon className="w-5 h-5" />}
                        حفظ اليومية
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ManualDailyModal;
