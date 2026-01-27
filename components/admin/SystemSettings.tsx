import React, { useState, useEffect, useRef } from 'react';
import {
    UploadIcon, CheckCircleIcon, XIcon, CloudIcon, BoltIcon,
    ClipboardListIcon, SettingsIcon, RocketIcon, DownloadIcon,
    BellIcon, ShieldCheckIcon, MobileIcon, TrashIcon,
    RefreshCwIcon, ServerIcon, ActivityIcon, SaveIcon
} from '../icons';
import {
    updateData, uploadFile, subscribeToCollection,
    deleteData, addData, sendExternalNotification
} from '../../services/firebase';
import { AppConfig, UpdateLog } from '../../types';

// --- Types ---
interface SystemSettingsProps {
    currentUser?: any;
}

// --- Components ---

const SidebarItem = ({ active, icon: Icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-900/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
    >
        <Icon className={`w-5 h-5 transition-colors ${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
        <span className="font-medium text-sm tracking-wide">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
    </button>
);

const SectionHeader = ({ title, description }: { title: string, description: string }) => (
    <div className="mb-6 border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            {title}
        </h2>
        <p className="text-gray-400 text-xs pl-3">{description}</p>
    </div>
);

const ActionButton = ({ onClick, label, icon: Icon, variant = 'primary', loading = false, disabled = false, className = '' }: any) => {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-500 border-blue-500/50 text-white shadow-blue-900/20',
        danger: 'bg-red-600/10 hover:bg-red-600/20 border-red-500/30 text-red-500 hover:text-red-400',
        secondary: 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant as keyof typeof variants]} ${className}`}
        >
            {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (Icon && <Icon className="w-4 h-4" />)}
            <span>{label}</span>
        </button>
    );
};

const StatusBadge = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${active
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
        {active ? 'نشط حالياً' : 'غير نشط'}
    </span>
);

const ToastNotification = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-full border backdrop-blur-xl shadow-2xl animate-slide-up ${type === 'success' ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-100' :
                type === 'error' ? 'bg-red-900/80 border-red-500/30 text-red-100' :
                    'bg-blue-900/80 border-blue-500/30 text-blue-100'
            }`}>
            {type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : type === 'error' ? <XIcon className="w-5 h-5" /> : <BellIcon className="w-5 h-5" />}
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

// --- Main Component ---

const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'updates' | 'database'>('general');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: any } | null>(null);

    // General Config
    const [appName, setAppName] = useState('GOO NOW');
    const [appVersion, setAppVersion] = useState('1.0.0');

    // Updates
    const [newVersion, setNewVersion] = useState('');
    const [updateUrl, setUpdateUrl] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');
    const [targetRoles, setTargetRoles] = useState<string[]>(['driver', 'merchant']);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [history, setHistory] = useState<UpdateLog[]>([]);

    const apkInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        const unsubConfig = subscribeToCollection('system_metadata', (data) => {
            const conf = data.find(d => d.id === 'config');
            if (conf) { setAppName(conf.appName || ''); setAppVersion(conf.appVersion || ''); }
        });
        const unsubUpdates = subscribeToCollection('app_updates', (data) => {
            setHistory(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        });
        return () => { unsubConfig(); unsubUpdates(); };
    }, []);

    // Helper
    const showToast = (msg: string, type: 'success' | 'error' | 'info') => setToast({ msg, type });

    // Actions
    const handleSaveConfig = async () => {
        if (!appName || !appVersion) return showToast('يرجى ملء جميع الحقول', 'error');
        try {
            await updateData('system_metadata', 'config', { appName, appVersion, updatedAt: new Date().toISOString() });
            showToast('تم حفظ الإعدادات', 'success');
        } catch (e) { showToast('فشل الحفظ', 'error'); }
    };

    const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // PASSING CALLBACK FOR PROGRESS
            const url = await uploadFile(file, `updates/${file.name}`, (prog) => {
                setUploadProgress(Math.round(prog));
            });
            setUpdateUrl(url);
            showToast('تم رفع الملف بنجاح', 'success');
        } catch (error) {
            console.error(error);
            showToast('فشل رفع الملف', 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(100);
        }
    };

    const handlePublishUpdate = async () => {
        if (!newVersion || !updateUrl) return showToast('مطلوب الإصدار ورابط الملف', 'error');
        try {
            const payload = {
                version: newVersion, url: updateUrl, notes: updateNotes,
                target_roles: targetRoles, timestamp: new Date().toISOString(),
                isActive: true, forceUpdate: true
            };

            await addData('app_updates', payload);
            await updateData('settings', 'app_update', { ...payload, id: 'app_update' });

            for (const role of targetRoles) {
                await sendExternalNotification(role, {
                    title: `تحديث ${newVersion} متوفر`,
                    body: 'يرجى التحديث الآن لأفضل أداء',
                    url: '/?target=main'
                });
            }
            showToast('تم نشر التحديث بنجاح', 'success');
            setNewVersion(''); setUpdateUrl('');
        } catch (e) { showToast('حدث خطأ أثناء النشر', 'error'); }
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm('حذف هذا السجل؟')) return;
        try { await deleteData('app_updates', id); showToast('تم الحذف', 'success'); }
        catch (e) { showToast('فشل الحذف', 'error'); }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30">

            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[#1e293b]/50 backdrop-blur-md border-r border-white/5 p-4 flex flex-col gap-2">
                <div className="px-4 py-6 mb-2">
                    <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                        <SettingsIcon className="text-blue-500 w-6 h-6" />
                        الإعدادات
                    </h1>
                </div>

                <SidebarItem
                    label="عام"
                    icon={MobileIcon}
                    active={activeTab === 'general'}
                    onClick={() => setActiveTab('general')}
                />
                <SidebarItem
                    label="مركز التحديثات"
                    icon={RocketIcon}
                    active={activeTab === 'updates'}
                    onClick={() => setActiveTab('updates')}
                />
                <SidebarItem
                    label="قواعد البيانات"
                    icon={ServerIcon}
                    active={activeTab === 'database'}
                    onClick={() => setActiveTab('database')}
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-4xl mx-auto animate-fade-in-up">

                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <SectionHeader title="بيانات التطبيق" description="تخصيص المعلومات الأساسية للتطبيق" />

                            <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 font-bold uppercase">اسم التطبيق</label>
                                        <input
                                            value={appName}
                                            onChange={(e) => setAppName(e.target.value)}
                                            className="w-full bg-[#0f172a] border border-gray-700/50 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 font-bold uppercase">الإصدار الحالي</label>
                                        <input
                                            value={appVersion}
                                            onChange={(e) => setAppVersion(e.target.value)}
                                            className="w-full bg-[#0f172a] border border-gray-700/50 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <ActionButton
                                        label="حفظ التغييرات"
                                        icon={SaveIcon}
                                        onClick={handleSaveConfig}
                                    />
                                </div>
                            </div>

                            <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">أدوات الصيانة</h3>
                                    <p className="text-gray-400 text-xs mt-1">إجراءات سريعة لاختبار وإصلاح المشاكل</p>
                                </div>
                                <div className="flex gap-3">
                                    <ActionButton
                                        label="مسح التحديث"
                                        variant="danger"
                                        icon={TrashIcon}
                                        onClick={async () => {
                                            if (confirm('هل أنت متأكد؟')) {
                                                await deleteData('settings', 'app_update');
                                                showToast('تم تنظيف التحديث', 'success');
                                            }
                                        }}
                                    />
                                    <ActionButton
                                        label="إعادة تحميل"
                                        variant="secondary"
                                        icon={RefreshCwIcon}
                                        onClick={() => window.location.reload()}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Updates Tab */}
                    {activeTab === 'updates' && (
                        <div className="space-y-8">
                            <SectionHeader title="نشر التحديثات" description="إدارة وتوزيع إصدارات APK الجديدة" />

                            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left: Inputs */}
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-bold uppercase">رقم الإصدار (SemVer)</label>
                                            <div className="relative">
                                                <BoltIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    placeholder="e.g. 2.1.0"
                                                    value={newVersion}
                                                    onChange={(e) => setNewVersion(e.target.value)}
                                                    className="w-full bg-[#0f172a] border border-gray-700/50 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-blue-500 outline-none font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-bold uppercase">ملف APK</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={updateUrl}
                                                    onChange={(e) => setUpdateUrl(e.target.value)}
                                                    placeholder="رابط مباشر..."
                                                    className="flex-1 bg-[#0f172a] border border-gray-700/50 rounded-lg px-4 py-3 text-xs text-gray-300 focus:border-blue-500 outline-none"
                                                />
                                                <button
                                                    onClick={() => apkInputRef.current?.click()}
                                                    className={`px-4 rounded-lg border border-gray-600 hover:bg-white/5 transition-colors flex items-center gap-2 ${isUploading ? 'cursor-wait opacity-70' : ''}`}
                                                >
                                                    {isUploading ? (
                                                        <span className="text-xs font-bold text-blue-400">{uploadProgress}%</span>
                                                    ) : (
                                                        <UploadIcon className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                                <input type="file" ref={apkInputRef} accept=".apk" hidden onChange={handleApkUpload} />
                                            </div>
                                            {isUploading && (
                                                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-bold uppercase">ملاحظات</label>
                                            <textarea
                                                value={updateNotes}
                                                onChange={(e) => setUpdateNotes(e.target.value)}
                                                className="w-full h-24 bg-[#0f172a] border border-gray-700/50 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none"
                                                placeholder="ما الجديد..."
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Targeting */}
                                    <div className="space-y-5 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <label className="text-xs text-gray-400 font-bold uppercase block">الفئات المستهدفة</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['driver', 'merchant', 'supervisor', 'admin'].map(role => (
                                                    <button
                                                        key={role}
                                                        onClick={() => setTargetRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                                                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${targetRoles.includes(role)
                                                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                            : 'bg-[#0f172a] border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                                    >
                                                        {targetRoles.includes(role) && <CheckCircleIcon className="w-3 h-3" />}
                                                        {role.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <ActionButton
                                            label={`نشر الإصدار ${newVersion || '...'}`}
                                            icon={RocketIcon}
                                            className="w-full py-4 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
                                            onClick={handlePublishUpdate}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* History */}
                            <div className="bg-[#1e293b] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="bg-[#0f172a]/50 p-4 border-b border-white/5">
                                    <h3 className="font-bold text-sm text-gray-300">سجل التحديثات</h3>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {history.map(log => (
                                        <div key={log.id} className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center font-mono font-bold text-blue-400 text-sm">
                                                    v{log.version}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-white">{new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                                                        <StatusBadge active={log.isActive} />
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{log.notes || 'No notes'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {history.length === 0 && <div className="p-8 text-center text-gray-500 text-xs">لا يوجد سجلات</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Database Tab */}
                    {activeTab === 'database' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                                <CloudIcon className="w-10 h-10 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-bold">Firebase Connected</h2>
                            <p className="text-gray-400 max-w-md">The system is currently using Firebase Realtime & Firestore for data synchronization.</p>
                            <div className="pt-6">
                                <ActionButton label="Check Connection" variant="secondary" icon={ActivityIcon} />
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {toast && <ToastNotification message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SystemSettings;