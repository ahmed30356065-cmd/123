
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// استرجاع الإعدادات الافتراضية كاحتياط، لكن الكود يعتمد بشكل أساسي على التهيئة الديناميكية من التطبيق الرئيسي
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCzclhrtHAI4lNfqHaKJ6wh-Qr-skoPaZQ",
  authDomain: "goo-now3.firebaseapp.com",
  databaseURL: "https://goo-now3-default-rtdb.firebaseio.com",
  projectId: "goo-now3",
  storageBucket: "goo-now3.firebasestorage.app",
  messagingSenderId: "966566737002",
  appId: "1:966566737002:android:7ef09d74e85403d3154613"
};

if (!firebase.apps.length) {
  firebase.initializeApp(DEFAULT_FIREBASE_CONFIG);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Check if this is a Silent Sync Message (Method 2)
  if (payload.data && payload.data.sync_data === "true") {
    console.log('[firebase-messaging-sw.js] Silent Sync Triggered. Waking up background threads.');
    // We don't necessarily show a notification for silent syncs
    // This wakes up the SW and allows it to perform background tasks if needed.
    if (payload.data.wake_up !== "true") return;
  }

  const notificationTitle = payload.notification?.title || payload.data?.title || 'GOO NOW';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'لديك تحديث جديد',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: payload.data, // ضروري للتوجيه عند النقر
    tag: payload.data?.targetId || 'general',
    renotify: true,
    requireInteraction: true // Important for visibility
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// معالجة النقر على الإشعار (مكررة هنا للضمان)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let targetUrl = event.notification.data?.url || '/';

  if (!targetUrl.startsWith('http')) {
    targetUrl = self.registration.scope.replace(/\/$/, '') + targetUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          if (targetUrl !== client.url) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
