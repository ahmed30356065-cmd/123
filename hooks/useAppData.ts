
import { useState, useEffect, useRef } from 'react';
import { User, Order, OrderStatus, Message, SliderImage, SliderConfig, AuditLog, AppConfig, UpdateConfig, AppTheme, Payment, ManualDaily } from '../types';
import * as firebaseService from '../services/firebase';
import { setAndroidRole, safeStringify, NativeBridge, logoutAndroid } from '../utils/NativeBridge';
import { AppStorage, SafeLocalStorage } from '../utils/storage';

export const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyC4bv_RLpS-jxunMs7nWjux806bYk6XnVY",
    authDomain: "goo-now-1ce44.firebaseapp.com",
    databaseURL: "https://goo-now-1ce44-default-rtdb.firebaseio.com",
    projectId: "goo-now-1ce44",
    storageBucket: "goo-now-1ce44.firebasestorage.app",
    messagingSenderId: "742306376566",
    appId: "1:742306376566:android:9298a84980b239e528a857"
};

const getActiveFirebaseConfig = () => {
    try {
        const savedConfig = localStorage.getItem('firebase_config');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            if (parsed && parsed.apiKey && parsed.projectId) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Failed to load custom firebase config, using default.", e);
    }
    return DEFAULT_FIREBASE_CONFIG;
};

// Force Firestore to be aggressive on visibility change
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const now = new Date().toISOString();
            console.log(`[InstantSync] App Resumed at ${now} - Forcing Sync...`);
            // We can 'poke' firestore by enabling/disabling network if really needed, 
            // but just logging often wakes up the thread.
            // firebase.firestore().enableNetwork(); 
        }
    });
}

// Initialize Firebase once
firebaseService.initFirebase(getActiveFirebaseConfig());

export const useAppData = (showNotify: (msg: string, type: 'success' | 'error' | 'info') => void) => {

    // Initial states are empty (Async Load)
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);

    // Other states remain default or light
    const [passwordResetRequests, setPasswordResetRequests] = useState<{ phone: string; requestedAt: Date }[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [manualDailies, setManualDailies] = useState<ManualDaily[]>([]);

    // Configs
    const [sliderConfig, setSliderConfig] = useState<SliderConfig>({ isEnabled: true });
    // Global Counters (for ID generation)
    const [globalCounters, setGlobalCounters] = useState<any>({});
    const [pointsConfig, setPointsConfig] = useState<{ pointsPerCurrency: number; currencyPerPoint: number; isPointsEnabled?: boolean }>({
        pointsPerCurrency: 1,
        currencyPerPoint: 0.1,
        isPointsEnabled: true
    });

    const [appConfig, setAppConfig] = useState<AppConfig>(() => SafeLocalStorage.get('app_config_cache', { appName: 'GOO NOW', appVersion: 'VERSION 1.0.5' }));

    const [updateConfig, setUpdateConfig] = useState<UpdateConfig | null>(null);
    const [showUpdate, setShowUpdate] = useState(false);

    // LOADING IS TRUE INITIALLY
    const [isLoading, setIsLoading] = useState(true);

    // Track previous orders to detect NEW ones
    const prevOrdersRef = useRef<number>(0);

    const [currentUser, setCurrentUser] = useState<User | null>(() => SafeLocalStorage.get('currentUser', null));

    const [appTheme, setAppTheme] = useState<AppTheme>(() => SafeLocalStorage.get('app_theme', { driver: { icons: {} }, merchant: { icons: {} }, admin: { mode: 'dark' }, customer: { icons: {}, mode: 'dark' } }));

    // Granular Loading States to ensure we don't show "All 0s"
    const [isOrdersLoaded, setIsOrdersLoaded] = useState(false);

    // Async Restoration Logic (The Fix for Quota/Crash)
    useEffect(() => {
        const loadCache = async () => {
            const [cUsers, cOrders, cMsgs, cSlider] = await Promise.all([
                AppStorage.get<User[]>('cache_users', []),
                AppStorage.get<Order[]>('cache_orders', []),
                AppStorage.get<Message[]>('cache_messages', []),
                AppStorage.get<SliderImage[]>('cache_slider', [])
            ]);

            // Only update if we have data to avoid unnecessary renders of empty arrays
            if (cUsers.length) setUsers(cUsers);

            // Load cached orders for EVERYONE initially
            // This gives admin/supervisors instant data
            // For drivers/merchants, we avoid stale cache to ensure deleted orders vanish (Zombie Fix)
            if (cOrders.length) {
                // If we know the role from local storage init, use it.
                // We access the initial state of currentUser directly if possible or check storage again?
                // Using the variable from closure might be tricky if it changes, but this effect runs ONCE.
                // A safer bet is checking the parsed currentUser from localStorage if available.
                const savedUser = SafeLocalStorage.get('currentUser', null);
                const role = savedUser?.role;

                if (role === 'admin' || role === 'supervisor') {
                    setOrders(cOrders);
                    setIsOrdersLoaded(true);
                } else {
                    // 🛡️ ZOMBIE FIX: For Drivers/Merchants, DO NOT load stale cache!
                    // Wait for network.
                    console.log("[Cache] Skipping stale orders cache for non-admin role to prevent zombie data.");
                }
            }

            if (cMsgs.length) setMessages(cMsgs);
            if (cSlider.length) setSliderImages(cSlider);

            // LOGIC CHANGE: We DO NOT set isLoading(false) unconditionally here.
            // If cache is empty, we MUST wait for the network to prevent "Zero State" scare.
            // However, to support "Weak Network" replay, if we HAVE critical data (Users), we open.
            if (cUsers.length > 0) {
                setIsLoading(false);
            }
        };
        loadCache();
    }, []);

    // Font Injection Effect
    useEffect(() => {
        const styleId = 'custom-app-font';
        let style = document.getElementById(styleId);

        if (appConfig.customFont) {
            if (!style) {
                style = document.createElement('style');
                style.id = styleId;
                document.head.appendChild(style);
            }
            style.innerHTML = `
                @font-face {
                    font-family: 'AppCustomFont';
                    src: url('${appConfig.customFont}') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                }
                :root, body, html, * {
                    font-family: 'AppCustomFont', 'Cairo', sans-serif !important;
                }
                input, textarea, select, button, h1, h2, h3, h4, h5, h6, span, p, div, a {
                    font-family: 'AppCustomFont', 'Cairo', sans-serif !important;
                }
            `;
        } else {
            if (style) style.remove();
        }
    }, [appConfig.customFont]);

    // Data Subscriptions
    useEffect(() => {
        const unsubUsers = firebaseService.subscribeToCollection('users', (data) => {
            setUsers(data as User[]);
            AppStorage.set('cache_users', data); // ASYNC STORAGE
            setIsLoading(false); // Network returned users, we can enter.

            if (currentUser) {
                const updatedMe = data.find((u: User) => u.id === currentUser.id);

                if (updatedMe && updatedMe.status === 'blocked') {
                    setCurrentUser(null);
                    SafeLocalStorage.remove('currentUser');
                    logoutAndroid();
                    showNotify('⛔ تم حظر حسابك من قبل الإدارة. يرجى عدم إنشاء حساب جديد.', 'error');
                    return;
                }

                if (updatedMe && updatedMe.status === 'suspended') {
                    // 🛑 Suspended User Logic: Keep logged in but show NOTHING
                    setCurrentUser(updatedMe); // Update local user to reflected suspended status
                    SafeLocalStorage.set('currentUser', firebaseService.deepClean(updatedMe));

                    // CLEAR ALL DATA so the app looks empty
                    setOrders([]);
                    setUsers([]); // Only see self effectively
                    setMessages([]);
                    return; // Stop processing further
                }

                if (updatedMe && safeStringify(updatedMe) !== safeStringify(currentUser)) {
                    setCurrentUser(updatedMe);
                    SafeLocalStorage.set('currentUser', firebaseService.deepClean(updatedMe));
                }
            }
        });

        // ... existing user subscription ...

        // 🛑 SUSPENSION GUARD: If suspended, DO NOT subscribe to anything else.
        if (currentUser?.status === 'suspended') {
            setOrders([]);
            setMessages([]);
            setPayments([]);
            setSliderImages([]);
            setAuditLogs([]);

            // Clear Cache to prevent flash on restart
            AppStorage.set('cache_orders', []);
            AppStorage.set('cache_messages', []);
            AppStorage.set('cache_slider', []);

            // We ONLY keep 'users' subscription (defined above) to detect when we get reactivated.
            return () => {
                unsubUsers();
            };
        }

        // SMART DATA SUBSCRIPTION FOR ORDERS
        let unsubOrders = () => { };

        if (!currentUser) {
            // Not logged in yet? Load ALL orders preemptively
            // This ensures admin/supervisor sees data immediately after login
            // For other roles, this will be filtered/refined after login
            unsubOrders = firebaseService.subscribeToCollection('orders', (data) => {
                setOrders(data as Order[]);
                AppStorage.set('cache_orders', data);
                setIsOrdersLoaded(true);
            });
        } else if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
            // 👑 Admin/Supervisor: See EVERYTHING (Firehose)
            unsubOrders = firebaseService.subscribeToCollection('orders', (data) => {
                setOrders(data as Order[]);
                AppStorage.set('cache_orders', data);
                setIsOrdersLoaded(true);
            });
        } else if (currentUser.role === 'merchant') {
            // 🏪 Merchant: See only orders from MY store
            // CRITICAL: Clear cache to prevent "Deleted" orders from showing up from local storage
            if (prevOrdersRef.current === 0) {
                setOrders([]);
                AppStorage.set('cache_orders', []);
            }

            unsubOrders = firebaseService.subscribeToQuery('orders', [
                { field: 'merchantId', op: '==', value: currentUser.id }
            ], (data) => {
                setOrders(data as Order[]);
                AppStorage.set('cache_orders', data);
                setIsOrdersLoaded(true);
            });
        } else if (currentUser.role === 'customer') {
            // 👤 Customer: See only MY orders
            // Note: Storing phone in 'customer.phone' in order object
            unsubOrders = firebaseService.subscribeToQuery('orders', [
                { field: 'customer.phone', op: '==', value: currentUser.phone }
            ], (data) => {
                setOrders(data as Order[]);
                AppStorage.set('cache_orders', data);
                setIsOrdersLoaded(true);
            });
        } else if (currentUser.role === 'driver') {
            // 🛵 Driver: Hybrid View (Pending + Mine)
            // CRITICAL: Clear cached orders first to prevent flash of stale data
            setOrders([]);
            AppStorage.set('cache_orders', []);

            // We need two subscriptions and merge them unique by ID.

            const pendingOrdersMap = new Map<string, Order>();
            const myOrdersMap = new Map<string, Order>();

            const updateDriverOrders = () => {
                const merged = [...Array.from(pendingOrdersMap.values()), ...Array.from(myOrdersMap.values())];
                // Deduplicate just in case an order is both (rare race condition)
                let unique = Array.from(new Map(merged.map(item => [item.id, item])).values());

                // 🛡️ RE-INJECT MISSING STICKY ORDERS
                // If an order is in pendingWrites (optimistically updated) but vanished from both streams
                // (e.g. removed from 'Pending' but not yet in 'My Orders'), force it back.
                pendingWrites.current.forEach((info, id) => {
                    if (info.fallbackOrder && !unique.find(o => o.id === id)) {
                        // Re-construct the order from fallback + updates
                        unique.push({ ...info.fallbackOrder, ...info.updates });
                    }
                });

                // 🌟 sticky UPDATE LOGIC: Override server data with pending optimistic data
                unique = unique.map(order => {
                    const pending = pendingWrites.current.get(order.id);
                    if (pending) {
                        // If we have a pending update, FORCE the pending fields locally
                        // This ignores the stale server data for these specific fields
                        if (Date.now() - pending.timestamp < 5000) {
                            return { ...order, ...pending.updates };
                        } else {
                            pendingWrites.current.delete(order.id); // Expired
                        }
                    }
                    return order;
                });

                // Sort by date (Newest first for UI usually, but DriverApp sorts manually)
                setOrders(unique);
                AppStorage.set('cache_orders', unique);
                setIsOrdersLoaded(true);

                // DETECT NEW ORDERS - LIGHTNING SPEED
                pointsConfig; // dummy ref
                if (unique.length > prevOrdersRef.current && prevOrdersRef.current !== 0) {
                    console.log("[InstantSync] 🔔 New Order Detected!");
                }
                prevOrdersRef.current = unique.length;
            };

            // 1. Subscribe to ALL Pending orders (The Pool)
            const unsubPending = firebaseService.subscribeToQuery('orders', [
                { field: 'status', op: '==', value: OrderStatus.Pending }
            ], (data) => {
                pendingOrdersMap.clear();
                data.forEach(o => pendingOrdersMap.set(o.id, o as Order));
                updateDriverOrders();
            });

            // 2. Subscribe to MY orders (The Work)
            const unsubMyWork = firebaseService.subscribeToQuery('orders', [
                { field: 'driverId', op: '==', value: currentUser.id }
            ], (data) => {
                myOrdersMap.clear();
                data.forEach(o => myOrdersMap.set(o.id, o as Order));
                updateDriverOrders();
            });

            unsubOrders = () => {
                unsubPending();
                unsubMyWork();
            };
        } else {
            // Fallback for unknown roles (e.g. initial state)
            setOrders([]);
            setIsOrdersLoaded(true);
        }

        const unsubMsgs = firebaseService.subscribeToCollection('messages', (data) => {
            setMessages(data as Message[]);
            AppStorage.set('cache_messages', data); // ASYNC STORAGE
        });

        const unsubPayments = firebaseService.subscribeToCollection('payments', (data) => setPayments(data as Payment[]));
        const unsubReset = firebaseService.subscribeToCollection('reset_requests', (data) => setPasswordResetRequests(data as any));

        const unsubSlider = firebaseService.subscribeToCollection('slider_images', (data) => {
            setSliderImages(data as SliderImage[]);
            AppStorage.set('cache_slider', data); // ASYNC STORAGE
        });

        const unsubAudit = firebaseService.subscribeToCollection('audit_logs', (data) => setAuditLogs(data as AuditLog[]));
        const unsubManualDailies = firebaseService.subscribeToCollection('manual_dailies', (data) => setManualDailies(data as ManualDaily[]));

        const unsubSettings = firebaseService.subscribeToCollection('settings', (data) => {
            const sConf = data.find(s => s.id === 'slider_config');
            if (sConf) setSliderConfig(sConf as SliderConfig);
            else setSliderConfig({ isEnabled: true });

            const counters = data.find(s => s.id === 'counters');
            if (counters) setGlobalCounters(counters);

            const pConf = data.find(s => s.id === 'points_config');
            if (pConf) {
                setPointsConfig(prev => ({
                    pointsPerCurrency: pConf.pointsPerCurrency ?? 1,
                    currencyPerPoint: pConf.currencyPerPoint ?? 0.1,
                    isPointsEnabled: pConf.isPointsEnabled ?? true
                }));
            }

            const aConf = data.find(s => s.id === 'app_config');
            if (aConf) {
                const newAppConfig = {
                    appName: aConf.appName || 'GOO NOW',
                    appVersion: aConf.appVersion || 'VERSION 1.0.5',
                    customFont: aConf.customFont,
                    games: aConf.games || [], // Fix: Load games from config
                    isGamesEnabled: aConf.isGamesEnabled // Fix: Load games toggle state
                };
                setAppConfig(newAppConfig);
                SafeLocalStorage.set('app_config_cache', newAppConfig);
            }

            const updateData = data.find(s => s.id === 'app_update');
            if (updateData) {
                const conf = updateData as unknown as UpdateConfig;
                setUpdateConfig(conf);

                const localVer = '2.0.0'; // HARDCODED BUILD VERSION

                // DEBUG: Show what we're checking
                const debugInfo = `
🔍 فحص التحديث:
━━━━━━━━━━━━━
📦 الإصدار المحلي: ${localVer}
📦 الإصدار البعيد: ${conf.version}
━━━━━━━━━━━━━
✅ التحديث نشط: ${conf.isActive ? 'نعم' : 'لا'}
✅ فرض التحديث: ${conf.forceUpdate ? 'نعم' : 'لا'}
━━━━━━━━━━━━━
👥 الأدوار المستهدفة: ${conf.target_roles?.join(', ') || 'الكل'}
👤 دورك الحالي: ${currentUser?.role || 'غير معرّف'}
                `.trim();

                console.log('[UPDATE CHECK]', debugInfo);

                if (conf.isActive && conf.version !== localVer) {
                    // 1. Check Target Roles
                    if (conf.target_roles && Array.isArray(conf.target_roles) && conf.target_roles.length > 0) {
                        const userRole = currentUser?.role;
                        if (!userRole || !conf.target_roles.includes(userRole)) {
                            console.log('[UPDATE CHECK] ❌ User role not in target roles. Skipping update.');
                            return;
                        }
                    }

                    // 2. Version Comparison
                    const cleanRemote = conf.version.toLowerCase().replace(/[^0-9.]/g, '');
                    const cleanLocal = localVer.toLowerCase().replace(/[^0-9.]/g, '');

                    const remoteParts = cleanRemote.split('.').map(Number);
                    const localParts = cleanLocal.split('.').map(Number);

                    let isRemoteNewer = false;
                    const len = Math.max(remoteParts.length, localParts.length);

                    for (let i = 0; i < len; i++) {
                        const r = remoteParts[i] || 0;
                        const l = localParts[i] || 0;
                        if (r > l) { isRemoteNewer = true; break; }
                        if (r < l) { isRemoteNewer = false; break; }
                    }

                    if (isRemoteNewer || (conf.forceUpdate && conf.version === localVer)) {
                        const skippedVersion = localStorage.getItem('skipped_update_version');
                        console.log('[UPDATE CHECK] Skipped version in storage:', skippedVersion);

                        if (conf.forceUpdate || skippedVersion !== conf.version) {
                            console.log('[UPDATE CHECK] ✅ SHOWING UPDATE SCREEN');
                            setShowUpdate(true);
                        } else {
                            console.log('[UPDATE CHECK] ❌ User already skipped this version');
                        }
                    } else {
                        console.log('[UPDATE CHECK] ❌ Remote version is not newer');
                    }
                } else if (conf.isActive && conf.forceUpdate && conf.version === localVer) {
                    console.log('[UPDATE CHECK] ✅ Force update for same version - SHOWING UPDATE SCREEN');
                    setShowUpdate(true);
                } else {
                    console.log('[UPDATE CHECK] ❌ Update not active or version matches');
                }
            }
        });

        return () => {
            unsubUsers(); unsubOrders(); unsubMsgs(); unsubPayments(); unsubReset(); unsubSlider(); unsubSettings(); unsubAudit(); unsubManualDailies();
        };
    }, [currentUser?.id, currentUser?.role, currentUser?.status, appConfig.appVersion]);

    useEffect(() => {
        if (currentUser) setAndroidRole(currentUser.role, currentUser.id);
    }, [currentUser?.id]);

    // Safety Timeout
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                console.warn("Loading timeout reached.");
                setIsLoading(false);
            }
        }, 30000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    // STICKY UPDATES LOGIC (Prevent Flicker)
    const pendingWrites = useRef<Map<string, { updates: any, timestamp: number, fallbackOrder?: Order }>>(new Map());

    const registerOptimisticUpdate = (id: string, updates: any, fallbackOrder?: Order) => {
        pendingWrites.current.set(id, { updates, timestamp: Date.now(), fallbackOrder });
        // Auto-cleanup after 5 seconds
        setTimeout(() => {
            if (pendingWrites.current.has(id)) {
                pendingWrites.current.delete(id);
            }
        }, 5000);
    };

    return {
        users, orders, messages, payments, sliderImages, auditLogs, manualDailies, passwordResetRequests,
        sliderConfig, pointsConfig, appConfig, updateConfig, showUpdate, setShowUpdate,
        globalCounters, // Exposed for Optimistic ID generation
        isLoading, setIsLoading, isOrdersLoaded,
        currentUser, setCurrentUser,
        appTheme, setAppTheme,
        setOrders, setUsers, // Exposed for Optimistic Updates
        registerOptimisticUpdate, // Exposed to App.tsx
        pendingWrites // Exposed if needed, but preferably internal use validation
    };
};
