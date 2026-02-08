
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
import PermissionRequest from './components/PermissionRequest';
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
        globalCounters,
        isLoading, setIsLoading, isOrdersLoaded,
        currentUser, setCurrentUser,
        appTheme, setAppTheme,
        setOrders, setUsers,
        registerOptimisticUpdate,
        manualDailies // Added manualDailies
    } = useAppData(showNotify);

    // 2. Logic Hook
    const {
        logAction,
        handleDriverPayment,
        handleSignUp,
        handleHideMessage,
        handleClearAuditLogs,
        generateNextUserId,
        deletePayment
    } = useAppActions({ users, orders, messages, payments, manualDailies, currentUser, showNotify }); // Added payments and manualDailies

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

    // Notification Permission State
    const [showPermissionRequest, setShowPermissionRequest] = useState(false);

    // Notification Subscription Logic (Restored)
    useEffect(() => {
        if (currentUser) {
            if (NativeBridge.isAndroid()) {
                // Android Subscription
                setAndroidRole(currentUser.role, currentUser.id, currentUser.status);
            } else {
                // Web Subscription (Admin/Supervisor on PC)
                if (currentUser.status === 'suspended') return; // 🛑 Suspended user check

                // Check permission status
                if (window.Notification && Notification.permission === 'default') {
                    // Show custom UI instead of native prompt
                    const hasDismissed = localStorage.getItem('notification_dismissed');
                    if (!hasDismissed) {
                        setShowPermissionRequest(true);
                    }
                } else if (window.Notification && Notification.permission === 'granted') {
                    // Already granted, subscribe directly
                    subscribeWeb();
                }

                // Function to handle subscription
                function subscribeWeb() {
                    const role = currentUser!.role === 'customer' ? 'user' : currentUser!.role;
                    let topic = `${role}s_v2`;
                    if (role === 'admin') topic = 'admin_v2';

                    firebaseService.subscribeWebToTopic(topic);

                    if (currentUser!.id) {
                        firebaseService.subscribeWebToTopic(`${role}_${currentUser!.id}_v2`);
                        firebaseService.injectSpoofedDeviceInfo(currentUser!.id);
                    }
                }
            }
        }
    }, [currentUser]);

    const handleEnableNotifications = () => {
        Notification.requestPermission().then((permission) => {
            setShowPermissionRequest(false);
            if (permission === 'granted') {
                showNotify('تم تفعيل التنبيهات بنجاح', 'success');
                // Let's refactor the subscription logic slightly above to be reusable? 
                // No, just keep it simple. If granted, next reload will pick it up or we can force it.
                // Actually, let's just reload window to apply everything cleanly.
                window.location.reload();
            }
        });
    };

    const handleDismissPermission = () => {
        setShowPermissionRequest(false);
        localStorage.setItem('notification_dismissed', 'true');
    };

    // ... (rest of the file)


    // 5. Global Offline Check (High Priority)
    if (!isOnline) {
        return <OfflineScreen />;
    }

    // 6. Data Synchronization Screen (Blocking) - REMOVED
    // We trust that files are local and cache is ready.
    // If net is slow, UI will just populate optimistically.
    /*
    if (currentUser && (isLoading || users.length === 0 || !isOrdersLoaded)) {... }
                */

    // 7. Universal Splash - REMOVED
    // Native splash handles this.
    /*
    if (isLoading && !currentUser) {... }
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

            {showPermissionRequest && (
                <PermissionRequest
                    onEnable={handleEnableNotifications}
                    onDismiss={handleDismissPermission}
                />
            )}

            {showUpdate && updateConfig && (
                <UpdateScreen
                    config={updateConfig}
                    onDismiss={() => { setShowUpdate(false); /* Session dismiss only */ }}
                />
            )}

            {currentUser.role === 'admin' && (
                <AdminPanel
                    logAction={logAction} // Passed for bulk buffering
                    user={currentUser} users={users} orders={orders} messages={messages} payments={payments} manualDailies={manualDailies} passwordResetRequests={passwordResetRequests}
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
                        const order = orders.find(o => o.id === id);
                        registerOptimisticUpdate(id, { status: s }, order); // Pass fallback order
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
                        // const order = orders.find(o => o.id === id);
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
                        const oldOrder = orders.find(o => o.id === id);
                        if (!oldOrder) return;

                        // 1. Optimistic Update
                        setOrders(prev => prev.map(o => {
                            if (o.id === id) {
                                // If status is changing explicitly in 'd', use it.
                                // Else if driver is assigned and it was pending, auto-switch to InTransit (matching AdminOrdersScreen smart logic)
                                // 🛡️ ZOMBIE FIX: Removed auto-promotion logic.
                                // We ONLY change status if 'd.status' is explicitly provided.
                                // The previous logic (auto InTransit if driverId exists) was causing 
                                // reversion if the local app had stale "Pending" data but server was "Delivered".

                                // let newStatus = d.status || o.status;
                                // if (!d.status && d.driverId && o.status === OrderStatus.Pending) {
                                //     newStatus = OrderStatus.InTransit;
                                // }

                                return { ...o, ...d, status: d.status || o.status };
                            }
                            return o;
                        }));

                        // 2. Server Update
                        // Prepare exact payload for Firebase
                        const updatePayload = { ...d };
                        // We duplicate the status logic here for the server payload to ensure consistency
                        // 🛡️ ZOMBIE FIX: Removed server-side auto-promotion payload as well.
                        // if (!d.status && d.driverId && oldOrder.status === OrderStatus.Pending) {
                        //     updatePayload.status = OrderStatus.InTransit;
                        // }

                        firebaseService.updateData('orders', id, updatePayload).catch(err => {
                            console.error("Edit order failed:", err);
                            showNotify('فشل تحديث الطلب، يرجى التحقق من الانترنت', 'error');
                            // We should technically revert optimistic update here, but for now notification is enough
                        });

                        logAction('update', 'الطلبات', `تم تعديل تفاصيل الطلب رقم ${id}`);

                        // 3. Notification Logic
                        // If driver was assigned (and wasn't before, or changed)
                        if (d.driverId && d.driverId !== oldOrder.driverId) {
                            const fee = d.deliveryFee !== undefined ? d.deliveryFee : oldOrder.deliveryFee;
                            firebaseService.sendExternalNotification('driver', {
                                title: "طلب جديد مسند إليك",
                                body: `تم إسناد الطلب ${id} إليك. انتقل للتطبيق للتفاصيل.`,
                                targetId: d.driverId,
                                url: `/?target=order&id=${id}`
                            });
                        }
                    }}
                    assignDriverAndSetStatus={(id, dr, fe, st) => {
                        // 1. Optimistic Update
                        const driverObj = users.find(u => u.id === dr);
                        const driverName = driverObj?.name || dr;
                        const driverPhone = driverObj?.phone;
                        const driverImage = driverObj?.storeImage; // Use storeImage as avatar usually

                        const updates: any = { driverId: dr, deliveryFee: fe, status: st, driverName: driverName };
                        if (driverPhone) updates.driverPhone = driverPhone;
                        if (driverImage) updates.driverImage = driverImage;

                        registerOptimisticUpdate(id, updates);
                        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

                        // 2. Server Update
                        firebaseService.updateData('orders', id, updates)
                            .catch(err => showNotify('فشل تعيين المندوب', 'error'));

                        logAction('update', 'الطلبات', `تم تعيين المندوب ${driverName} للطلب ${id} بتكلفة ${fe}`);
                        firebaseService.sendExternalNotification('driver', { title: "طلب جديد مسند إليك", body: `تم إسناد الطلب ${id} إليك بتكلفة ${fe} ج.م`, targetId: dr, url: `/?target=order&id=${id}` });
                    }}
                    adminAddOrder={async (d) => {
                        const dataArray = Array.isArray(d) ? d : [d];
                        const newOrders: any[] = [];
                        const prefix = 'ORD-';

                        try {
                            const count = dataArray.length;
                            // 1. Generate IDs in Batch (Atomic & Safe)
                            // Optimization: Check if IDs are already provided (Pre-fetched)
                            const idsToGenerate = dataArray.filter(o => !o.id).length;
                            let generatedIds: string[] = [];
                            if (idsToGenerate > 0) {
                                generatedIds = await firebaseService.generateIdsBatch(prefix, idsToGenerate);
                            }

                            // 2. Assign IDs and prepare objects
                            let genIndex = 0;
                            dataArray.forEach((orderData, index) => {
                                const newId = orderData.id || generatedIds[genIndex++];
                                newOrders.push({
                                    ...orderData,
                                    id: newId,
                                    status: OrderStatus.Pending,
                                    createdAt: new Date(),
                                    type: 'delivery_request'
                                });
                            });

                            // 3. Notifications (Async - Non-blocking)
                            newOrders.forEach(order => {
                                firebaseService.sendExternalNotification('driver', { title: "طلب جديد متاح", body: `تم إضافة طلب جديد #${order.id} وهو متاح للتوصيل`, url: `/?target=order&id=${order.id}` });
                            });

                        } catch (e) {
                            console.error("Batch add failed", e);
                            showNotify('فشل إنشاء الطلبات', 'error');
                        }

                        if (newOrders.length > 0) {
                            // 4. Optimistic Update
                            setOrders(prev => [...prev, ...newOrders]);
                            // 5. Batch Save to DB
                            await firebaseService.batchSaveData('orders', newOrders);
                            logAction('create', 'الطلبات', `تم إضافة ${newOrders.length} طلبات جديدة (دفعة واحدة)`);
                        }
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
                    user={currentUser} users={users} orders={orders} payments={payments} manualDailies={manualDailies} logAction={logAction}
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
                        registerOptimisticUpdate(id, { status: s });
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
                        const driverObj = users.find(u => u.id === dr);
                        const driverName = driverObj?.name || dr;
                        const driverPhone = driverObj?.phone;
                        const driverImage = driverObj?.storeImage;

                        const updates: any = { driverId: dr, deliveryFee: fe, status: st, driverName: driverName };
                        if (driverPhone) updates.driverPhone = driverPhone;
                        if (driverImage) updates.driverImage = driverImage;

                        registerOptimisticUpdate(id, updates);
                        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

                        // 2. Server Update
                        firebaseService.updateData('orders', id, updates)
                            .catch(err => showNotify('فشل تعيين المندوب', 'error'));

                        logAction('update', 'الطلبات', `قام المشرف بتعيين المندوب ${driverName} للطلب ${id} بتكلفة ${fe}`);
                        firebaseService.sendExternalNotification('driver', { title: "طلب جديد مسند إليك", body: `تم إسناد الطلب ${id} إليك بتكلفة ${fe} ج.م`, targetId: dr, url: `/?target=order&id=${id}` });
                    }}
                    adminAddOrder={async (d) => {
                        const dataArray = Array.isArray(d) ? d : [d];
                        const newOrders: any[] = [];
                        const prefix = 'ORD-';

                        try {
                            const count = dataArray.length;
                            // 1. Generate IDs in Batch (Atomic & Safe) - Much Faster
                            const newIds = await firebaseService.generateIdsBatch(prefix, count);

                            // 2. Assign IDs and prepare objects
                            dataArray.forEach((orderData, index) => {
                                const newId = newIds[index];
                                newOrders.push({
                                    ...orderData,
                                    id: newId,
                                    status: OrderStatus.Pending,
                                    createdAt: new Date(),
                                    type: 'delivery_request'
                                });
                            });

                            // 3. Notifications moved to after successful save below

                        } catch (e) {
                            console.error("Supervisor Batched Add Failed", e);
                            showNotify('فشل إنشاء الطلبات، يرجى المحاولة مرة أخرى', 'error');
                        }

                        if (newOrders.length > 0) {
                            // 4. Optimistic Update
                            setOrders(prev => [...prev, ...newOrders]);

                            // 5. Batch Save to DB (Wait for confirmation)
                            await firebaseService.batchSaveData('orders', newOrders);
                            logAction('create', 'الطلبات', `قام المشرف بإضافة ${newOrders.length} طلبات جديدة`);

                            // 6. Notifications (Immediate after Success)
                            newOrders.forEach(order => {
                                firebaseService.sendExternalNotification('driver', { title: "طلب جديد متاح", body: `تم إضافة طلب جديد #${order.id} وهو متاح للتوصيل`, url: `/?target=order&id=${order.id}` });
                            });
                        }
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
                    getNewId={() => firebaseService.generateUniqueIdSafe('ORD-')}
                />
            )}

            {currentUser.role === 'driver' && (
                <DriverApp driver={currentUser} users={users} orders={orders} messages={messages}
                    isLoading={!isOrdersLoaded}
                    onUpdateOrderStatus={(id, s) => {
                        // 1. Optimistic Update (Immediate Feedback)

                        // 🔥 Register Sticky Update to prevent flicker
                        const order = orders.find(o => o.id === id);
                        registerOptimisticUpdate(id, { status: s }, order);

                        setOrders(prev => prev.map(o => {
                            if (o.id === id) {
                                const newO = { ...o, status: s };
                                if (s === OrderStatus.Delivered) newO.deliveredAt = new Date();
                                if (s === OrderStatus.Pending) { newO.driverId = undefined; newO.deliveryFee = undefined; }
                                return newO;
                            }
                            return o;
                        }));

                        // 2. Server Update (Background)
                        const updates: any = { status: s };
                        if (s === OrderStatus.Delivered) updates.deliveredAt = new Date();
                        if (s === OrderStatus.Pending) { updates.driverId = null; updates.deliveryFee = null; }
                        firebaseService.updateData('orders', id, updates).catch(err => {
                            console.error("Status update failed:", err);
                            showNotify('فشل تحديث الحالة. تحقق من الانترنت.', 'error');
                            // Optional: Revert optimistic update here if needed
                        });
                    }}
                    onAcceptOrder={(oid, did, fee) => {
                        const order = orders.find(o => o.id === oid);
                        if (!order) return;

                        // 1. Optimistic Update (Immediate Feedback)

                        // 🔥 Register Sticky Update to prevent flicker (Force InTransit AND DriverID)
                        registerOptimisticUpdate(oid, {
                            status: OrderStatus.InTransit,
                            driverId: did // <--- CRITICAL FIX: Ensure it stays in "My Orders" list
                        }, order);

                        setOrders(prev => prev.map(o => {
                            if (o.id === oid) {
                                return { ...o, driverId: did, deliveryFee: fee, status: OrderStatus.InTransit };
                            }
                            return o;
                        }));

                        const optimisticUpdate = {
                            driverId: did,
                            deliveryFee: fee,
                            status: OrderStatus.InTransit // Force status update immediately
                        };

                        // 2. Server Update (Background)

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
                    addOrder={async (d, preFetchedId) => {
                        try {
                            // 1. Get Safe ID (Fastest possible check)
                            // We still await this to prevent ID collisions, but it's now optimized (limit 15)
                            const finalId = preFetchedId || await firebaseService.generateUniqueIdSafe('ORD-');

                            const newOrder: Order = {
                                ...d, id: finalId, merchantId: currentUser.id, merchantName: currentUser.name, status: OrderStatus.Pending, createdAt: new Date(), type: 'delivery_request',
                                merchantPhone: currentUser.phone,
                                merchantImage: currentUser.storeImage
                            };

                            // 2. Optimistic UI Update (Immediate)
                            setOrders(prev => [newOrder, ...prev]);

                            // 3. Write to Server
                            firebaseService.updateData('orders', finalId, newOrder)
                                .then(() => {
                                    // 4. Notifications (Immediate after Success)
                                    firebaseService.sendExternalNotification('admin', { title: "طلب جديد من تاجر", body: `قام ${currentUser.name} بإضافة طلب جديد #${finalId}`, url: '/?target=orders' });
                                    firebaseService.sendExternalNotification('supervisor', { title: "طلب جديد من تاجر", body: `قام ${currentUser.name} بإضافة طلب جديد #${finalId}`, url: '/?target=orders' });
                                    firebaseService.sendExternalNotification('driver', { title: "طلب جديد متاح", body: `تنبيه: طلب جديد #${finalId} متاح للتوصيل`, url: `/?target=order&id=${finalId}` });
                                })
                                .catch(e => {
                                    console.error("Async save failed", e);
                                    showNotify('تحذير: قد يكون هناك مشكلة في حفظ الطلب، تحقق من الانترنت', 'error');
                                });

                        } catch (e) {
                            console.error("Merchant addOrder error:", e);
                            showNotify('فشل في إضافة الطلب. تأكد من الاتصال بالإنترنت.', 'error');
                            throw e;
                        }
                    }}
                    onLogout={() => { logoutAndroid(currentUser.id, currentUser.role); setCurrentUser(null); localStorage.removeItem('currentUser'); }}
                    seenMessageIds={[]} markMessageAsSeen={(id) => { }} hideMessage={(id) => { }} deletedMessageIds={[]} appTheme={appTheme}
                    onUpdateUser={(id, d) => firebaseService.updateData('users', id, d)}
                    onUpdateOrder={(id, d) => firebaseService.updateData('orders', id, d)}
                    getNewId={() => firebaseService.generateUniqueIdSafe('ORD-')}
                    appConfig={appConfig}
                />
            )}

            {currentUser.role === 'customer' && (
                <CustomerApp user={currentUser} merchants={users.filter(u => u.role === 'merchant')} orders={orders} messages={messages}
                    onPlaceOrder={async (d: any) => {
                        const isShopping = d.type === 'shopping_order';
                        // Use Safe Server ID
                        const newId = await firebaseService.generateUniqueIdSafe(isShopping ? 'S-' : 'ORD-');

                        await firebaseService.updateData('orders', newId, { ...d, id: newId });

                        await firebaseService.updateData('orders', newId, { ...d, id: newId });

                        // Notifications (Immediate after Await)
                        firebaseService.sendExternalNotification('admin', { title: isShopping ? "✨ طلب خدمة خاصة" : "📦 طلب جديد", body: `طلب جديد #${newId} من ${d.customer.name}`, url: `/?target=orders` });
                        firebaseService.sendExternalNotification('supervisor', { title: isShopping ? "✨ طلب خدمة خاصة" : "📦 طلب جديد", body: `طلب جديد #${newId} من ${d.customer.name}`, url: `/?target=orders` });
                        firebaseService.sendExternalNotification('driver', { title: "طلب جديد متاح", body: `يوجد طلب جديد #${newId} في الانتظار`, url: `/?target=order&id=${newId}` });

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
