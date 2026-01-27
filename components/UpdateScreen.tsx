
import React, { useState } from 'react';
import { DownloadIcon, LinkIcon } from './icons';
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

    const handleUpdate = async () => {
        if (!config.url) return;

        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            let finalUrl = config.url;

            // Check if it's a Firestore Chunked File
            if (config.url.startsWith('FIRESTORE_FILE:')) {
                setStatusText('جاري تجميع ملف التحديث...');
                const fileId = config.url.split(':')[1];
                finalUrl = await downloadFileFromFirestore(fileId);
                setDownloadProgress(30);
                setStatusText('تم التجهيز! جاري التحميل...');
            }

            // Check if we're in Android WebView and this is an APK
            if (typeof window !== 'undefined' && (window as any).Android?.downloadAndInstallApk && config.type === 'apk') {
                // Use native Android download with progress tracking
                setStatusText('جاري التحميل...');

                // Simulate progress (actual progress would come from native side)
                const progressInterval = setInterval(() => {
                    setDownloadProgress(prev => {
                        if (prev >= 95) {
                            clearInterval(progressInterval);
                            return 95;
                        }
                        return prev + 5;
                    });
                }, 300);

                const fileName = `GOO_NOW_v${config.version}.apk`;

                // Finalize download visual
                clearInterval(progressInterval);
                setDownloadProgress(100);
                setStatusText('تم التحميل! جاري التثبيت...');

                // Small delay to let UI render 100% before native intent takes over possibly pausing JS
                setTimeout(() => {
                    (window as any).Android.downloadAndInstallApk(finalUrl, fileName);
                }, 500);

            } else {
                // Fallback to browser download
                setStatusText('جاري التحميل...');
                const link = document.createElement('a');
                link.href = finalUrl;
                link.target = '_blank';
                if (config.type === 'apk') {
                    link.download = `GOO_NOW_v${config.version}.apk`;
                }
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setDownloadProgress(100);
                setStatusText('تم بدء التحميل!');
            }

            // Reset after delay
            setTimeout(() => {
                setIsDownloading(false);
                setDownloadProgress(0);
                setStatusText('');
            }, 5000);

        } catch (e) {
            console.error("Update failed:", e);
            setStatusText('فشل تحميل التحديث');
            setTimeout(() => {
                setIsDownloading(false);
                setDownloadProgress(0);
                setStatusText('');
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#0f172a] flex flex-col items-center justify-center p-6 animate-fadeIn font-sans text-white overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 w-full max-w-sm text-center">

                {/* Animated Logo */}
                {/* Animated Logo */}
                <div className="relative mb-10 flex justify-center">
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                    <div className="w-28 h-28 bg-[#1e293b] rounded-[2rem] flex items-center justify-center border-4 border-gray-700 shadow-2xl relative z-10 animate-bounce-slow overflow-hidden">
                        {!imageError ? (
                            <img
                                src="/app-icon.png"
                                alt="GOO NOW"
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 w-full h-full">
                                <div className="text-red-500 font-black text-2xl tracking-tight">GOO</div>
                                <div className="text-white font-bold text-sm tracking-wide mt-0.5">NOW</div>
                            </div>
                        )}
                        {/* Notification Badge */}
                        <div className="absolute -top-2 -right-2 bg-red-500 w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#0f172a] animate-ping"></div>
                        <div className="absolute -top-2 -right-2 bg-red-600 w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#0f172a] text-xs font-bold shadow-lg">
                            1
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-slide-up">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full mb-4">
                        <SparklesIcon className="w-4 h-4 text-red-400 animate-spin-slow" />
                        <span className="text-xs font-bold text-red-300 tracking-wider">تحديث جديد متوفر</span>
                    </div>

                    <h2 className="text-3xl font-black mb-2 text-white">
                        الإصدار {config.version}
                    </h2>

                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                        {config.description || config.notes || 'يوجد تحديث جديد للتطبيق مع تحسينات في الأداء وإضافات مميزة. قم بالتحديث الآن للحصول على أفضل تجربة.'}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleUpdate}
                            disabled={isDownloading}
                            className={`group relative w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-600/30 active:scale-95 transition-all overflow-hidden ${isDownloading ? 'cursor-wait opacity-80' : ''}`}
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <div className="relative flex flex-col items-center justify-center gap-2">
                                {isDownloading ? (
                                    <>
                                        <div className="w-full px-6">
                                            <div className="w-full bg-white/20 rounded-full h-2.5 mb-3">
                                                <div
                                                    className="bg-white h-2.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${downloadProgress}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-2xl font-black mb-1">{downloadProgress}%</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm">{statusText || 'جاري التحميل...'}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DownloadIcon className="w-6 h-6" />
                                        <span className="text-lg">تحميل التطبيق الآن</span>
                                    </>
                                )}
                            </div>
                        </button>

                        {!isDownloading && (
                            <button
                                onClick={onDismiss}
                                className="w-full bg-transparent hover:bg-white/5 text-gray-400 font-bold py-3 rounded-2xl transition-colors text-sm"
                            >
                                ليس الآن
                            </button>
                        )}
                    </div>
                </div>

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
