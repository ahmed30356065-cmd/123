
/* 
   GOO NOW - Ultra Performance Service Worker
   Cached Firebase SDKs for 0ms Startup
*/

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const CACHE_NAME = 'delinow-core-v7'; // Version bumped to force update
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/app-icon.png',
  '/public/fonts/ArabicUI.ttf',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // استراتيجية Network First لطلبات الـ API و Cache First للملفات الثابتة
  if (url.hostname.includes('firebaseio.com') || url.pathname.includes('exec') || url.hostname.includes('googleapis.com')) {
    return; // دع الـ SDK يتعامل مع المزامنة
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        if (event.request.destination === 'image' || url.hostname.includes('gstatic') || url.hostname.includes('fonts.googleapis.com')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        }
        return fetchRes;
      });
    })
  );
});

// معالجة الرسائل في الخلفية لضمان عملها في الويب فيو
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    if (!firebase.apps.length) {
      try {
        firebase.initializeApp(event.data.config);
        const messaging = firebase.messaging();

        messaging.onBackgroundMessage((payload) => {
          console.log('[SW] Background message received:', payload);

          // استخراج البيانات بدقة سواء جاءت في notification أو data
          const title = payload.notification?.title || payload.data?.title || 'GOO NOW';
          const body = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';
          const icon = '/vite.svg';

          const notificationOptions = {
            body: body,
            icon: icon,
            badge: icon,
            data: payload.data, // تمرير البيانات لحدث النقر
            tag: payload.data?.targetId || 'general', // تجميع الإشعارات المتشابهة
            renotify: true,
            requireInteraction: true // بقاء الإشعار حتى يتفاعل المستخدم
          };

          return self.registration.showNotification(title, notificationOptions);
        });
      } catch (e) {
        console.error('[SW] Firebase init error:', e);
      }
    }
  }
});

// معالجة النقر على الإشعار لفتح التطبيق وتوجيه المستخدم
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.');

  event.notification.close();

  // الحصول على الرابط من بيانات الإشعار
  let targetUrl = event.notification.data?.url || '/';

  // التأكد من أن الرابط كامل
  if (!targetUrl.startsWith('http')) {
    targetUrl = self.registration.scope.replace(/\/$/, '') + targetUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. محاولة العثور على نافذة مفتوحة للتطبيق
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          // توجيه النافذة الموجودة للرابط الجديد
          if (targetUrl !== client.url) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // 2. إذا لم توجد نافذة مفتوحة، افتح واحدة جديدة
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
