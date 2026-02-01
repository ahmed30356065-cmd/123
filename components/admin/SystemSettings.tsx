
import React, { useState, useEffect, useRef } from 'react';
import {
    UploadIcon, CheckCircleIcon, XIcon, CloudIcon, BoltIcon,
    SettingsIcon, RocketIcon, ServerIcon, ActivityIcon, SaveIcon,
    AlertTriangleIcon, TrashIcon, MobileIcon, RefreshCwIcon
} from '../icons';
import {
    updateData, uploadFile, subscribeToCollection,
    deleteData, addData, sendExternalNotification,
    db // Import db for direct access if needed
} from '../../services/firebase';
import firebase from 'firebase/compat/app'; // For batch operations types
import { AppConfig, UpdateLog } from '../../types';

// --- Types ---
interface SystemSettingsProps {
    currentUser?: any;
    // Add props for deletion if needed, but we can import firebase services directly
}

// Custom Modal Component
const Modal = ({ isOpen, onClose, title, message, onConfirm, confirmText = 'نعم', cancelText = 'إلغاء', type = 'danger' }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scaleIn">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {type === 'danger' ? <TrashIcon className="w-6 h-6" /> : <BoltIcon className="w-6 h-6" />}
                    </div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors font-medium text-sm"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 text-sm ${type === 'danger' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Top Tab Component
const TabButton = ({ active, label, icon: Icon, onClick }: any) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-2 px-6 py-4 transition-all duration-300 ${active ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
    >
        <Icon className={`w-4 h-4 ${active ? 'animate-bounce-slow' : ''}`} />
        <span className="font-bold text-sm tracking-wide">{label}</span>
        {active && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_-2px_8px_rgba(59,130,246,0.5)] animate-width-expand" />
        )}
    </button>
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
            {type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : type === 'error' ? <XIcon className="w-5 h-5" /> : <BoltIcon className="w-5 h-5" />}
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

// --- Main Component ---

const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'updates' | 'maintenance' | 'database'>('updates'); // Default to updates
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: any } | null>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'info' }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }
    });

    // General Config
    const [appName, setAppName] = useState('GOO NOW');
    const [appVersion, setAppVersion] = useState('1.0.0');

    // Updates
    const [newVersion, setNewVersion] = useState('');
    const [updateUrl, setUpdateUrl] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');
    // DEFAULT TARGET ROLES IS EMPTY to prevent accidental spam
    const [targetRoles, setTargetRoles] = useState<string[]>([]);
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

    const showToast = (msg: string, type: 'success' | 'error' | 'info') => setToast({ msg, type });

    const openConfirmModal = (title: string, message: string, action: () => void, type: 'danger' | 'info' = 'danger') => {
        setModalConfig({ isOpen: true, title, message, onConfirm: action, type });
    };

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
            setUploadProgress(100); // Ensure complete visual
        }
    };

    const handlePublishUpdate = async () => {
        if (!newVersion || !updateUrl) return showToast('مطلوب الإصدار ورابط الملف', 'error');
        // Validate Target Roles
        if (targetRoles.length === 0) return showToast('يجب اختيار فئة مستهدفة واحدة على الأقل (مثل Admin للتجربة)', 'error');

        openConfirmModal(
            'نشر تحديث جديد',
            `أنت على وشك نشر الإصدار ${newVersion} للفئات: ${targetRoles.join('، ')}. هل أنت متأكد؟`,
            async () => {
                try {
                    const payload = {
                        version: newVersion, url: updateUrl, notes: updateNotes,
                        target_roles: targetRoles, timestamp: new Date().toISOString(),
                        isActive: true, forceUpdate: true
                    };

                    await addData('app_updates', payload);
                    // Also update the singleton settings doc for quick check
                    await updateData('settings', 'app_update', { ...payload, id: 'app_update' });

                    for (const role of targetRoles) {
                        await sendExternalNotification(role, {
                            title: `تحديث ${newVersion} متوفر`,
                            body: 'يرجى التحديث الآن لأفضل أداء',
                            url: '/?target=main'
                        });
                    }
                    showToast('تم نشر التحديث بنجاح', 'success');
                    setNewVersion(''); setUpdateUrl(''); setTargetRoles([]);
                } catch (e) { showToast('حدث خطأ أثناء النشر', 'error'); }
            },
            'info'
        );
    };

    const handleDeleteLog = async (id: string) => {
        openConfirmModal('حذف سجل', 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع.', async () => {
            try { await deleteData('app_updates', id); showToast('تم الحذف', 'success'); }
            catch (e) { showToast('فشل الحذف', 'error'); }
        });
    };

    const handleClearUpdate = async () => {
        openConfirmModal('مسح التحديث النشط', 'سيتم إيقاف ظهور نافذة التحديث لدى المستخدمين. هل أنت متأكد؟', async () => {
            await deleteData('settings', 'app_update');
            showToast('تم تنظيف التحديث', 'success');
        });
    };

    // --- NEW: Conditional Delete (Safety) ---
    const handleConditionalDelete = async () => {
        // Default to first day of current month to save current month's work
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

        const dateStr = prompt('أدخل تاريخ (YYYY-MM-DD). سيتم حذف جميع الطلبات التي تم إنشاؤها *قبل* هذا التاريخ:', firstDayOfMonth);
        if (!dateStr) return;

        const cutoffDate = new Date(dateStr);
        if (isNaN(cutoffDate.getTime())) return showToast('تاريخ غير صالح', 'error');

        openConfirmModal('⚠️ تنظيف البيانات القديمة',
            `سيتم حذف جميع الطلبات التي تم إنشاؤها قبل يوم ${dateStr}.\n\nالطلبات الجديدة (منذ هذا التاريخ) ستبقى آمنة.\n\nهل أنت متأكد؟`,
            async () => {
                showToast('جاري التنظيف...', 'info');
                try {
                    const cutoffTimestamp = firebase.firestore.Timestamp.fromDate(cutoffDate);

                    // Direct query for older orders
                    const snapshot = await firebase.firestore().collection('orders')
                        .where('createdAt', '<', cutoffTimestamp)
                        .get();

                    if (snapshot.empty) {
                        return showToast('لا توجد طلبات قديمة بهذا التاريخ', 'info');
                    }

                    const batchSize = 400;
                    let batch = firebase.firestore().batch();
                    let count = 0;
                    let totalDeleted = 0;

                    for (const doc of snapshot.docs) {
                        batch.delete(doc.ref);
                        count++;
                        if (count >= batchSize) {
                            await batch.commit();
                            batch = firebase.firestore().batch();
                            totalDeleted += count;
                            count = 0;
                        }
                    }
                    if (count > 0) {
                        await batch.commit();
                        totalDeleted += count;
                    }

                    showToast(`تم تنظيف ${totalDeleted} طلب قديم بنجاح.`, 'success');
                    setTimeout(() => window.location.reload(), 2000);

                } catch (error) {
                    console.error(error);
                    showToast('حدث خطأ أثناء التنظيف', 'error');
                }
            }, 'danger'
        );
    };

    // --- NEW: Delete by ID Range (Surgical Fix) ---
    const handleRangeDelete = async () => {
        const startStr = prompt('أدخل بداية نطاق الأرقام للحذف (من رقم):', '6');
        if (!startStr) return;
        const endStr = prompt('أدخل نهاية نطاق الأرقام للحذف (إلى رقم):', '10000');
        if (!endStr) return;

        const startId = parseInt(startStr);
        const endId = parseInt(endStr);

        if (isNaN(startId) || isNaN(endId) || startId > endId) {
            return showToast('نطاق غير صالح', 'error');
        }

        openConfirmModal('⚠️ حذف بنطاق الأرقام',
            `سيتم حذف جميع الطلبات التي تحمل أرقاماً بين ${startId} و ${endId} (شاملة).\n\nهذا سيسمح بتصحيح عداد الطلبات.\n\nهل أنت متأكد؟`,
            async () => {
                showToast('جاري البحث والحذف...', 'info');
                try {
                    const snapshot = await firebase.firestore().collection('orders').get(); // Direct fetch

                    const batchSize = 400;
                    let batch = firebase.firestore().batch();
                    let count = 0;
                    let totalDeleted = 0;

                    const ordersToDelete = snapshot.docs.filter(doc => {
                        const data = doc.data();
                        const idStr = data.id || '';
                        const idNum = parseInt(idStr.replace(/\D/g, '') || '0');
                        return idNum >= startId && idNum <= endId;
                    });

                    if (ordersToDelete.length === 0) {
                        return showToast('لا توجد طلبات في هذا النطاق', 'info');
                    }

                    for (const doc of ordersToDelete) {
                        batch.delete(doc.ref);
                        count++;
                        if (count >= batchSize) {
                            await batch.commit();
                            batch = firebase.firestore().batch();
                            totalDeleted += count;
                            count = 0;
                        }
                    }
                    if (count > 0) {
                        await batch.commit();
                        totalDeleted += count;
                    }

                    showToast(`تم حذف ${totalDeleted} طلب في النطاق ${startId}-${endId}.`, 'success');
                    setTimeout(() => window.location.reload(), 2000);

                } catch (error) {
                    console.error(error);
                    showToast('حدث خطأ أثناء الحذف', 'error');
                }
            }, 'danger'
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30">

            {/* Header & Tabs */}
            <div className="sticky top-0 z-40 bg-[#1e293b]/80 backdrop-blur-md border-b border-white/5 shadow-xl">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 border-b border-white/5 mb-1">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <SettingsIcon className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-lg font-black tracking-tight text-white">إعدادات النظام</h1>
                        </div>
                        <div className="text-xs font-mono text-gray-500">{appName} v{appVersion}</div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <TabButton active={activeTab === 'updates'} onClick={() => setActiveTab('updates')} label="مركز التحديثات" icon={RocketIcon} />
                        <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} label="عام" icon={MobileIcon} />
                        <TabButton active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} label="صيانة النظام" icon={AlertTriangleIcon} />
                        <TabButton active={activeTab === 'database'} onClick={() => setActiveTab('database')} label="قواعد البيانات" icon={ServerIcon} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto animate-fadeIn">

                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1 h-5 bg-blue-500 rounded-full" /> تخصيص التطبيق</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 font-bold uppercase">اسم التطبيق</label>
                                        <input value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full bg-[#0f172a] border border-gray-700/50 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 font-bold uppercase">الإصدار الحالي</label>
                                        <input value={appVersion} onChange={(e) => setAppVersion(e.target.value)} className="w-full bg-[#0f172a] border border-gray-700/50 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <ActionButton label="حفظ التغييرات" icon={SaveIcon} onClick={handleSaveConfig} />
                                </div>
                            </div>

                            <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl">
                                <h3 className="font-bold text-lg mb-4 text-gray-300">أدوات إضافية</h3>
                                <div className="flex gap-3">
                                    <ActionButton label="مسح التحديث" variant="danger" icon={TrashIcon} onClick={handleClearUpdate} />
                                    <ActionButton label="إعادة تحميل" variant="secondary" icon={RefreshCwIcon} onClick={() => window.location.reload()} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Maintenance Tab (New Dedicated Tab) */}
                    {activeTab === 'maintenance' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                                <h2 className="text-xl font-bold text-red-500 mb-2">منطقة الخطر / الصيانة</h2>
                                <p className="text-gray-400 text-sm">هذه الأدوات تقوم بتعديل أو حذف البيانات. يرجى استخدامها بحذر.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Safe Clean Card */}
                                <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl hover:border-blue-500/30 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <TrashIcon className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="font-bold text-lg text-white mb-2">تنظيف البيانات القديمة</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                        حذف الطلبات والمعاملات التي تسبق تاريخاً معيناً. هذا الخيار <strong>آمن</strong> لأنه لا يحذف بيانات الشهر الحالي إذا اخترت التاريخ الصحيح.
                                    </p>
                                    <ActionButton
                                        label="بدء التنظيف الآمن..."
                                        variant="primary"
                                        icon={CheckCircleIcon}
                                        onClick={handleConditionalDelete}
                                        className="w-full justify-center py-3 bg-blue-600 hover:bg-blue-500"
                                    />
                                </div>

                                {/* ID Range Delete Card */}
                                <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl hover:border-amber-500/30 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <AlertTriangleIcon className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <h3 className="font-bold text-lg text-white mb-2">إصلاح تسلسل الأرقام</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                        حذف الطلبات في نطاق محدد (مثلاً من 6 إلى 1000) لإزالة الفجوات وإصلاح العداد ليبدأ من الرقم الصحيح.
                                    </p>
                                    <ActionButton
                                        label="حذف بنطاق الأرقام..."
                                        variant="danger"
                                        icon={TrashIcon}
                                        onClick={handleRangeDelete}
                                        className="w-full justify-center py-3"
                                    />
                                </div>

                                {/* Reset Card (Future Use) */}
                                <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl opacity-60">
                                    <div className="w-12 h-12 rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
                                        <AlertTriangleIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-300 mb-2">إعادة ضبط المصنع</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                        حذف جميع البيانات وإعادة التطبيق لحالته الأولية. (معطل حالياً للأمان)
                                    </p>
                                    <button disabled className="w-full py-3 rounded-lg border border-gray-700 text-gray-600 font-bold text-xs cursor-not-allowed">
                                        غير متاح
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Updates Tab */}
                    {activeTab === 'updates' && (
                        <div className="space-y-8">
                            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left: Inputs */}
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-bold uppercase">رقم الإصدار (SemVer)</label>
                                            <div className="relative">
                                                <BoltIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input placeholder="e.g. 2.1.0" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} className="w-full bg-[#0f172a] border border-gray-700/50 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-blue-500 outline-none font-mono" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-bold uppercase">ملف APK</label>
                                            <div className="flex gap-2">
                                                <input value={updateUrl} onChange={(e) => setUpdateUrl(e.target.value)} placeholder="رابط مباشر..." className="flex-1 bg-[#0f172a] border border-gray-700/50 rounded-lg px-4 py-3 text-xs text-gray-300 focus:border-blue-500 outline-none" />
                                                <button onClick={() => apkInputRef.current?.click()} className={`px-4 rounded-lg border border-gray-600 hover:bg-white/5 transition-colors flex items-center gap-2 ${isUploading ? 'cursor-wait opacity-70' : ''}`}>
                                                    {isUploading ? <span className="text-xs font-bold text-blue-400">{uploadProgress}%</span> : <UploadIcon className="w-5 h-5 text-gray-400" />}
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
                                            <textarea value={updateNotes} onChange={(e) => setUpdateNotes(e.target.value)} className="w-full h-24 bg-[#0f172a] border border-gray-700/50 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none" placeholder="ما الجديد..." />
                                        </div>
                                    </div>

                                    {/* Right: Targeting */}
                                    <div className="space-y-5 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <label className="text-xs text-gray-400 font-bold uppercase block text-amber-500">من سيحصل على التحديث؟</label>
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
                                            <p className="text-[10px] text-gray-500 leading-tight">* اختر 'ADMIN' فقط لاختبار التحديث قبل نشره للجميع.</p>
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
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center font-mono font-bold text-blue-400 text-sm">v{log.version}</div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-white">{new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                                                        <StatusBadge active={log.isActive} />
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{log.notes || 'No notes'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteLog(log.id)} className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
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
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fadeIn">
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

            {/* Render Modal */}
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                type={modalConfig.type}
            />
        </div >
    );
};

export default SystemSettings;