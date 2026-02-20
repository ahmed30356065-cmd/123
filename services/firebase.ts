
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/messaging';
import 'firebase/compat/auth';
import 'firebase/compat/storage';
import 'firebase/compat/database';
import { getFcmV1AccessToken, SERVICE_ACCOUNT } from '../utils/FirebaseServiceAccount';
import { AuditLog } from '../types';

let db: firebase.firestore.Firestore | undefined;
let auth: firebase.auth.Auth | undefined;
let isSettingsApplied = false;

// Global flag to prevent re-initialization across module reloads
if (typeof window !== 'undefined' && !(window as any).__FIREBASE_SETTINGS_APPLIED__) {
    (window as any).__FIREBASE_SETTINGS_APPLIED__ = false;
}

export const setupRecaptcha = (containerId: string) => {
    if (!auth) auth = firebase.auth();
    return new firebase.auth.RecaptchaVerifier(containerId, {
        'size': 'invisible',
        'callback': () => {
            console.log("Recaptcha resolved");
        }
    });
};


// NativeBridge is handled in NativeBridge.ts & firebase.ts
declare global {
    interface Window {
        onPhoneAuthCodeSent?: (verificationId: string) => void;
        onPhoneAuthAutoRetrieval?: (code: string) => void;
        onPhoneAuthSuccess?: (userJson: string) => void;
        onPhoneAuthError?: (error: string) => void;
        onPhoneAuthCodeSentInjected?: (verificationId: string) => void;
        Android?: any;
    }
}

export const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: firebase.auth.RecaptchaVerifier) => {
    console.log(`[PhoneAuth] Initiating for ${phoneNumber}...`);

    const enableSimulation = true;

    if (enableSimulation) {
        console.log("[PhoneAuth] Using Simulation Mode (Bypassing Billing/SMS)");
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    confirmationResult: {
                        verificationId: "simulated-verification-id-" + Date.now(),
                        confirm: async (code: string) => {
                            if (code === '123456') {
                                console.log("[PhoneAuth] Simulation Code Valid. Signing in anonymously...");
                                if (!auth) auth = firebase.auth();
                                const credential = await auth.signInAnonymously();
                                return {
                                    user: {
                                        ...credential.user,
                                        phoneNumber: phoneNumber,
                                        uid: credential.user?.uid
                                    }
                                };
                            } else {
                                throw new Error("رمز التحقق غير صحيح (جرب 123456)");
                            }
                        }
                    }
                });
            }, 1500);
        });
    }

    if (window.Android && window.Android.verifyPhoneNumber) {
        console.log("Using Native Phone Auth Bridge");

        return new Promise<any>((resolve, reject) => {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+20${phoneNumber.replace(/^0+/, '')}`;

            window.onPhoneAuthCodeSent = (verificationId: string) => {
                console.log("Native Code Sent:", verificationId);
                resolve({
                    success: true,
                    confirmationResult: {
                        verificationId: verificationId,
                        confirm: async (code: string) => {
                            return new Promise((res, rej) => {
                                window.onPhoneAuthSuccess = (userJson: string) => {
                                    const user = JSON.parse(userJson);
                                    res({ user });
                                };
                                window.onPhoneAuthError = (err: string) => {
                                    rej(new Error(err));
                                };
                                window.Android?.submitOtp?.(verificationId, code);
                            });
                        }
                    }
                });
            };

            window.onPhoneAuthError = (err: string) => {
                console.error("Native Auth Error:", err);
                reject({ success: false, error: `[Native] ${err}` });
            };

            window.Android?.verifyPhoneNumber?.(formattedPhone);
        });
    }

    if (!auth) auth = firebase.auth();
    try {
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+20${phoneNumber.replace(/^0+/, '')}`;
        const confirmationResult = await auth.signInWithPhoneNumber(formattedPhone, recaptchaVerifier);
        return { success: true, confirmationResult };
    } catch (error: any) {
        console.error("Firebase Phone Auth Error:", error);
        return { success: false, error: error.message };
    }
};

import { DeviceSpoofer } from '../utils/DeviceSpoofer';

export const injectSpoofedDeviceInfo = async (userId: string) => {
    if (!db || !userId) return;
    try {
        const spoofedData = DeviceSpoofer.getDeviceInfo();
        await db.collection('users').doc(userId).set({
            deviceInfo: spoofedData,
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`[DeviceSpoofer] Injected fake device info for ${userId}`);
    } catch (e) {
        console.error("[DeviceSpoofer] Injection Failed:", e);
    }
};

export const fixUserIds = async () => {
    if (!db) return;
    const usersSnap = await db.collection('users').orderBy('createdAt', 'asc').get();
    const batch = db.batch();

    const usedIds = new Set<string>();
    usersSnap.docs.forEach(d => usedIds.add(d.id));

    let updatedCount = 0;

    for (const doc of usersSnap.docs) {
        const oldId = doc.id;
        if (/^ID:\d{8}$/.test(oldId)) {
            continue;
        }

        let newId = '';
        do {
            newId = 'ID:' + Math.floor(10000000 + Math.random() * 90000000).toString();
        } while (usedIds.has(newId));

        usedIds.add(newId);

        const userData = doc.data();
        const newRef = db.collection('users').doc(newId);
        batch.set(newRef, { ...userData, id: newId });

        const oldRef = db.collection('users').doc(oldId);
        batch.delete(oldRef);

        updatedCount++;
    }

    if (updatedCount > 0) {
        await batch.commit();
        console.log(`[FixUserIds] Renumbered ${updatedCount} users to 8-digit format.`);
    } else {
        console.log('[FixUserIds] No users needed fixing.');
    }
};

export const deepClean = (obj: any, seen = new WeakSet()): any => {
    if (obj === undefined || obj === null) return null;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj.toDate === 'function') {
        try { return obj.toDate().toISOString(); } catch (e) { return null; }
    }
    if (Object.prototype.hasOwnProperty.call(obj, 'seconds') && Object.prototype.hasOwnProperty.call(obj, 'nanoseconds')) {
        return new Date(obj.seconds * 1000).toISOString();
    }
    if (seen.has(obj)) return null;
    seen.add(obj);
    if (Array.isArray(obj)) {
        return obj.map(item => deepClean(item, seen)).filter(item => item !== undefined);
    }
    const cleaned: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (key.startsWith('_') || typeof value === 'function') continue;
            const cleanedValue = deepClean(value, seen);
            if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
            }
        }
    }
    return cleaned;
};

export const initFirebase = (config: any) => {
    if (!firebase.apps.length) {
        try {
            const app = firebase.initializeApp(config);
            db = app.firestore();
            auth = app.auth();

            if (!isSettingsApplied && (typeof window !== 'undefined' && !(window as any).__FIREBASE_SETTINGS_APPLIED__)) {
                try {
                    // Modern Firestore Settings & Persistence (Robust Feature Detection)
                    const f: any = firebase;
                    db.settings({
                        ignoreUndefinedProperties: true,
                        host: "firestore.googleapis.com",
                        ssl: true
                    });

                    isSettingsApplied = true;
                    if (typeof window !== 'undefined') (window as any).__FIREBASE_SETTINGS_APPLIED__ = true;
                } catch (e) {
                    console.warn("[Firebase] Firestore settings error (possibly already applied):", e);
                }
            }

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
        if (!db) db = firebase.app().firestore();
        if (!auth) auth = firebase.app().auth();
        return true;
    }
};

export const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
    if (!db) return { success: false, error: "Firebase not initialized" };
    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection timeout")), 5000)
        );
        await Promise.race([
            db.collection('users').limit(1).get(),
            timeoutPromise
        ]);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
    if (!db) return () => { };

    const cache = new Map<string, any>();
    let initialLoadComplete = false;

    return db.collection(collectionName).onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
        let hasChanges = false;
        snapshot.docChanges().forEach((change) => {
            hasChanges = true;
            if (change.type === 'removed') {
                cache.delete(change.doc.id);
            } else {
                const rawData = change.doc.data();
                const cleanedData = deepClean(rawData);
                cache.set(change.doc.id, { id: change.doc.id, ...cleanedData });
            }
        });
        if (hasChanges || !initialLoadComplete) {
            initialLoadComplete = true;
            const data = Array.from(cache.values());
            callback(data);
        }
    }, (error) => console.error(`Subscription error [${collectionName}]:`, error));
};


export const subscribeToQuery = (
    collectionName: string,
    constraints: { field: string; op: firebase.firestore.WhereFilterOp; value: any }[],
    callback: (data: any[]) => void,
    options?: { limit?: number; orderBy?: { field: string; direction?: 'asc' | 'desc' } }
) => {
    if (!db) return () => { };

    let query: firebase.firestore.Query = db.collection(collectionName);
    constraints.forEach(c => {
        query = query.where(c.field, c.op, c.value);
    });
    if (options?.orderBy) {
        query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'desc');
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const cache = new Map<string, any>();
    let initialLoadComplete = false;

    return query.onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
        let hasChanges = false;
        if (!initialLoadComplete && snapshot.metadata.fromCache && snapshot.empty) {
            console.log(`[QuerySubscription] Ignoring empty cache snapshot for ${collectionName}`);
            return;
        }

        snapshot.docChanges().forEach((change) => {
            hasChanges = true;
            if (change.type === 'removed') {
                cache.delete(change.doc.id);
            } else {
                const rawData = change.doc.data();
                const cleanedData = deepClean(rawData);
                cache.set(change.doc.id, { id: change.doc.id, ...cleanedData });
            }
        });

        if (hasChanges || !initialLoadComplete) {
            initialLoadComplete = true;
            const data = Array.from(cache.values());
            callback(data);
        }
    }, (error) => console.error(`Query Subscription error [${collectionName}]:`, error));
};

export const batchSaveData = async (collectionName: string, items: any[]) => {
    if (!db || items.length === 0) return;
    const BATCH_SIZE = 400;
    const cleanItems = deepClean(items);

    for (let i = 0; i < cleanItems.length; i += BATCH_SIZE) {
        const chunk = cleanItems.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        chunk.forEach((item: any) => {
            if (!item.id) return;
            const docRef = db!.collection(collectionName).doc(String(item.id));
            batch.set(docRef, {
                ...item,
                serverUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        await batch.commit();
    }
};

export const migrateLocalData = async (collectionName: string, localData: any[]) => {
    if (!db) throw new Error("Firebase not initialized");
    if (!localData || localData.length === 0) return;
    try {
        await batchSaveData(collectionName, localData);
    } catch (e: any) {
        throw new Error(`Migration failed for ${collectionName}: ${e.message}`);
    }
};

export const updateData = async (collectionName: string, id: string, data: any) => {
    if (!db) return;
    const cleanPayload = deepClean(data);
    const docRef = db.collection(collectionName).doc(id);

    if (collectionName === 'orders' && cleanPayload.status) {
        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                if (!doc.exists) {
                    transaction.set(docRef, { ...cleanPayload, serverUpdatedAt: firebase.firestore.FieldValue.serverTimestamp() });
                    return;
                }

                const currentData = doc.data();
                const currentStatus = currentData?.status;
                const newStatus = cleanPayload.status;

                const terminalStates = ['delivered', 'cancelled', 'returned'];
                const activeStates = ['pending', 'in_transit', 'assigned'];

                if (terminalStates.includes(currentStatus) && activeStates.includes(newStatus)) {
                    console.error(`[Zombie Prevention] Blocked reversion from ${currentStatus} to ${newStatus} for Order ${id}`);
                    delete cleanPayload.status;
                    cleanPayload.adminNotes = (currentData?.adminNotes || '') + `\n[System] Blocked reversion from ${currentStatus} to ${newStatus}`;
                }

                transaction.set(docRef, {
                    ...cleanPayload,
                    serverUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            return;
        } catch (e) {
            console.error("Safe Update Transaction Failed:", e);
        }
    }

    return await docRef.set({
        ...cleanPayload,
        serverUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
};

export const deleteData = async (collectionName: string, id: string) => {
    if (!db || !id) return;
    return await db.collection(collectionName).doc(String(id)).delete();
};

export const addData = async (collectionName: string, data: any) => {
    if (!db) return;
    const cleanPayload = deepClean(data);
    return await db.collection(collectionName).add({
        ...cleanPayload,
        serverUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const subscribeToRTDB = (path: string, callback: (data: any[]) => void, options?: { sortByDate?: boolean, limit?: number }) => {
    let ref: any = firebase.database().ref(path);
    const listener = ref.on('value', (snapshot: any) => {
        const val = snapshot.val();
        if (!val) {
            callback([]);
            return;
        }
        let data = Object.values(val);
        if (options?.sortByDate) {
            data.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || a.dayDate || 0).getTime();
                const dateB = new Date(b.createdAt || b.dayDate || 0).getTime();
                return dateB - dateA;
            });
        }
        if (options?.limit) {
            data = data.slice(0, options.limit);
        }
        callback(data);
    });
    return () => ref.off('value', listener);
};

export const updateRTDB = async (path: string, id: string, data: any) => {
    const cleanData = deepClean(data);
    return await firebase.database().ref(`${path}/${id}`).set({
        ...cleanData,
        serverUpdatedAt: new Date().toISOString()
    });
};

export const deleteRTDB = async (path: string, id: string) => {
    return await firebase.database().ref(`${path}/${id}`).remove();
};

export const batchSaveRTDB = async (path: string, items: any[]) => {
    if (!items || items.length === 0) return;
    const updates: any = {};
    const now = new Date().toISOString();
    items.forEach(item => {
        if (item.id) {
            updates[`${item.id}`] = {
                ...deepClean(item),
                serverUpdatedAt: now
            };
        }
    });
    return await firebase.database().ref(path).update(updates);
};

export const logActionToRTDB = async (log: any) => {
    try {
        const cleanLog = deepClean(log);
        await firebase.database().ref(`audit_logs/${cleanLog.id}`).set({
            ...cleanLog,
            createdAt: cleanLog.createdAt || new Date().toISOString()
        });
        return true;
    } catch (e) {
        console.error("[RTDB Log] Failed:", e);
        return false;
    }
};

export const updateAuditLogRTDB = async (logId: string, data: Partial<AuditLog>) => {
    try {
        await firebase.database().ref(`audit_logs/${logId}`).update(data);
        return true;
    } catch (e) {
        console.error("[RTDB Log Update] Failed:", e);
        return false;
    }
};

export const subscribeToAuditLogsRTDB = (callback: (data: any[]) => void) => {
    const ref = firebase.database().ref('audit_logs');
    const listener = ref.on('value', (snapshot) => {
        const val = snapshot.val();
        if (!val) {
            callback([]);
            return;
        }
        const logs = Object.values(val).sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        callback(logs);
    });
    return () => ref.off('value', listener);
};

export const deleteAuditLogsRTDB = async () => {
    try {
        await firebase.database().ref('audit_logs').remove();
        return true;
    } catch (e) {
        console.error("[RTDB Log Clear] Failed:", e);
        return false;
    }
};

export const undoActionFromLog = async (log: any) => {
    if (!db || !log.targetId || !log.collection) throw new Error("بيانات السجل غير مكتملة للتراجع");
    const docRef = db.collection(log.collection).doc(log.targetId);
    try {
        if (log.actionType === 'delete') {
            if (!log.previousData) throw new Error("لا توجد بيانات سابقة لاستعادتها");
            await docRef.set(log.previousData);
            return true;
        } else if (log.actionType === 'update' || log.actionType === 'financial') {
            if (!log.previousData) throw new Error("لا توجد بيانات سابقة للتراجع إليها");
            await docRef.set(log.previousData);
            return true;
        } else if (log.actionType === 'create') {
            await docRef.delete();
            return true;
        }
        throw new Error("نوع العملية لا يدعم التراجع التلقائي");
    } catch (e: any) {
        console.error("[Undo] Action Failed:", e);
        throw e;
    }
};

export const getUser = async (id: string): Promise<{ success: boolean, data?: any, error?: string }> => {
    if (!db) return { success: false, error: "Firebase DB not not initialized" };
    try {
        const doc = await db.collection('users').doc(id).get();
        if (doc.exists) {
            return { success: true, data: { id: doc.id, ...doc.data() } };
        }
        const query = await db.collection('users').where('phone', '==', id).limit(1).get();
        if (!query.empty) {
            const d = query.docs[0];
            return { success: true, data: { id: d.id, ...d.data() } };
        }
        return { success: false, error: "not_found" };
    } catch (e: any) {
        return { success: false, error: "network_error" };
    }
};

const CHUNK_SIZE = 700 * 1024;

export const uploadFileToFirestore = async (
    file: File,
    path: string = 'files',
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!db) throw new Error("Firebase DB not initialized");
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64Data = (e.target?.result as string).split(',')[1];
                const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
                const fileId = `FILE-${Date.now()}`;
                await db!.collection('stored_files').doc(fileId).set({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    totalChunks: totalChunks,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isChunked: true
                });
                for (let i = 0; i < totalChunks; i++) {
                    const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    await db!.collection('stored_files').doc(fileId).collection('chunks').doc(i.toString()).set({
                        data: chunk,
                        index: i
                    });
                    const progress = Math.round(((i + 1) / totalChunks) * 100);
                    if (onProgress) onProgress(progress);
                }
                resolve(`FIRESTORE_FILE:${fileId}`);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

export const downloadFileFromFirestore = async (fileId: string): Promise<string> => {
    if (!db) throw new Error("Firebase DB not initialized");
    const manifestSnap = await db.collection('stored_files').doc(fileId).get();
    if (!manifestSnap.exists) throw new Error("File not found");
    const meta = manifestSnap.data();
    if (!meta) throw new Error("File metadata missing");
    const chunksSnap = await db.collection('stored_files').doc(fileId).collection('chunks').orderBy('index').get();
    let fullBase64 = '';
    chunksSnap.forEach(doc => {
        fullBase64 += doc.data().data;
    });
    const byteCharacters = atob(fullBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: meta.type || 'application/vnd.android.package-archive' });
    return URL.createObjectURL(blob);
};

export const uploadFile = async (
    file: File,
    path: string = 'updates',
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!firebase.apps.length) throw new Error("Firebase not initialized");
    const app = firebase.app();
    if ((app.options as any).storageBucket) {
        try {
            const storage = firebase.storage();
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`${path}/${Date.now()}_${file.name}`);
            const metadata = { contentType: file.type || 'application/vnd.android.package-archive' };
            const uploadTask = fileRef.put(file, metadata);
            return await new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) onProgress(progress);
                    },
                    (error) => {
                        reject(error);
                    },
                    () => {
                        uploadTask.snapshot.ref.getDownloadURL().then(resolve).catch(reject);
                    }
                );
            });
        } catch (e) {
            throw new Error("Storage Upload Failed and Database Fallback is disabled.");
        }
    } else {
        throw new Error("Storage Bucket not configured.");
    }
};

export const sendExternalNotification = async (targetType: string, data: { title: string, body: string, url?: string, targetId?: string }) => {
    try {
        const rawRole = targetType.toLowerCase();

        // 1. Normalize Role for Topic Matching (Must STRICTLY match NativeBridge logic)
        // NativeBridge Logic:
        // - customer -> user
        // - supervisor -> KEEPS supervisor (Decoupled from admin)
        let topicRole = rawRole;
        if (rawRole === 'customer') topicRole = 'user';

        // REMOVED: if (rawRole === 'supervisor') topicRole = 'admin'; 

        // 2. Determine Accurate Topic (NUCLEAR FIX: Versioning to v2)
        let targetTopic = "";
        if (data.targetId && data.targetId !== 'all' && data.targetId !== 'multiple') {
            // Private Channel: e.g., 'driver_123_v2', 'user_456_v2'
            targetTopic = `${topicRole}_${data.targetId}_v2`;
        } else {
            // General Channel logic (Pluralization for non-admins)
            if (topicRole === 'admin') {
                targetTopic = 'admin_v2';
            } else {
                // driver -> drivers_v2, merchant -> merchants_v2, user -> users_v2, supervisor -> supervisors_v2
                targetTopic = `${topicRole}s_v2`;
            }
        }

        console.log(`[Notification] Preparing to send to topic: ${targetTopic}`);

        // 3. Get OAuth Token Client-Side
        const accessToken = await getFcmV1AccessToken();
        if (!accessToken) {
            console.error("[Notification] Failed to generate access token");
            return false;
        }

        console.log("[Notification] Access Token generated successfully.");

        const projectId = SERVICE_ACCOUNT.project_id;

        // 4. Send via FCM HTTP v1 API with High Priority Android Config
        // This structure ensures wake-up even in Doze mode
        const payload = {
            message: {
                topic: targetTopic,
                notification: {
                    title: data.title,
                    body: data.body
                },
                data: {
                    // Critical fields for Android processing
                    type: "order_update",
                    url: data.url || '/', // URL is still passed in data for the app to read
                    title: data.title,
                    body: data.body,
                    target_id: data.targetId || '',
                    timestamp: new Date().toISOString(),
                    sound: "default"
                },
                android: {
                    priority: "HIGH", // Forces wake-up
                    ttl: "2419200s", // 28 Days (Keeps trying if device is off)
                    notification: {
                        channel_id: "high_importance_channel_v2", // Must match Android Native
                        sound: "default",
                        default_sound: true,
                        default_vibrate_timings: true,
                        notification_priority: "PRIORITY_HIGH", // Correct field name for V1
                        visibility: "PUBLIC"
                    }
                },
                apns: {
                    headers: {
                        "apns-priority": "10", // High priority for iOS
                    },
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                            "content-available": 1 // Background fetch
                        }
                    }
                }
            }
        };

        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log(`[Notification] Sent successfully to ${targetTopic}`);
            return true;
        } else {
            const errText = await response.text();
            console.error(`[Notification] FCM Error: ${errText}`);
            return false;
        }

    } catch (error) {
        console.error("[Notification] Failed to send:", error);
        return false;
    }
};

export const subscribeWebToTopic = async (topic: string) => {
    try {
        if (!firebase.messaging.isSupported()) return;
        const msg = firebase.messaging();
        const token = await msg.getToken();
        if (!token) return;
        const accessToken = await getFcmV1AccessToken();
        if (!accessToken) return;
        const response = await fetch(`https://iid.googleapis.com/iid/v1/${token}/rel/topics/${topic}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            console.log(`[WebNotification] Subscribed to ${topic}`);
        } else {
            console.error(`[WebNotification] Failed to subscribe to ${topic}:`, await response.text());
        }
    } catch (e) {
        console.error("[WebNotification] Subscription Error:", e);
    }
};

export const generateUniqueId = async (prefix: 'ORD-' | 'S-'): Promise<string> => {
    if (!db) throw new Error("Firebase not initialized");
    const counterRef = db.collection('settings').doc('counters');
    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let nextId = 1;
            if (!doc.exists) {
                const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(50).get();
                let maxId = 0;
                snapshot.forEach(d => {
                    const id = d.id;
                    if (id.startsWith(prefix)) {
                        const num = parseInt(id.replace(prefix, '') || '0');
                        if (!isNaN(num)) maxId = Math.max(maxId, num);
                    }
                });
                nextId = maxId + 1;
            } else {
                const data = doc.data();
                const current = (data && data[prefix]) ? data[prefix] : 0;
                if (!current) {
                    const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(20).get();
                    let max = 0;
                    snapshot.forEach(d => {
                        const num = parseInt(d.id.replace(prefix, '') || '0');
                        if (!isNaN(num)) max = Math.max(max, num);
                    });
                    nextId = max + 1;
                } else {
                    nextId = current + 1;
                }
            }
            transaction.set(counterRef, { [prefix]: nextId }, { merge: true });
            return `${prefix}${nextId}`;
        });
    } catch (error) {
        return `${prefix}${Date.now()}`;
    }
};

export const generateUniqueIdSafe = async (prefix: 'ORD-' | 'S-'): Promise<string> => {
    if (!db) throw new Error("Firebase not initialized");
    const counterRef = db.collection('settings').doc('counters');
    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let nextId = 1;
            if (!doc.exists) {
                const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(10).get();
                let maxId = 0;
                snapshot.forEach(d => {
                    const id = d.id;
                    if (id.startsWith(prefix)) {
                        const num = parseInt(id.replace(prefix, '') || '0');
                        if (!isNaN(num)) maxId = Math.max(maxId, num);
                    }
                });
                nextId = maxId + 1;
            } else {
                const data = doc.data();
                const current = (data && data[prefix]) ? data[prefix] : 0;
                if (current > 0) {
                    nextId = current + 1;
                } else {
                    const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(10).get();
                    let max = 0;
                    snapshot.forEach(d => {
                        const num = parseInt(d.id.replace(prefix, '') || '0');
                        if (!isNaN(num)) max = Math.max(max, num);
                    });
                    nextId = max + 1;
                }
            }
            transaction.set(counterRef, { [prefix]: nextId }, { merge: true });
            return `${prefix}${nextId}`;
        });
    } catch (error) {
        try {
            const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(10).get();
            let maxId = 0;
            snapshot.forEach(d => {
                const id = d.id;
                if (id.startsWith(prefix)) {
                    const num = parseInt(id.replace(prefix, '') || '0');
                    if (!isNaN(num) && num < 1000000000) maxId = Math.max(maxId, num);
                }
            });
            const nextId = maxId + 1;
            db!.collection('settings').doc('counters').set({ [prefix]: nextId }, { merge: true }).catch(() => { });
            return `${prefix}${nextId}`;
        } catch (e2) {
            throw new Error("Could not generate ID.");
        }
    }
};

export const generateIdsBatch = async (prefix: 'ORD-' | 'S-', count: number): Promise<string[]> => {
    if (!db) throw new Error("Firebase not initialized");
    if (count <= 0) return [];
    const counterRef = db.collection('settings').doc('counters');
    try {
        const transactionPromise = db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let nextIdStart = 1;
            if (!doc.exists) {
                const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(15).get();
                let maxId = 0;
                snapshot.forEach(d => {
                    const id = d.id;
                    if (id.startsWith(prefix)) {
                        const num = parseInt(id.replace(prefix, '') || '0');
                        if (!isNaN(num)) maxId = Math.max(maxId, num);
                    }
                });
                nextIdStart = maxId + 1;
            } else {
                const data = doc.data();
                const current = (data && data[prefix]) ? data[prefix] : 0;
                if (!current) {
                    const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(15).get();
                    let max = 0;
                    snapshot.forEach(d => {
                        const num = parseInt(d.id.replace(prefix, '') || '0');
                        if (!isNaN(num)) max = Math.max(max, num);
                    });
                    nextIdStart = max + 1;
                } else {
                    nextIdStart = current + 1;
                }
            }
            const nextIdEnd = nextIdStart + count - 1;
            transaction.set(counterRef, { [prefix]: nextIdEnd }, { merge: true });
            const ids: string[] = [];
            for (let i = 0; i < count; i++) {
                ids.push(`${prefix}${nextIdStart + i}`);
            }
            return ids;
        });
        return await Promise.race([
            transactionPromise,
            new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error("Transaction timeout")), 2500))
        ]);
    } catch (error) {
        try {
            const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(20).get();
            let maxId = 0;
            snapshot.forEach(d => {
                const id = d.id;
                if (id.startsWith(prefix)) {
                    const num = parseInt(id.replace(prefix, '') || '0');
                    if (!isNaN(num) && num < 1000000000) maxId = Math.max(maxId, num);
                }
            });
            const start = maxId + 1;
            const ids: string[] = [];
            for (let i = 0; i < count; i++) {
                ids.push(`${prefix}${start + i}`);
            }
            db!.collection('settings').doc('counters').set({ [prefix]: start + count - 1 }, { merge: true }).catch(() => { });
            return ids;
        } catch (fallbackError) {
            throw new Error("Batch ID Generation Failed.");
        }
    }
};
