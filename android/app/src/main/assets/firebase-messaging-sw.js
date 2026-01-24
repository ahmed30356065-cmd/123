importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const DEFAULT_CONFIG = {
    apiKey: "AIzaSyC4bv_RLpS-jxunMs7nWjux806bYk6XnVY",
    authDomain: "goo-now-1ce44.firebaseapp.com",
    projectId: "goo-now-1ce44",
    storageBucket: "goo-now-1ce44.firebasestorage.app",
    messagingSenderId: "742306376566",
    appId: "1:742306376566:android:9298a84980b239e528a857"
};

// Listen for custom config from main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        const config = event.data.config;
        if (firebase.apps.length === 0) {
            firebase.initializeApp(config);
            const messaging = firebase.messaging();
            setupMessaging(messaging);
        }
    }
});

// Fallback initialization
if (firebase.apps.length === 0) {
    firebase.initializeApp(DEFAULT_CONFIG);
    const messaging = firebase.messaging();
    setupMessaging(messaging);
}

function setupMessaging(messaging) {
    messaging.onBackgroundMessage(function (payload) {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);

        // Normalize payload data
        const notificationTitle = payload.notification?.title || payload.data?.title || 'تنبيه جديد';
        const notificationBody = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';
        const icon = '/icon.png';

        const notificationOptions = {
            body: notificationBody,
            icon: icon,
            badge: icon,
            data: payload.data,
            // Typical for FCM HTTP v1 'click_action'
            actions: [],
            tag: payload.data?.tag || 'default-tag'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Handle click - open window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            const urlToOpen = event.notification.data?.url || '/';
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
