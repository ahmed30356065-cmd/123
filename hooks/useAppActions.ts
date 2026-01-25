
import { User, Order, AuditLog, OrderStatus } from '../types';
import * as firebaseService from '../services/firebase';
import { logoutAndroid } from '../utils/NativeBridge';

interface UseAppActionsProps {
    users: User[];
    orders: Order[];
    messages: any[];
    currentUser: User | null;
    showNotify: (msg: string, type: 'success' | 'error' | 'info', silent?: boolean) => void;
}

export const useAppActions = ({ users, orders, messages, currentUser, showNotify }: UseAppActionsProps) => {

    const generateNextUserId = (allUsers: User[]) => {
        const maxId = allUsers.reduce((max, u) => {
            const num = parseInt(u.id);
            return !isNaN(num) ? Math.max(max, num) : max;
        }, 0);
        return String(maxId + 1);
    };

    const logAction = (actionType: 'create' | 'update' | 'delete' | 'financial', target: string, details: string) => {
        if (!currentUser) return;
        const newLog: AuditLog = {
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actionType,
            target,
            details,
            createdAt: new Date()
        };
        firebaseService.updateData('audit_logs', newLog.id, newLog);
    };

    const handleDriverPayment = async (driverId: string) => {
        const driver = users.find(u => u.id === driverId);
        if (!driver) return;

        const eligibleOrders = orders.filter(o =>
            String(o.driverId) === String(driverId) &&
            o.status === OrderStatus.Delivered &&
            !o.reconciled
        );

        if (eligibleOrders.length === 0) {
            showNotify('لا توجد طلبات لتسويتها', 'info');
            return;
        }

        const toCurrency = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
        const safeParseFloat = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val) || 0;
            return 0;
        };

        const totalFees = eligibleOrders.reduce((sum, o) => sum + safeParseFloat(o.deliveryFee), 0);
        let companyShare = 0;
        const commissionRate = safeParseFloat(driver.commissionRate);

        if (driver.commissionType === 'fixed') {
            companyShare = eligibleOrders.length * commissionRate;
        } else {
            companyShare = totalFees * (commissionRate / 100);
        }

        const finalCompanyShare = toCurrency(companyShare);
        const finalTotalFees = toCurrency(totalFees);

        // Date Logic: If settling in the early morning (e.g. < 6 AM) for orders from the previous day,
        // record the payment as if it happened at the end of the previous day.
        let paymentDate = new Date();
        const sortedOrders = [...eligibleOrders].sort((a, b) => {
            const dateA = a.deliveredAt ? new Date(a.deliveredAt).getTime() : 0;
            const dateB = b.deliveredAt ? new Date(b.deliveredAt).getTime() : 0;
            return dateB - dateA;
        });

        if (sortedOrders.length > 0 && sortedOrders[0].deliveredAt) {
            const lastOrderDate = new Date(sortedOrders[0].deliveredAt);
            const now = new Date();

            // Check if "Next Day" and "Early Morning" (e.g. before 6 AM)
            // Example: Orders on Jan 25, Now is Jan 26 01:00 AM -> Set to Jan 25 23:59:59
            const isNextDay = now.getDate() !== lastOrderDate.getDate() || now.getMonth() !== lastOrderDate.getMonth();
            const isEarlyMorning = now.getHours() < 6;

            if (isNextDay && isEarlyMorning) {
                // Set to end of the last order's day
                paymentDate = new Date(lastOrderDate.getFullYear(), lastOrderDate.getMonth(), lastOrderDate.getDate(), 23, 59, 59);
            }
        }

        const paymentId = `PAY-${Date.now()}`;
        const paymentRecord = {
            id: paymentId,
            driverId: driverId,
            amount: finalCompanyShare,
            totalCollected: finalTotalFees,
            ordersCount: eligibleOrders.length,
            createdAt: paymentDate,
            reconciledOrderIds: eligibleOrders.map(o => o.id)
        };

        try {
            const orderUpdates = eligibleOrders.map(o => ({ ...o, reconciled: true }));
            await firebaseService.batchSaveData('orders', orderUpdates);
            await firebaseService.updateData('payments', paymentId, paymentRecord);
            logAction('financial', 'تسوية مالية', `تمت تسوية حساب المندوب ${driver.name}. المبلغ: ${finalCompanyShare} ج.م لعدد ${eligibleOrders.length} طلب.`);
            showNotify(`تم تسوية ${eligibleOrders.length} طلب بنجاح`, 'success');

            firebaseService.sendExternalNotification('driver', {
                title: "تمت تسوية الحساب",
                body: `قام المسؤول بتسوية حسابك. تم تصفير المستحقات لـ ${eligibleOrders.length} طلب.`,
                targetId: driverId,
                url: `/?target=wallet`
            });

        } catch (error) {
            console.error("Payment Error", error);
            showNotify('حدث خطأ أثناء التسوية', 'error');
        }
    };

    const handleSignUp = async (userData: any) => {
        const existing = users.find(u => u.phone === userData.phone);
        if (existing) return { success: false, message: 'رقم الهاتف مسجل مسبقاً.' };

        const newId = generateNextUserId(users);

        const newUser: User = {
            ...userData,
            id: newId,
            status: 'pending',
            createdAt: new Date(),
            pointsBalance: 0
        };

        if (newUser.role === 'driver') {
            newUser.commissionRate = 25;
            newUser.commissionType = 'percentage';
            newUser.dailyLogMode = 'always_open';
        }

        try {
            await firebaseService.updateData('users', newId, newUser);
            const logId = `LOG-${Date.now()}`;
            firebaseService.updateData('audit_logs', logId, {
                id: logId,
                actorId: newId,
                actorName: newUser.name,
                actionType: 'create',
                target: 'تسجيل جديد',
                details: `تسجيل حساب جديد: ${newUser.name} (${newUser.role})`,
                createdAt: new Date()
            });

            const roleLabel = newUser.role === 'driver' ? 'مندوب' : newUser.role === 'merchant' ? 'تاجر' : 'عميل';

            const notifyPayload = {
                title: "🔔 مستخدم جديد",
                body: `تم تسجيل حساب جديد: ${newUser.name} (${roleLabel}). بانتظار التفعيل.`,
                url: `/?target=users`
            };

            await firebaseService.sendExternalNotification('admin', notifyPayload);

            return { success: true, message: 'تم إنشاء الحساب بنجاح' };
        } catch (e: any) {
            return { success: false, message: 'حدث خطأ أثناء إنشاء الحساب' };
        }
    };

    const handleHideMessage = async (id: string, deletedMessageIds: string[], setDeletedMessageIds: (ids: string[]) => void) => {
        const newIds = [...deletedMessageIds, id];
        setDeletedMessageIds(newIds);
        localStorage.setItem('deleted_msgs', JSON.stringify(newIds));

        if (currentUser) {
            const msg = messages.find(m => m.id === id);
            if (msg) {
                const currentDeletedBy = msg.deletedBy || [];
                if (!currentDeletedBy.includes(currentUser.id)) {
                    const updatedDeletedBy = [...currentDeletedBy, currentUser.id];
                    await firebaseService.updateData('messages', id, { deletedBy: updatedDeletedBy });
                }
            }
        }
        showNotify('تم حذف الرسالة', 'success', true);
    };

    const handleClearAuditLogs = async (auditLogs: AuditLog[]) => {
        try {
            const deletePromises = auditLogs.map(log => firebaseService.deleteData('audit_logs', log.id));
            await Promise.all(deletePromises);
            logAction('delete', 'النظام', 'تم تنظيف سجل المراقبة بالكامل بواسطة المدير');
            showNotify('تم مسح سجل المراقبة بنجاح', 'success');
        } catch (error) {
            console.error("Failed to clear logs:", error);
            showNotify('فشل في مسح السجل', 'error');
        }
    };

    const deletePayment = (paymentId: string) => {
        firebaseService.deleteData('payments', paymentId);
        logAction('financial', 'المدفوعات', `تم حذف عملية الدفع رقم ${paymentId}`);
    };

    return {
        logAction,
        handleDriverPayment,
        handleSignUp,
        handleHideMessage,
        handleClearAuditLogs,
        generateNextUserId,
        deletePayment
    };
};
