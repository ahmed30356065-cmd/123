
import { User, Order, AuditLog, OrderStatus, ManualDaily } from '../types';
import * as firebaseService from '../services/firebase';
import { logoutAndroid } from '../utils/NativeBridge';

interface UseAppActionsProps {
    users: User[];
    orders: Order[];
    messages: any[];
    payments?: any[]; // Added payments prop
    manualDailies?: ManualDaily[];
    currentUser: User | null;
    showNotify: (msg: string, type: 'success' | 'error' | 'info', silent?: boolean) => void;
}

export const useAppActions = ({ users, orders, messages, payments = [], manualDailies = [], currentUser, showNotify }: UseAppActionsProps) => {

    const generateNextUserId = (allUsers: User[]) => {
        let newId = '';
        let isUnique = false;
        while (!isUnique) {
            // Generate 8 random digits
            const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
            newId = 'ID:' + random8;
            // Check uniqueness
            if (!allUsers.some(u => u.id === newId)) {
                isUnique = true;
            }
        }
        return newId;
    };

    const logAction = (
        actionType: 'create' | 'update' | 'delete' | 'financial',
        target: string,
        details: string,
        collection?: string,
        targetId?: string,
        previousData?: any
    ) => {
        if (!currentUser) return;
        const newLog: AuditLog = {
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actionType,
            target,
            targetId,
            collection,
            details,
            previousData,
            createdAt: new Date()
        };
        firebaseService.logActionToRTDB(newLog);
    };

    const handleUndo = async (log: AuditLog) => {
        try {
            await firebaseService.undoActionFromLog(log);
            // Instead of new log entry, update the current one
            await firebaseService.updateAuditLogRTDB(log.id, { isUndone: true });
            showNotify('تم التراجع عن العملية بنجاح', 'success');
            return true;
        } catch (e: any) {
            showNotify(`فشل التراجع: ${e.message}`, 'error');
            return false;
        }
    };

    const handleDriverPayment = async (driverId: string) => {
        const driver = users.find(u => u.id === driverId);
        if (!driver) return;

        const eligibleOrders = orders.filter(o =>
            String(o.driverId) === String(driverId) &&
            o.status === OrderStatus.Delivered &&
            !o.reconciled
        );

        const eligibleDailies = manualDailies.filter(d =>
            String(d.driverId) === String(driverId) &&
            !d.reconciled // Hypothetical field, but manual dailies don't have 'reconciled' yet in type?
            // Actually I defined ManualDaily type WITHOUT 'reconciled' field in types.ts step 1.
            // I should have added 'reconciled' or check against Payment.reconciledManualDailyIds?
            // Checking against all payments is slow. 
            // Better to add 'reconciled' boolean to ManualDaily schema.
        );

        // Wait, I missed adding 'reconciled' to ManualDaily in types.ts!
        // I need to add it now implicitly or explicitly.
        // Let's assume I will add it to the type definition. I'll do a quick fix to types.ts first in next tool if needed.
        // Or I can use this tool to Update types.ts as well? No, one file per tool.
        // I will trust that I will add 'reconciled' to ManualDaily type in type.ts subsequently or assuming it exists.
        // Actually I can check if it exists in data.

        // Let's modify the code to assume it has it.
        // And I'll add the field to types.ts in a separate call.


        const toCurrency = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
        const safeParseFloat = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val) || 0;
            return 0;
        };

        const totalFees = eligibleOrders.reduce((sum, o) => sum + safeParseFloat(o.deliveryFee), 0);
        let companyShare = 0;
        const commissionRate = safeParseFloat(driver.commissionRate);

        // Calculate Manual Dailies Amount
        const manualDailiesAmount = eligibleDailies.reduce((sum, d) => sum + (d.amount || 0), 0);

        if (driver.commissionType === 'fixed') {
            companyShare = eligibleOrders.length * commissionRate;
        } else {
            companyShare = totalFees * (commissionRate / 100);
        }

        // Add Manual Dailies
        companyShare += manualDailiesAmount;

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
            reconciledOrderIds: eligibleOrders.map(o => o.id),
            reconciledManualDailyIds: eligibleDailies.map(d => d.id)
        };

        try {
            const orderUpdates = eligibleOrders.map(o => ({ ...o, reconciled: true }));
            const dailyUpdates = eligibleDailies.map(d => ({ ...d, reconciled: true }));

            if (orderUpdates.length > 0) await firebaseService.batchSaveData('orders', orderUpdates);
            if (dailyUpdates.length > 0) await firebaseService.batchSaveRTDB('manual_dailies', dailyUpdates);

            await firebaseService.updateRTDB('payments', paymentId, paymentRecord);

            logAction('financial', 'تسوية مالية', `تمت تسوية حساب المندوب ${driver.name}. المبلغ: ${finalCompanyShare} ج.م (طلبات: ${eligibleOrders.length}, يوميات: ${eligibleDailies.length}).`);
            showNotify(`تم تسوية ${eligibleOrders.length} طلب و ${eligibleDailies.length} يومية بنجاح وتصفير مديونية المندوب`, 'success');

            firebaseService.sendExternalNotification('driver', {
                title: "تمت تسوية الحساب",
                body: `قام المسؤول بتسوية حسابك. تم تصفير المستحقات لـ ${eligibleOrders.length} طلب و ${eligibleDailies.length} يومية.`,
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

    const handleClearAuditLogs = async () => {
        try {
            await firebaseService.deleteAuditLogsRTDB();
            logAction('delete', 'النظام', 'تم تنظيف سجل المراقبة بالكامل من RTDB بواسطة المدير');
            showNotify('تم مسح سجل المراقبة بنجاح', 'success');
        } catch (error) {
            console.error("Failed to clear logs:", error);
            showNotify('فشل في مسح السجل', 'error');
        }
    };

    const deletePayment = async (paymentId: string) => {
        // 1. Find the payment to get linked orders
        // Use the passed payments prop if available, otherwise we might fail to unreconcile if not provided.
        // Assuming payments are passed from App.tsx
        const payment = payments?.find(p => p.id === paymentId);

        if (payment && payment.reconciledOrderIds && payment.reconciledOrderIds.length > 0) {
            // 2. Un-reconcile orders
            const orderUpdates = payment.reconciledOrderIds.map((oid: string) => ({
                id: oid,
                reconciled: false
            }));

            try {
                await firebaseService.batchSaveData('orders', orderUpdates);
                console.log(`Un-reconciled ${orderUpdates.length} orders for payment ${paymentId}`);
            } catch (e) {
                console.error("Failed to un-reconcile orders:", e);
                showNotify('فشل استعادة حالة الطلبات، لكن سيتم حذف السجل', 'error');
            }
        }

        // 3. Un-reconcile manual dailies
        if (payment && payment.reconciledManualDailyIds && payment.reconciledManualDailyIds.length > 0) {
            const dailyUpdates = payment.reconciledManualDailyIds.map((did: string) => ({
                id: did,
                reconciled: false
            }));

            try {
                await firebaseService.batchSaveRTDB('manual_dailies', dailyUpdates);
                console.log(`Un-reconciled ${dailyUpdates.length} dailies for payment ${paymentId}`);
            } catch (e) {
                console.error("Failed to un-reconcile dailies:", e);
            }
        }

        // 4. Delete the payment record from RTDB
        firebaseService.deleteRTDB('payments', paymentId);
        logAction('financial', 'المدفوعات', `تم حذف عملية الدفع رقم ${paymentId}`);
        showNotify('تم حذف عملية الدفع واستعادة مديونية الطلبات واليوميات', 'success');
    };

    return {
        logAction,
        handleUndo,
        handleDriverPayment,
        handleSignUp,
        handleHideMessage,
        handleClearAuditLogs,
        generateNextUserId,
        deletePayment
    };
};
