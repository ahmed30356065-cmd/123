
import React, { useState, useMemo } from 'react';
import { AuditLog } from '../../types';
import { ShieldCheckIcon, SearchIcon, ClockIcon, UserIcon, CalendarIcon, TrashIcon, RefreshCwIcon } from '../icons';
import ConfirmationModal from './ConfirmationModal';

interface AuditLogsScreenProps {
    logs: AuditLog[];
    onClearLogs: () => void;
    onUndo?: (log: AuditLog) => Promise<boolean>;
}

const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({ logs, onClearLogs, onUndo }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(20);

    const filteredLogs = useMemo(() => {
        setDisplayLimit(20); // Reset limit on filter change
        return logs
            .filter(log => {
                const matchesSearch = log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    log.details.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesType = filterType === 'all' || log.actionType === filterType;
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                const timeA = new Date(a.createdAt).getTime();
                const timeB = new Date(b.createdAt).getTime();
                return timeB - timeA;
            });
    }, [logs, searchQuery, filterType]);

    const visibleLogs = useMemo(() => filteredLogs.slice(0, displayLimit), [filteredLogs, displayLimit]);

    const getActionColor = (type: string) => {
        switch (type) {
            case 'create': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'delete': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'update': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'login': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'financial': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getActionLabel = (type: string) => {
        switch (type) {
            case 'create': return 'إضافة جديد';
            case 'delete': return 'حذف بيانات';
            case 'update': return 'تعديل بيانات';
            case 'login': return 'تسجيل دخول';
            case 'financial': return 'عملية مالية';
            default: return type;
        }
    };

    const formatFullDateTime = (dateVal: any) => {
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return { dayName: 'غير معروف', dateStr: '--', timeStr: '--' };

            const dayName = d.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long' });
            const dateStr = d.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
            const timeStr = d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true });

            return { dayName, dateStr, timeStr };
        } catch (e) {
            return { dayName: '-', dateStr: '-', timeStr: '-' };
        }
    };

    const handleClearConfirm = () => {
        onClearLogs();
        setIsConfirmOpen(false);
    };

    return (
        <div className="space-y-6 pb-24 animate-fadeIn">
            {/* Header */}
            <div className="bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-700/50 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">سجل المراقبة</h2>
                        <p className="text-xs text-gray-400">تتبع نشاط المشرفين والعمليات الحساسة بدقة</p>
                    </div>
                </div>

                <div className="relative flex-1 w-full flex items-center gap-3">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="بحث باسم المشرف، الحدث، أو التفاصيل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900 text-white rounded-xl py-3 pr-12 pl-4 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-500"
                        />
                    </div>
                    {logs.length > 0 && (
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-3 rounded-xl transition-all active:scale-95"
                            title="تنظيف السجل"
                        >
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'create', 'update', 'delete', 'financial', 'login'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${filterType === type
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                    >
                        {type === 'all' ? 'الكل' : getActionLabel(type)}
                    </button>
                ))}
            </div>

            {/* Logs List */}
            <div className="space-y-3">
                {visibleLogs.length > 0 ? (
                    visibleLogs.map(log => {
                        const { dayName, dateStr, timeStr } = formatFullDateTime(log.createdAt);

                        return (
                            <div key={log.id} className="bg-[#1e293b] rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm group">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-2.5 rounded-xl border mt-1 shadow-inner ${getActionColor(log.actionType)}`}>
                                        <ShieldCheckIcon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-white font-bold text-sm flex items-center gap-1">
                                                <UserIcon className="w-3 h-3 text-gray-500" />
                                                {log.actorName}
                                            </span>
                                            <span className="text-gray-600 text-xs">|</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getActionColor(log.actionType)}`}>
                                                {getActionLabel(log.actionType)}
                                            </span>
                                            <span className="text-gray-500 text-xs bg-black/20 px-2 py-0.5 rounded border border-white/5 font-mono">
                                                {log.target}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium">#{log.id.split('-').pop()}</p>
                                        {log.isUndone && (
                                            <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded-full border border-orange-500/20 font-bold">
                                                تم التراجع
                                            </span>
                                        )}
                                        <p className="text-gray-300 text-sm leading-relaxed">{log.details}</p>

                                        {/* Undo Button - Only show if not already undone */}
                                        {onUndo && !log.isUndone && log.actionType !== 'login' && log.targetId && log.collection && (
                                            <button
                                                onClick={() => onUndo(log)}
                                                className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded-lg border border-orange-500/20 transition-all active:scale-95"
                                            >
                                                <RefreshCwIcon className="w-3 h-3" />
                                                تراجع عن العملية
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 text-xs text-gray-500 bg-black/20 px-3 py-2 rounded-lg border border-white/5 w-full md:w-auto">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>{dayName}، {dateStr}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-300 font-bold font-mono">
                                        <ClockIcon className="w-3 h-3 text-blue-400" />
                                        <span>{timeStr}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-16 text-gray-500 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
                        <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-gray-400">لا توجد سجلات</h3>
                        <p className="text-xs mt-1">لم يتم العثور على أي نشاط مطابق للبحث.</p>
                    </div>
                )}
            </div>

            {filteredLogs.length > displayLimit && (
                <button
                    onClick={() => setDisplayLimit(prev => prev + 20)}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all"
                >
                    عرض المزيد ({filteredLogs.length - displayLimit} متبقي)
                </button>
            )}

            {/* Confirmation Modal */}
            {
                isConfirmOpen && (
                    <ConfirmationModal
                        title="تأكيد مسح السجل"
                        message="هل أنت متأكد من رغبتك في حذف جميع سجلات المراقبة؟ لا يمكن التراجع عن هذا الإجراء."
                        onClose={() => setIsConfirmOpen(false)}
                        onConfirm={handleClearConfirm}
                        confirmButtonText="نعم، مسح الكل"
                        confirmVariant="danger"
                    />
                )
            }
        </div >
    );
};

export default AuditLogsScreen;
