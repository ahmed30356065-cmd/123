
import { useState, useEffect } from 'react';
import { User, Order, Message, SliderImage, SliderConfig, AuditLog, AppConfig, UpdateConfig, AppTheme, Payment } from '../types';
import * as firebaseService from '../services/firebase';
import { setAndroidRole, safeStringify, NativeBridge, logoutAndroid } from '../utils/NativeBridge';

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

// Initialize Firebase once
firebaseService.initFirebase(getActiveFirebaseConfig());

export const useAppData = (showNotify: (msg: string, type: 'success' | 'error' | 'info') => void) => {
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [passwordResetRequests, setPasswordResetRequests] = useState<{ phone: string; requestedAt: Date }[]>([]);
    const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    // Configs
    const [sliderConfig, setSliderConfig] = useState<SliderConfig>({ isEnabled: true });
    const [pointsConfig, setPointsConfig] = useState<{ pointsPerCurrency: number; currencyPerPoint: number; isPointsEnabled?: boolean }>({
        pointsPerCurrency: 1,
        currencyPerPoint: 0.1,
        isPointsEnabled: true
    });

    const [appConfig, setAppConfig] = useState<AppConfig>(() => {
        try {
            const saved = localStorage.getItem('app_config_cache');
            if (saved) return JSON.parse(saved);
        } catch { }
        return { appName: 'GOO NOW', appVersion: 'VERSION 1.0.5' };
    });

    const [updateConfig, setUpdateConfig] = useState<UpdateConfig | null>(null);
    const [showUpdate, setShowUpdate] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try { const saved = localStorage.getItem('currentUser'); return saved ? JSON.parse(saved) : null; } catch { return null; }
    });

    const [appTheme, setAppTheme] = useState<AppTheme>(() => {
        try { const saved = localStorage.getItem('app_theme'); if (saved) return JSON.parse(saved); } catch { }
        return { driver: { icons: {} }, merchant: { icons: {} }, admin: { mode: 'dark' }, customer: { icons: {}, mode: 'dark' } };
    });

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
            setIsLoading(false);

            if (currentUser) {
                const updatedMe = data.find((u: User) => u.id === currentUser.id);

                if (updatedMe && updatedMe.status === 'blocked') {
                    setCurrentUser(null);
                    localStorage.removeItem('currentUser');
                    logoutAndroid();
                    showNotify('⛔ تم حظر حسابك من قبل الإدارة. يرجى عدم إنشاء حساب جديد.', 'error');
                    return;
                }

                if (updatedMe && safeStringify(updatedMe) !== safeStringify(currentUser)) {
                    setCurrentUser(updatedMe);
                    localStorage.setItem('currentUser', safeStringify(firebaseService.deepClean(updatedMe)));
                }
            }
        });

        const unsubOrders = firebaseService.subscribeToCollection('orders', (data) => setOrders(data as Order[]));
        const unsubMsgs = firebaseService.subscribeToCollection('messages', (data) => setMessages(data as Message[]));
        const unsubPayments = firebaseService.subscribeToCollection('payments', (data) => setPayments(data as Payment[]));
        const unsubReset = firebaseService.subscribeToCollection('reset_requests', (data) => setPasswordResetRequests(data as any));
        const unsubSlider = firebaseService.subscribeToCollection('slider_images', (data) => setSliderImages(data as SliderImage[]));
        const unsubAudit = firebaseService.subscribeToCollection('audit_logs', (data) => setAuditLogs(data as AuditLog[]));

        const unsubSettings = firebaseService.subscribeToCollection('settings', (data) => {
            const sConf = data.find(s => s.id === 'slider_config');
            if (sConf) setSliderConfig(sConf as SliderConfig);
            else setSliderConfig({ isEnabled: true });

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
                    customFont: aConf.customFont
                };
                setAppConfig(newAppConfig);
                localStorage.setItem('app_config_cache', JSON.stringify(newAppConfig));
            }

            const updateData = data.find(s => s.id === 'app_update');
            if (updateData) {
                const conf = updateData as unknown as UpdateConfig;
                setUpdateConfig(conf);

                // STRICT VERSION CHECK LOGIC
                // Only show update if Remote Version > Local Version (CURRENT_APP_VERSION)
                // We use a simple semantic version comparator or string comparison if format is consistent
                const localVer = '2.0.0'; // HARDCODED BUILD VERSION

                if (conf.isActive && conf.version !== localVer) {
                    // Check Target Roles
                    if (conf.target_roles && Array.isArray(conf.target_roles) && conf.target_roles.length > 0) {
                        const userRole = currentUser?.role;
                        if (!userRole || !conf.target_roles.includes(userRole)) {
                            return;
                        }
                    }

                    // Normalize versions for comparison (remove 'v', 'version', spaces)
                    const cleanRemote = conf.version.toLowerCase().replace(/[^0-9.]/g, '');
                    const cleanLocal = localVer.toLowerCase().replace(/[^0-9.]/g, '');

                    // Simple numeric comparison for semver "Major.Minor.Patch" (e.g. 1.0.6 vs 1.0.7)
                    // We split by '.' and compare each segment numerically to avoid string sorting issues (e.g. "1.10" < "1.2" in string sort)
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
                        if (conf.forceUpdate || skippedVersion !== conf.version) {
                            setShowUpdate(true);
                        }
                    }
                } else if (conf.isActive && conf.forceUpdate && conf.version === localVer) {
                    // Explicit handling for same-version forced updates (e.g. testing)
                    setShowUpdate(true);
                }
            }
        });

        return () => {
            unsubUsers(); unsubOrders(); unsubMsgs(); unsubPayments(); unsubReset(); unsubSlider(); unsubSettings(); unsubAudit();
        };
    }, [currentUser?.id, currentUser?.role, appConfig.appVersion]);

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

    return {
        users, orders, messages, payments, sliderImages, auditLogs, passwordResetRequests,
        sliderConfig, pointsConfig, appConfig, updateConfig, showUpdate, setShowUpdate,
        isLoading, setIsLoading,
        currentUser, setCurrentUser,
        appTheme, setAppTheme
    };
};
