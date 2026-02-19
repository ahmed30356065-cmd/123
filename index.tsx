import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { DEFAULT_FIREBASE_CONFIG } from './hooks/useAppData';
import './index.css';
import { NativeBridge } from './utils/NativeBridge';

// 🔙 الربط المباشر لزر الرجوع مع نظام الأندرويد لعدة مسميات محتملة
const globalHandler = () => {
  return NativeBridge.handleBackPress();
};

(window as any).handleAndroidBack = globalHandler;
(window as any).onBackPressed = globalHandler;

// 📳 Global Haptic Feedback for Touch Interaction
// This adds a subtle vibration on clicks for buttons and interactive elements
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  // Check if the clicked element or its parent is a button or link
  if (target.closest('button') || target.closest('a') || target.closest('.clickable')) {
    if (navigator.vibrate) {
      navigator.vibrate(5); // Extremely short, subtle tick (5ms)
    }
  }
}, { passive: true });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 🚀 تسجيل الـ Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (window.location.protocol === 'blob:' || window.location.protocol === 'file:') return;
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => {
        // Retrieve custom config if available to ensure SW uses the correct project
        const getActiveConfig = () => {
          try {
            const stored = localStorage.getItem('firebase_config');
            if (stored) return JSON.parse(stored);
          } catch (e) { }
          return DEFAULT_FIREBASE_CONFIG;
        };

        const activeConfig = getActiveConfig();

        if (reg.active) {
          reg.active.postMessage({ type: 'FIREBASE_CONFIG', config: activeConfig });
        } else if (reg.installing) {
          reg.installing.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated' && reg.active) {
              reg.active.postMessage({ type: 'FIREBASE_CONFIG', config: activeConfig });
            }
          });
        }
      })
      .catch(err => console.log('[SW] Error:', err));

    // 🔄 Force reload when new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

// 🚨 CRASH REPORTER 🚨
// This will intercept any global errors and display them on the screen
// instead of a black screen.
window.onerror = function (message, source, lineno, colno, error) {
  const errorContainer = document.createElement('div');
  errorContainer.style.position = 'fixed';
  errorContainer.style.top = '0';
  errorContainer.style.left = '0';
  errorContainer.style.width = '100%';
  errorContainer.style.height = '100%';
  errorContainer.style.backgroundColor = '#990000';
  errorContainer.style.color = '#ffffff';
  errorContainer.style.zIndex = '999999';
  errorContainer.style.padding = '20px';
  errorContainer.style.overflow = 'scroll';
  errorContainer.style.fontFamily = 'monospace';
  errorContainer.style.fontSize = '14px';
  errorContainer.style.direction = 'ltr';
  errorContainer.style.textAlign = 'left';

  errorContainer.innerHTML = `
        <h2 style="border-bottom: 2px solid white; padding-bottom: 10px;">⚠️ APP CRASH ⚠️</h2>
        <p><strong>Error:</strong> ${message}</p>
        <p><strong>Source:</strong> ${source}</p>
        <p><strong>Line:</strong> ${lineno}:${colno}</p>
        <pre style="background: rgba(0,0,0,0.3); padding: 10px; white-space: pre-wrap;">${error?.stack || 'No stack trace'}</pre>
    `;

  document.body.appendChild(errorContainer);
  return false;
};

window.addEventListener('unhandledrejection', function (event) {
  const errorContainer = document.createElement('div');
  errorContainer.style.position = 'fixed';
  errorContainer.style.bottom = '0';
  errorContainer.style.left = '0';
  errorContainer.style.width = '100%';
  errorContainer.style.height = '50%';
  errorContainer.style.backgroundColor = '#990000';
  errorContainer.style.color = '#ffffff';
  errorContainer.style.zIndex = '999999';
  errorContainer.style.padding = '20px';
  errorContainer.style.borderTop = '2px solid white';
  errorContainer.style.overflow = 'scroll';

  errorContainer.innerHTML = `
        <h3>⚠️ UNHANDLED PROMISE ⚠️</h3>
        <p>${event.reason}</p>
    `;
  document.body.appendChild(errorContainer);
});

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);