
import React, { useState } from 'react';
import { User, OrderStatus, Order, SupervisorPermission } from '../../types';
import { StoreIcon, ClockIcon, TruckIconV2, SearchIcon, PencilIcon, UtensilsIcon, EyeIcon, XIcon, GridIcon, ShieldCheckIcon } from '../icons';
import EditUserModal from './EditUserModal';
import UserDetailsModal from './UserDetailsModal';
import MenuManager from '../merchant_app/MenuManager';
import useAndroidBack from '../../hooks/useAndroidBack';

interface AdminStoresScreenProps {
    users: User[];
    orders: Order[];
    updateUser: (userId: string, updatedData: Partial<User>) => void;
    permissions?: SupervisorPermission[];
}

const AdminStoresScreen: React.FC<AdminStoresScreenProps> = ({ users, orders, updateUser, permissions }) => {
    const canManage = !permissions || permissions.includes('manage_stores');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingMerchant, setEditingMerchant] = useState<User | null>(null);
    const [viewingMerchant, setViewingMerchant] = useState<User | null>(null);
    const [viewingMenuMerchant, setViewingMenuMerchant] = useState<User | null>(null);

    // Handle Android Back Button for local modals
    useAndroidBack(() => {
        // Priority 1: Close Menu Manager
        if (viewingMenuMerchant) {
            setViewingMenuMerchant(null);
            return true;
        }
        // Priority 2: Close Edit Modal
        if (editingMerchant) {
            setEditingMerchant(null);
            return true;
        }
        // Priority 3: Close Details Modal
        if (viewingMerchant) {
            setViewingMerchant(null);
            return true;
        }
        // If no modals are open, return false to let AdminPanel handle navigation (Back to Orders)
        return false;
    }, [viewingMenuMerchant, editingMerchant, viewingMerchant]);

    const merchants = users.filter(u => u.role === 'merchant');

    const filteredMerchants = merchants.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phone && m.phone.includes(searchQuery))
    );

    const toggleFreeDelivery = (merchant: User) => {
        updateUser(merchant.id, { hasFreeDelivery: !merchant.hasFreeDelivery });
    };

    return (
        <div className="space-y-6 pb-32 animate-fadeIn relative">

            {/* Header & Search */}
            <div className="bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-700/50 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                        <StoreIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">إدارة المتاجر</h2>
                        <p className="text-xs text-gray-400">{merchants.length} متجر مسجل</p>
                    </div>
                </div>

                <div className="relative flex-1 w-full">
                    <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="بحث باسم المتجر..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-900 text-white rounded-xl py-3 pr-12 pl-4 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Merchants List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMerchants.length > 0 ? (
                    filteredMerchants.map((merchant, idx) => {
                        const completedOrders = orders.filter(o => o.merchantId === merchant.id && o.status === OrderStatus.Delivered).length;

                        return (
                            <div key={merchant.id} className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-700 shadow-md group hover:border-gray-500 transition-all flex flex-col">
                                {/* Card Header / Image */}
                                <div className="h-24 bg-gray-800 relative overflow-hidden">
                                    {merchant.storeImage ? (
                                        <img src={merchant.storeImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt={merchant.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <StoreIcon className="w-12 h-12 text-gray-600 opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] to-transparent"></div>
                                    <div className="absolute bottom-3 right-4">
                                        <h3 className="text-lg font-bold text-white shadow-sm">{merchant.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono">{merchant.phone}</p>
                                    </div>

                                    <div className="absolute top-2 left-2 flex gap-2">
                                        <button
                                            onClick={() => setViewingMerchant(merchant)}
                                            className="bg-black/40 hover:bg-black/60 p-2 rounded-full text-white backdrop-blur-sm transition-colors border border-white/5"
                                            title="التفاصيل"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        {canManage && (
                                            <button
                                                onClick={() => setEditingMerchant(merchant)}
                                                className="bg-black/40 hover:bg-black/60 p-2 rounded-full text-white backdrop-blur-sm transition-colors border border-white/5"
                                                title="الإعدادات"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Controls Body */}
                                <div className="p-4 space-y-4 flex-1 flex flex-col">

                                    {/* Stats Row */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-gray-900/50 p-2 rounded-lg text-center border border-gray-700">
                                            <p className="text-[10px] text-gray-500 mb-1">الطلبات المكتملة</p>
                                            <p className="font-bold text-white text-lg">{completedOrders}</p>
                                        </div>
                                        <div className="flex-1 bg-gray-900/50 p-2 rounded-lg text-center border border-gray-700">
                                            <p className="text-[10px] text-gray-500 mb-1">سرعة الاستجابة</p>
                                            <p className="font-bold text-blue-400 text-sm mt-1">{merchant.responseTime || '--'}</p>
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="space-y-3 pt-2 border-t border-gray-700/50">

                                        {/* Free Delivery Toggle */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${merchant.hasFreeDelivery ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                                    <TruckIconV2 className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-300">توصيل مجاني</span>
                                            </div>
                                            <button
                                                onClick={canManage ? () => toggleFreeDelivery(merchant) : undefined}
                                                className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${!canManage ? 'opacity-50 cursor-not-allowed' : ''} ${merchant.hasFreeDelivery ? 'bg-green-500' : 'bg-gray-600'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all duration-300 ${merchant.hasFreeDelivery ? 'left-1' : 'left-6'}`}></div>
                                            </button>
                                        </div>

                                        {/* Response Time */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                                                    <ClockIcon className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-300">وقت التجهيز</span>
                                            </div>
                                            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                                {merchant.responseTime || 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    {canManage && (
                                        <div className="pt-3 mt-auto">
                                            <button
                                                onClick={() => setViewingMenuMerchant(merchant)}
                                                className="w-full bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold py-2.5 rounded-xl border border-purple-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <UtensilsIcon className="w-4 h-4" />
                                                <span>إدارة قائمة الطعام (المنيو)</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <StoreIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>لا توجد متاجر مطابقة للبحث.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {editingMerchant && (
                <EditUserModal
                    user={editingMerchant}
                    onClose={() => setEditingMerchant(null)}
                    onSave={(id, data) => { updateUser(id, data); setEditingMerchant(null); }}
                    isLastAdmin={false}
                />
            )}

            {viewingMerchant && (
                <UserDetailsModal
                    user={viewingMerchant}
                    onClose={() => setViewingMerchant(null)}
                    onApprove={() => { }}
                    onDelete={() => { }}
                />
            )}

            {viewingMenuMerchant && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex justify-center items-end sm:items-center animate-fadeIn p-0 sm:p-4" onClick={() => setViewingMenuMerchant(null)}>
                    <div className="bg-[#1a1a1a] w-full max-w-4xl h-[95vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl border border-gray-700 shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="flex-none p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <UtensilsIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">إدارة قائمة {viewingMenuMerchant.name}</h3>
                                    <p className="text-xs text-gray-400">عدد المنتجات: {viewingMenuMerchant.products?.length || 0}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingMenuMerchant(null)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Menu Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#111]">
                            <MenuManager
                                merchant={viewingMenuMerchant}
                                onUpdateMerchant={(id, data) => updateUser(id, data)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStoresScreen;
