
import React, { useState, useEffect } from 'react';
import { DownloadIcon, LinkIcon, RocketIcon, AlertTriangleIcon } from './icons';
import { UpdateConfig } from '../types';
import { downloadFileFromFirestore } from '../services/firebase';

interface UpdateScreenProps {
    config: UpdateConfig;
    onDismiss: () => void;
}

const UpdateScreen: React.FC<UpdateScreenProps> = ({ config, onDismiss }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [imageError, setImageError] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]); // internal debug log

    const addLog = (msg: string) => {
        setDebugLog(prev => [...prev.slice(-4), msg]); // Keep last 5 logs
        console.log(`[UpdateScreen] ${msg}`);
    };

    const handleUpdate = async () => {
        if (!config.url) {
            addLog("Error: No URL provided");
            setStatusText("خطأ: لا يوجد رابط");
            return;
        }

        setIsDownloading(true);
        setDownloadProgress(0);
        addLog("Starting update process...");

        try {
            let finalUrl = config.url;

            // Check if it's a Firestore Chunked File
            if (config.url.startsWith('FIRESTORE_FILE:')) {
                setStatusText('جاري تجميع ملف التحديث...');
                addLog("Fetching firestore chunks...");
                const fileId = config.url.split(':')[1];
                finalUrl = await downloadFileFromFirestore(fileId);
                setDownloadProgress(30);
                setStatusText('تم التجهيز! جاري التحميل...');
                addLog("Firestore file assembled.");
            }

            // --- NATIVE INSTALL CHECK ---
            // We use a safe check for the Android bridge
            const androidBridge = (window as any).Android;
            const isNativeAvailable = typeof androidBridge !== 'undefined' && typeof androidBridge.downloadAndInstallApk === 'function';

            if (isNativeAvailable && config.type === 'apk') {
                addLog("Using Native Android Installer");
                setStatusText('جاري التحميل والتثبيت...');

                // Simulate progress for UX (Native handles actual background DL)
                const progressInterval = setInterval(() => {
                    setDownloadProgress(prev => {
                        if (prev >= 90) { clearInterval(progressInterval); return 90; }
                        return prev + 10;
                    });
                }, 400);

                const fileName = `GOO_NOW_v${config.version}.apk`;

                // Small delay to ensure UI updates
                setTimeout(() => {
                    try {
                        addLog(`Invoking native: ${fileName}`);
                        androidBridge.downloadAndInstallApk(finalUrl, fileName);

                        clearInterval(progressInterval);
                        setDownloadProgress(100);
                        setStatusText('تم بدء التثبيت التلقائي!');
                        addLog("Native intent sent.");
                    } catch (err) {
                        addLog(`Native Error: ${err}`);
                        console.error("Native Install Error", err);
                        fallbackToBrowser(finalUrl, fileName);
                    }
                }, 500);

            } else {
                addLog("Native bridge missing or not APK. Using Browser.");
                fallbackToBrowser(finalUrl, `GOO_NOW_v${config.version}.apk`);
            }

            // Reset UI after delay (give user time to read)
            setTimeout(() => {
                if (!isNativeAvailable) setIsDownloading(false); // Only reset if not native (native might kill app)
            }, 5000);

        } catch (e) {
            addLog(`Update Failed: ${e}`);
            console.error("Update failed:", e);
            setStatusText('فشل تحميل التحديث');
            setTimeout(() => setIsDownloading(false), 2000);
        }
    };

    const fallbackToBrowser = (url: string, fileName: string) => {
        setStatusText('جاري التحميل عبر المتصفح...');
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadProgress(100);
        setStatusText('تم فتح رابط التحميل!');
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#0f172a] flex flex-col items-center justify-center p-6 animate-fadeIn font-sans text-white overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 w-full max-w-sm text-center">

                {/* Animated Logo / Icon */}
                <div className="relative mb-8 flex justify-center">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                    <div className="w-24 h-24 bg-[#1e293b] rounded-[1.5rem] flex items-center justify-center border-4 border-gray-700 shadow-2xl relative z-10 animate-bounce-slow overflow-hidden">
                        {!imageError ? (
                            <img
                                // TRY NATIVE ASSET PATH FIRST
                                src="file:///android_asset/app-icon.png"
                                alt="GOO NOW"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // IF NATIVE FAILS, TRY SERVER PATH, THEN FALLBACK
                                    const target = e.target as HTMLImageElement;
                                    if (target.src.includes('file:///android_asset')) {
                                        target.src = "/app-icon.png";
                                    } else {
                                        setImageError(true);
                                    }
                                }}
                            />
                        ) : (
                            // PROFESSIONAL FALLBACK ICON
                            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 w-full h-full">
                                <RocketIcon className="w-10 h-10 text-blue-400 mb-1" />
                            </div>
                        )}
                        {/* Notification Badge */}
                        <div className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0f172a] animate-ping"></div>
                        <div className="absolute -top-1 -right-1 bg-red-600 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0f172a] text-[10px] font-bold shadow-lg">
                            !
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-up">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-4">
                        <SparklesIcon className="w-3 h-3 text-blue-400 animate-spin-slow" />
                        <span className="text-[10px] font-bold text-blue-300 tracking-wider uppercase">Update Available</span>
                    </div>

                    <h2 className="text-2xl font-black mb-2 text-white">
                        الإصدار {config.version}
                    </h2>

                    <p className="text-gray-400 text-xs leading-relaxed mb-6">
                        {config.notes || 'تحسينات جديدة في الأداء وإصلاح بعض المشاكل لضمان تجربة أفضل.'}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleUpdate}
                            disabled={isDownloading}
                            className={`group relative w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all overflow-hidden ${isDownloading ? 'cursor-wait opacity-80' : ''}`}
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <div className="relative flex flex-col items-center justify-center gap-1">
                                {isDownloading ? (
                                    <>
                                        <div className="w-full flex items-center justify-between text-xs mb-1 px-1">
                                            <span className="text-blue-100 opacity-80">{statusText}</span>
                                            <span className="font-bold">{downloadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-white h-full rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${downloadProgress}%` }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <DownloadIcon className="w-5 h-5" />
                                        <span className="text-sm">تحديث الآن</span>
                                    </div>
                                )}
                            </div>
                        </button>

                        {!isDownloading && (
                            <div className="flex gap-2">
                                <button
                                    onClick={onDismiss}
                                    className="flex-1 bg-transparent hover:bg-white/5 text-gray-500 hover:text-gray-300 font-medium py-3 rounded-xl transition-colors text-xs border border-white/5"
                                >
                                    ليس الآن
                                </button>
                                {/* Fallback Direct Link if native fails */}
                                <a
                                    href={config.url}
                                    target="_blank"
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors border border-white/5 flex items-center justify-center"
                                    title="تحميل مباشر (إذا فشل التلقائي)"
                                    download // Attribute to hint download
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Debug Footer (Visible only if logs exist) */}
                {debugLog.length > 0 && (
                    <div className="mt-4 p-2 bg-black/50 rounded text-[10px] text-left font-mono text-gray-400 w-full overflow-hidden">
                        {debugLog.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                )}

                <div className="mt-8 text-xs text-gray-600 font-mono">
                    GOO NOW UPDATE CENTER
                </div>
            </div>
        </div>
    );
};

// Helper Icon
const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

export default UpdateScreen;
