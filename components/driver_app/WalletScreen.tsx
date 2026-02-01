
import React from 'react';
import { Order, User, OrderStatus } from '../../types';
import { WalletIcon, PhoneIcon, ClockIcon, MapPinIcon, BuildingStorefrontIcon } from '../icons';

const FinancialRow: React.FC<{ label: string, value: number, currency?: string, colorClass?: string }> = ({ label, value, currency = 'ج.م', colorClass = 'text-white' }) => (
    <div className="flex justify-between items-baseline bg-[#2A2A2A] p-3 rounded-md">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <span className={`text-lg font-bold ${colorClass}`}>
            {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
        </span>
    </div>
);

interface WalletScreenProps {
    driver: User;
    orders: Order[];
    users: User[];
}

const WalletScreen: React.FC<WalletScreenProps> = ({ driver, orders, users }) => {
    // Logic: Show ALL unpaid/unreconciled orders with robust type checking
    const unpaidOrders = orders.filter((order) => {
        // Compare IDs as strings to avoid string vs number mismatches
        const isDriverMatch = String(order.driverId) === String(driver.id);
        const isDelivered = order.status === OrderStatus.Delivered;
        const isNotCancelled = order.status !== OrderStatus.Cancelled; // Strict Safety
        // Handle cases where reconciled might be undefined or null
        const isUnpaid = !order.reconciled;
        const isNotArchived = !order.isArchived;

        return isDriverMatch && isDelivered && isNotCancelled && isUnpaid && isNotArchived;
    });

    // --- Precise Financial Calculations ---
    // Helper to prevent floating point errors (e.g. 15.000000002)
    const toCurrency = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    // Safe parse function to handle potential string numbers in database
    const safeParseFloat = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return parseFloat(val) || 0;
        return 0;
    };

    const totalFees = unpaidOrders.reduce((sum, order) => sum + safeParseFloat(order.deliveryFee), 0);
    const commissionRate = safeParseFloat(driver.commissionRate);

    let companyShare = 0;
    if (driver.commissionType === 'fixed') {
        // Fixed amount per order * Number of orders
        companyShare = unpaidOrders.length * commissionRate;
    } else {
        // Percentage of the Total Delivery Fees
        companyShare = totalFees * (commissionRate / 100);
    }

    // Add Opening Balance (Carried over from previous months)
    const openingBalance = safeParseFloat(driver.walletOpeningBalance);

    // Apply rounding to final figures to match Ledger/Admin Panel
    const finalTotalFees = toCurrency(totalFees);
    const finalCompanyShare = toCurrency(companyShare);
    const finalDriverShare = toCurrency(finalTotalFees - finalCompanyShare + openingBalance); // Add Opening Balance here

    const commissionLabel = driver.commissionType === 'fixed'
        ? `${commissionRate} ج.م/طلب`
        : `${commissionRate}%`;

    return (
        <div className="p-4 text-white">
            <div className="bg-[#1F1F1F] p-5 rounded-xl shadow-lg flex flex-col space-y-4 border-t-4 border-red-500">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-3 bg-gray-700 rounded-full">
                        <WalletIcon className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">محفظتي</h3>
                        <p className="text-xs text-gray-400">الرصيد الحالي (غير مسوى)</p>
                    </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">
                        ملخص المستحقات ({unpaidOrders.length} {unpaidOrders.length === 1 ? 'طلب' : 'طلبات'})
                    </h4>
                    {safeParseFloat(driver.walletOpeningBalance) !== 0 && (
                        <FinancialRow label="رصيد مرحل (سابق)" value={safeParseFloat(driver.walletOpeningBalance)} colorClass="text-yellow-400" />
                    )}
                    <FinancialRow label="إجمالي التحصيل (توصيل)" value={finalTotalFees} colorClass="text-blue-400" />
                    <FinancialRow label={`مستحقات التطبيق (${commissionLabel})`} value={finalCompanyShare} colorClass="text-red-400" />
                    <FinancialRow label="صافي ربحك" value={finalDriverShare} colorClass="text-green-400" />
                </div>
                <div className="text-center pt-4">
                    <p className="text-xs text-gray-500">
                        يتم تصفير هذا الرصيد تلقائياً عند تسوية الحساب مع الإدارة.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-4">طلبات لم يتم تسويتها</h3>
                {unpaidOrders.length > 0 ? (
                    <div className="space-y-4">
                        {unpaidOrders.map(order => {
                            const merchant = users.find(u => u.id === order.merchantId);
                            const formattedTime = (() => {
                                try {
                                    if (!order.deliveredAt) return '';
                                    const d = new Date(order.deliveredAt);
                                    if (isNaN(d.getTime())) return '';
                                    return d.toLocaleString('ar-EG-u-nu-latn', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                                } catch (e) {
                                    return '';
                                }
                            })();

                            return (
                                <div key={order.id} className="bg-[#2A2A2A] p-4 rounded-lg shadow-md border border-gray-700 flex flex-col space-y-4">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                        <span className="font-mono text-sm text-gray-400">{order.id}</span>
                                        <span className="text-xl font-bold text-green-400">
                                            {safeParseFloat(order.deliveryFee).toLocaleString('en-US')} ج.م
                                        </span>
                                    </div>

                                    {/* Card Body */}
                                    <div className="space-y-4">
                                        {/* Customer Info */}
                                        <div className="flex items-start space-x-3 space-x-reverse">
                                            <MapPinIcon className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-400">العميل</p>
                                                <p className="font-semibold text-white">{order.customer.address}</p>
                                                <p className="text-sm text-gray-300 flex items-center mt-1">
                                                    <PhoneIcon className="w-4 h-4 ml-2" />
                                                    <span>{order.customer.phone}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Merchant Info */}
                                        <div className="flex items-start space-x-3 space-x-reverse">
                                            <BuildingStorefrontIcon className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-400">التاجر</p>
                                                <p className="font-semibold text-white">{order.merchantName}</p>
                                                {merchant?.phone && (
                                                    <p className="text-sm text-gray-300 flex items-center mt-1">
                                                        <PhoneIcon className="w-4 h-4 ml-2" />
                                                        <span>{merchant.phone}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="flex items-center justify-end text-xs text-neutral-500 pt-3 border-t border-gray-700">
                                        <ClockIcon className="w-4 h-4 ml-2" />
                                        <span>تم التوصيل: {formattedTime}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-[#1F1F1F] p-8 rounded-lg text-center text-gray-500 border border-gray-800">
                        <p>رصيدك صافي! لا توجد مستحقات معلقة.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletScreen;
