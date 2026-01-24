
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// استرجاع الإعدادات الافتراضية كاحتياط، لكن الكود يعتمد بشكل أساسي على التهيئة الديناميكية من التطبيق الرئيسي
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyC4bv_RLpS-jxunMs7nWjux806bYk6XnVY",
    authDomain: "goo-now-1ce44.firebaseapp.com",
    databaseURL: "https://goo-now-1ce44-default-rtdb.firebaseio.com",
    projectId: "goo-now-1ce44",
    storageBucket: "goo-now-1ce44.firebasestorage.app",
    messagingSenderId: "742306376566",
    appId: "1:742306376566:android:9298a84980b239e528a857"
};

if (!firebase.apps.length) {
    firebase.initializeApp(DEFAULT_FIREBASE_CONFIG);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
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
