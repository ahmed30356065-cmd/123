
declare global {
    interface Window {
        Android?: {
            showAndroidNotification: (title: string, body: string) => void;
            playNotificationSound?: () => void;
            vibrate?: (duration: number) => void;
            onLoginSuccess?: (userJson: string) => void;
            onContextChange?: (context: string) => void;
            setAppRole?: (role: string) => void;
            subscribeToTopic?: (topic: string) => void;
            unsubscribeFromTopic?: (topic: string) => void;
            setActiveNotificationChannel?: (channelId: string) => void;
            onLogout?: (userId?: string, role?: string) => void;
        };
        // JS Interface injected by WebView.addJavascriptInterface
        AndroidSplash?: {
            hideSplash: () => void;
            showSplash: () => void;
        };
        handleAndroidBack?: () => boolean;
        onBackPressed?: () => boolean;
    }
}

export const safeStringify = (obj: any): string => {
    try {
        const cache = new Set();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) return '[Circular]';
                cache.add(value);
            }
            return value;
        });
    } catch (e) {
        return "{}";
    }
};

const backHandlers: Array<() => boolean> = [];

export const NativeBridge = {
    isAndroid: (): boolean => typeof window !== 'undefined' && !!window.Android,

    // Improved Subscription logic for Back Button (LIFO)
    subscribeBackHandler: (handler: () => boolean) => {
        // Remove if exists to re-add at the end (LIFO priority)
        const index = backHandlers.indexOf(handler);
        if (index > -1) {
            backHandlers.splice(index, 1);
        }
        backHandlers.push(handler);

        return () => {
            const idx = backHandlers.indexOf(handler);
            if (idx > -1) backHandlers.splice(idx, 1);
        };
    },

    handleBackPress: (): boolean => {
        // Iterate from the end (Top of the stack)
        // The last registered handler gets the first chance to handle the back press
        for (let i = backHandlers.length - 1; i >= 0; i--) {
            const handler = backHandlers[i];
            if (handler && typeof handler === 'function') {
                const handled = handler();
                if (handled) {
                    console.log(`[NativeBridge] Back press handled by listener at index ${i}`);
                    return true; // Stop propagation if handled
                }
            }
        }
        console.log('[NativeBridge] Back press NOT handled by any listener. Default Android behavior.');
        return false; // Let Android handle it (e.g. exit app)
    },

    showNotification: (title: string, body: string) => {
        if (NativeBridge.isAndroid()) {
            try { window.Android?.showAndroidNotification(title, body); } catch (e) { }
        }
    },

    playSound: () => {
        if (NativeBridge.isAndroid()) window.Android?.playNotificationSound?.();
    },

    reportContext: (context: string) => {
        if (NativeBridge.isAndroid()) window.Android?.onContextChange?.(context);
    },

    loginSuccess: (user: any) => {
        if (NativeBridge.isAndroid()) {
            console.log('[NativeBridge] Reporting Login Success to Android');
            window.Android?.onLoginSuccess?.(safeStringify(user));
        }
    },

    hideSplashScreen: () => {
        console.log("NativeBridge: Requesting Splash Hide");
        if (typeof window !== 'undefined' && window.AndroidSplash) {
            console.log('[NativeBridge] Hiding Native Splash Screen');
            window.AndroidSplash.hideSplash();
        }
    }
};

if (typeof window !== 'undefined') {
    // Expose handlers for Android WebView
    window.handleAndroidBack = NativeBridge.handleBackPress;
    window.onBackPressed = NativeBridge.handleBackPress;
}

export const setAndroidRole = (role: string, userId?: string) => {
    if (NativeBridge.isAndroid()) {
        console.log(`[NativeBridge] Configuring Role: ${role}, ID: ${userId}`);

        // 1. Tell Android about the UI Role
        window.Android?.setAppRole?.(role);

        // 2. Logic to map App Roles to Notification Channels/Topics
        let effectiveRole = role;
        if (role === 'customer') effectiveRole = 'user';
        // REMOVED: if (role === 'supervisor') effectiveRole = 'admin'; -> Supervisors now have their own identity

        // CRITICAL FIX: Unsubscribe from ALL other potential roles first
        // This prevents "Topic Leaks" if a user switches accounts without proper logout
        // We explicitly unsubscribe to ensure clean state
        const allTopics = [
            'admin', 'drivers', 'merchants', 'users', 'driver', 'merchant', 'user', 'supervisor', 'supervisors',
            'admin_v2', 'drivers_v2', 'merchants_v2', 'users_v2', 'supervisors_v2', 'all_users_v2'
        ];
        allTopics.forEach(t => {
            if (window.Android?.unsubscribeFromTopic) {
                try { window.Android.unsubscribeFromTopic(t); } catch (e) { }
            }
        });

        // Anti-Leak: If I am a merchant, I must NOT listen to driver channels
        if (effectiveRole === 'merchant' && userId) {
            const forbiddenTopic = `driver_${userId}`;
            window.Android?.unsubscribeFromTopic?.(forbiddenTopic);
        }
        // Anti-Leak: If I am a driver, I must NOT listen to merchant channels
        if (effectiveRole === 'driver' && userId) {
            const forbiddenTopic = `merchant_${userId}`;
            window.Android?.unsubscribeFromTopic?.(forbiddenTopic);
        }

        const channels: string[] = [];

        // 3. General Role Channel
        let generalTopic = '';
        if (effectiveRole === 'admin') {
            generalTopic = 'admin_v2'; // Admin channel is singular 'admin'
        } else {
            // user -> users, driver -> drivers, merchant -> merchants, supervisor -> supervisors
            generalTopic = effectiveRole + 's_v2';
        }

        if (generalTopic) {
            window.Android?.subscribeToTopic?.(generalTopic);
            channels.push(generalTopic);
        }

        // 4. Private User Channel
        if (userId) {
            // Format: role_id_v2 (e.g. driver_123_v2)
            const privateChannelId = `${effectiveRole}_${userId}_v2`;
            window.Android?.subscribeToTopic?.(privateChannelId);

            // Critical: Tell Android this is the MAIN active channel for High Priority notifications
            window.Android?.setActiveNotificationChannel?.(privateChannelId);
            channels.push(privateChannelId);

            // Legacy/Backup: Subscribe to raw ID (Only if not admin to avoid noise)
            if (effectiveRole !== 'admin') {
                // window.Android?.subscribeToTopic?.(userId);
            }
        }

        // 5. Global Broadcast
        window.Android?.subscribeToTopic?.('all_users_v2');
        channels.push('all_users_v2');

        console.log(`[NativeBridge] Active Notification Channels: ${channels.join(', ')}`);

        // DEBUG: Tell the User what's happening
        // "System: Active Channels: merchants, merchant_123, all_users"

    }
};

export const logoutAndroid = (userId?: string, role?: string) => {
    if (NativeBridge.isAndroid()) {
        console.log(`[NativeBridge] Logging out from Android Native layer. ID: ${userId}, Role: ${role}`);
        // This triggers the native side to unsubscribe from all topics
        // We pass ID and Role to allow specific topic unsubscription (e.g. driver_123)
        window.Android?.onLogout?.(userId, role);
    }
};
