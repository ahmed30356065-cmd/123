
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
        <div className="max-w-4xl mx-auto space-y-8 text-white p-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
                    {viewProvider === 'firebase' ? <CloudIcon className="w-10 h-10 text-red-500" /> : <BoltIcon className="w-10 h-10 text-green-500" />}
                    <span>إعدادات قاعدة البيانات</span>
                </h2>
                <p className="text-gray-400">اربط التطبيق بقاعدة بيانات سحابية للمزامنة الفورية.</p>
            </div>

            {/* Provider Selector */}
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
                            <div className="p-3 bg-gray-900/50 rounded-lg max-h-32 overflow-y-auto">
                                <pre className="text-xs text-green-400 font-mono">{configJson}</pre>
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
                                    onClick={() => setShowSchemaModal(true)}
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
                    <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-200 text-sm">
                        <XIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">خطأ:</p>
                            <p>{errorMessage}</p>
                        </div>
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
                            onClick={() => setShowDisconnectConfirm(true)}
                            className="px-6 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-3 rounded-lg transition-colors"
                        >
                            إيقاف
                        </button>
                    )}
                </div>
            </div>

            {showDisconnectConfirm && (
                <ConfirmationModal 
                    title="تأكيد إيقاف المزامنة"
                    message="هل أنت متأكد من رغبتك في قطع الاتصال بقاعدة البيانات السحابية؟ سيعود التطبيق للعمل في الوضع المحلي."
                    onClose={() => setShowDisconnectConfirm(false)}
                    onConfirm={confirmDisconnect}
                    confirmButtonText="نعم، إيقاف"
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
