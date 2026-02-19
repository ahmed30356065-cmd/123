
import React, { useState, useEffect } from 'react';
import { PromoCode } from '../../types';
import { TicketIcon, PlusIcon, TrashIcon, CheckCircleIcon, XIcon, DollarSignIcon, CoinsIcon } from '../icons';
import ConfirmationModal from './ConfirmationModal';

interface LoyaltyScreenProps {
    promoCodes: PromoCode[];
    pointsConfig: { pointsPerCurrency: number; currencyPerPoint: number; isPointsEnabled?: boolean };
    onAddPromo: (promo: PromoCode) => void;
    onDeletePromo: (id: string) => void;
    onUpdatePointsConfig: (config: { pointsPerCurrency: number; currencyPerPoint: number; isPointsEnabled?: boolean }) => void;
}

const LoyaltyScreen: React.FC<LoyaltyScreenProps> = ({ promoCodes, pointsConfig, onAddPromo, onDeletePromo, onUpdatePointsConfig }) => {
    const [activeTab, setActiveTab] = useState<'promos' | 'points'>('promos');
    const [showSuccess, setShowSuccess] = useState(false);

    // Promo State
    const [code, setCode] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [usageLimit, setUsageLimit] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [maxDiscount, setMaxDiscount] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    // Points State
    const [isPointsEnabled, setIsPointsEnabled] = useState(pointsConfig?.isPointsEnabled ?? true);

    // UI State for "Points per Amount" calculation
    // Backend uses "pointsPerCurrency" (points for 1 unit).
    // UI shows "X Points for Y Amount". 
    // Logic: pointsPerCurrency = earningRatePoints / earningRateAmount.
    const [earningRateAmount, setEarningRateAmount] = useState<string>('1'); // The "100" in "100 EGP"
    const [earningRatePoints, setEarningRatePoints] = useState<string>(String(pointsConfig?.pointsPerCurrency || 1)); // The "1" in "1 Point"

    const [currencyPerPoint, setCurrencyPerPoint] = useState(pointsConfig?.currencyPerPoint || 0.1);

    // Initialize UI state from props
    useEffect(() => {
        setIsPointsEnabled(pointsConfig?.isPointsEnabled ?? true);
        setCurrencyPerPoint(pointsConfig?.currencyPerPoint || 0.1);

        // Reverse calculate for UI if it looks like a standard ratio (e.g. 0.01 -> 1 point for 100)
        const currentRate = pointsConfig?.pointsPerCurrency || 1;
        if (currentRate < 1 && (1 / currentRate) % 10 === 0) {
            setEarningRateAmount(String(1 / currentRate));
            setEarningRatePoints('1');
        } else {
            setEarningRateAmount('1');
            setEarningRatePoints(String(currentRate));
        }
    }, [pointsConfig]);

    const handleAddPromo = () => {
        if (!code || !value) return;
        const newPromo: PromoCode = {
            id: `PROMO-${Date.now()}`,
            code: code.toUpperCase(),
            type,
            value: parseFloat(value),
            isActive: true,
            usageCount: 0,
            maxUsage: usageLimit ? parseInt(usageLimit) : undefined,
            minOrderAmount: minOrder ? parseFloat(minOrder) : undefined,
            maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
            expiryDate: expiryDate || undefined,
            createdAt: new Date().toISOString()
        };
        onAddPromo(newPromo);
        setCode('');
        setValue('');
        setUsageLimit('');
        setMinOrder('');
        setMaxDiscount('');
        setExpiryDate('');
    };

    const handleSavePoints = () => {
        const amount = parseFloat(earningRateAmount);
        const points = parseFloat(earningRatePoints);

        if (isNaN(amount) || amount <= 0 || isNaN(points) || points < 0) {
            alert('يرجى إدخال قيم صحيحة لمعدل احتساب النقاط.');
            return;
        }

        const calculatedRate = points / amount;

        onUpdatePointsConfig({
            pointsPerCurrency: calculatedRate,
            currencyPerPoint: currencyPerPoint,
            isPointsEnabled: isPointsEnabled
        });

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    return (
        <div className="space-y-6 pb-24 animate-fadeIn relative">

            {showSuccess && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-gray-800 border border-green-500/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center animate-pop-in">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircleIcon className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">تم الحفظ بنجاح</h3>
                        <p className="text-gray-400">تم تحديث إعدادات النقاط.</p>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <TicketIcon className="w-8 h-8 text-yellow-500" />
                الولاء والخصومات
            </h2>

            {/* Tabs */}
            <div className="flex bg-gray-800 p-1 rounded-xl w-fit mb-6">
                <button
                    onClick={() => setActiveTab('promos')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'promos' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    أكواد الخصم
                </button>
                <button
                    onClick={() => setActiveTab('points')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'points' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    إعدادات النقاط
                </button>
            </div>

            {activeTab === 'promos' ? (
                <div className="space-y-6">
                    {/* Add New Promo */}
                    <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <PlusIcon className="w-5 h-5 text-green-500" />
                            إضافة كود جديد
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input
                                type="text"
                                placeholder="الكود (مثال: SALE20)"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none uppercase font-mono"
                            />
                            <div className="flex bg-gray-900 rounded-xl border border-gray-600 overflow-hidden">
                                <input
                                    type="number"
                                    placeholder="القيمة"
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    className="flex-1 bg-transparent px-4 py-3 text-white outline-none"
                                />
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value as any)}
                                    className="bg-gray-800 text-gray-300 px-3 text-xs outline-none border-r border-gray-600"
                                >
                                    <option value="percentage">%</option>
                                    <option value="fixed">ج.م</option>
                                </select>
                            </div>
                            <input
                                type="number"
                                placeholder="الحد الأقصى للاستخدام"
                                value={usageLimit}
                                onChange={e => setUsageLimit(e.target.value)}
                                className="bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none text-sm"
                            />
                            <input
                                type="number"
                                placeholder="الحد الأدنى للطلب"
                                value={minOrder}
                                onChange={e => setMinOrder(e.target.value)}
                                className="bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none text-sm"
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-500 mr-2">تاريخ الانتهاء</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={e => setExpiryDate(e.target.value)}
                                    className="bg-gray-900 border border-gray-600 rounded-xl px-4 py-2.5 text-white focus:border-yellow-500 outline-none text-sm"
                                />
                            </div>
                            {type === 'percentage' && (
                                <input
                                    type="number"
                                    placeholder="أقصى قيمة للخصم"
                                    value={maxDiscount}
                                    onChange={e => setMaxDiscount(e.target.value)}
                                    className="bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none text-sm animate-fadeIn"
                                />
                            )}
                            <button
                                onClick={handleAddPromo}
                                disabled={!code || !value}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                حفظ الكود
                            </button>
                        </div>
                    </div>

                    {/* Promos List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {promoCodes.map(promo => (
                            <div key={promo.id} className="bg-[#1e293b] rounded-xl p-4 border border-gray-700 flex justify-between items-center group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-1 h-full bg-yellow-500"></div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-white text-lg tracking-wider">{promo.code}</span>
                                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20">
                                            {promo.type === 'percentage' ? `${promo.value}%` : `${promo.value} ج.م`}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        تم الاستخدام: <span className="text-white font-bold">{promo.usageCount}</span> {promo.maxUsage ? `/ ${promo.maxUsage}` : ''}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeletePromo(promo.id)}
                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {promoCodes.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-500 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                                <TicketIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                لا توجد أكواد نشطة
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg max-w-xl">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-white">إعدادات النقاط</h3>

                        {/* Enable/Disable Toggle */}
                        <button
                            onClick={() => setIsPointsEnabled(!isPointsEnabled)}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isPointsEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${isPointsEnabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    <div className={`space-y-6 transition-opacity duration-300 ${isPointsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        {/* Points Calculator Interface */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-bold">معدل اكتساب النقاط</label>
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-600 flex items-center gap-3">
                                <span className="text-gray-400 text-sm">يحصل العميل على</span>

                                <div className="relative w-20">
                                    <input
                                        type="number"
                                        value={earningRatePoints}
                                        onChange={e => setEarningRatePoints(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-500 rounded-lg px-2 py-1.5 text-center text-white font-bold focus:border-yellow-500 outline-none"
                                    />
                                </div>
                                <span className="text-yellow-500 font-bold text-sm">نقطة</span>

                                <span className="text-gray-400 text-sm">مقابل كل</span>

                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        value={earningRateAmount}
                                        onChange={e => setEarningRateAmount(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-500 rounded-lg px-2 py-1.5 text-center text-white font-bold focus:border-green-500 outline-none"
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">ج.م</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 mr-1">
                                مثال: 1 نقطة مقابل كل 100 جنيه، أو 0.5 نقطة مقابل كل 1 جنيه.
                            </p>
                        </div>

                        {/* Redemption Value */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-bold">قيمة النقطة عند الاستبدال</label>
                            <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-600">
                                <CoinsIcon className="w-5 h-5 text-yellow-500" />
                                <span className="text-white font-bold text-sm">1 نقطة =</span>
                                <input
                                    type="number"
                                    value={currencyPerPoint}
                                    onChange={e => setCurrencyPerPoint(parseFloat(e.target.value))}
                                    className="w-24 bg-gray-800 border border-gray-500 rounded-lg px-3 py-1.5 text-center text-white font-bold focus:border-green-500 outline-none"
                                />
                                <span className="text-green-500 font-bold text-sm">ج.م</span>
                            </div>
                        </div>

                        {/* Live Example */}
                        <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 text-sm text-blue-200">
                            <p className="font-bold mb-1 text-white">مثال حي:</p>
                            إذا اشترى العميل بـ <strong>{earningRateAmount || 0} ج.م</strong>، سيحصل على <strong>{earningRatePoints || 0}</strong> نقاط.
                            <br />
                            وقيمتها عند الخصم ستكون <strong>{(parseFloat(earningRatePoints || '0') * currencyPerPoint).toFixed(2)}</strong> جنيه.
                        </div>
                    </div>

                    <button
                        onClick={handleSavePoints}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg mt-6"
                    >
                        حفظ الإعدادات
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoyaltyScreen;
