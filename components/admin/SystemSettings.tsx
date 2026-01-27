import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UploadIcon, CheckCircleIcon, XIcon, CloudIcon, BoltIcon, ClipboardListIcon, SettingsIcon, RocketIcon, DownloadIcon, LinkIcon, BellIcon, ShieldCheckIcon, MobileIcon, UserIcon, TrashIcon, RefreshCwIcon } from '../icons';
import { initFirebase, migrateLocalData as migrateFirebase, testConnection as testFirebase, sendExternalNotification, updateData, uploadFile, subscribeToCollection, deleteData, addData } from '../../services/firebase';
import { initSupabase, migrateLocalData as migrateSupabase, fetchSupabase, testConnection as testSupabase } from '../../services/supabase';
import { AppConfig, UpdateLog } from '../../types';

// --- Types ---
interface SystemSettingsProps {
    currentUser?: any; // Allow passing user for role checks if needed
}

// --- Components ---

const GlassCard = ({ children, className = '', title, icon: Icon, action }: any) => (
    <div className={`relative overflow-hidden bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>
        {title && (
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-blue-400" />}
                    {title}
                </h3>
                {action}
            </div>
        )}
        <div className="p-6">{children}</div>
    </div>
);

const PremiumInput = ({ label, value, onChange, placeholder, type = "text", disabled = false, icon: Icon, className = "" }: any) => (
    <div className={`space-y-2 ${className}`}>
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">{label}</label>
        <div className="relative group">
            {Icon && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors z-10"><Icon className="w-5 h-5" /></div>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full bg-gray-900/50 border border-gray-700/50 focus:border-blue-500/50 text-white rounded-xl px-4 py-3.5 ${Icon ? 'pr-12' : ''} outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
        </div>
    </div>
);

const ToastNotification = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    };

    return (
        <div className={`fixed bottom-6 left-6 right-6 md:right-auto md:w-96 z-50 p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-center justify-between ${colors[type]} animate-slide-up`}>
            <div className="flex items-center gap-3">
                {type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : type === 'error' ? <XIcon className="w-5 h-5" /> : <BellIcon className="w-5 h-5" />}
                <p className="font-medium text-sm">{message}</p>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors"><XIcon className="w-4 h-4" /></button>
        </div>
    );
};

const ConfirmationModal = ({ title, message, onClose, onConfirm, confirmVariant = 'primary', confirmButtonText = 'تأكيد' }: any) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-gray-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmVariant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {confirmVariant === 'danger' ? <ShieldCheckIcon className="w-8 h-8" /> : <CheckCircleIcon className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors">إلغاء</button>
                    <button onClick={onConfirm} className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${confirmVariant === 'danger' ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'}`}>
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const SchemaModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#1e1e1e] w-full max-w-4xl rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#252526]">
                <span className="text-gray-300 font-mono text-sm">Supabase SQL Editor</span>
                <button onClick={onClose}><XIcon className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="flex-1 overflow-auto p-0 bg-[#1e1e1e]">
                <pre className="p-6 text-sm font-mono text-blue-300 whitespace-pre-wrap select-text">
                    {`-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'pending'::text,
  total_amount numeric DEFAULT 0,
  customer_name text,
  customer_phone text,
  items jsonb DEFAULT '[]'::jsonb,
  driver_id text,
  merchant_id text,
  delivery_address text,
  notes text
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create Policy for Anomalous Access (Modify as needed for production)
CREATE POLICY "Enable all access for all users" ON public.orders FOR ALL USING (true) WITH CHECK (true);
`}
                </pre>
            </div>
            <div className="p-4 border-t border-gray-700 bg-[#252526] flex justify-end">
                <button onClick={() => { navigator.clipboard.writeText('CREATE TABLE ...'); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium">نسخ الكود</button>
            </div>
        </div>
    </div>
);

const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
    // --- State ---
    const [viewProvider, setViewProvider] = useState<'firebase' | 'supabase'>('firebase');
    const [activeProvider, setActiveProvider] = useState<string>('firebase');
    const [configJson, setConfigJson] = useState<string>('');
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [toastState, setToastState] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // App & Update State
    const [appName, setAppName] = useState('GOO NOW');
    const [appVersion, setAppVersion] = useState('1.0.0');
    const [isSavingAppConfig, setIsSavingAppConfig] = useState(false);

    // Update Center State
    const [updateUrl, setUpdateUrl] = useState('');
    const [newVersion, setNewVersion] = useState(''); // e.g. 1.0.6
    const [updateNotes, setUpdateNotes] = useState('');
    const [isUploadingApk, setIsUploadingApk] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [targetRoles, setTargetRoles] = useState<string[]>(['driver', 'merchant']);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<UpdateLog[]>([]);
    const [deleteHistoryId, setDeleteHistoryId] = useState<string | null>(null);

    // Modals
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
    const [showSchemaModal, setShowSchemaModal] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apkInputRef = useRef<HTMLInputElement>(null);

    // --- Effects ---
    useEffect(() => {
        checkStatus();
        fetchAppConfig();
        fetchUpdateHistory();
    }, []);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToastState({ message, type });
    };

    const checkStatus = async () => {
        setIsLoading(true);
        // ... (Mock check of local storage or active provider logic)
        const provider = localStorage.getItem('active_provider') || 'firebase';
        setActiveProvider(provider);
        setIsActive(true); // Assume active for demo
        setIsLoading(false);
    };

    const fetchAppConfig = async () => {
        // Fetch from firebase 'system_metadata' or similar
        // Mock:
        setAppName('GOO NOW');
        setAppVersion('1.0.5');
    };

    const fetchUpdateHistory = async () => {
        const unsubscribe = subscribeToCollection('app_updates', (data: any[]) => {
            // Sort by date desc
            const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setHistoryLogs(sorted.map(item => ({
                id: item.id,
                version: item.version,
                releaseDate: item.timestamp,
                notes: item.notes,
                isActive: item.active || false,
                roles: item.target_roles
            })));
        });
        return unsubscribe;
    };

    // --- Handlers ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) setConfigJson(event.target.result as string);
        };
        reader.readAsText(file);
    };

    const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingApk(true);
        setUploadProgress(0);

        try {
            // Mock upload with interval
            const uploadTask = await uploadFile(file, `updates/${file.name}`);
            setUpdateUrl(uploadTask);
            showToast('تم رفع ملف APK بنجاح', 'success');
        } catch (error) {
            showToast('فشل رفع الملف', 'error');
            console.error(error);
        } finally {
            setIsUploadingApk(false);
            setUploadProgress(100);
        }
    };

    const handlePushUpdate = async () => {
        setShowUpdateConfirm(false);
        if (!newVersion || !updateUrl) {
            showToast('يرجى تعبئة جميع الحقول المطلوبة (الرابط والإصدار)', 'error');
            return;
        }

        try {
            const updatePayload = {
                version: newVersion,
                url: updateUrl,
                notes: updateNotes,
                target_roles: targetRoles,
                timestamp: new Date().toISOString(),
                active: true,
                force_update: true // Can be a toggle
            };

            // 1. Add to history
            await addData('app_updates', updatePayload);

            // 2. Update a 'latest' doc for quick fetching
            // Use settings/app_update to match useAppData hook
            await updateData('settings', 'app_update', { ...updatePayload, id: 'app_update' });

            // 3. Send Notification
            // We can loop roles and send to topics
            for (const role of targetRoles) {
                await sendExternalNotification(role, {
                    title: `تحديث مهم متوفر (${newVersion})`,
                    body: `يرجى تحديث التطبيق للاستفادة من الميزات الجديدة.`,
                    url: updateUrl
                });
            }

            showToast('تم نشر التحديث بنجاح!', 'success');
            setNewVersion('');
            setUpdateNotes('');
            setUpdateUrl('');
        } catch (err) {
            console.error(err);
            showToast('حدث خطأ أثناء نشر التحديث', 'error');
        }
    };

    const handleDeleteLog = async (id: string) => {
        try {
            await deleteData('app_updates', id);
            showToast('تم حذف السجل', 'success');
            setDeleteHistoryId(null);
        } catch (err) {
            showToast('فشل الحذف', 'error');
        }
    }

    const toggleRole = (role: string) => {
        setTargetRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    // --- Render ---

    return (
        <div className="space-y-8 pb-20 fade-in-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">إعدادات النظام</h1>
                    <p className="text-gray-400 text-sm mt-1">تحكم كامل في إعدادات التطبيق، قواعد البيانات، والتحديثات.</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700/50">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-mono text-gray-300">Target: Web/PWA</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Config Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Update Center */}
                    <GlassCard title="مركز التحديثات" icon={RocketIcon} className="bg-gradient-to-br from-gray-900/80 to-blue-900/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <PremiumInput
                                label="رقم الإصدار الجديد"
                                placeholder="e.g. 1.2.0"
                                value={newVersion}
                                onChange={(e: any) => setNewVersion(e.target.value)}
                                icon={BoltIcon}
                            />

                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1 mb-2 block">ملف التحديث (APK)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={updateUrl}
                                            onChange={(e) => setUpdateUrl(e.target.value)}
                                            placeholder="رابط مباشر أو رفع ملف..."
                                            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:ring-2 ring-blue-500/20"
                                        />
                                    </div>
                                    <button
                                        onClick={() => apkInputRef.current?.click()}
                                        className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
                                        title="رفع ملف APK"
                                    >
                                        {isUploadingApk ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UploadIcon className="w-5 h-5" />}
                                    </button>
                                    <input ref={apkInputRef} type="file" accept=".apk" className="hidden" onChange={handleApkUpload} />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1 mb-2 block">ملاحظات التحديث</label>
                            <textarea
                                value={updateNotes}
                                onChange={(e) => setUpdateNotes(e.target.value)}
                                placeholder="ما الجديد في هذا الإصدار؟"
                                className="w-full h-24 bg-gray-900/50 border border-gray-700/50 focus:border-blue-500/50 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-600 resize-none"
                            />
                        </div>

                        <div className="mb-8">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1 mb-3 block">الفئات المستهدفة</label>
                            <div className="flex flex-wrap gap-3">
                                {['driver', 'merchant', 'supervisor', 'admin'].map(role => (
                                    <button
                                        key={role}
                                        onClick={() => toggleRole(role)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${targetRoles.includes(role) ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'}`}
                                    >
                                        {targetRoles.includes(role) && <CheckCircleIcon className="w-4 h-4" />}
                                        {role === 'driver' ? 'Sائقين' : role === 'merchant' ? 'تجار' : role === 'supervisor' ? 'مشرفين' : 'إدارة'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowUpdateConfirm(true)}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <RocketIcon className="w-5 h-5" />
                            نشر التحديث لـ {targetRoles.length} فئات
                        </button>
                    </GlassCard>

                    {/* General Settings */}
                    <GlassCard title="بيانات التطبيق" icon={SettingsIcon}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PremiumInput
                                label="اسم التطبيق"
                                value={appName}
                                onChange={(e: any) => setAppName(e.target.value)}
                                icon={MobileIcon}
                            />
                            <PremiumInput
                                label="الإصدار الحالي (Current)"
                                value={appVersion}
                                onChange={(e: any) => setAppVersion(e.target.value)}
                                icon={BoltIcon}
                            />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm border border-gray-600">
                                حفظ التغييرات
                            </button>
                        </div>
                    </GlassCard>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">

                    {/* Provider Status */}
                    <GlassCard className="bg-gradient-to-b from-gray-900 via-gray-900 to-black">
                        <div className="flex flex-col items-center py-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 ${activeProvider === 'firebase' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-green-500/20 bg-green-500/10 text-green-500'}`}>
                                {activeProvider === 'firebase' ? <CloudIcon className="w-10 h-10" /> : <BoltIcon className="w-10 h-10" />}
                            </div>
                            <h3 className="text-xl font-bold text-white max-w-[80%] text-center leading-tight">
                                {activeProvider === 'firebase' ? 'Firebase Realtime' : 'Supabase PostgreSQL'}
                            </h3>
                            <p className="text-gray-500 text-sm mt-2">المزود الحالي للبيانات</p>

                            <div className="grid grid-cols-2 w-full gap-3 mt-8">
                                <button
                                    onClick={() => setViewProvider('firebase')}
                                    className={`py-3 rounded-xl border font-bold text-sm transition-all ${viewProvider === 'firebase' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                >
                                    Firebase
                                </button>
                                <button
                                    onClick={() => setViewProvider('supabase')}
                                    className={`py-3 rounded-xl border font-bold text-sm transition-all ${viewProvider === 'supabase' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                >
                                    Supabase
                                </button>
                            </div>
                        </div>

                        {viewProvider === 'firebase' ? (
                            <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-700 rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors group">
                                    <CloudIcon className="w-6 h-6 text-gray-500 group-hover:text-amber-500 transition-colors mb-2" />
                                    <span className="text-xs text-gray-500">upload google-services.json</span>
                                </div>
                                <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                                {configJson && <div className="text-xs text-green-400 flex items-center gap-2"><CheckCircleIcon className="w-3 h-3" /> Config Loaded</div>}
                            </div>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                                <PremiumInput placeholder="Project URL" value={supabaseUrl} onChange={(e: any) => setSupabaseUrl(e.target.value)} className="text-xs" />
                                <PremiumInput placeholder="Anon Key" value={supabaseKey} onChange={(e: any) => setSupabaseKey(e.target.value)} type="password" />
                                <button onClick={() => setShowSchemaModal(true)} className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 underline">Get SQL Schema</button>
                            </div>
                        )}
                    </GlassCard>

                    {/* Update History */}
                    <GlassCard title="سجل النشر" icon={ClipboardListIcon} className="max-h-[500px] flex flex-col">
                        <div className="overflow-y-auto custom-scrollbar flex-1 space-y-3 pr-2 -mr-2">
                            {historyLogs.length > 0 ? (
                                historyLogs.map((log) => (
                                    <div key={log.id} className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-white text-sm">v{log.version}</span>
                                                    {log.isActive && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-md">Active</span>}
                                                </div>
                                                <p className="text-[10px] text-gray-400">{new Date(log.releaseDate || '').toLocaleDateString('ar-EG')}</p>
                                            </div>
                                            <button onClick={() => setDeleteHistoryId(log.id)} className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {/* Roles Badges */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {log.roles?.map((r: string) => (
                                                <span key={r} className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/10">{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-600 text-sm">لا يوجد سجلات</div>
                            )}
                        </div>
                    </GlassCard>

                </div>
            </div>

            {/* Modals */}
            {showUpdateConfirm && (
                <ConfirmationModal
                    title="نشر تحديث جديد"
                    message={`هل أنت متأكد من نشر الإصدار ${newVersion}؟ سيصل الإشعار إلى ${targetRoles.length} فئات من المستخدمين.`}
                    onClose={() => setShowUpdateConfirm(false)}
                    onConfirm={handlePushUpdate}
                    confirmVariant="success"
                    confirmButtonText="نشر الآن"
                />
            )}

            {showDisconnectConfirm && (
                <ConfirmationModal
                    title="قطع الاتصال"
                    message="هل تريد إيقاف مزود البيانات الحالي؟"
                    onClose={() => setShowDisconnectConfirm(false)}
                    onConfirm={() => { setIsActive(false); setShowDisconnectConfirm(false); }}
                    confirmVariant="danger"
                />
            )}

            {deleteHistoryId && (
                <ConfirmationModal
                    title="حذف سجل"
                    message="هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء."
                    onClose={() => setDeleteHistoryId(null)}
                    onConfirm={() => deleteHistoryId && handleDeleteLog(deleteHistoryId)}
                    confirmVariant="danger"
                    confirmButtonText="حذف"
                />
            )}

            {showSchemaModal && <SchemaModal onClose={() => setShowSchemaModal(false)} />}

            {toastState && <ToastNotification message={toastState.message} type={toastState.type} onClose={() => setToastState(null)} />}
        </div>
    );
};

export default SystemSettings;