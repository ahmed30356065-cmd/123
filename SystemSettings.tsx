
import React, { useState, useEffect, useRef } from 'react';
import { UploadIcon, CheckCircleIcon, XIcon, CloudIcon, BoltIcon, ClipboardListIcon } from './components/icons';
// Fixed: Using correct relative paths from root for imports
import { initFirebase, migrateLocalData as migrateFirebase, testConnection as testFirebase } from './services/firebase';
import { initSupabase, migrateLocalData as migrateSupabase, testConnection as testSupabase } from './services/supabase';
import ConfirmationModal from './components/admin/ConfirmationModal';

interface SystemSettingsProps {
    onSuccess?: () => void;
    onDisconnect?: () => void;
}

const SUPABASE_SCHEMA_SQL = `
-- Users Table
create table if not exists users (
  id text primary key,
  name text,
  role text,
  password text,
  status text,
  phone text,
  "createdAt" timestamp with time zone,
  "commissionRate" numeric,
  "commissionType" text,
  "dailyLogStatus" text,
  "incentivesActive" boolean,
  permissions jsonb,
  "dailyLogMode" text,
  "dailyLogStartedAt" timestamp with time zone
);

-- Orders Table
create table if not exists orders (
  id text primary key,
  customer jsonb,
  "createdAt" timestamp with time zone,
  status text,
  notes text,
  "driverId" text,
  "merchantId" text,
  "merchantName" text,
  "deliveryFee" numeric,
  "deliveredAt" timestamp with time zone,
  reconciled boolean
);

-- Messages Table
create table if not exists messages (
  id text primary key,
  text text,
  image text,
  "targetRole" text,
  "targetId" text,
  "createdAt" timestamp with time zone
);

-- Payments Table
create table if not exists payments (
  id text primary key,
  "driverId" text,
  amount numeric,
  "createdAt" timestamp with time zone,
  "reconciledOrderIds" jsonb
);

-- Reset Requests Table
create table if not exists "resetRequests" (
  phone text primary key,
  "requestedAt" timestamp with time zone
);

-- Notifications Table
create table if not exists notifications (
  id serial primary key,
  type text,
  "orderId" text,
  "merchantName" text,
  "customerAddress" text,
  "targetRole" text,
  "createdAt" timestamp with time zone
);
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
                    <h3 className="text-lg font-bold text-green-400">كود إنشاء الجداول (SQL Schema)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto bg-gray-900 font-mono text-sm text-gray-300">
                    <div className="mb-4 text-gray-400 font-sans">
                        <p className="mb-2">1. انسخ الكود التالي.</p>
                        <p className="mb-2">2. اذهب إلى <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 underline">لوحة تحكم Supabase</a>.</p>
                        <p>3. افتح <strong>SQL Editor</strong>، الصق الكود، واضغط <strong>Run</strong>.</p>
                    </div>
                    <pre className="p-4 bg-black rounded border border-gray-700 whitespace-pre-wrap select-all">
                        {SUPABASE_SCHEMA_SQL}
                    </pre>
                </div>
                <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-end gap-2 rounded-b-lg">
                    <button
                        onClick={handleCopy}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                        {copied ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <ClipboardListIcon className="w-5 h-5 mr-2" />}
                        {copied ? 'تم النسخ!' : 'نسخ الكود'}
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

const SystemSettings: React.FC<SystemSettingsProps> = ({ onSuccess, onDisconnect }) => {
    const [viewProvider, setViewProvider] = useState<'firebase' | 'supabase'>('firebase');
    const [activeProvider, setActiveProvider] = useState<'firebase' | 'supabase' | null>(null);

    const [configJson, setConfigJson] = useState('');

    // Supabase State
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');

    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'migrating'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);

    // Unified processing state for the overlay
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStep, setProcessStep] = useState('');

    // State for modals
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
    const [showSchemaModal, setShowSchemaModal] = useState(false);

    // Ref for the file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Check if system is explicitly stopped
        const systemStatus = localStorage.getItem('system_status');

        const storedProvider = localStorage.getItem('db_provider') as 'firebase' | 'supabase';

        if (systemStatus === 'stopped') {
            setActiveProvider(null);
        } else if (storedProvider) {
            setActiveProvider(storedProvider);
        } else {
            // Default is firebase if not stopped and no provider set (first run or implicit)
            setActiveProvider('firebase');
        }

        const savedFirebaseConfig = localStorage.getItem('firebase_config');
        if (savedFirebaseConfig) {
            setConfigJson(savedFirebaseConfig);
        }

        const savedSupabaseConfig = localStorage.getItem('supabase_config');
        if (savedSupabaseConfig) {
            const parsed = JSON.parse(savedSupabaseConfig);
            setSupabaseUrl(parsed.url);
            setSupabaseKey(parsed.key);
        }
    }, []);

    // Check configuration for the CURRENTLY VIEWED provider
    useEffect(() => {
        if (viewProvider === 'firebase') {
            setIsConfigured(!!configJson);
        } else {
            setIsConfigured(!!supabaseUrl && !!supabaseKey);
        }
    }, [viewProvider, configJson, supabaseUrl, supabaseKey]);

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

                // Check if it's an Android google-services.json
                if (json.project_info && json.client && Array.isArray(json.client) && json.client.length > 0) {
                    const client = json.client[0]; // Take the first client
                    const projectInfo = json.project_info;

                    // Extract relevant fields and map them to Web SDK format
                    webConfig = {
                        apiKey: client.api_key?.[0]?.current_key,
                        authDomain: `${projectInfo.project_id}.firebaseapp.com`, // Inferred
                        projectId: projectInfo.project_id,
                        storageBucket: projectInfo.storage_bucket,
                        messagingSenderId: projectInfo.project_number,
                        appId: client.client_info?.mobilesdk_app_id
                    };

                    setStatus('idle');
                    setErrorMessage('');
                } else if (json.apiKey && json.projectId) {
                    // It's already a web config
                    webConfig = json;
                    setStatus('idle');
                    setErrorMessage('');
                } else {
                    setErrorMessage('الملف لا يحتوي على البيانات المطلوبة (google-services.json أو Web Config).');
                    setStatus('error');
                    return;
                }

                setConfigJson(JSON.stringify(webConfig, null, 2));

            } catch (err) {
                setErrorMessage('الملف غير صالح (Invalid JSON)');
                setStatus('error');
            }
        };
        reader.readAsText(file);

        // Reset input value to allow selecting the same file again if needed
        e.target.value = '';
    };

    const handleSave = async () => {
        try {
            // Start the full screen overlay immediately
            setIsProcessing(true);
            setProcessStep("جاري تهيئة الاتصال...");

            // Artificial delay to make UI feel stable
            await new Promise(r => setTimeout(r, 1000));

            // Clear the "stopped" flag to allow connection
            localStorage.removeItem('system_status');

            if (viewProvider === 'firebase') {
                const config = JSON.parse(configJson);

                if (!config.apiKey || !config.projectId) {
                    throw new Error("تكوين غير صحيح. لم يتم العثور على apiKey أو projectId.");
                }

                // 1. Initialize Firebase
                const initSuccess = initFirebase(config);
                if (!initSuccess) throw new Error("فشل في تهيئة مكتبة Firebase.");

                // 2. Test Connection
                setProcessStep("جاري التحقق من الصلاحيات...");
                const testResult = await testFirebase();
                if (!testResult.success) throw new Error(`فشل الاتصال: ${testResult.error || 'خطأ غير معروف'}`);

                // 3. Migration
                await performMigration(migrateFirebase);

                // 4. Finalize
                localStorage.setItem('firebase_config', JSON.stringify(config));
                localStorage.setItem('db_provider', 'firebase');
                setActiveProvider('firebase');

            } else {
                // Supabase
                if (!supabaseUrl || !supabaseKey) {
                    throw new Error("يرجى إدخال رابط المشروع ومفتاح API.");
                }

                if (!supabaseUrl.startsWith('http')) {
                    throw new Error("رابط المشروع غير صالح. يجب أن يبدأ بـ http أو https.");
                }

                // 1. Initialize
                const initSuccess = initSupabase(supabaseUrl, supabaseKey);
                if (!initSuccess) throw new Error("فشل في تهيئة مكتبة Supabase.");

                // 2. Test Connection
                setProcessStep("جاري التحقق من الاتصال...");
                const testResult = await testSupabase();
                if (!testResult.success) throw new Error(`فشل الاتصال: ${testResult.error || 'خطأ غير معروف'}`);

                // 3. Migration
                await performMigration(migrateSupabase);

                // 4. Finalize
                localStorage.setItem('supabase_config', JSON.stringify({ url: supabaseUrl, key: supabaseKey }));
                localStorage.setItem('db_provider', 'supabase');
                setActiveProvider('supabase');
            }

            setIsConfigured(true);
            setStatus('success');

            setProcessStep("تم تفعيل النظام بنجاح! العودة للوحة التحكم...");

            // Wait a bit for user to see success message inside the overlay
            await new Promise(r => setTimeout(r, 2000));

            // Execute success callback (Soft Reload)
            if (onSuccess) {
                onSuccess();
            } else {
                setIsProcessing(false);
            }

        } catch (e: any) {
            // If error, we can optionally revert to stopped if it was stopped before, but let's keep it open for retry
            setIsProcessing(false);
            setErrorMessage(e.message || "حدث خطأ غير متوقع.");
            setStatus('error');
            console.error(e);
        }
    };

    const performMigration = async (migrateFn: (col: string, data: any[]) => Promise<void>) => {
        setProcessStep("جاري تأمين ونقل البيانات...");

        try {
            const loadFromLocal = (key: string) => {
                const stored = localStorage.getItem(key);
                if (!stored) return [];
                return JSON.parse(stored, (key, value) => {
                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                        return new Date(value);
                    }
                    return value;
                });
            };

            setProcessStep("جاري نقل حسابات المستخدمين...");
            await migrateFn('users', loadFromLocal('users'));

            setProcessStep("جاري نقل سجل الطلبات...");
            await migrateFn('orders', loadFromLocal('orders'));

            setProcessStep("جاري نقل الرسائل والمدفوعات...");
            await migrateFn('messages', loadFromLocal('messages'));
            await migrateFn('payments', loadFromLocal('payments'));

            await migrateFn('resetRequests', loadFromLocal('passwordResetRequests'));

        } catch (migrationError: any) {
            console.error("Migration failed:", migrationError);
            throw new Error(`فشل نقل البيانات: ${migrationError.message}`);
        }
    };

    const confirmDisconnect = () => {
        setShowDisconnectConfirm(false);
        setIsProcessing(true);
        setProcessStep("جاري قطع الاتصال بقاعدة البيانات...");

        setTimeout(() => {
            setProcessStep("جاري إيقاف الخدمات السحابية...");

            // Mark system as explicitly stopped
            localStorage.setItem('system_status', 'stopped');

            // We also clear the active provider state to reflect the UI change immediately
            setActiveProvider(null);

            setStatus('idle');

            setTimeout(() => {
                if (onDisconnect) {
                    onDisconnect();
                } else {
                    setIsProcessing(false);
                }
            }, 1500);
        }, 2000);
    };

    if (isProcessing) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#111827] animate-fadeIn">
                <style>{`
                    @keyframes pulse-ring {
                        0% { transform: scale(0.8); opacity: 0.5; }
                        50% { transform: scale(1.1); opacity: 1; }
                        100% { transform: scale(0.8); opacity: 0.5; }
                    }
                    .brand-pulse {
                        animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                `}</style>
                <div className="text-5xl font-bold mb-8 brand-pulse flex items-center gap-2">
                    {viewProvider === 'firebase' ? <CloudIcon className="w-12 h-12 text-red-500" /> : <BoltIcon className="w-12 h-12 text-green-500" />}
                    <div>
                        <span className="text-red-500">DELI</span>
                        <span className="text-white"> NOW</span>
                    </div>
                </div>

                <div className="relative w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                    <div className={`absolute top-0 left-0 h-full ${viewProvider === 'firebase' ? 'bg-red-600' : 'bg-green-500'} animate-[progress_2s_ease-in-out_infinite] w-1/3 rounded-full`}></div>
                </div>
                <style>{`
                    @keyframes progress {
                        0% { left: -30%; }
                        100% { left: 100%; }
                    }
                `}</style>

                <p className="text-gray-200 text-lg font-bold animate-pulse">{processStep}</p>
                <p className="text-gray-500 text-sm mt-2">يرجى الانتظار، لا تغلق الصفحة...</p>
            </div>
        );
    }

    const isActive = activeProvider === viewProvider;

    return (
        <div className="max-w-5xl mx-auto space-y-8 text-white p-6 pb-32 animate-fadeIn">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black mb-2 flex items-center justify-center gap-3">
                    <span className="bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text">إعدادات النظام</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-xl text-gray-400 font-medium">الربط السحابي</span>
                </h2>
                <p className="text-gray-400">إدارة ربط التطبيق بقواعد البيانات السحابية للمزامنة الحية</p>
            </div>

            {/* Provider Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Firebase Card */}
                <div
                    onClick={() => { setViewProvider('firebase'); setErrorMessage(''); }}
                    className={`relative overflow-hidden group cursor-pointer transition-all duration-300 border-2 rounded-2xl p-6 ${viewProvider === 'firebase'
                            ? 'bg-gray-800/80 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                            : 'bg-gray-800/40 border-gray-700 hover:border-gray-600 hover:bg-gray-800/60'
                        }`}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl transition-colors ${viewProvider === 'firebase' ? 'bg-red-500/20 text-red-500' : 'bg-gray-700/50 text-gray-400'}`}>
                            <CloudIcon className="w-8 h-8" />
                        </div>
                        {activeProvider === 'firebase' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                متصل
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold mb-1 ${viewProvider === 'firebase' ? 'text-white' : 'text-gray-400'}`}>Firebase</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            منصة جوجل المتكاملة. الخيار الأفضل للأداء العالي، الإشعارات، والتحليلات المتقدمة.
                        </p>
                    </div>
                    {viewProvider === 'firebase' && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none -mr-10 -mt-10"></div>
                    )}
                </div>

                {/* Supabase Card */}
                <div
                    onClick={() => { setViewProvider('supabase'); setErrorMessage(''); }}
                    className={`relative overflow-hidden group cursor-pointer transition-all duration-300 border-2 rounded-2xl p-6 ${viewProvider === 'supabase'
                            ? 'bg-gray-800/80 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)]'
                            : 'bg-gray-800/40 border-gray-700 hover:border-gray-600 hover:bg-gray-800/60'
                        }`}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl transition-colors ${viewProvider === 'supabase' ? 'bg-green-500/20 text-green-500' : 'bg-gray-700/50 text-gray-400'}`}>
                            <BoltIcon className="w-8 h-8" />
                        </div>
                        {activeProvider === 'supabase' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                متصل
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold mb-1 ${viewProvider === 'supabase' ? 'text-white' : 'text-gray-400'}`}>Supabase</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            بديل مفتوح المصدر لـ Firebase. يوفر قاعدة بيانات SQL قوية وواجهات برمجية مرنة.
                        </p>
                    </div>
                    {viewProvider === 'supabase' && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full pointer-events-none -mr-10 -mt-10"></div>
                    )}
                </div>
            </div>

            {/* Detailed Configuration Panel */}
            <div className={`bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700 transition-all duration-500 ${viewProvider ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {viewProvider === 'firebase' ? <CloudIcon className="w-5 h-5 text-red-500" /> : <BoltIcon className="w-5 h-5 text-green-500" />}
                            إعدادات {viewProvider === 'firebase' ? 'Firebase' : 'Supabase'}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            {viewProvider === 'firebase' ? 'قم برفع ملف google-services.json الخاص بمشروعك.' : 'أدخل رابط المشروع ومفتاح API الخاص بـ Supabase.'}
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-gray-900/50">
                    {viewProvider === 'firebase' ? (
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Upload Area */}
                            <div className="flex-1">
                                <div
                                    onClick={handleTriggerUpload}
                                    className={`relative group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${isConfigured
                                            ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                                            : 'border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-gray-500'
                                        }`}
                                >
                                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 pointer-events-none">
                                        <div className={`p-4 rounded-full transition-transform duration-300 group-hover:scale-110 ${isConfigured ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'}`}>
                                            <UploadIcon className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-base font-bold text-gray-300 group-hover:text-white transition-colors">
                                                {isConfigured ? 'ملف التكوين جاهز' : 'رفع ملف google-services.json'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {isConfigured ? 'اضغط لاستبدال الملف' : 'اضغط هنا لاختيار الملف من جهازك'}
                                            </p>
                                        </div>
                                    </div>
                                    {isConfigured && (
                                        <div className="absolute top-3 right-3 text-green-500 bg-green-500/10 p-1 rounded-full animate-bounce">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                            </div>

                            {/* Info Area */}
                            {configJson && !errorMessage && (
                                <div className="flex-1 flex flex-col h-48">
                                    <div className="flex-1 bg-black/40 rounded-xl border border-gray-700/50 p-4 relative overflow-hidden group">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    const blob = new Blob([configJson], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = 'google-services.json';
                                                    a.click();
                                                }}
                                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white shadow-lg"
                                                title="تحميل الملف"
                                            >
                                                <UploadIcon className="w-4 h-4 rotate-180" />
                                            </button>
                                        </div>
                                        <pre className="text-[10px] text-green-400 font-mono leading-relaxed h-full overflow-y-auto custom-scrollbar select-all">
                                            {configJson}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Project URL</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={supabaseUrl}
                                            onChange={(e) => setSupabaseUrl(e.target.value)}
                                            placeholder="https://xyz.supabase.co"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-1 focus:ring-green-500Outline-none transition-all shadow-inner"
                                        />
                                        <div className="absolute left-3 top-3.5 text-gray-500">
                                            <CloudIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">API Key (Anon/Public)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={supabaseKey}
                                            onChange={(e) => setSupabaseKey(e.target.value)}
                                            placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                                            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all shadow-inner font-mono text-sm"
                                        />
                                        <div className="absolute left-3 top-3.5 text-gray-500">
                                            <BoltIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-5 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-blue-200 mb-3 flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5" />
                                        تعليمات التشغيل
                                    </h4>
                                    <ul className="space-y-2 text-sm text-blue-200/70 list-disc list-inside">
                                        <li>قم بإنشاء مشروع جديد على Supabase.</li>
                                        <li>انسخ كود SQL Schema لإنشاء الجداول.</li>
                                        <li>نفذ الكود في "SQL Editor" في لوحة التحكم.</li>
                                        <li>انسخ الرابط والمفتاح من إعدادات المشروع.</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={() => setShowSchemaModal(true)}
                                    className="mt-4 w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 py-3 rounded-lg border border-blue-500/30 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 font-bold"
                                >
                                    <ClipboardListIcon className="w-5 h-5" />
                                    عرض ونسخ كود SQL
                                </button>
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-200 animate-fadeIn">
                            <div className="p-2 bg-red-500/20 rounded-full flex-shrink-0">
                                <XIcon className="w-5 h-5 text-red-400" />
                            </div>
                            <p className="text-sm font-medium">{errorMessage}</p>
                        </div>
                    )}
                </div>

                {/* Footer Configuration Actions */}
                <div className="p-6 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
                    <div className="text-gray-500 text-xs hidden md:block">
                        تأكد من صحة البيانات قبل الضغط على تفعيل.
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        {isActive && (
                            <button
                                onClick={() => setShowDisconnectConfirm(true)}
                                className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all hover:shadow-lg border border-gray-600"
                            >
                                إيقاف المزامنة
                            </button>
                        )}

                        {!isActive && (
                            <button
                                onClick={handleSave}
                                disabled={viewProvider === 'firebase' ? !configJson : (!supabaseUrl || !supabaseKey)}
                                className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 ${viewProvider === 'firebase'
                                        ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-900/30'
                                        : 'bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-500 hover:to-teal-400 shadow-green-900/30'
                                    }`}
                            >
                                {viewProvider === 'firebase' ? <CloudIcon className="w-5 h-5" /> : <BoltIcon className="w-5 h-5" />}
                                <span>تفعيل وبدء المزامنة</span>
                            </button>
                        )}

                        {isActive && (
                            <div className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold flex items-center justify-center gap-2 cursor-default">
                                <CheckCircleIcon className="w-5 h-5" />
                                النظام يعمل
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Components... */}
            {showDisconnectConfirm && (
                <ConfirmationModal
                    title="إيقاف المزامنة"
                    message="هل أنت متأكد؟ سيعود التطبيق للعمل محلياً."
                    onClose={() => setShowDisconnectConfirm(false)}
                    onConfirm={confirmDisconnect}
                    confirmButtonText="إيقاف"
                    confirmVariant="danger"
                />
            )}

            {showSchemaModal && (
                <SchemaModal onClose={() => setShowSchemaModal(false)} />
            )}
        </div>
    );
};

export default SystemSettings;
