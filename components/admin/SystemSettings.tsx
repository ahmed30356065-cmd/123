


import React, { useState, useEffect, useRef } from 'react';
import { UploadIcon, CheckCircleIcon, XIcon, CloudIcon, BoltIcon, ClipboardListIcon, SettingsIcon, RocketIcon, DownloadIcon, LinkIcon, BellIcon } from '../icons';
import { initFirebase, migrateLocalData as migrateFirebase, testConnection as testFirebase, sendExternalNotification, updateData, uploadFile } from '../../services/firebase';
import { initSupabase, migrateLocalData as migrateSupabase, fetchSupabase, testConnection as testSupabase } from '../../services/supabase';
import ConfirmationModal from './ConfirmationModal';
import useAndroidBack from '../../hooks/useAndroidBack';
import { safeStringify } from '../../utils/NativeBridge';
import { AppConfig, UpdateConfig } from '../../types';

interface SystemSettingsProps {
    onSuccess?: () => void;
    onDisconnect?: () => void;
    appConfig?: AppConfig;
    onUpdateAppConfig?: (config: AppConfig) => void;
}

// ... (Existing Safe Storage Helpers & Schema Modal - Keep unchanged)
const safeGetItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn(`Failed to get item ${key}:`, e);
        return null;
    }
};

const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`Failed to set item ${key}:`, e);
    }
};

const safeRemoveItem = (key: string) => {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn(`Failed to remove item ${key}:`, e);
    }
};

const SUPABASE_SCHEMA_SQL = `
/* 
   ===================================================================
   GOO NOW - Database Schema & Repair Script
   ===================================================================
*/

-- 1. Create Tables (If Not Exists)
create table if not exists users (
  id text primary key, 
  name text, 
  role text, 
  password text, 
  status text, 
  phone text, 
  created_at timestamp with time zone, 
  commission_rate numeric, 
  commission_type text, 
  daily_log_status text, 
  incentives_active boolean, 
  permissions jsonb, 
  daily_log_mode text, 
  daily_log_started_at timestamp with time zone,
  address text,
  addresses jsonb,
  store_name text,
  store_image text,
  store_category text,
  working_hours jsonb,
  has_free_delivery boolean,
  response_time text,
  email text,
  fcm_token text,
  max_concurrent_orders numeric,
  appointed_by text,
  products jsonb,
  points_balance numeric
);

create table if not exists orders (
  id text primary key, 
  customer jsonb, 
  created_at timestamp with time zone, 
  status text, 
  notes text, 
  driver_id text, 
  merchant_id text, 
  merchant_name text, 
  delivery_fee numeric, 
  delivered_at timestamp with time zone, 
  reconciled boolean,
  type text,
  items jsonb,
  total_price numeric
);

create table if not exists messages (id text primary key, text text, image text, target_role text, target_id text, created_at timestamp with time zone, read_by jsonb, deleted_by jsonb);
create table if not exists payments (id text primary key, driver_id text, amount numeric, created_at timestamp with time zone, reconciled_order_ids jsonb);
create table if not exists reset_requests (phone text primary key, requested_at timestamp with time zone);
create table if not exists notifications (id serial primary key, type text, order_id text, merchant_name text, customer_address text, target_role text, created_at timestamp with time zone, body text, target_id text);
create table if not exists slider_images (id text primary key, url text, active boolean, created_at timestamp with time zone, linked_merchant_id text, linked_category_id text);
create table if not exists settings (id text primary key, is_enabled boolean, theme_config jsonb, points_config jsonb, app_name text, app_version text, support_config jsonb, update_config jsonb);

-- NEW TABLES FOR LOYALTY & AUDIT
create table if not exists audit_logs (id text primary key, actor_id text, actor_name text, action_type text, target text, details text, created_at timestamp with time zone);
create table if not exists promo_codes (id text primary key, code text, type text, value numeric, is_active boolean, expiry_date timestamp with time zone, usage_count numeric, max_usage numeric);
create table if not exists support_chats (id text primary key, user_id text, user_name text, user_phone text, last_message text, last_updated timestamp with time zone, unread_count numeric, messages jsonb);

-- 2. Add Missing Columns
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='users' and column_name='points_balance') then alter table users add column points_balance numeric; end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='points_config') then alter table settings add column points_config jsonb; end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='app_name') then alter table settings add column app_name text; end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='app_version') then alter table settings add column app_version text; end if;
  if not exists (select 1 from information_schema.columns where table_name='messages' and column_name='deleted_by') then alter table messages add column deleted_by jsonb; end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='update_config') then alter table settings add column update_config jsonb; end if;
end $$;

-- 3. Enable Replication
alter table users replica identity full;
alter table orders replica identity full;
alter table messages replica identity full;
alter table payments replica identity full;
alter table reset_requests replica identity full;
alter table notifications replica identity full;
alter table slider_images replica identity full;
alter table settings replica identity full;
alter table audit_logs replica identity full;
alter table promo_codes replica identity full;
alter table support_chats replica identity full;

-- 4. Publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for all tables;
commit;

-- 5. Disable RLS
alter table users disable row level security;
alter table orders disable row level security;
alter table messages disable row level security;
alter table payments disable row level security;
alter table reset_requests disable row level security;
alter table notifications disable row level security;
alter table slider_images disable row level security;
alter table settings disable row level security;
alter table audit_logs disable row level security;
alter table promo_codes disable row level security;
alter table support_chats disable row level security;
`;

const SchemaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl text-white flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-green-400">إصلاح قاعدة البيانات (SQL Repair)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto bg-gray-900 font-mono text-sm text-gray-300">
                    <div className="mb-4 text-gray-400 font-sans">
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded mb-3 text-yellow-200">
                            <strong>تنبيه هام:</strong> هذا الكود سيقوم بإنشاء الجداول المفقودة وتحديث الحقول الناقصة.
                        </div>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>انسخ الكود أدناه.</li>
                            <li>اذهب إلى <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">Supabase SQL Editor</a>.</li>
                            <li>ألصق الكود واضغط <strong>Run</strong>.</li>
                            <li>تأكد من ظهور رسالة "Success".</li>
                        </ol>
                    </div>
                    <pre className="p-4 bg-black rounded border border-gray-700 whitespace-pre-wrap select-all">
                        {SUPABASE_SCHEMA_SQL}
                    </pre>
                </div>
                <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-end gap-2 rounded-b-lg">
                    <button
                        onClick={handleCopy}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-bold shadow-lg"
                    >
                        {copied ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <ClipboardListIcon className="w-5 h-5 mr-2" />}
                        {copied ? 'تم النسخ!' : 'نسخ كود الإصلاح'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

const SystemSettings: React.FC<SystemSettingsProps> = ({ onSuccess, onDisconnect, appConfig, onUpdateAppConfig }) => {
    // ... (Existing state initialization)
    const [viewProvider, setViewProvider] = useState<'firebase' | 'supabase'>('firebase');
    const [activeProvider, setActiveProvider] = useState<'firebase' | 'supabase' | null>(null);
    
    // App Config State
    const [appName, setAppName] = useState(appConfig?.appName || 'GOO NOW');
    const [appVersion, setAppVersion] = useState(appConfig?.appVersion || 'VERSION 1.0.5');
    const [isSavingAppConfig, setIsSavingAppConfig] = useState(false);
    
    const [configJson, setConfigJson] = useState('');
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');

    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'migrating'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStep, setProcessStep] = useState('');
    
    // Update Logic State
    const [updateVersion, setUpdateVersion] = useState('');
    const [updateUrl, setUpdateUrl] = useState('');
    const [updateType, setUpdateType] = useState<'apk' | 'link'>('apk');
    const [updateDesc, setUpdateDesc] = useState('');
    const [isSendingUpdate, setIsSendingUpdate] = useState(false);
    const [isUploadingApk, setIsUploadingApk] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // Add Progress State
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

    // State for modals
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
    const [showSchemaModal, setShowSchemaModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const apkInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (appConfig) {
            setAppName(appConfig.appName);
            setAppVersion(appConfig.appVersion);
        }
    }, [appConfig]);

    useAndroidBack(() => {
        if (showUpdateConfirm) { setShowUpdateConfirm(false); return true; }
        if (showSchemaModal) { setShowSchemaModal(false); return true; }
        if (showDisconnectConfirm) { setShowDisconnectConfirm(false); return true; }
        return false;
    }, [showSchemaModal, showDisconnectConfirm, showUpdateConfirm]);

    // Modal State Helpers
    const pushModalState = (modalName: string) => {
        try {
            window.history.pushState({ view: 'settings', modal: modalName }, '', window.location.pathname);
        } catch (e) {}
    };

    const closeModal = () => {
        if (window.history.state?.modal) {
            window.history.back();
        } else {
            setShowDisconnectConfirm(false);
            setShowSchemaModal(false);
        }
    };

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (!event.state?.modal) {
                setShowDisconnectConfirm(false);
                setShowSchemaModal(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // ... (Existing useEffects for storage and routing - Keep unchanged)

    const handleSaveAppConfig = () => {
        if (!appName.trim() || !appVersion.trim()) return;
        setIsSavingAppConfig(true);
        if (onUpdateAppConfig) {
            onUpdateAppConfig({ appName, appVersion });
        }
        setTimeout(() => setIsSavingAppConfig(false), 1000);
    };
    
    // ... (Existing File Upload & Database Logic - Keep unchanged)

    const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.apk')) {
            alert('الرجاء اختيار ملف بصيغة .apk');
            return;
        }

        setIsUploadingApk(true);
        setUploadProgress(0); // Reset progress

        try {
            const url = await uploadFile(file, 'app_updates', (progress) => {
                setUploadProgress(Math.round(progress));
            });
            setUpdateUrl(url);
            setUpdateType('apk'); 
        } catch (err: any) {
            console.error("APK Upload Error:", err);
            // Suggest CORS issue if it hangs or fails mysteriously
            const corsNote = "\n\nنصيحة: إذا توقف الرفع، تأكد من إعداد CORS على حاوية التخزين في Google Cloud Console.";
            alert(`فشل رفع الملف. السبب: ${err.message || 'خطأ غير معروف'}${corsNote}`);
        } finally {
            setIsUploadingApk(false);
            setUploadProgress(0);
            if (apkInputRef.current) apkInputRef.current.value = '';
        }
    };

    // --- Update System Logic ---
    const handlePushUpdate = async () => {
        if (!updateVersion || !updateUrl) return;

        setIsSendingUpdate(true);
        setShowUpdateConfirm(false);

        const updateConfig: UpdateConfig = {
            id: `UPDATE-${Date.now()}`,
            version: updateVersion,
            url: updateUrl,
            type: updateType,
            description: updateDesc,
            isActive: true,
            releaseDate: new Date()
        };

        try {
            // 1. Save to DB
            await updateData('settings', 'app_update', updateConfig);

            // 2. Send Notifications to All Roles
            const roles = ['driver', 'merchant', 'customer', 'admin']; // 'customer' maps to 'user' in backend
            
            const notifyPromises = roles.map(role => 
                sendExternalNotification(role, {
                    title: `🚀 تحديث جديد ${updateVersion}`,
                    body: updateDesc || "نسخة جديدة من التطبيق متوفرة الآن بميزات وتحسينات جديدة. اضغط للتحديث.",
                    url: updateUrl
                })
            );

            await Promise.all(notifyPromises);

            setIsSendingUpdate(false);
            alert('تم نشر التحديث وإرسال الإشعارات للجميع بنجاح!');
            
            // Clear Form
            setUpdateVersion('');
            setUpdateUrl('');
            setUpdateDesc('');

        } catch (error) {
            console.error("Failed to push update:", error);
            setIsSendingUpdate(false);
            alert('حدث خطأ أثناء نشر التحديث.');
        }
    };
    
    // ... (Existing Rendering Logic for Overlay & Modals)

    // Split name logic for the overlay display
    const currentAppName = appName || 'GOO NOW';
    const [firstWord, ...restWords] = currentAppName.split(' ');
    const restOfName = restWords.join(' ');

    if (isProcessing) {
        // ... (Existing Processing Overlay - Keep unchanged)
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#111827] animate-fadeIn">
                 {/* ... existing pulse logic ... */}
                 <div className="text-5xl font-bold mb-8 flex items-center gap-2">
                    {viewProvider === 'firebase' ? <CloudIcon className="w-12 h-12 text-red-500" /> : <BoltIcon className="w-12 h-12 text-green-500" />}
                    <div>
                        <span className="text-red-500">{firstWord}</span>
                        <span className="text-white ml-2">{restOfName}</span>
                    </div>
                </div>
                <div className="relative w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                    <div className={`absolute top-0 left-0 h-full ${viewProvider === 'firebase' ? 'bg-red-600' : 'bg-green-500'} animate-[progress_2s_ease-in-out_infinite] w-1/3 rounded-full`}></div>
                </div>
                <p className="text-gray-200 text-lg font-bold animate-pulse">{processStep}</p>
                <p className="text-gray-500 text-sm mt-2">يرجى الانتظار، لا تغلق الصفحة...</p>
            </div>
        );
    }
    
    const isActive = activeProvider === viewProvider;
    
    const handleTriggerUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const json = JSON.parse(text);
                
                let webConfig = {};

                if (json.project_info && json.client) {
                    const client = json.client[0]; 
                    const projectInfo = json.project_info;
                    webConfig = {
                        apiKey: client.api_key?.[0]?.current_key,
                        authDomain: `${projectInfo.project_id}.firebaseapp.com`,
                        projectId: projectInfo.project_id,
                        storageBucket: projectInfo.storage_bucket,
                        messagingSenderId: projectInfo.project_number,
                        appId: client.client_info?.mobilesdk_app_id
                    };
                    setStatus('idle');
                    setErrorMessage('');
                } else if (json.apiKey && json.projectId) {
                    webConfig = json;
                    setStatus('idle');
                    setErrorMessage('');
                } else {
                     setErrorMessage('الملف لا يحتوي على البيانات المطلوبة.');
                     setStatus('error');
                     return;
                }

                setConfigJson(safeStringify(webConfig));

            } catch (err) {
                setErrorMessage('الملف غير صالح');
                setStatus('error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };
    
    const handleSave = async () => {
        // ... (Keep existing handleSave logic intact)
        try {
            setIsProcessing(true);
            setProcessStep("جاري تهيئة الاتصال...");
            await new Promise(r => setTimeout(r, 1000));
            safeRemoveItem('system_status');

            if (viewProvider === 'firebase') {
                const config = JSON.parse(configJson);
                if (!config.apiKey || !config.projectId) throw new Error("تكوين غير صحيح.");
                const initSuccess = initFirebase(config);
                if (!initSuccess) throw new Error("فشل في تهيئة مكتبة Firebase.");
                setProcessStep("جاري التحقق من الصلاحيات...");
                const testResult = await testFirebase();
                if (!testResult.success) throw new Error(`${testResult.error || 'خطأ غير معروف'}`);
                await performMigration(migrateFirebase);
                safeSetItem('firebase_config', safeStringify(config));
                safeSetItem('db_provider', 'firebase');
                setActiveProvider('firebase');
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'FIREBASE_CONFIG', config: config });
                }
            } else {
                const finalUrl = supabaseUrl.trim();
                const finalKey = supabaseKey.trim();
                if (!finalUrl || !finalKey) throw new Error("يرجى إدخال البيانات.");
                if (!finalUrl.startsWith('http')) throw new Error("رابط غير صالح.");
                const initSuccess = initSupabase(finalUrl, finalKey);
                if (!initSuccess) throw new Error("فشل التهيئة.");
                setProcessStep("جاري التحقق من الاتصال...");
                const testResult = await testSupabase();
                if (!testResult.success) throw new Error(`${testResult.error || 'خطأ غير معروف'}`);
                await performMigration(migrateSupabase);
                safeSetItem('supabase_config', safeStringify({ url: finalUrl, key: finalKey }));
                safeSetItem('db_provider', 'supabase');
                setActiveProvider('supabase');
            }
            setIsConfigured(true);
            setStatus('success');
            setProcessStep("تم التفعيل بنجاح!");
            await new Promise(r => setTimeout(r, 2000));
            if (onSuccess) onSuccess(); else setIsProcessing(false);
        } catch (e: any) {
            setIsProcessing(false);
            setErrorMessage(e.message || "حدث خطأ.");
            setStatus('error');
            console.error(e);
        }
    };
    
    // Helper to strictly deduplicate data before sending to migration
    const deduplicateLocalData = (data: any[]) => {
        if (!Array.isArray(data)) return [];
        const map = new Map();
        data.forEach(item => {
            if (item && item.id) {
                map.set(String(item.id), item);
            } else if (item && item.phone) {
                map.set(String(item.phone), item);
            }
        });
        return Array.from(map.values());
    };

    const performMigration = async (migrateFn: (col: string, data: any[]) => Promise<void>) => {
        // ... (Keep existing migration logic)
        setProcessStep("جاري تأمين ونقل البيانات...");
        try {
            const loadFromLocal = (key: string) => {
                const stored = safeGetItem(key);
                if (!stored) return [];
                try {
                    return deduplicateLocalData(JSON.parse(stored));
                } catch (e) { return []; }
            };
            setProcessStep("جاري نقل حسابات المستخدمين...");
            await migrateFn('users', loadFromLocal('users'));
            setProcessStep("جاري نقل سجل الطلبات...");
            await migrateFn('orders', loadFromLocal('orders'));
            setProcessStep("جاري نقل الرسائل والمدفوعات...");
            await migrateFn('messages', loadFromLocal('messages'));
            await migrateFn('payments', loadFromLocal('payments'));
            await migrateFn('reset_requests', loadFromLocal('passwordResetRequests'));
            setProcessStep("جاري نقل العروض والصور...");
            await migrateFn('slider_images', loadFromLocal('sliderImages')); 
        } catch (migrationError: any) {
            console.error("Migration failed:", migrationError);
            if (migrationError.message && (migrationError.message.includes('column') || migrationError.message.includes('relation'))) {
                 setErrorMessage("خطأ في هيكل قاعدة البيانات. يرجى تشغيل كود SQL الإصلاحي.");
            }
            throw new Error(`${migrationError.message}`);
        }
    };

    const confirmDisconnect = () => {
         // ... (Keep existing disconnect logic)
        closeModal(); 
        setIsProcessing(true);
        setProcessStep("جاري قطع الاتصال بقاعدة البيانات...");
        setTimeout(() => {
            setProcessStep("جاري إيقاف الخدمات السحابية...");
            safeSetItem('system_status', 'stopped');
            setActiveProvider(null);
            setStatus('idle');
            setTimeout(() => {
                if (onDisconnect) onDisconnect(); else setIsProcessing(false);
            }, 1500);
        }, 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 text-white p-4 pb-32">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
                    <SettingsIcon className="w-10 h-10 text-blue-500" />
                    <span>الإعدادات العامة</span>
                </h2>
                <p className="text-gray-400">تحكم في اسم التطبيق، التحديثات، وإعدادات قاعدة البيانات.</p>
            </div>

            {/* App Info Settings */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-t-4 border-blue-500">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-blue-400" />
                        معلومات التطبيق
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">اسم التطبيق</label>
                        <input 
                            type="text" 
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="GOO NOW"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">رقم الإصدار الحالي</label>
                        <input 
                            type="text" 
                            value={appVersion}
                            onChange={(e) => setAppVersion(e.target.value)}
                            placeholder="VERSION 1.0.5"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleSaveAppConfig}
                        disabled={isSavingAppConfig}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {isSavingAppConfig ? 'جاري الحفظ...' : <>حفظ التغييرات <CheckCircleIcon className="w-4 h-4" /></>}
                    </button>
                </div>
            </div>

            {/* Update Management Section */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-t-4 border-purple-500 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                        <RocketIcon className="w-5 h-5 text-purple-400" />
                        إرسال تحديث جديد
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">رقم الإصدار الجديد</label>
                        <input 
                            type="text" 
                            value={updateVersion}
                            onChange={(e) => setUpdateVersion(e.target.value)}
                            placeholder="مثال: 1.1.0"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">نوع التحديث</label>
                         <div className="flex bg-gray-700 p-1 rounded-lg">
                            <button 
                                onClick={() => setUpdateType('apk')} 
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${updateType === 'apk' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                <DownloadIcon className="w-4 h-4 inline ml-1" /> تطبيق (APK)
                            </button>
                            <button 
                                onClick={() => setUpdateType('link')} 
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${updateType === 'link' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                <LinkIcon className="w-4 h-4 inline ml-1" /> رابط (Link)
                            </button>
                         </div>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">رابط التحميل / ملف التطبيق</label>
                        
                        <div className="flex gap-2 items-center">
                             {/* URL Input */}
                             <div className="relative flex-1">
                                <input 
                                    type="url" 
                                    value={updateUrl}
                                    onChange={(e) => setUpdateUrl(e.target.value)}
                                    placeholder={isUploadingApk ? `جاري الرفع... ${uploadProgress}%` : "https://..."}
                                    disabled={isUploadingApk}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none dir-ltr disabled:opacity-70 disabled:cursor-wait"
                                />
                                {isUploadingApk && (
                                    <div className="absolute top-0 left-0 bottom-0 bg-purple-500/10 transition-all duration-300 pointer-events-none" style={{ width: `${uploadProgress}%` }}></div>
                                )}
                                {isUploadingApk && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                         <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                             </div>

                             {/* Upload Button */}
                             <button 
                                onClick={() => apkInputRef.current?.click()}
                                disabled={isUploadingApk}
                                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg border border-gray-600 transition-colors flex items-center justify-center"
                                title="رفع ملف APK من الجهاز"
                            >
                                <UploadIcon className="w-5 h-5" />
                             </button>
                             <input 
                                ref={apkInputRef} 
                                type="file" 
                                accept=".apk" 
                                className="hidden" 
                                onChange={handleApkUpload} 
                             />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">وصف التحديث (ما الجديد؟)</label>
                        <textarea 
                            value={updateDesc}
                            onChange={(e) => setUpdateDesc(e.target.value)}
                            placeholder="اكتب تفاصيل التحديث هنا..."
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={() => setShowUpdateConfirm(true)}
                        disabled={!updateVersion || !updateUrl || isSendingUpdate || isUploadingApk}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                    >
                        {isSendingUpdate ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                جاري النشر...
                            </>
                        ) : (
                            <>
                                <BellIcon className="w-5 h-5 group-hover:animate-swing" />
                                نشر التحديث وإشعار الجميع
                            </>
                        )}
                    </button>
                </div>
                
                {/* Visual Background Decoration */}
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Database Provider Selector (Existing) */}
            <div className="text-center mt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3">
                    {viewProvider === 'firebase' ? <CloudIcon className="w-8 h-8 text-red-500" /> : <BoltIcon className="w-8 h-8 text-green-500" />}
                    <span>قاعدة البيانات</span>
                </h2>
            </div>
            {/* ... Existing Database Logic ... */}
            <div className="flex bg-gray-800 p-1 rounded-lg max-w-md mx-auto mb-6 relative">
                <button 
                    onClick={() => { setViewProvider('firebase'); setErrorMessage(''); }}
                    className={`flex-1 py-2 px-4 rounded-md font-bold transition-colors flex items-center justify-center gap-2 relative ${viewProvider === 'firebase' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <CloudIcon className="w-5 h-5" />
                    Firebase
                    {activeProvider === 'firebase' && (
                        <span className="absolute top-2 left-2 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-800 animate-pulse"></span>
                    )}
                </button>
                <button 
                    onClick={() => { setViewProvider('supabase'); setErrorMessage(''); }}
                    className={`flex-1 py-2 px-4 rounded-md font-bold transition-colors flex items-center justify-center gap-2 relative ${viewProvider === 'supabase' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <BoltIcon className="w-5 h-5" />
                    Supabase
                    {activeProvider === 'supabase' && (
                        <span className="absolute top-2 left-2 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-800 animate-pulse"></span>
                    )}
                </button>
            </div>

            <div className={`bg-gray-800 p-6 rounded-xl shadow-lg border-t-4 ${isActive ? 'border-green-500' : 'border-red-500'}`}>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-200">
                        {viewProvider === 'firebase' ? 'إعداد Firebase' : 'إعداد Supabase'}
                    </h3>
                    <span className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isActive && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
                        {isActive ? 'نظام مفعل (Online)' : 'تم الإيقاف (Stopped)'}
                    </span>
                </div>

                {viewProvider === 'firebase' ? (
                     <div className="space-y-4">
                        {!isConfigured && (
                            <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-lg mb-6 text-sm text-blue-200">
                                <p className="font-bold mb-1">طريقة التفعيل:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>قم بتحميل ملف <code>google-services.json</code> من Firebase Console.</li>
                                    <li>اضغط أدناه لرفع الملف.</li>
                                </ol>
                            </div>
                        )}
                        <div>
                            <p className="block text-sm font-medium text-gray-400 mb-2">ملف التكوين (google-services.json)</p>
                            <div 
                                onClick={handleTriggerUpload}
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                                    <UploadIcon className="w-10 h-10 text-gray-400 mb-3" />
                                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">اضغط لرفع الملف</span></p>
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                        </div>
                         {configJson && !errorMessage && (
                            <div className="bg-[#0f172a] border border-gray-700 rounded-xl p-4 mt-4 relative group">
                                <div className="flex justify-between items-center mb-2 border-b border-gray-700/50 pb-2">
                                     <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                        <h4 className="text-sm font-bold text-white">ملف التكوين الحالي (Active Config)</h4>
                                     </div>
                                     <span className="text-[10px] font-mono bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                                        {(() => {
                                            try { return JSON.parse(configJson).projectId; } catch { return 'Unknown'; }
                                        })()}
                                     </span>
                                </div>
                                <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                    <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap">
                                        {configJson}
                                    </pre>
                                </div>
                                <div className="mt-3 pt-2 border-t border-gray-700/50 text-[10px] text-gray-500">
                                    هذا هو ملف الإعدادات المعتمد كقاعدة بيانات افتراضية للنظام.
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!isConfigured && (
                             <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-lg mb-6 text-sm text-blue-200">
                                <p className="font-bold mb-1">طريقة التفعيل:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>أنشئ مشروعاً جديداً في Supabase.</li>
                                    <li>اضغط على الزر أدناه للحصول على كود SQL لإنشاء الجداول.</li>
                                    <li>نفذ الكود في <strong>SQL Editor</strong> داخل Supabase.</li>
                                    <li>انسخ <code>Project URL</code> و <code>Anon Key</code>.</li>
                                </ol>
                                <button 
                                    onClick={() => { pushModalState('schema'); setShowSchemaModal(true); }}
                                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors flex items-center"
                                >
                                    <ClipboardListIcon className="w-4 h-4 mr-2" />
                                    نسخ كود إنشاء الجداول (SQL)
                                </button>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Project URL</label>
                            <input 
                                type="text" 
                                value={supabaseUrl}
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                placeholder="https://xyz.supabase.co"
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">API Key (anon/public)</label>
                            <input 
                                type="text" 
                                value={supabaseKey}
                                onChange={(e) => setSupabaseKey(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                    </div>
                )}
                 {errorMessage && (
                    <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 rounded-lg flex flex-col items-start gap-2 text-red-200 text-sm">
                        <div className="flex items-start gap-2">
                            <XIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">خطأ:</p>
                                <p>{errorMessage}</p>
                            </div>
                        </div>
                        {(errorMessage.includes('RLS') || errorMessage.includes('SQL') || errorMessage.includes('policy') || errorMessage.includes('column')) && (
                             <button 
                                onClick={() => { pushModalState('schema'); setShowSchemaModal(true); }}
                                className="mt-2 mr-7 text-blue-300 hover:text-blue-200 underline text-xs"
                            >
                                عرض كود SQL المطلوب
                            </button>
                        )}
                    </div>
                )}
                
                <div className="flex gap-4 pt-6 border-t border-gray-700 mt-6">
                    {!isActive ? (
                        <button
                            onClick={handleSave}
                            disabled={viewProvider === 'firebase' ? !configJson : (!supabaseUrl || !supabaseKey)}
                            className={`flex-1 ${viewProvider === 'firebase' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'} disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2`}
                        >
                            {viewProvider === 'firebase' ? <CloudIcon className="w-5 h-5" /> : <BoltIcon className="w-5 h-5" />}
                            <span>تفعيل هذا النظام</span>
                        </button>
                    ) : (
                        <div className="flex-1 bg-gray-700/50 text-gray-400 font-bold py-3 rounded-lg flex justify-center items-center gap-2 cursor-default border border-gray-600">
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            <span>النظام يعمل حالياً</span>
                        </div>
                    )}
                    
                    {isActive && (
                        <button
                            onClick={() => { pushModalState('disconnect'); setShowDisconnectConfirm(true); }}
                            className="px-6 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-3 rounded-lg transition-colors"
                        >
                            إيقاف
                        </button>
                    )}
                </div>
            </div>

            {/* Confirm Update Modal */}
            {showUpdateConfirm && (
                <ConfirmationModal 
                    title="تأكيد نشر التحديث"
                    message="هل أنت متأكد من رغبتك في إرسال هذا التحديث لجميع المستخدمين؟ سيتم إرسال إشعار فوري للجميع."
                    onClose={() => setShowUpdateConfirm(false)}
                    onConfirm={handlePushUpdate}
                    confirmButtonText="نعم، نشر الآن"
                    confirmVariant="success"
                />
            )}

            {showDisconnectConfirm && (
                <ConfirmationModal 
                    title="تأكيد إيقاف المزامنة"
                    message="هل أنت متأكد من رغبتك في قطع الاتصال بقاعدة البيانات السحابية؟ سيعود التطبيق للعمل في الوضع المحلي."
                    onClose={closeModal}
                    onConfirm={confirmDisconnect}
                    confirmButtonText="نعم، إيقاف"
                    confirmVariant="danger"
                />
            )}

            {showSchemaModal && (
                <SchemaModal onClose={closeModal} />
            )}
        </div>
    );
};

export default SystemSettings;