
// Custom High-Capacity Storage using IndexedDB
// Replaces localStorage to avoid 5MB Quota Limit
// zero-dependency implementation

const DB_NAME = 'GOO_NOW_DB';
const STORE_NAME = 'app_data';
const DB_VERSION = 1;

interface StorageInterface {
    get: <T>(key: string, defaultValue: T) => Promise<T>;
    set: (key: string, value: any) => Promise<void>;
    remove: (key: string) => Promise<void>;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            console.error("IndexedDB Error:", (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    });

    return dbPromise;
};

export const AppStorage: StorageInterface = {
    get: async <T>(key: string, defaultValue: T): Promise<T> => {
        try {
            const db = await getDB();
            return new Promise((resolve) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    const result = request.result;
                    // If result undefined, return default. 
                    // Note: We expect standard JSON objects or arrays.
                    if (result === undefined) resolve(defaultValue);
                    else resolve(result as T);
                };

                request.onerror = () => {
                    console.warn(`Failed to read ${key}, using default.`);
                    resolve(defaultValue);
                };
            });
        } catch (e) {
            console.error("Storage Get Error:", e);
            return defaultValue;
        }
    },

    set: async (key: string, value: any): Promise<void> => {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(value, key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("Storage Set Error:", e);
        }
    },

    remove: async (key: string): Promise<void> => {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("Storage Remove Error:", e);
        }
    }
};

// Fallback synchronous helper for safe localStorage (Legacy/Tiny data only)
export const SafeLocalStorage = {
    get: (key: string, def: any) => {
        try { return JSON.parse(localStorage.getItem(key) || 'null') || def; } catch { return def; }
    },
    set: (key: string, val: any) => {
        try { localStorage.setItem(key, JSON.stringify(val)); }
        catch (e) { console.error("LocalStorage Quota Exceeded for " + key); }
    },
    remove: (key: string) => localStorage.removeItem(key)
};
