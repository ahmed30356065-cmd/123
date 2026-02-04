
import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus } from './types';
import AdminPanel from './components/admin/AdminPanel';
import MerchantPortal from './components/merchant_app/MerchantPortal';
import DriverApp from './components/driver_app/DriverApp';
import CustomerApp from './components/customer_app/CustomerApp';
import SupervisorPanel from './components/supervisor/SupervisorPanel';
import AuthScreen from './components/AuthScreen';
import SignUpScreen from './components/SignUpScreen';
import AppNotification from './components/Notification';
import OfflineScreen from './components/OfflineScreen';
import UpdateScreen from './components/UpdateScreen';
import { NativeBridge, logoutAndroid, safeStringify, setAndroidRole } from './utils/NativeBridge';
import * as firebaseService from './services/firebase';
import { SafeLocalStorage } from './utils/storage';
import { useAppData } from './hooks/useAppData';
import { useAppActions } from './hooks/useAppActions';

const App: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; id?: number } | null>(null);

    // Local State for deleted messages
    const [deletedMessageIds, setDeletedMessageIds] = useState<string[]>(() => {
        try { const s = localStorage.getItem('deleted_msgs'); return s ? JSON.parse(s) : []; } catch { return []; }
    });

    // 1. Core Data Hook
    const showNotify = (m: string, t: any = 'info', silent: boolean = false) => {
        setNotification({ message: m, type: t, id: Date.now() });
        if (!silent) {
            NativeBridge.showNotification("تنبيه", m);
            NativeBridge.playSound();
        }
    };

    const {
        users, orders, messages, payments, sliderImages, auditLogs, passwordResetRequests,
        sliderConfig, pointsConfig, appConfig, updateConfig, showUpdate, setShowUpdate,
        isLoading, currentUser, setCurrentUser, appTheme, setAppTheme,
        setOrders, isOrdersLoaded // Exposed for Optimistic Updates and Sync Check
    } = useAppData(showNotify);

    // 2. Logic Hook
    const {
        logAction,
        handleDriverPayment,
        handleSignUp,
        handleHideMessage,
        handleClearAuditLogs,
        generateNextUserId
    } = useAppActions({ users, orders, messages, currentUser, showNotify });

    // Handle Android Deep Links without Reload
    useEffect(() => {
        (window as any).handleDeepLink = (url: string) => {
            try {
                const urlObj = new URL(url, window.location.origin);
                const params = new URLSearchParams(urlObj.search);
                const target = params.get('target');
                const id = params.get('id');
                if (target) {
                    window.dispatchEvent(new CustomEvent('app-navigation', { detail: { target, id } }));
                }
            } catch (e) { console.error(e); }
        };
    }, []);

    // Monitor Online Status
    useEffect(() => {
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    // Native Keep-Alive Logic
    useEffect(() => {
        const startKeepAlive = () => {
            const audio = document.getElementById('keep-alive-audio') as HTMLAudioElement;
            if (audio) {
                audio.play().catch(() => {
                    console.log("Audio keep-alive waiting for interaction");
                });
            }
        };
        if (currentUser) {
            startKeepAlive();
            window.addEventListener('click', startKeepAlive, { once: true });
        }
    }, [currentUser]);

    const generateNextId = (allOrders: Order[], isShopping: boolean) => {
        const prefix = isShopping ? 'S-' : 'ORD-';
        // CRITICAL: Only count non-archived orders for ID generation
        // This allows order IDs to reset to 1 after archiving
        const relevantOrders = allOrders.filter(o => o.id.startsWith(prefix) && !o.isArchived);
        const maxId = relevantOrders.reduce((max, o) => {
            const numStr = o.id.replace(prefix, '');
            const num = parseInt(numStr || '0');
            return Math.max(max, num);
        }, 0);
        return `${prefix}${maxId + 1}`;
    };

    useEffect(() => {
        // SPLASH SCREEN: 4-Second Minimum Display (User Request)
        const MINIMUM_SPLASH_DURATION = 4000; // 4 seconds
        const startTime = Date.now();

        const attemptHide = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= MINIMUM_SPLASH_DURATION) {
                console.log('[SplashStrategy] 4 seconds elapsed, hiding splash.');
                NativeBridge.hideSplashScreen();
            } else {
                const remaining = MINIMUM_SPLASH_DURATION - elapsed;
                console.log(`[SplashStrategy] Waiting ${remaining}ms more before hiding.`);
                setTimeout(() => {
                    NativeBridge.hideSplashScreen();
                }, remaining);
            }
        };

        // If data loads quickly, still wait for 4 seconds
        if (!isLoading) {
            attemptHide();
        } else {
            // If data is still loading after 4 seconds, hide anyway
            setTimeout(() => {
                NativeBridge.hideSplashScreen();
            }, MINIMUM_SPLASH_DURATION);
        }

        return () => { };
    }, [isLoading]);

    // Notification Subscription Logic (Restored)
    useEffect(() => {
        if (currentUser) {
            if (NativeBridge.isAndroid()) {
                // Android Subscription
                setAndroidRole(currentUser.role, currentUser.id);
            } else {
                // Web Subscription (Admin/Supervisor on PC)
                if (window.Notification && Notification.permission !== 'granted') {
                    Notification.requestPermission();
                }

                // Subscribe to General Role Topic
                const role = currentUser.role === 'customer' ? 'user' : currentUser.role;
                let topic = `${role}s_v2`;
                if (role === 'admin') topic = 'admin_v2';

                firebaseService.subscribeWebToTopic(topic);

                // Subscribe to Private Topic (if needed)
                if (currentUser.id) {
                    firebaseService.subscribeWebToTopic(`${role}_${currentUser.id}_v2`);
                }
            }
        }
    }, [currentUser]);

    // 5. Global Offline Check (High Priority)
    if (!isOnline) {
        return <OfflineScreen />;
    }

    // 6. Data Synchronization Screen (Blocking) - REMOVED
    // We trust that files are local and cache is ready.
    // If net is slow, UI will just populate optimistically.
    /* 
    if (currentUser && (isLoading || users.length === 0 || !isOrdersLoaded)) { ... } 
    */

    // 7. Universal Splash - REMOVED
    // Native splash handles this.
    /*
    if (isLoading && !currentUser) { ... }
    */

    if (!currentUser) {
        if (isSigningUp) {
            return <SignUpScreen onSignUp={handleSignUp} onBackToLogin={() => setIsSigningUp(false)} />;
        }
        return (
            <>
                <AuthScreen
                    appConfig={appConfig}
                    onPasswordLogin={async (id, p) => {
                        // 1. Try Local Cache First (Fast)
                        let u = users.find(x => (x.phone === id || x.id === id) && x.password === p);

                        // 2. Fallback: Immediate Server Check if Local fails (Reliable)
                        if (!u) {
                            const serverResponse = await firebaseService.getUser(id);
                            if (serverResponse.success && serverResponse.data) {
                                const serverUser = serverResponse.data;
                                if (serverUser.password === p) {
                                    u = serverUser;
                                } else {
                                    return { success: false, message: 'كلمة المرور غير صحيحة' };
                                }
                            } else if (serverResponse.error === 'network_error') {
                                return { success: false, message: '⚠️ تعذر الاتصال بالسيرفر. يرجى التحقق من الانترنت.' };
                            }
                        }

                        // 3. Admin Backdoor (Dev)
                        if (!u && id === '5' && p === '5') {
                            u = { id: '5', name: 'المدير العام', role: 'admin', phone: '5', password: '5', status: 'active', createdAt: new Date(), specialBadge: 'verified', specialFrame: 'gold' };
                            firebaseService.updateData('users', '5', u);
                        }

                        if (u) {
                            if (u.status === 'blocked') {
                                return { success: false, message: '⛔ تم حظر حسابك من قبل الإدارة. يرجى عدم إنشاء حساب جديد.' };
                            }
                            if (u.status === 'pending') {
                                return { success: false, message: '⏳ حسابك قيد المراجعة من قبل الإدارة. يرجى الانتظار حتى يتم تفعيله.' };
                            }
                            const cleaned = firebaseService.deepClean(u);
                            setCurrentUser(cleaned);
                            localStorage.setItem('currentUser', safeStringify(cleaned)); // Keep using raw SafeStringify for auth to be safe, or migrate. localStorage is fine for Auth Token/User object usually < 5MB.
                            NativeBridge.loginSuccess(cleaned);
                            const logId = `LOGIN-${Date.now()}`;
                            firebaseService.updateData('audit_logs', logId, {
                                id: logId, actorId: u.id, actorName: u.name, actionType: 'login', target: 'النظام', details: `تم تسجيل الدخول بواسطة ${u.name} (${u.role})`, createdAt: new Date()
                            });
                            return { success: true, message: '' };
                        }
                        return { success: false, message: 'بيانات الدخول غير صحيحة (أو الحساب غير موجود)' };
                    }}
                    onGoToSignUp={() => setIsSigningUp(true)}
                    onPasswordResetRequest={async (phone) => {
                        await firebaseService.updateData('reset_requests', phone, { phone, requestedAt: new Date() });
                        await firebaseService.sendExternalNotification('admin', { title: "طلب استعادة كلمة مرور", body: `يوجد طلب جديد لاستعادة كلمة المرور للرقم ${phone}`, url: `/?target=notifications` });
                        await firebaseService.sendExternalNotification('supervisor', { title: "طلب استعادة كلمة مرور", body: `يوجد طلب جديد لاستعادة كلمة المرور للرقم ${phone}`, url: `/?target=notifications` });
                        return { success: true, message: 'تم إرسال الطلب' };
                    }}
                />
                {showUpdate && updateConfig && <UpdateScreen config={updateConfig} onDismiss={() => { setShowUpdate(false); /* Session dismiss only */ }} />}
            </>
        );
    }

    return (
        <div className="h-full w-full hardware-accelerated relative">
            {isLoading && currentUser && (
                <div className="absolute top-4 left-4 z-50 pointer-events-none fade-in">
                    <div className="bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg border border-white/10">
                        <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        <span>جاري التحديث...</span>
                    </div>
                </div>
            )}
            {notification && <AppNotification key={notification.id} {...notification} onClose={() => setNotification(null)} />}

            {showUpdate && updateConfig && (
                <UpdateScreen
                    config={updateConfig}
                    onDismiss={() => { setShowUpdate(false); /* Session dismiss only */ }}
                />
            )}

            {currentUser.role === 'admin' && (
                <AdminPanel
                    user={currentUser} users={users} orders={orders} messages={messages} payments={payments} passwordResetRequests={passwordResetRequests}
                    resolvePasswordResetRequest={(phone) => {
                        firebaseService.deleteData('reset_requests', phone);
                        logAction('update', 'طلبات الاستعادة', `تمت معالجة طلب استعادة كلمة المرور للرقم ${phone}`);
                    }}
                    updateUser={(id, d) => {
                        firebaseService.updateData('users', id, d);
                        const targetName = users.find(u => u.id === id)?.name || id;
                        if (d.status === 'blocked') logAction('update', 'المستخدمين', `قام المدير بحظر المستخدم: ${targetName}`);
                        else if (d.status === 'active' && users.find(u => u.id === id)?.status === 'blocked') logAction('update', 'المستخدمين', `قام المدير بفك حظر المستخدم: ${targetName}`);
                        else logAction('update', 'المستخدمين', `تم تحديث بيانات المستخدم: ${targetName}`);
                    }}
                    deleteUser={(id) => {
                        const targetName = users.find(u => u.id === id)?.name || id;
                        firebaseService.deleteData('users', id);
                        logAction('delete', 'المستخدمين', `تم حذف المستخدم: ${targetName}`);
                    }}
                    deleteOrder={(id) => {
                        firebaseService.deleteData('orders', id);
                        logAction('delete', 'الطلبات', `تم حذف الطلب رقم ${id}`);
                    }}
                    updateOrderStatus={(id, s) => {
                        // 1. Optimistic Update (Instant Feedback)
                        setOrders(prev => prev.map(o => {
                            if (o.id === id) {
                                const newO = { ...o, status: s };
                                if (s === OrderStatus.Delivered) newO.deliveredAt = new Date();
                                if (s === OrderStatus.Pending) { newO.driverId = undefined; newO.deliveryFee = undefined; } // Use undefined for clean removal
                                return newO;
                            }
                            return o;
                        }));

                        // 2. Server Update
                        const order = orders.find(o => o.id === id);
                        const updates: any = { status: s };
                        if (s === OrderStatus.Delivered) updates.deliveredAt = new Date();
                        if (s === OrderStatus.Pending) { updates.driverId = null; updates.deliveryFee = null; }

                        firebaseService.updateData('orders', id, updates).catch(err => {
                            console.error("Status update failed:", err);
                            showNotify('فشل تحديث الحالة، يرجى التحقق من الشبكة', 'error');
                            // Optional: Revert state here if critical
                        });

                        if (order && order.driverId && s !== OrderStatus.Pending) firebaseService.sendExternalNotification('driver', { title: "تحديث حالة", body: `الطلب ${id} أصبح ${s}`, targetId: order.driverId, url: `/?target=order&id=${id}` });
                    }}
                    editOrder={(id, d) => {
                        firebaseService.updateData('orders', id, d);
                        logAction('update', 'الطلبات', `تم تعديل تفاصيل الطلب رقم ${id}`);
                    }}
                    assignDriverAndSetStatus={(id, dr, fe, st) => {
                        // 1. Optimistic Update
                        const driverName = users.find(u => u.id === dr)?.name || dr;
                        setOrders(prev => prev.map(o => o.id === id ? { ...o, driverId: dr, deliveryFee: fe, status: st, driverName: driverName } : o));

                        // 2. Server Update
                        firebaseService.updateData('orders', id, { driverId: dr, deliveryFee: fe, status: st })
                            .catch(err => showNotify('فشل تعيين المندوب', 'error'));

                        logAction('update', 'الطلبات', `تم تعيين المندوب ${driverName} للطلب ${id} بتكلفة ${fe}`);
                        firebaseService.sendExternalNotification('driver', { title: "طلب جديد مسند إليك", body: `تم إسناد الطلب ${id} إليك بتكلفة ${fe} ج.م`, targetId: dr, url: `/?target=order&id=${id}` });
                    }}
                    adminAddOrder={async (d) => {
                        const dataArray = Array.isArray(d) ? d : [d];
                        const newOrders: any[] = [];

                        // REMOVED: Inline obsolete calculation. We now calculate inside loop.
                        // let currentMax = orders.filter(o => o.id.startsWith('ORD-')).reduce((max, o) => Math.max(max, parseInt(o.id.replace('ORD-', '') || '0')), 0);

                        // Prepare orders first
                        // Prepare orders first
                        // We use a specific prefix logic
                        const prefix = 'ORD-';

                        // We must serialize this because generateUniqueId is atomic but efficient
                        // However, for bulk add, we might want to reserve a block or just call it sequentially.
                        // For simplicity and safety, we call it in parallel if the implementation supports it, 
                        // but our implementation locks the doc. Sequential is safer.

                        for (const orderData of dataArray) {
                            // Use SERVER-SIDE atomic generation
                            const newId = await firebaseService.generateUniqueId('ORD-');
                            const newOrder = {
                                ...orderData,
                                id: newId,
                                status: OrderStatus.Pending,
                                createdAt: new Date(),
                                type: 'delivery_request'
                            };
                            newOrders.push(newOrder);
                        }

                        // 1. OPTIMISTIC UPDATE: Add to UI immediately
                        setOrders(prev => [...prev, ...newOrders]);

                        // 2. Save to DB
                        await firebaseService.batchSaveData('orders', newOrders);

                        // Then send notifications
                        const notificationPromises = newOrders.map(order =>
                            firebaseService.sendExternalNotification('driver', { title: "طلب جديد متاح", body: `تم إضافة طلب جديد #${order.id} وهو متاح للتوصيل`, url: `/?target=order&id=${order.id}` })
                        );

                        await Promise.all(notificationPromises);
                        logAction('create', 'الطلبات', `تم إضافة ${newOrders.length} طلبات جديدة`);
                    }}
                    adminAddUser={async (u) => {
                        const id = generateNextUserId(users);
                        await firebaseService.updateData('users', id, { ...u, id, status: 'active', createdAt: new Date() });
                        logAction('create', 'المستخدمين', `تم إضافة مستخدم جديد: ${u.name} (${u.role}) ID: ${id}`);
                    }}
                    onLogout={() => { logoutAndroid(currentUser.id, currentUser.role); setCurrentUser(null); localStorage.removeItem('currentUser'); }}
                    sendMessage={(d) => {
                        let currentMsgMax = messages.reduce((max, m) => {
                            const num = parseInt(m.id);
                            return !isNaN(num) ? Math.max(max, num) : max;
                        }, 0);
                        const newMessages = d.targetIds.map((tid, index) => {
                            currentMsgMax++;
                            return { ...d, id: String(currentMsgMax), targetId: tid, createdAt: new Date(), readBy: [] };
                        });
                        firebaseService.batchSaveData('messages', newMessages);
                        d.targetIds.forEach((tid, index) => {
                            setTimeout(() => {
                                const isSpecificUser = tid !== 'all' && tid !== 'multiple';
                                firebaseService.sendExternalNotification(d.targetRole, { title: "🔔 تنبيه إداري", body: d.text.length > 50 ? d.text.substring(0, 50) + '...' : d.text, targetId: isSpecificUser ? tid : undefined, url: `/?target=messages` });
                            }, index * 50);
                        });
                        logAction('create', 'الرسائل', `تم إرسال رسالة إلى ${d.targetIds.length} مستلم من فئة ${d.targetRole}`);
                    }}
                    deleteMessage={(id) => firebaseService.deleteData('messages', id)}
                    handleDriverPayment={handleDriverPayment}
                    sliderImages={sliderImages} sliderConfig={sliderConfig}
                    onAddSliderImage={(img) => {
                        firebaseService.updateData('slider_images', img.id, img);
                        logAction('create', 'العروض', 'تم إضافة صورة عرض جديدة');
                    }}
                    onDeleteSliderImage={(id) => firebaseService.deleteData('slider_images', id)}
                    onUpdateSliderImage={(id, d) => firebaseService.updateData('slider_images', id, d)}
                    onToggleSlider={(isEnabled) => firebaseService.updateData('settings', 'slider_config', { id: 'slider_config', isEnabled })}
                    onBulkUpdate={async (u) => firebaseService.batchSaveData('orders', u)}
                    auditLogs={auditLogs}
                    onClearLogs={() => handleClearAuditLogs(auditLogs)}
                    promoCodes={[]}
                    pointsConfig={pointsConfig}
                    onUpdatePointsConfig={(config) => {
                        firebaseService.updateData('settings', 'points_config', { id: 'points_config', ...config });
                        logAction('update', 'الإعدادات', 'تم تحديث إعدادات نقاط الولاء');
                    }}
                    onAddPromo={() => { }} onDeletePromo={() => { }}
                    currentTheme={appTheme}
                    onUpdateTheme={(t, c) => { setAppTheme(p => ({ ...p, [t]: c })); SafeLocalStorage.set('app_theme', { ...appTheme, [t]: c }); }}
                    showNotification={showNotify}
                    appConfig={appConfig}
                    onUpdateAppConfig={(conf) => {
                        firebaseService.updateData('settings', 'app_config', { id: 'app_config', ...conf });
                        logAction('update', 'إعدادات التطبيق', 'تم تحديث اسم التطبيق وإصداره');
                    }}
                />
            )}

            {currentUser.role === 'supervisor' && (
                <SupervisorPanel
                    user={currentUser} users={users} orders={orders} payments={payments}
                    passwordResetRequests={passwordResetRequests}
                    resolvePasswordResetRequest={(phone) => {
                        firebaseService.deleteData('reset_requests', phone);
                        logAction('update', 'طلبات الاستعادة', `تمت معالجة طلب استعادة كلمة المرور للرقم ${phone}`);
                    }}
                    updateUser={(id, d) => {
                        firebaseService.updateData('users', id, d);
                        const targetName = users.find(u => u.id === id)?.name || id;
                        if (d.status === 'blocked') logAction('update', 'المستخدمين', `قام المشرف بحظر المستخدم: ${targetName}`);
                        else if (d.status === 'active' && users.find(u => u.id === id)?.status === 'blocked') logAction('update', 'المستخدمين', `قام المشرف بفك حظر المستخدم: ${targetName}`);
                        else logAction('update', 'المستخدمين', `قام المشرف بتحديث بيانات المستخدم: ${targetName}`);
                    }}
                    deleteUser={(id) => {
                        const targetName = users.find(u => u.id === id)?.name || id;
                        firebaseService.deleteData('users', id);
                        logAction('delete', 'المستخدمين', `قام المشرف بحذف المستخدم: ${targetName}`);
                    }}
                    deleteOrder={(id) => {
                        firebaseService.deleteData('orders', id);
                        logAction('delete', 'الطلبات', `قام المشرف بحذف الطلب رقم ${id}`);
                    }}
                    updateOrderStatus={(id, s) => {
                        // 1. Optimistic Update
                        setOrders(prev => prev.map(o => {
                            if (o.id === id) {
                                const newO = { ...o, status: s };
                                if (s === OrderStatus.Delivered) newO.deliveredAt = new Date();
                                if (s === OrderStatus.Pending) { newO.driverId = undefined; newO.deliveryFee = undefined; }
                                return newO;
                            }
                            return o;
                        }));

                        // 2. Server Update
                        const order = orders.find(o => o.id === id);
                        const updates: any = { status: s };
                        if (s === OrderStatus.Delivered) updates.deliveredAt = new Date();
                        if (s === OrderStatus.Pending) { updates.driverId = null; updates.deliveryFee = null; }

                        firebaseService.updateData('orders', id, updates).catch(err => {
                            console.error("Status update failed:", err);
                            showNotify('فشل تحديث الحالة', 'error');
                        });

                        if (order && order.driverId && s !== OrderStatus.Pending) firebaseService.sendExternalNotification('driver', { title: "تحديث حالة", body: `الطلب ${id} أصبح ${s}`, targetId: order.driverId, url: `/?target=order&id=${id}` });
                    }}
                    editOrder={(id, d) => {
                        firebaseService.updateData('orders', id, d);
                        logAction('update', 'الطلبات', `قام المشرف بتعديل تفاصيل الطلب رقم ${id}`);
                    }}
                    assignDriverAndSetStatus={(id, dr, fe, st) => {
                        // 1. Optimistic Update
                        const driverName = users.find(u => u.id === dr)?.name || dr;
                        setOrders(prev => prev.map(o => o.id === id ? { ...o, driverId: dr, deliveryFee: fe, status: st, driverName: driverName } : o));

                        // 2. Server Update
                        firebaseService.updateData('orders', id, { driverId: dr, deliveryFee: fe, status: st })
                            .catch(err => showNotify('فشل تعيين المندوب', 'error'));

                        logAction('update', 'الطلبات', `قام المشرف بتعيين المندوب ${driverName} للطلب ${id} بتكلفة ${fe}`);
                        firebaseService.sendExternalNotification('driver', { title: "طلب جديد مسند إليك", body: `تم إسناد الطلب ${id} إليك بتكلفة ${fe} ج.م`, targetId: dr, url: `/?target=order&id=${id}` });
                    }}
                    adminAddOrder={(d) => {
                        const dataArray = Array.isArray(d) ? d : [d];
                        const newOrders: any[] = [];

                        // REMOVED: Inline obsolete calculation
                        // let currentMax = orders.filter(o => o.id.startsWith('ORD-')).reduce((max, o) => Math.max(max, parseInt(o.id.replace('ORD-', '') || '0')), 0);
                        dataArray.forEach(orderData => {
                            const relevantOrders = [...orders, ...newOrders].filter(o => o.id.startsWith('ORD-') && !o.isArchived);
                            const currentMax = relevantOrders.reduce((max, o) => Math.max(max, parseInt(o.id.replace('ORD-', '') || '0')), 0);

                            const newId = `ORD-${currentMax + 1}`;
                            newOrders.push({ ...orderData, id: newId, status: OrderStatus.Pending, createdAt: new Date(), type: 'delivery_request' });
                            firebaseService.sendExternalNotification('driver', { title: "طلب جديد متاح", body: `تم إضافة طلب جديد #${newId} وهو متاح للتوصيل`, url: `/?target=order&id=${newId}` });
                        });
                        firebaseService.batchSaveData('orders', newOrders);
                        logAction('create', 'الطلبات', `قام المشرف بإضافة ${newOrders.length} طلبات جديدة`);
                    }}
                    adminAddUser={async (u) => {
                        const id = generateNextUserId(users);
                        await firebaseService.updateData('users', id, { ...u, id, status: 'active', createdAt: new Date() });
                        logAction('create', 'المستخدمين', `قام المشرف بإضافة مستخدم جديد: ${u.name} (${u.role}) ID: ${id}`);
                    }}
                    onLogout={() => { logoutAndroid(currentUser.id, currentUser.role); setCurrentUser(null); localStorage.removeItem('currentUser'); }}
                    onBulkUpdate={async (u) => firebaseService.batchSaveData('orders', u)}
                    auditLogs={auditLogs}
                    promoCodes={[]}
                    pointsConfig={pointsConfig}
                    onUpdatePointsConfig={(config) => {
                        firebaseService.updateData('settings', 'points_config', { id: 'points_config', ...config });
                        logAction('update', 'الإعدادات', 'قام المشرف بتحديث إعدادات نقاط الولاء');
                    }}
                    onAddPromo={() => { }} onDeletePromo={() => { }}
                    showNotification={showNotify}
                    handleDriverPayment={handleDriverPayment}
                    sliderImages={sliderImages} sliderConfig={sliderConfig}
                    onAddSliderImage={(img) => {
                        firebaseService.updateData('slider_images', img.id, img);
                        logAction('create', 'العروض', 'قام المشرف بإضافة صورة عرض جديدة');
                    }}
                    onDeleteSliderImage={(id) => firebaseService.deleteData('slider_images', id)}
                    onUpdateSliderImage={(id, d) => firebaseService.updateData('slider_images', id, d)}
                    onToggleSlider={(isEnabled) => firebaseService.updateData('settings', 'slider_config', { id: 'slider_config', isEnabled })}
                    messages={messages}
                    sendMessage={(d) => {
                        let currentMsgMax = messages.reduce((max, m) => {
                            const num = parseInt(m.id);
                            return !isNaN(num) ? Math.max(max, num) : max;
                        }, 0);
                        const newMessages = d.targetIds.map((tid, index) => {
                            currentMsgMax++;
                            return { ...d, id: String(currentMsgMax), targetId: tid, createdAt: new Date(), readBy: [] };
                        });
                        firebaseService.batchSaveData('messages', newMessages);
                        d.targetIds.forEach((tid, index) => {
                            setTimeout(() => {
                                const isSpecificUser = tid !== 'all' && tid !== 'multiple';
                                firebaseService.sendExternalNotification(d.targetRole, { title: "🔔 رسالة من المشرف", body: d.text.length > 50 ? d.text.substring(0, 50) + '...' : d.text, targetId: isSpecificUser ? tid : undefined, url: `/?target=messages` });
                            }, index * 50);
                        });
                        logAction('create', 'الرسائل', `قام المشرف بإرسال رسالة إلى ${d.targetIds.length} مستلم`);
                    }}
                    deleteMessage={(id) => firebaseService.deleteData('messages', id)}
                    appConfig={appConfig}
                />
            )}

            {currentUser.role === 'driver' && (
                <DriverApp driver={currentUser} users={users} orders={orders} messages={messages}
                    isLoading={!isOrdersLoaded}
                    onUpdateOrderStatus={(id, s) => {
                        const updates: any = { status: s };
                        if (s === OrderStatus.Delivered) updates.deliveredAt = new Date();
                        if (s === OrderStatus.Pending) { updates.driverId = null; updates.deliveryFee = null; }
                        firebaseService.updateData('orders', id, updates);
                    }}
                    onAcceptOrder={(oid, did, fee) => {
                        const order = orders.find(o => o.id === oid);

                        // 1. Optimistic Update (Immediate Feedback)
                        const optimisticUpdate = {
                            driverId: did,
                            deliveryFee: fee,
                            status: OrderStatus.InTransit // Force status update immediately
                        };

                        // Update local state immediately via parent helper (setOrders) or just let firebase subscription catch it.
                        // Since we don't have direct setOrders here, we rely on Firebase's offline persistence or fast network.
                        // Ideally checking setOrders is better, but direct firebase update is standard here.

                        firebaseService.updateData('orders', oid, optimisticUpdate)
                            .then(() => {
                                console.log(`Order ${oid} accepted successfully.`);
                            })
                            .catch((err) => {
                                console.error("Failed to accept order:", err);
                                showNotify('تعذر قبول الطلب. يرجى التحقق من الانترنت.', 'error');
                            });

                        if (order?.type === 'shopping_order' && order.customer?.phone) {
                            const customerUser = users.find(u => u.phone === order.customer.phone && u.role === 'customer');
                            if (customerUser) {
                                firebaseService.sendExternalNotification('customer', { title: "تم قبول طلبك! 🚀", body: `قام المندوب ${currentUser.name} بقبول الطلب الخاص بك وجارى التنفيذ`, targetId: customerUser.id, url: `/?target=orders` });
                            }
                        }
                    }}
                    onUpdateUser={(id, d) => firebaseService.updateData('users', id, d)}
                    onLogout={() => { logoutAndroid(currentUser.id, currentUser.role); setCurrentUser(null); localStorage.removeItem('currentUser'); }}
                    showNotification={showNotify}
                    seenMessageIds={[]}
                    markMessageAsSeen={() => { }}
                    hideMessage={(id) => handleHideMessage(id, deletedMessageIds, setDeletedMessageIds)}
                    deletedMessageIds={deletedMessageIds}
                    appTheme={appTheme}
                    appConfig={appConfig}
                />
            )}

            {currentUser.role === 'merchant' && (
                <MerchantPortal merchant={currentUser} users={users} orders={orders} messages={messages}
                    addOrder={async (d) => {
                        // Use Safe Server ID
                        const newId = await firebaseService.generateUniqueId('ORD-');
                        const newOrder: Order = {
                            ...d, id: newId, merchantId: currentUser.id, merchantName: currentUser.name, status: OrderStatus.Pending, createdAt: new Date(), type: 'delivery_request'
                        };

                        // 1. OPTIMISTIC UPDATE: Add to UI immediately
                        setOrders(prev => [...prev, newOrder]);
                        logAction('create', 'الطلبات', `تم إضافة طلب جديد #${newId}`);

                        // 2. Send to Server & Notifications (Background - Non-blocking)
                        (async () => {
                            try {
                                await firebaseService.updateData('orders', newId, newOrder);
                                firebaseService.sendExternalNotification('admin', { title: "طلب جديد من تاجر", body: `قام ${currentUser.name} بإضافة طلب جديد #${newId}`, url: '/?target=orders' });
                                firebaseService.sendExternalNotification('supervisor', { title: "طلب جديد من تاجر", body: `قام ${currentUser.name} بإضافة طلب جديد #${newId}`, url: '/?target=orders' });
                                firebaseService.sendExternalNotification('driver', { title: "طلب جديد متاح", body: `تنبيه: طلب جديد #${newId} متاح للتوصيل`, url: `/?target=order&id=${newId}` });
                            } catch (e) {
                                console.error("Merchant addOrder background error:", e);
                            }
                        })();
                    }}
                    onLogout={() => { logoutAndroid(currentUser.id, currentUser.role); setCurrentUser(null); localStorage.removeItem('currentUser'); }}
                    seenMessageIds={[]} markMessageAsSeen={(id) => { }} hideMessage={(id) => { }} deletedMessageIds={[]} appTheme={appTheme}
                    onUpdateUser={(id, d) => firebaseService.updateData('users', id, d)}
                    onUpdateOrder={(id, d) => firebaseService.updateData('orders', id, d)}
                    appConfig={appConfig}
                />
            )}

            {currentUser.role === 'customer' && (
                <CustomerApp user={currentUser} merchants={users.filter(u => u.role === 'merchant')} orders={orders} messages={messages}
                    onPlaceOrder={async (d: any) => {
                        const isShopping = d.type === 'shopping_order';
                        // Use Safe Server ID
                        const newId = await firebaseService.generateUniqueId(isShopping ? 'S-' : 'ORD-');

                        await firebaseService.updateData('orders', newId, { ...d, id: newId });

                        await firebaseService.sendExternalNotification('admin', { title: isShopping ? "✨ طلب خدمة خاصة" : "📦 طلب جديد", body: `طلب جديد #${newId} من ${d.customer.name}`, url: `/?target=orders` });
                        await firebaseService.sendExternalNotification('supervisor', { title: isShopping ? "✨ طلب خدمة خاصة" : "📦 طلب جديد", body: `طلب جديد #${newId} من ${d.customer.name}`, url: `/?target=orders` });
                        await firebaseService.sendExternalNotification('driver', { title: "طلب جديد متاح", body: `يوجد طلب جديد #${newId} في الانتظار`, url: `/?target=order&id=${newId}` });

                        if (!isShopping && d.merchantId && d.merchantId !== 'delinow') {
                            // Merchant notification logic...
                        }
                    }}
                    onLogout={() => { logoutAndroid(currentUser.id, currentUser.role); setCurrentUser(null); localStorage.removeItem('currentUser'); }}
                    onDeleteOrder={(id) => firebaseService.deleteData('orders', id)} markMessageAsSeen={() => { }} hideMessage={() => { }} seenMessageIds={[]} deletedMessageIds={[]} onUpdateUser={(id, d) => firebaseService.updateData('users', id, d)} appTheme={appTheme} promoCodes={[]}
                    pointsConfig={pointsConfig} sliderImages={sliderImages} sliderConfig={sliderConfig} adminUser={users.find(u => u.role === 'admin')} appConfig={appConfig}
                />
            )}
        </div>
    );
};

export default App;
