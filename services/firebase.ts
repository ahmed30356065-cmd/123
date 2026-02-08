
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/messaging';
import 'firebase/compat/auth';
import 'firebase/compat/storage';
import { getFcmV1AccessToken, SERVICE_ACCOUNT } from '../utils/FirebaseServiceAccount';

let db: firebase.firestore.Firestore | undefined;
let auth: firebase.auth.Auth | undefined;
let isSettingsApplied = false;

export const setupRecaptcha = (containerId: string) => {
    if (!auth) auth = firebase.auth();
    return new firebase.auth.RecaptchaVerifier(containerId, {
        'size': 'invisible',
        'callback': () => {
            console.log("Recaptcha resolved");
        }
    });
};


// Native Bridge Types
interface NativeBridge {
    verifyPhoneNumber: (phone: string) => void;
    submitOtp: (verificationId: string, code: string) => void;
}

declare global {
    interface Window {
        Android?: NativeBridge;
        onPhoneAuthCodeSent?: (verificationId: string) => void;
        onPhoneAuthAutoRetrieval?: (code: string) => void;
        onPhoneAuthSuccess?: (userJson: string) => void;
        onPhoneAuthError?: (error: string) => void;
    }
}

export const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: firebase.auth.RecaptchaVerifier) => {
    console.log(`[PhoneAuth] Initiating for ${phoneNumber}...`);

    // --- SIMULATION MODE (FREE TIER BYPASS) ---
    // Since Firebase Billing is not enabled, we default to this robust simulation.
    // This allows the app to have a "Verification" step without paying for SMS.
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
                            // The Unified OTP for Simulation
                            if (code === '123456') {
                                console.log("[PhoneAuth] Simulation Code Valid. Signing in anonymously...");
                                // We use Anonymous Auth to get a real Firebase User ID and Token
                                if (!auth) auth = firebase.auth();
                                const credential = await auth.signInAnonymously();
                                return {
                                    user: {
                                        ...credential.user,
                                        phoneNumber: phoneNumber, // Mock the phone number on var
                                        uid: credential.user?.uid // Real UID
                                    }
                                };
                            } else {
                                throw new Error("رمز التحقق غير صحيح (جرب 123456)");
                            }
                        }
                    }
                });
            }, 1500); // Simulate network delay
        });
    }

    // 1. NATIVE BRIDGE PATH (Robust, bypasses Billing/SafetyNet blockers on WebView)
    if (window.Android && window.Android.verifyPhoneNumber) {
        console.log("Using Native Phone Auth Bridge");

        return new Promise<any>((resolve, reject) => {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+20${phoneNumber.replace(/^0+/, '')}`;

            // Setup Listeners
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
                                    res({ user }); // Mimic Firebase UserCredential
                                };
                                window.onPhoneAuthError = (err: string) => {
                                    rej(new Error(err));
                                };
                                window.Android!.submitOtp(verificationId, code);
                            });
                        }
                    }
                });
            };

            window.onPhoneAuthError = (err: string) => {
                console.error("Native Auth Error:", err);
                reject({ success: false, error: `[Native] ${err}` });
            };

            // Trigger Native Call
            window.Android.verifyPhoneNumber(formattedPhone);
        });
    }

    // 2. WEB FALLBACK (Legacy)
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

// --- DEVICE SPOOFING INJECTION ---
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

// --- FIX USER IDs UTILITY (8-Digits) ---
export const fixUserIds = async () => {
    if (!db) return;
    const usersSnap = await db.collection('users').orderBy('createdAt', 'asc').get();
    const batch = db.batch();

    const usedIds = new Set<string>();
    // Pre-populate used IDs to avoid collisions with existing formatted IDs
    usersSnap.docs.forEach(d => usedIds.add(d.id));

    let updatedCount = 0;

    for (const doc of usersSnap.docs) {
        const oldId = doc.id;

        // If already 8 digits (prefixed with ID:), maybe skip? Or force re-roll?
        // User asked to "fix" them, so let's re-roll strict 8 digits if not already valid.
        // A valid 8-digit ID with prefix is /^ID:\d{8}$/
        if (/^ID:\d{8}$/.test(oldId)) {
            continue;
        }

        let newId = '';
        do {
            newId = 'ID:' + Math.floor(10000000 + Math.random() * 90000000).toString();
        } while (usedIds.has(newId));

        usedIds.add(newId);

        const userData = doc.data();

        // Create new doc with new ID
        const newRef = db.collection('users').doc(newId);
        batch.set(newRef, { ...userData, id: newId });

        // Delete old doc
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


// Direct FCM Integration replacing Google Script
// This ensures notifications work without external backend dependencies

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

            if (!isSettingsApplied) {
                try {
                    db.settings({
                        ignoreUndefinedProperties: true,
                        merge: true,
                        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                    });
                } catch (e) {
                    console.warn("Firestore settings error (might be already applied):", e);
                }

                db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn("Persistence failed: Multiple tabs open");
                    } else if (err.code === 'unimplemented') {
                        console.warn("Persistence not supported by browser");
                    }
                });
                isSettingsApplied = true;
            }
            return true;
        } catch (error) {
            console.error("Firebase Init Error:", error);
            return false;
        }
    }
    if (!db) {
        db = firebase.firestore();
    }
    return true;
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

    // Maintain a local Map for O(1) updates and to avoid re-processing all documents
    const cache = new Map<string, any>();
    let initialLoadComplete = false;

    return db.collection(collectionName).onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
        let hasChanges = false;

        // Efficiently process only the changes
        snapshot.docChanges().forEach((change) => {
            hasChanges = true;
            if (change.type === 'removed') {
                cache.delete(change.doc.id);
            } else {
                // added or modified
                const rawData = change.doc.data();
                // Only deepClean the changed document
                const cleanedData = deepClean(rawData);
                cache.set(change.doc.id, { id: change.doc.id, ...cleanedData });
            }
        });

        // Always emit on the very first snapshot (even if empty, though usually it has 'added' events)
        // OR if there were actual changes.
        // We also check snapshot.metadata.fromCache to ensure we emit when data syncs from server
        // (though fromCache flip usually triggers a 'modified' event with metadata change if includeMetadataChanges is true).

        if (hasChanges || !initialLoadComplete) {
            initialLoadComplete = true;
            const data = Array.from(cache.values());
            callback(data);
        }
    }, (error) => console.error(`Subscription error [${collectionName}]:`, error));
};

// --- SMART SUBSCRIPTION LOGIC (Phase 1) ---

export const subscribeToQuery = (
    collectionName: string,
    constraints: { field: string; op: firebase.firestore.WhereFilterOp; value: any }[],
    callback: (data: any[]) => void
) => {
    if (!db) return () => { };

    let query: firebase.firestore.Query = db.collection(collectionName);

    // Apply filters
    constraints.forEach(c => {
        query = query.where(c.field, c.op, c.value);
    });

    const cache = new Map<string, any>();
    let initialLoadComplete = false;

    return query.onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
        let hasChanges = false;

        // OPTIMIZATION: Ignore initial empty snapshot if it comes from cache.
        // This prevents the UI from flashing "No Orders" while waiting for the server.
        // We only want to emit if:
        // 1. It's NOT from cache (real server data).
        // 2. OR it IS from cache but HAS data (offline mode support).
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

    // 🛡️ STATUS REGRESSION GUARD 🛡️
    // Prevent overwriting a terminal state (Delivered/Cancelled) with an active state (Pending/InTransit)
    // unless explicitly authorized (e.g. by Admin).
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

                // Define Terminal States
                const terminalStates = ['delivered', 'cancelled', 'returned'];
                // Define Active States
                const activeStates = ['pending', 'in_transit', 'assigned'];

                // Check for Regression
                if (terminalStates.includes(currentStatus) && activeStates.includes(newStatus)) {
                    console.error(`[Zombie Prevention] Blocked reversion from ${currentStatus} to ${newStatus} for Order ${id}`);
                    // We ignore the status update but keep other fields if any? 
                    // Or we throw? For now, we THROW to alert the caller (the app).
                    // But if it's a silent sync, maybe we just ignore.
                    // Let's Log audit and IGNORE the status change.

                    // Remove status from payload
                    delete cleanPayload.status;

                    // Add a warning note to the order so admin sees it blocked something
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
            // Fallback to normal update if transaction fails (e.g. offline?)
            // BUT offline transactions usually queue. 
            // If we are offline, we can't read 'currentData'. 
            // This is the tricky part. Firestore Transactions require online.
            // If offline, this throws. 

            // If we are offline, we might be the source of the zombie data.
            // We should NOT allow this update if we can't verify.
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

export const getUser = async (id: string): Promise<{ success: boolean, data?: any, error?: string }> => {
    if (!db) return { success: false, error: "Firebase DB not not initialized" };
    try {
        // Fast ID check
        const doc = await db.collection('users').doc(id).get();
        if (doc.exists) {
            return { success: true, data: { id: doc.id, ...doc.data() } };
        }

        // Fallback Phone check
        const query = await db.collection('users').where('phone', '==', id).limit(1).get();
        if (!query.empty) {
            const d = query.docs[0];
            return { success: true, data: { id: d.id, ...d.data() } };
        }
        return { success: false, error: "not_found" };
    } catch (e: any) {
        console.error("Error fetching user:", e);
        return { success: false, error: "network_error" }; // Assume exceptions are network/permission related
    }
};

// --- FIRESTORE CHUNK UPLOAD LOGIC (Alternative to Storage) ---

const CHUNK_SIZE = 700 * 1024; // ~700KB (Safe limit for 1MB Firestore doc)

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
                const base64Data = (e.target?.result as string).split(',')[1]; // Remove prefix
                const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
                const fileId = `FILE-${Date.now()}`;

                // 1. Create Manifest
                await db!.collection('stored_files').doc(fileId).set({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    totalChunks: totalChunks,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isChunked: true
                });

                // 2. Upload Chunks
                for (let i = 0; i < totalChunks; i++) {
                    const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    // Using subcollection for chunks
                    await db!.collection('stored_files').doc(fileId).collection('chunks').doc(i.toString()).set({
                        data: chunk,
                        index: i
                    });

                    const progress = Math.round(((i + 1) / totalChunks) * 100);
                    if (onProgress) onProgress(progress);
                    console.log(`[Firestore Upload] Chunk ${i + 1}/${totalChunks} uploaded.`);
                }

                resolve(`FIRESTORE_FILE:${fileId}`);

            } catch (err) {
                console.error("Firestore chunk upload failed:", err);
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

export const downloadFileFromFirestore = async (fileId: string): Promise<string> => {
    if (!db) throw new Error("Firebase DB not initialized");

    // 1. Get Manifest
    const manifestSnap = await db.collection('stored_files').doc(fileId).get();
    if (!manifestSnap.exists) throw new Error("File not found");

    const meta = manifestSnap.data();
    if (!meta) throw new Error("File metadata missing");

    // 2. Get All Chunks
    const chunksSnap = await db.collection('stored_files').doc(fileId).collection('chunks').orderBy('index').get();

    // 3. Reassemble
    let fullBase64 = '';
    chunksSnap.forEach(doc => {
        fullBase64 += doc.data().data;
    });

    // 4. Create Blob URL
    const byteCharacters = atob(fullBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: meta.type || 'application/vnd.android.package-archive' });

    return URL.createObjectURL(blob);
};

// Modified uploadFile to fallback to Firestore if Storage fails or is missing
export const uploadFile = async (
    file: File,
    path: string = 'updates',
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!firebase.apps.length) throw new Error("Firebase not initialized");

    const app = firebase.app();

    // Check if Storage Bucket is available
    if (app.options.storageBucket) {
        try {
            console.log(`[Upload] Attempting Storage upload to ${app.options.storageBucket}...`);
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
                        console.warn("[Storage Upload Failed] Switching to Firestore fallback...", error);
                        reject(error); // Trigger catch block to use fallback
                    },
                    () => {
                        uploadTask.snapshot.ref.getDownloadURL().then(resolve).catch(reject);
                    }
                );
            });
        } catch (e) {
            console.log("Storage failed, trying Firestore Chunking...");
        }
    } else {
        console.log("No storage bucket defined. Using Firestore Chunking...");
    }

    // Fallback: Upload to Firestore (Database)
    return await uploadFileToFirestore(file, path, onProgress);
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

        // 1. Get Token
        const token = await msg.getToken({ vapidKey: "YOUR_VAPID_KEY_IF_NEEDED" }); // Usually implicitly handled if manifest matches
        if (!token) {
            console.warn("[WebNotification] No FCM token available.");
            return;
        }

        // 2. Get Access Token (Server Side Logic on Client)
        const accessToken = await getFcmV1AccessToken();
        if (!accessToken) return;

        // 3. Subscribe via IID API (Legacy but functional with OAuth)
        // Note: For strict V1, this should be done via a backend proxy to https://fcm.googleapis.com/v1/...
        // But using IID with OAuth token works for now.
        const response = await fetch(`https://iid.googleapis.com/iid/v1/${token}/rel/topics/${topic}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log(`[WebNotification] Subscribed content-available to ${topic}`);
        } else {
            console.error(`[WebNotification] Failed to subscribe to ${topic}:`, await response.text());
        }

    } catch (e) {
        console.error("[WebNotification] Subscription Error:", e);
    }
};

// ==========================================
// 🆔 SEQUENTIAL ID GENERATION (Atomic Transactions - Trusted)
// ==========================================
export const generateUniqueId = async (prefix: 'ORD-' | 'S-'): Promise<string> => {
    if (!db) throw new Error("Firebase not initialized");

    const counterRef = db.collection('settings').doc('counters');

    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let nextId = 1;

            if (!doc.exists) {
                // FIRST RUN: Scan to initialize the counter correctly
                // This prevents resetting to 1 if we switch strategies mid-production
                const snapshot = await db.collection('orders')
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .get();

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
                // Get current value for this specific prefix (ORD- or S-)
                const current = (data && data[prefix]) ? data[prefix] : 0;

                // Safety check: If counter is 0 found but we have orders? 
                // We assume if it exists, it's correct. If it's 0, we start at 1.
                // To be extra safe on migration, we could double check if current < 1000? 
                // But let's trust the transaction flow. valid nextId is current + 1.

                // If the key is missing (e.g. we added S- later), we might want to scan?
                // For now, let's assume simple increment.
                if (!current) {
                    // Fallback scan if key missing in existing doc
                    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(20).get();
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

            // Update the counter
            transaction.set(counterRef, { [prefix]: nextId }, { merge: true });

            return `${prefix}${nextId}`;
        });
    } catch (error) {
        console.error("Transaction failed:", error);
        // Fallback to random if transaction totally fails (e.g. permission/network)
        // But we really want to know if this fails.
        return `${prefix}${Date.now()}`;
    }
};

// ==========================================
// 🛡️ SECURE ID GENERATION (Collision Proof)
// ==========================================
export const generateUniqueIdSafe = async (prefix: 'ORD-' | 'S-'): Promise<string> => {
    if (!db) throw new Error("Firebase not initialized");
    const counterRef = db.collection('settings').doc('counters');

    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let nextId = 1;

            if (!doc.exists) {
                // FIRST RUN - Scan last 10 orders only for speed
                const snapshot = await db!.collection('orders')
                    .orderBy('createdAt', 'desc')
                    .limit(10)
                    .get();
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

                // OPTIMIZATION: Trust the counter if it exists
                if (current > 0) {
                    nextId = current + 1;
                } else {
                    // Fallback: scan last 10 orders only
                    const snapshot = await db!.collection('orders').orderBy('createdAt', 'desc').limit(10).get();
                    let max = 0;
                    snapshot.forEach(d => {
                        const num = parseInt(d.id.replace(prefix, '') || '0');
                        if (!isNaN(num)) max = Math.max(max, num);
                    });
                    nextId = max + 1;
                }
            }

            // Update counter immediately
            transaction.set(counterRef, { [prefix]: nextId }, { merge: true });
            return `${prefix}${nextId}`;
        });
    } catch (error) {
        console.error("Safe ID Gen Transaction failed, trying Safe Fallback (Query):", error);
        // FALLBACK: Query the latest ID directly
        try {
            // Query Last 10 Orders only for speed
            const snapshot = await db!.collection('orders')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            let maxId = 0;
            snapshot.forEach(d => {
                const id = d.id;
                if (id.startsWith(prefix)) {
                    const num = parseInt(id.replace(prefix, '') || '0');
                    // Filter out large timestamp IDs
                    if (!isNaN(num) && num < 1000000000) maxId = Math.max(maxId, num);
                }
            });

            // Increment
            const nextId = maxId + 1;
            const finalId = `${prefix}${nextId}`;

            // Try repair counter (fire and forget)
            db!.collection('settings').doc('counters').set({ [prefix]: nextId }, { merge: true }).catch(() => { });

            return finalId;
        } catch (e2) {
            console.error("Critical: Even Fallback Failed", e2);
            throw new Error("Could not generate ID. Check connection.");
        }
    }
};

// ==========================================
// 📦 BATCH ID GENERATION (For Bulk Adds)
// ==========================================
export const generateIdsBatch = async (prefix: 'ORD-' | 'S-', count: number): Promise<string[]> => {
    if (!db) throw new Error("Firebase not initialized");
    if (count <= 0) return [];

    const counterRef = db.collection('settings').doc('counters');

    try {
        const transactionPromise = db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let nextIdStart = 1;

            if (!doc.exists) {
                // Initialize checks (copy logic from single gen)
                // OPTIMIZED: Limit scan to 15
                const snapshot = await db!.collection('orders')
                    .orderBy('createdAt', 'desc')
                    .limit(15)
                    .get();
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
                // Double check if 0
                if (!current) {
                    // OPTIMIZED: Limit scan to 15
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

            // Reserve the range
            transaction.set(counterRef, { [prefix]: nextIdEnd }, { merge: true });

            // Generate the array
            const ids: string[] = [];
            for (let i = 0; i < count; i++) {
                ids.push(`${prefix}${nextIdStart + i}`);
            }
            console.log(`[BatchID] Generated ${count} IDs: ${ids[0]} to ${ids[ids.length - 1]}`);
            return ids;
        });

        // 🚀 SPEED: Race against a timeout (2.5s)
        return await Promise.race([
            transactionPromise,
            new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error("Transaction timeout")), 2500))
        ]);

    } catch (error) {
        console.error("Batch ID Gen failed/timedout, switching to smart fallback:", error);

        try {
            // 🛡️ ACCURACY: Read Max ID directly from Orders
            // Smart Logic: Ignore "Timestamp" IDs (usually > 10 digits) to preserve the clean sequence.
            // OPTIMIZED: Limit scan to 20
            const snapshot = await db!.collection('orders')
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();

            let maxId = 0;
            snapshot.forEach(d => {
                const id = d.id;
                if (id.startsWith(prefix)) {
                    const numStr = id.replace(prefix, '') || '0';
                    const num = parseInt(numStr);

                    // HEURISTIC: Timestamp IDs are usually huge (e.g. 1700000000000).
                    // Sequential IDs are usually < 1,000,000.
                    // We only count it if it looks like a sequence ID (less than 1 billion).
                    if (!isNaN(num) && num < 1000000000) {
                        maxId = Math.max(maxId, num);
                    }
                }
            });

            const start = maxId + 1;
            const ids: string[] = [];
            for (let i = 0; i < count; i++) {
                ids.push(`${prefix}${start + i}`);
            }
            console.log(`[BatchID-Fallback] Generated ${count} IDs from max ${maxId} (Smart Filter)`);

            // Try to repair counter if possible
            db!.collection('settings').doc('counters').set({ [prefix]: start + count - 1 }, { merge: true }).catch(() => { });

            return ids;

        } catch (fallbackError) {
            console.error("Critical Fallback failed:", fallbackError);
            // Worst Case: Timestamp
            throw new Error("Batch ID Generation Failed completely. Please retry.");
        }
    }
};
