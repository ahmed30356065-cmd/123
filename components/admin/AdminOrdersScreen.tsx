
import React, { useState, useMemo } from 'react';
import { Order, User, Customer, OrderStatus, SupervisorPermission, CartItem } from '../../types';
import OrderCard from './OrderCard';
import EditOrderModal from './EditOrderModal';
import ConfirmationModal from './ConfirmationModal';
import { TruckIconV2, ClockIcon, CheckCircleIcon, XIcon, RouteIcon, PlusIcon, TrashIcon, SearchIcon, ShoppingCartIcon, ExclamationTriangleIcon, ChevronDownIcon, UserIcon, PhoneIcon, RocketIcon, RefreshCwIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface AdminOrdersScreenProps {
    orders: Order[];
    users: User[];
    deleteOrder: (orderId: string) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    editOrder: (orderId: string, updatedData: {
        customer: Customer,
        notes?: string,
        merchantId: string,
        merchantName: string, // Added to interface
        driverId?: string | null,
        deliveryFee?: number | null,
        items?: CartItem[],
        totalPrice?: number,
        status?: OrderStatus // Added status
    }) => void;
    assignDriverAndSetStatus: (orderId: string, driverId: string, deliveryFee: number, status: OrderStatus.InTransit | OrderStatus.Delivered) => void;
    adminAddOrder: (newOrder: { customer: Customer; notes?: string; merchantId: string; } | { customer: Customer; notes?: string; merchantId: string; }[]) => void;
    permissions?: SupervisorPermission[];
    onOpenStatusModal?: (order: Order) => void;
    onOpenPaymentModal?: (order: Order) => void;
    onNavigateToAdd?: () => void;
    onBulkAssign?: (driverId: string, deliveryFee: number) => void;
    onBulkStatusUpdate?: (status: OrderStatus) => void;
    onBulkDelete?: (status: OrderStatus | 'all') => void;
    appName?: string;
    currentUser?: User;
    viewMode?: 'default' | 'shopping' | 'special'; // Added viewMode
}

const FilterCard: React.FC<{
    label: string;
    count?: number;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    colorClasses: string;
    disabled?: boolean;
}> = ({ label, count, icon, isActive, onClick, colorClasses, disabled }) => (
    <button
        onClick={disabled ? undefined : onClick}
        className={`p-3 rounded-xl flex flex-col items-center justify-center text-center w-full transition-all duration-200 border-2 min-h-[90px] focus:outline-none ${disabled
            ? 'opacity-40 cursor-not-allowed bg-gray-800 border-transparent grayscale'
            : isActive
                ? 'border-red-500 bg-gray-700/50 shadow-lg scale-105 z-10'
                : 'border-transparent bg-gray-800 hover:bg-gray-700/70'
            }`}
    >
        <div className={`p-2 rounded-full mb-1 ${colorClasses.split(' ')[0]}`}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 ${colorClasses.split(' ')[1]}` })}
        </div>
        <p className="text-gray-400 text-[10px] font-bold mb-1 line-clamp-1">{label}</p>
        {count !== undefined && <p className="text-white text-lg font-black leading-none">{count}</p>}
    </button>
);

const AdminOrdersScreen: React.FC<AdminOrdersScreenProps> = React.memo(({ orders, users, deleteOrder, editOrder, onNavigateToAdd, permissions, onOpenStatusModal, onOpenPaymentModal, onBulkAssign, onBulkStatusUpdate, onBulkDelete, appName, currentUser, viewMode = 'default' }) => {
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    // Pagination State (Moved up for useAndroidBack)
    const [currentPage, setCurrentPage] = useState(1);

    // States for filtering
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    // Updated Filter Type: 'all' | 'merchant' (GOO NOW) | 'special' (Special Requests)
    const [filterType, setFilterType] = useState<'all' | 'merchant' | 'special'>('all');

    // --- Permission Checks ---
    const canManage = !permissions || permissions.includes('manage_orders');
    const canDelete = !permissions || permissions.includes('delete_orders');
    const isSupervisor = currentUser?.role === 'supervisor';

    // Sync filterType with viewMode
    React.useEffect(() => {
        if (viewMode === 'shopping') setFilterType('merchant');
        else if (viewMode === 'special') setFilterType('special');
        else setFilterType('all');
    }, [viewMode]);

    const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
    const [isDeleteToolsOpen, setIsDeleteToolsOpen] = useState(false);

    // Bulk Status Change States
    const [isBulkStatusToolsOpen, setIsBulkStatusToolsOpen] = useState(false);
    const [bulkStatusTarget, setBulkStatusTarget] = useState<OrderStatus | null>(null);

    // Custom Driver Selection State
    const [isDriverSelectorOpen, setIsDriverSelectorOpen] = useState(false);
    const [driverSearchTerm, setDriverSearchTerm] = useState('');

    // Specific Delete Confirmation State
    const [deleteTargetStatus, setDeleteTargetStatus] = useState<OrderStatus | 'all' | null>(null);

    // Local Toast State
    const [localToast, setLocalToast] = useState<string | null>(null);

    const [bulkDriverId, setBulkDriverId] = useState('');
    const [bulkFee, setBulkFee] = useState('');

    useAndroidBack(() => {
        // High Priority Modals
        if (isDriverSelectorOpen) { setIsDriverSelectorOpen(false); return true; }
        if (deleteTargetStatus) { setDeleteTargetStatus(null); return true; }
        if (bulkStatusTarget) { setBulkStatusTarget(null); return true; }
        if (isBulkAssignOpen) { setIsBulkAssignOpen(false); return true; }
        if (isDeleteToolsOpen) { setIsDeleteToolsOpen(false); return true; }
        if (isBulkStatusToolsOpen) { setIsBulkStatusToolsOpen(false); return true; }
        if (editingOrder) { setEditingOrder(null); return true; }
        if (deletingOrder) { setDeletingOrder(null); return true; }

        // Navigation Logic: If inside a specific Filter Type (Special/Merchant) AND viewMode is default, go back to "All"
        // If viewMode is NOT default (Active Tab is Shopping/Special), we don't want back button to switch tabs, maybe just exit app logic or do nothing
        if (viewMode === 'default' && filterType !== 'all') {
            setFilterType('all');
            setStatusFilter('all'); // Optional: Reset status filter too
            return true;
        }

        // Fix: Reset Status Filter on Back
        if (statusFilter !== 'all') {
            setStatusFilter('all');
            return true;
        }

        if (currentPage > 1) { setCurrentPage(currentPage - 1); return true; }
        return false;
    }, [editingOrder, deletingOrder, isBulkAssignOpen, isDeleteToolsOpen, deleteTargetStatus, isDriverSelectorOpen, isBulkStatusToolsOpen, bulkStatusTarget, currentPage, filterType, viewMode, statusFilter]);

    // ... (URL Logic Omitted for brevity, kept same) ...

    // Updated Logic: Calculate Counts based on CURRENT Filter Context
    // This makes the tabs (Pending, InTransit...) show numbers relevant to the active view (Special vs All)
    const statusCounts = useMemo(() => {
        // Base set of orders to count from (depends on active view)
        const relevantOrders = orders.filter(o => {
            if (filterType === 'merchant') return o.type === 'shopping_order' && o.merchantId !== 'delinow';
            if (filterType === 'special') return o.merchantId === 'delinow';
            return true; // 'all' context
        });

        return {
            all: relevantOrders.length,
            [OrderStatus.Pending]: relevantOrders.filter(o => o.status === OrderStatus.Pending).length,
            [OrderStatus.Ready]: relevantOrders.filter(o => o.status === OrderStatus.Ready).length, // Added Ready Count
            [OrderStatus.InTransit]: relevantOrders.filter(o => o.status === OrderStatus.InTransit).length,
            [OrderStatus.Delivered]: relevantOrders.filter(o => o.status === OrderStatus.Delivered).length,
            [OrderStatus.Cancelled]: relevantOrders.filter(o => o.status === OrderStatus.Cancelled).length,

            // Global counts for the main switches (independent of context)
            totalMerchantOrders: orders.filter(o => o.type === 'shopping_order' && o.merchantId !== 'delinow').length,
            totalSpecialRequests: orders.filter(o => o.merchantId === 'delinow').length,

            pendingUnassigned: relevantOrders.filter(o => o.status === OrderStatus.Pending && !o.driverId).length
        };
    }, [orders, filterType]);

    const filterOptions = useMemo(() => {
        const options = [
            { value: 'all', label: 'الكل', icon: <TruckIconV2 />, colorClasses: 'bg-blue-500/20 text-blue-400' },
            { value: OrderStatus.Pending, label: 'قيد الانتظار', icon: <ClockIcon />, colorClasses: 'bg-yellow-500/20 text-yellow-400' },
            // Ready (تم التجهيز) is only for Shopping
            ...(viewMode === 'shopping' ? [{ value: OrderStatus.Ready, label: 'تم التجهيز', icon: <CheckCircleIcon />, colorClasses: 'bg-teal-500/20 text-teal-400' }] : []),
            { value: OrderStatus.InTransit, label: 'قيد التوصيل', icon: <RouteIcon />, colorClasses: 'bg-sky-500/20 text-sky-400' },
            { value: OrderStatus.Delivered, label: 'تم التوصيل', icon: <CheckCircleIcon />, colorClasses: 'bg-green-500/20 text-green-400' },
            { value: OrderStatus.Cancelled, label: 'ملغي', icon: <XIcon />, colorClasses: 'bg-red-500/20 text-red-400' },
        ];
        return options;
    }, [viewMode]);

    const handleBulkAssignConfirm = () => {
        if (!bulkDriverId || !bulkFee) return;

        // Restriction Check:
        const fee = parseFloat(bulkFee);
        if (currentUser?.role !== 'admin' && fee <= 0) {
            setLocalToast('عفواً، فقط الإدارة يمكنها تعيين طلبات مجانية (سعر 0)');
            setTimeout(() => setLocalToast(null), 3000);
            return;
        }

        onBulkAssign?.(bulkDriverId, fee);
        setIsBulkAssignOpen(false);
        setBulkDriverId('');
        setBulkFee('');
    };

    const getDeleteModalInfo = (status: OrderStatus | 'all') => {
        switch (status) {
            case OrderStatus.Pending: return { title: 'حذف الطلبات قيد الانتظار', message: 'سيتم حذف جميع الطلبات التي ما زالت قيد الانتظار (لم يتم تعيين مندوب). هل أنت متأكد؟' };
            case OrderStatus.Ready: return { title: 'حذف الطلبات الجاهزة', message: 'سيتم حذف جميع الطلبات التي تم تجهيزها. هل أنت متأكد؟' }; // Added Ready Case
            case OrderStatus.InTransit: return { title: 'حذف الطلبات قيد التوصيل', message: 'تنبيه: سيتم حذف الطلبات الجاري توصيلها حالياً! هل أنت متأكد من المتابعة؟' };
            case OrderStatus.Delivered: return { title: 'حذف الطلبات المستلمة', message: 'سيتم تنظيف السجل وحذف جميع الطلبات المكتملة. هل أنت متأكد؟' };
            case OrderStatus.Cancelled: return { title: 'حذف الطلبات الملغية', message: 'سيتم إزالة جميع الطلبات الملغية نهائياً من النظام.' };
            case 'all': return { title: 'مسح شامل لقاعدة البيانات', message: 'تحذير شديد: سيتم مسح كافة الطلبات من النظام نهائياً! لا يمكن التراجع عن هذا الإجراء.', variant: 'danger' };
            default: return { title: 'حذف', message: '' };
        }
    };

    const getStatusModalInfo = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Pending:
                return { title: 'إعادة تعيين الكل إلى "قيد الانتظار"', message: 'سيتم تحويل جميع الطلبات الحالية (التي ليست ملغية) إلى حالة "قيد الانتظار" وإلغاء تعيين المناديب. هل أنت متأكد؟', variant: 'primary' };
            case OrderStatus.Ready:
                return { title: 'تغيير الكل إلى "تم التجهيز"', message: 'سيتم تحويل جميع الطلبات إلى حالة "تم التجهيز". هل أنت متأكد؟', variant: 'primary' }; // Added Ready Case
            case OrderStatus.Delivered:
                return { title: 'إكمال جميع الطلبات', message: 'سيتم تحويل جميع الطلبات الجارية (قيد التوصيل) إلى حالة "تم التوصيل" وتحديث السجلات المالية. هل أنت متأكد؟', variant: 'success' };
            default:
                return { title: 'تغيير الحالة', message: '', variant: 'primary' };
        }
    };

    const deleteInfo = deleteTargetStatus ? getDeleteModalInfo(deleteTargetStatus) : null;
    const statusInfo = bulkStatusTarget ? getStatusModalInfo(bulkStatusTarget) : null;

    // Pagination State

    const itemsPerPage = 50;

    // Reset pagination when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, filterType, searchTerm]);

    // Scroll to top on page change
    React.useEffect(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    // Restored Filtering Logic
    const filteredOrders = useMemo(() => {
        let result = [...orders];

        // 1. Filter by Type
        if (filterType === 'merchant') {
            result = result.filter(o => o.type === 'shopping_order' && o.merchantId !== 'delinow');
        } else if (filterType === 'special') {
            result = result.filter(o => o.merchantId === 'delinow');
        }

        // 2. Filter by Status
        if (statusFilter !== 'all') {
            result = result.filter(o => o.status === statusFilter);
        }

        // 3. Filter by Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();

            // Precise Search Logic with # prefix
            if (lowerTerm.startsWith('#')) {
                const preciseNumber = lowerTerm.substring(1).trim();
                result = result.filter(o =>
                    (o.customOrderNumber && o.customOrderNumber.toString().toLowerCase() === preciseNumber) ||
                    (o.id && o.id.toString().toLowerCase().includes(preciseNumber)) // Still allow ID partial match even with #
                );
            } else {
                // Default broad search
                result = result.filter(o =>
                    (o.id && o.id.toString().includes(lowerTerm)) ||
                    (o.customOrderNumber && o.customOrderNumber.toString().toLowerCase().includes(lowerTerm)) ||
                    (o.customer?.phone && o.customer.phone.includes(lowerTerm)) ||
                    (o.customer?.address && o.customer.address.toLowerCase().includes(lowerTerm)) ||
                    (o.notes && o.notes.toLowerCase().includes(lowerTerm))
                );
            }
        }

        // 4. Sort (Priority: Created At Descending, then ID Descending)
        result.sort((a, b) => {
            // Primary: Date (Descending) - Newest created first
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeA !== timeB) {
                return timeB - timeA;
            }

            // Secondary: ID Number (Descending: 3, 2, 1...)
            const idA = parseInt(a.id.replace(/\D/g, '') || '0');
            const idB = parseInt(b.id.replace(/\D/g, '') || '0');
            return idB - idA;
        });

        return result;
    }, [orders, filterType, statusFilter, searchTerm]);

    // Restoring other missing derived state
    const merchants = useMemo(() => users.filter(u => u.role === 'merchant'), [users]);
    const drivers = useMemo(() => users.filter(u => u.role === 'driver'), [users]);

    const filteredDrivers = useMemo(() => {
        if (!driverSearchTerm) return drivers;
        const lower = driverSearchTerm.toLowerCase();
        return drivers.filter(d =>
            d.name.toLowerCase().includes(lower) ||
            (d.phone && d.phone.includes(lower))
        );
    }, [drivers, driverSearchTerm]);

    const selectedBulkDriver = useMemo(() => {
        return drivers.find(d => d.id === bulkDriverId);
    }, [drivers, bulkDriverId]);

    const currentOrders = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredOrders, currentPage, itemsPerPage]);

    return (
        <div className="space-y-6 pb-32">
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {/* Standard Status Filters */}
                {filterOptions.map(opt => (
                    <FilterCard
                        key={opt.value}
                        label={opt.label}
                        count={statusCounts[opt.value as any]}
                        icon={opt.icon}
                        isActive={statusFilter === opt.value}
                        onClick={() => {
                            // If we are in default mode, we can switch freely.
                            // If we are in viewMode='shopping', filtering by status keeps us in 'merchant' type.
                            setStatusFilter(opt.value as any);
                        }}
                        colorClasses={opt.colorClasses}
                    />
                ))}

                {/* Custom Filters (Shopping/Special) Removed from here as per request */}

                {canManage && (
                    <>
                        <FilterCard
                            label={`تعيين الكل (${statusCounts.pendingUnassigned})`}
                            icon={<PlusIcon />}
                            isActive={isBulkAssignOpen}
                            onClick={() => {
                                if (statusCounts.pendingUnassigned === 0) {
                                    setLocalToast('لا يوجد طلبات قيد الانتظار للتعيين حالياً');
                                    setTimeout(() => setLocalToast(null), 3000);
                                } else {
                                    setIsBulkAssignOpen(true);
                                }
                            }}
                            colorClasses="bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        />

                        <FilterCard
                            label="تغيير حالة الكل"
                            icon={<RefreshCwIcon />}
                            isActive={isBulkStatusToolsOpen}
                            onClick={() => setIsBulkStatusToolsOpen(true)}
                            colorClasses="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        />
                    </>
                )}

                {canDelete && (
                    <FilterCard label="أدوات الحذف" icon={<TrashIcon />} isActive={isDeleteToolsOpen} onClick={() => setIsDeleteToolsOpen(true)} colorClasses="bg-red-500/20 text-red-400 border-red-500/30" />
                )}
            </div>

            {/* Toast Notification */}
            {localToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-xl border border-gray-700 z-50 animate-fadeIn">
                    {localToast}
                </div>
            )}

            <div className="bg-gray-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center border border-gray-700">
                <div className="relative flex-1 w-full">
                    <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input type="text" placeholder="بحث برقم الطلب، هاتف العميل، العنوان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-1 focus:ring-red-500 outline-none" />
                </div>
                {/* Add Order Button */}
                {canManage && (
                    <button
                        onClick={onNavigateToAdd}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-red-900/30 transition-all active:scale-95 group"
                    >
                        <div className="bg-white/20 p-1 rounded-full group-hover:rotate-90 transition-transform duration-300">
                            <PlusIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">طلب جديد</span>
                    </button>
                )}
            </div>

            {/* Dynamic Title based on filter */}
            {filterType !== 'all' && (
                <div className="flex items-center gap-2 px-2">
                    <span className={`w-2 h-6 rounded-full ${filterType === 'merchant' ? 'bg-orange-500' : 'bg-purple-500'}`}></span>
                    <h3 className="text-xl font-bold text-white">
                        {filterType === 'merchant' ? 'قائمة طلبات المتاجر' : 'قائمة الطلبات الخاصة'}
                    </h3>
                </div>
            )}

            {/* Pagination Logic */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentOrders.length > 0 ? (
                    currentOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onEdit={canManage ? setEditingOrder : undefined}
                            onDelete={canDelete ? (o) => setDeletingOrder(o) : undefined}
                            onOpenStatusModal={canManage ? onOpenStatusModal : undefined}
                            onOpenPaymentModal={canManage ? onOpenPaymentModal : undefined}
                            users={users}
                        />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-gray-800/30 rounded-3xl border border-dashed border-gray-700">
                        <TruckIconV2 className="w-16 h-16 text-gray-700 mb-4 opacity-20" />
                        <p className="text-gray-500 font-bold">لا توجد طلبات للعرض</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {filteredOrders.length > itemsPerPage && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-gray-700">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                    >
                        السابق
                    </button>
                    <span className="text-gray-400 font-mono">
                        صفحة {currentPage} من {Math.ceil(filteredOrders.length / itemsPerPage)}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredOrders.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                    >
                        التالي
                    </button>
                </div>
            )}

            {editingOrder && <EditOrderModal order={editingOrder} merchants={merchants} drivers={drivers} onClose={() => setEditingOrder(null)} onSave={(data) => {
                const currentOrder = editingOrder;
                let newStatus = currentOrder.status;

                // Smart Status Logic
                if (data.driverId && data.deliveryFee !== null && data.deliveryFee !== undefined) {
                    if (currentOrder.status === OrderStatus.Pending) {
                        newStatus = OrderStatus.InTransit;
                    }
                } else if (!data.driverId) {
                    if (currentOrder.status === OrderStatus.InTransit) {
                        newStatus = OrderStatus.Pending;
                    }
                }

                const finalData = { ...data };
                if (newStatus !== currentOrder.status) {
                    (finalData as any).status = newStatus;
                }

                editOrder(editingOrder.id, finalData);
                setEditingOrder(null);
                editOrder(editingOrder.id, finalData);
                setEditingOrder(null);
            }}
                currentUserRole={currentUser?.role}
                currentUserPermissions={permissions} // Pass permissions
                currentUser={currentUser} // Pass full user object for deeper checks
            />}

            {deletingOrder && (
                <ConfirmationModal
                    title="حذف الطلب"
                    message={`هل أنت متأكد من حذف الطلب رقم ${deletingOrder.id} نهائياً؟`}
                    onClose={() => setDeletingOrder(null)}
                    onConfirm={() => { deleteOrder(deletingOrder.id); setDeletingOrder(null); }}
                    confirmButtonText="تأكيد الحذف"
                    confirmVariant='danger'
                />
            )}

            {isBulkAssignOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsBulkAssignOpen(false)}>
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl p-6 animate-pop-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <TruckIconV2 className="w-6 h-6 text-indigo-400" />
                                تعيين كافة الطلبات
                            </h3>
                            <button onClick={() => setIsBulkAssignOpen(false)} className="text-gray-500 hover:text-white"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">سيتم تعيين <span className="text-yellow-500 font-bold">{statusCounts.pendingUnassigned}</span> طلبات (قيد الانتظار) للمندوب المختار.</p>

                            {/* Driver Selection Button */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">اختر المندوب</label>
                                <button
                                    onClick={() => setIsDriverSelectorOpen(true)}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-4 flex justify-between items-center text-white hover:border-gray-500 transition-colors"
                                >
                                    {selectedBulkDriver ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                                {selectedBulkDriver.storeImage ? <img src={selectedBulkDriver.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-gray-400" />}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">{selectedBulkDriver.name}</p>
                                                <p className="text-xs text-gray-500 font-mono">{selectedBulkDriver.phone}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">اضغط للاختيار...</span>
                                    )}
                                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Delivery Fee */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">سعر التوصيل الموحد</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={bulkFee}
                                        onChange={(e) => setBulkFee(e.target.value)}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:border-indigo-500"
                                    />
                                    <span className="absolute left-3 top-3.5 text-gray-500 text-xs font-bold">ج.م</span>
                                </div>
                            </div>

                            <button
                                onClick={handleBulkAssignConfirm}
                                disabled={!bulkDriverId || !bulkFee}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 mt-2"
                            >
                                تأكيد التعيين
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Driver Selector Modal */}
            {isDriverSelectorOpen && (
                <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsDriverSelectorOpen(false)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[60vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700">
                            <div className="relative">
                                <SearchIcon className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="بحث عن مندوب..."
                                    value={driverSearchTerm}
                                    onChange={(e) => setDriverSearchTerm(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-2.5 pr-9 pl-3 text-white text-sm outline-none focus:border-blue-500"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {filteredDrivers.length > 0 ? (
                                filteredDrivers.map(driver => (
                                    <button
                                        key={driver.id}
                                        onClick={() => { setBulkDriverId(driver.id); setIsDriverSelectorOpen(false); }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${bulkDriverId === driver.id ? 'bg-blue-900/20 border border-blue-500/30' : 'hover:bg-gray-800 border border-transparent'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {driver.storeImage ? <img src={driver.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-gray-400" />}
                                        </div>
                                        <div className="text-right flex-1">
                                            <p className={`font-bold text-sm ${bulkDriverId === driver.id ? 'text-blue-400' : 'text-white'}`}>{driver.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{driver.phone}</p>
                                        </div>
                                        {bulkDriverId === driver.id && <CheckCircleIcon className="w-5 h-5 text-blue-500" />}
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4 text-xs">لا يوجد مناديب</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isBulkStatusToolsOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsBulkStatusToolsOpen(false)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-gray-700 shadow-2xl p-6 animate-pop-in text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                            <RefreshCwIcon className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">تغيير حالة الكل</h3>
                        <p className="text-gray-400 text-sm mb-6">قم بتغيير حالة جميع الطلبات النشطة بضغطة واحدة.</p>

                        <div className="space-y-3">
                            <button onClick={() => { setIsBulkStatusToolsOpen(false); setBulkStatusTarget(OrderStatus.Pending); }} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl py-3 text-sm font-bold text-yellow-400 transition-colors flex items-center justify-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                إعادة تعيين للانتظار
                            </button>
                            <button onClick={() => { setIsBulkStatusToolsOpen(false); setBulkStatusTarget(OrderStatus.Delivered); }} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl py-3 text-sm font-bold text-green-400 transition-colors flex items-center justify-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                تحديد الكل "تم التوصيل"
                            </button>
                        </div>
                        <button onClick={() => setIsBulkStatusToolsOpen(false)} className="mt-4 text-gray-500 text-xs hover:text-white transition-colors">إلغاء</button>
                    </div>
                </div>
            )}

            {isDeleteToolsOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsDeleteToolsOpen(false)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-gray-700 shadow-2xl p-6 animate-pop-in text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                            <TrashIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">أدوات الحذف الجماعي</h3>
                        <p className="text-gray-400 text-sm mb-6">يرجى الحذر، هذه العمليات لا يمكن التراجع عنها.</p>

                        <div className="space-y-3">
                            <button onClick={() => { setIsDeleteToolsOpen(false); setDeleteTargetStatus(OrderStatus.Pending); }} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl py-3 text-sm font-bold text-yellow-400 transition-colors">
                                حذف جميع الطلبات المعلقة ({statusCounts[OrderStatus.Pending]})
                            </button>
                            <button onClick={() => { setIsDeleteToolsOpen(false); setDeleteTargetStatus(OrderStatus.Cancelled); }} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl py-3 text-sm font-bold text-red-400 transition-colors">
                                حذف جميع الطلبات الملغية ({statusCounts[OrderStatus.Cancelled]})
                            </button>
                            <button onClick={() => { setIsDeleteToolsOpen(false); setDeleteTargetStatus(OrderStatus.Delivered); }} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl py-3 text-sm font-bold text-green-400 transition-colors">
                                حذف أرشيف الطلبات المكتملة ({statusCounts[OrderStatus.Delivered]})
                            </button>
                            <div className="h-px bg-gray-700 my-2"></div>
                            <button onClick={() => { setIsDeleteToolsOpen(false); setDeleteTargetStatus('all'); }} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors">
                                مسح شامل لكافة الطلبات
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {bulkStatusTarget && statusInfo && (
                <ConfirmationModal
                    title={statusInfo.title}
                    message={statusInfo.message}
                    onClose={() => setBulkStatusTarget(null)}
                    onConfirm={() => { onBulkStatusUpdate?.(bulkStatusTarget); setBulkStatusTarget(null); }}
                    confirmButtonText="تأكيد التغيير"
                    confirmVariant={statusInfo.variant as any}
                />
            )}

            {deleteTargetStatus && deleteInfo && (
                <ConfirmationModal
                    title={deleteInfo.title}
                    message={deleteInfo.message}
                    onClose={() => setDeleteTargetStatus(null)}
                    onConfirm={() => { onBulkDelete?.(deleteTargetStatus); setDeleteTargetStatus(null); }}
                    confirmButtonText="نعم، حذف نهائي"
                    confirmVariant={deleteInfo.variant as any || 'danger'}
                />
            )}
        </div>
    );
});

export default AdminOrdersScreen;
