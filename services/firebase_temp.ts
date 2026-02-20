import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/storage';
import 'firebase/compat/database';
import 'firebase/compat/messaging';

import { OrderStatus, AuditLog, AppConfig, UpdateConfig } from '../types';

let db: firebase.firestore.Firestore | undefined;
let auth: firebase.auth.Auth | undefined;
let isSettingsApplied = false;
let isPersistenceAttempted = false;

// Global flag to prevent re-initialization across module reloads if possible
if (typeof window !== 'undefined' && !(window as any).__FIREBASE_SETTINGS_APPLIED__) {
    (window as any).__FIREBASE_SETTINGS_APPLIED__ = false;
}

export const setupRecaptcha = (containerId: string) => {
    if (!auth) auth = firebase.auth();
    return new firebase.auth.RecaptchaVerifier(containerId, {
        'size': 'invisible',
        'callback': () => {
            console.log("[Auth] Recaptcha verified");
        }
    });
};

export const initFirebase = (config: any) => {
    if (!firebase.apps.length) {
        try {
            const app = firebase.initializeApp(config);
            db = app.firestore();
            auth = app.auth();

            if (!isSettingsApplied && (typeof window !== 'undefined' && !(window as any).__FIREBASE_SETTINGS_APPLIED__)) {
                try {
                    // Modern Firestore Settings (Prevent Host Overrides)
                    db.settings({
                        ignoreUndefinedProperties: true,
                    });

                    isSettingsApplied = true;
                    if (typeof window !== 'undefined') (window as any).__FIREBASE_SETTINGS_APPLIED__ = true;

                    // Modern Persistence API (Handle IndexedDB errors gracefully)
                    if (!isPersistenceAttempted) {
                        isPersistenceAttempted = true;
                        db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
                            if (err.code === 'failed-precondition') {
                                console.warn("[Firebase] Persistence failed: Multiple tabs open");
                            } else if (err.code === 'unimplemented') {
                                console.warn("[Firebase] Persistence not supported by browser");
                            } else {
                                console.error("[Firebase] Persistence Unknown Error:", err);
                            }
                        });
                    }
                } catch (e) {
                    console.warn("[Firebase] Firestore settings error (possibly already applied):", e);
                }
            }

            // Proactive Connection Keep-Alive
            firebase.database().ref('.info/connected').on('value', (snap) => {
                if (snap.val() === true) {
                    console.log("[Firebase] Proactive connection established.");
                } else {
                    console.log("[Firebase] Proactive connection lost. Reconnecting...");
                    firebase.database().goOnline();
                }
            });

            return true;
        } catch (error) {
            console.error("Firebase Init Error:", error);
            return false;
        }
    } else {
        // Already initialized, ensure references are set
        if (!db) db = firebase.app().firestore();
        if (!auth) auth = firebase.app().auth();
        return true;
    }
};

// ... Rest of the file should be intact if I only replace initFirebase,
// but since I don't trust small edits now, I'll read the rest first or use a safer tool.
