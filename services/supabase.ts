
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

const snakeToCamel = (str: string) => str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('_', ''));
    
const convertKeysToCamel = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(item => convertKeysToCamel(item));
    }
    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
        const newObj: {[key: string]: any} = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[snakeToCamel(key)] = data[key]; 
            }
        }
        return newObj;
    }
    return data;
};

const convertTopLevelKeysToSnakeCase = (obj: any) => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    const newObj: {[key: string]: any} = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            newObj[newKey] = obj[key];
        }
    }
    return newObj;
};


export const initSupabase = (url: string, key: string) => {
    try {
        if (!url || !url.startsWith('http')) {
            console.error("Invalid Supabase URL: Must start with http or https");
            return false;
        }
        if (!key) {
            console.error("Supabase Key missing");
            return false;
        }
        supabase = createClient(url, key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            },
            db: {
                schema: 'public',
            },
        });
        console.log("Supabase initialized successfully");
        return true;
    } catch (error) {
        console.error("Error initializing Supabase:", error);
        return false;
    }
};

export const isSupabaseInitialized = () => {
    return !!supabase;
};

export const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: "قاعدة البيانات غير مهيأة (Not Initialized)" };
    try {
        const { error } = await supabase.from('users').select('id').limit(1);
        
        if (error) {
             if (error.code === '42P01') { 
                 return { success: false, error: `فشل الاتصال: الجدول 'users' غير موجود. يرجى تشغيل كود SQL من صفحة الإعدادات.` }; 
            }
            if (error.code === '42501' || error.message.includes('security policy')) {
                return { success: false, error: `فشل الاتصال: تم رفض الوصول بسبب سياسة الأمان (RLS). يرجى تشغيل كود SQL لتعطيل RLS.` };
            }
            if (error.message.toLowerCase().includes('invalid api key')) {
                 return { success: false, error: `فشل الاتصال: مفتاح API غير صالح. تأكد من استخدام مفتاح 'anon' العام.` };
            }
             return { success: false, error: `فشل الاتصال: ${error.message}` };
        }
        
        return { success: true };
    } catch (e: any) {
        let msg = e.message || '';
        if (msg.includes("Failed to fetch")) {
            msg = "فشل الاتصال: تأكد من صحة الرابط (URL) ومن اتصالك بالإنترنت.";
        }
        return { success: false, error: msg };
    }
};

// --- Deep Clean Function to Remove Undefined and Circular References ---
const cleanObjectForSerialization = (obj: any, seen = new WeakSet()): any => {
    // 1. Primitive types
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'undefined') return null; // Convert undefined to null for JSON safety
        return obj;
    }

    // 2. Dates
    if (obj instanceof Date) {
        return obj.toISOString();
    }

    // 3. Circular Reference Check
    if (seen.has(obj)) {
        return null; // Return null for circular references
    }
    seen.add(obj);

    // 4. Arrays
    if (Array.isArray(obj)) {
        return obj.map(v => cleanObjectForSerialization(v, seen));
    }

    // 5. Objects (Filter out DOM elements and React internals)
    
    // Strict DOM Node Check: 'nodeType' is numeric on standard DOM nodes (1 for ELEMENT_NODE)
    if (obj.nodeType && typeof obj.nodeType === 'number') return null; 
    
    // Check for React internal properties which often cause circular references
    if (obj._reactInternals || obj._reactFiber) return null; 
    
    // React Synthetic Event check (often has 'nativeEvent')
    if (obj.nativeEvent && obj.target) return null;

    const constructorName = obj.constructor ? obj.constructor.name : '';
    if (constructorName && (constructorName.includes('HTML') || constructorName.includes('Element') || constructorName.includes('Node') || constructorName.includes('Event'))) {
        return null; // Drop likely DOM elements or events
    }

    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            // Filter unsafe keys commonly found in events
            if (['source', 'target', 'currentTarget', '_owner', '_store', 'view', 'nativeEvent'].includes(key)) continue;
            
            if (value !== undefined) {
                newObj[key] = cleanObjectForSerialization(value, seen);
            }
        }
    }
    return newObj;
};

const convertDates = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
            return new Date(obj);
        }
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(v => convertDates(v));
    }
    
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = convertDates(obj[key]);
        }
    }
    return newObj;
};

export const fetchSupabase = async (collectionName: string) => {
    if (!supabase) return null; 
    const { data, error } = await supabase.from(collectionName).select('*');
    if (error) {
        if (error.code !== '42P01') { // "relation does not exist"
            console.error(`Error fetching ${collectionName}:`, error);
        }
        return null; 
    }
    const camelCasedData = convertKeysToCamel(data);
    return convertDates(camelCasedData) || [];
};

export const fetchData = fetchSupabase;

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
    if (!supabase) return () => {};

    // Initialize with empty array so realtime events can populate it immediately
    let localData: any[] = []; 

    const initialFetch = async () => {
        console.log(`[Supabase] Performing initial fetch for ${collectionName}`);
        const data = await fetchSupabase(collectionName);
        if (data !== null) {
            // Smart Merge: Keep realtime updates that might have arrived before initial fetch completed
            // 'data' is the snapshot from server. 'localData' might contain new items via realtime.
            
            // Create a Set of IDs from the fetched data for quick lookup
            const fetchedIds = new Set(data.map(item => item.id));
            
            // Filter localData to keep only items that are NOT in the fetched data (meaning they are newer/inserted during fetch)
            const newRealtimeItems = localData.filter(item => !fetchedIds.has(item.id));
            
            // Combine: New Realtime Items + Snapshot Data
            localData = [...newRealtimeItems, ...data];
            callback(localData);
        }
    };
    
    const channel = supabase
        .channel(`realtime-payload:${collectionName}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: collectionName },
            (payload) => {
                console.log(`[Supabase Realtime] Processing payload on ${collectionName}:`, payload);
                let dataChanged = false;

                switch (payload.eventType) {
                    case 'INSERT': {
                        const newRecord = convertDates(convertKeysToCamel(payload.new));
                        if (!localData.some(item => item.id === newRecord.id)) {
                            localData.unshift(newRecord); // Add to the top for visibility
                            dataChanged = true;
                        }
                        break;
                    }
                    case 'UPDATE': {
                        const updatedRecord = convertDates(convertKeysToCamel(payload.new));
                        const index = localData.findIndex(item => item.id === updatedRecord.id);
                        if (index !== -1) {
                            localData[index] = updatedRecord;
                            dataChanged = true;
                        } else {
                            // If we received an update for an item we don't have, treat as insert (or safe fallback)
                            localData.unshift(updatedRecord);
                            dataChanged = true;
                        }
                        break;
                    }
                    case 'DELETE': {
                        const oldRecordKeys = convertKeysToCamel(payload.old);
                        const initialLength = localData.length;
                        localData = localData.filter(item => item.id !== oldRecordKeys.id);
                        if (localData.length < initialLength) {
                            dataChanged = true;
                        }
                        break;
                    }
                }
                
                if (dataChanged) {
                    callback([...localData]);
                }
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[Supabase Realtime] Successfully subscribed to '${collectionName}'. Performing sync fetch.`);
                initialFetch();
            } else if (status === 'CHANNEL_ERROR') {
                console.error(`[Supabase Realtime] Channel error for '${collectionName}'. Check browser console for network errors.`, err);
            } else if (status === 'TIMED_OUT') {
                console.warn(`[Supabase Realtime] Timeout subscribing to '${collectionName}'.`);
            } else if (err) {
                console.error(`[Supabase Realtime] Failed to subscribe to '${collectionName}'.`, err);
            }
        });
    
    return () => {
        if (channel) {
            supabase.removeChannel(channel).catch(err => {
                console.warn(`[Supabase Realtime] Could not remove channel for '${collectionName}'.`, err);
            });
        }
    };
};


export const addData = async (collectionName: string, data: any) => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const cleanData = cleanObjectForSerialization(data);
        const snakeCaseData = convertTopLevelKeysToSnakeCase(cleanData);
        const { error } = await supabase.from(collectionName).insert(snakeCaseData);
        if (error) throw error;
    } catch (e: any) {
        console.error(`Error adding to ${collectionName}:`, e.message || e);
        throw e;
    }
};

// --- Updated Batch Save ---
export const batchSaveData = async (collectionName: string, items: any[]) => {
    if (!supabase) throw new Error("Supabase not initialized");
    if (items.length === 0) return;

    try {
        // Use cleanObjectForSerialization to remove circular refs and undefined
        const cleanItems = items.map(item => convertTopLevelKeysToSnakeCase(cleanObjectForSerialization(item)));
        
        // Supabase/Postgrest usually handles batches well, but we can chunk if needed. 
        // 500 is a safe chunk size for standard APIs.
        const BATCH_SIZE = 500;
        for (let i = 0; i < cleanItems.length; i += BATCH_SIZE) {
            const chunk = cleanItems.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from(collectionName).upsert(chunk, { onConflict: 'id' });
            if (error) throw error;
        }
        console.log(`✅ Successfully batched ${items.length} items to ${collectionName} (Supabase)`);
    } catch (e: any) {
        console.error(`❌ Batch save failed for ${collectionName}:`, e.message || JSON.stringify(e));
        throw e;
    }
};

export const updateData = async (collectionName: string, id: string, data: any) => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const cleanData = cleanObjectForSerialization(data);
        const snakeCaseData = convertTopLevelKeysToSnakeCase(cleanData);
        const { error } = await supabase.from(collectionName).update(snakeCaseData).eq('id', id);
        if (error) throw error;
    } catch (e: any) {
        console.error(`Error updating ${collectionName}/${id}:`, e.message || e);
        throw e;
    }
};

export const deleteData = async (collectionName: string, id: string, idColumn: string = 'id') => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const { error } = await supabase.from(collectionName).delete().eq(idColumn, id);
        if (error) throw error;
    } catch (e: any) {
        console.error(`Error deleting ${collectionName}/${id} on column ${idColumn}:`, e.message || e);
        throw e;
    }
};

export const deleteRelatedDocs = async (collectionName: string, field: string, value: string) => {
    if (!supabase) return;
    try {
        const { error } = await supabase.from(collectionName).delete().eq(field, value);
        if (error) throw error;
    } catch(e) {
        console.error("Supabase cleanup error:", e);
    }
};

export const saveData = async (collectionName: string, id: string, data: any) => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const cleanData = cleanObjectForSerialization(data);
        const payload = { ...cleanData, id };
        const snakeCasePayload = convertTopLevelKeysToSnakeCase(payload);
        
        const { error } = await supabase.from(collectionName).upsert(snakeCasePayload, { onConflict: 'id' });
        if (error) throw error;
    } catch (e: any) {
        console.error(`Error saving ${collectionName}/${id}:`, e.message || e);
        throw e;
    }
};

export const migrateLocalData = async (collectionName: string, localData: any[]) => {
    if (!supabase) throw new Error("Supabase not initialized");
    if (!localData || localData.length === 0) return;

    try {
        console.log(`Syncing ${localData.length} items to ${collectionName}...`);
        
        // Use batchSaveData which now includes the cleaning logic
        await batchSaveData(collectionName, localData);
        
        console.log(`Sync for ${collectionName} completed.`);
    } catch (e: any) {
        console.error(`Error migrating ${collectionName}:`, e.message || e);
        
        if (e.code === '42P01') {
             throw new Error(`لم يتم العثور على الجدول '${collectionName}'. يرجى تشغيل كود SQL في Supabase.`);
        }
        if (e.code === '42501' || e.message?.includes('row-level security')) {
             throw new Error(`خطأ في الصلاحيات (RLS) للجدول '${collectionName}'. يجب عليك تشغيل كود SQL الموجود في الإعدادات لتعطيل حماية RLS.`);
        }
        throw new Error(`Migration failed for ${collectionName}: ${e.message || JSON.stringify(e)}`);
    }
};
