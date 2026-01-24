
import React from 'react';
import { User } from '../../types';
import { XIcon, CheckCircleIcon, TrashIcon, UserIcon, PhoneIcon, ClockIcon, GridIcon, MapPinIcon, BriefcaseIcon, CalendarIcon, MailIcon, SettingsIcon } from '../icons';

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  onApprove: (userId: string, updatedData: Partial<User>) => void;
  onDelete: (userId: string) => void;
}

const getRoleName = (role: string) => {
    switch (role) {
        case 'merchant': return 'تاجر';
        case 'driver': return 'مندوب توصيل';
        case 'customer': return 'مستخدم';
        case 'admin': return 'مدير النظام';
        case 'supervisor': return 'مشرف';
        default: return role;
    }
}

const getCategoryName = (cat: string | undefined) => {
    switch(cat) {
        case 'restaurant': return 'مطعم';
        case 'market': return 'سوبر ماركت';
        case 'pharmacy': return 'صيدلية';
        case 'other': return 'أخرى';
        default: return cat || 'غير محدد';
    }
}

const InfoTile: React.FC<{ label: string; value: string; icon?: React.ReactNode; fullWidth?: boolean; highlight?: boolean }> = ({ label, value, icon, fullWidth, highlight }) => (
    <div className={`bg-[#252525] p-4 rounded-xl border ${highlight ? 'border-red-500/30 bg-red-900/10' : 'border-[#333]'} flex flex-col justify-center ${fullWidth ? 'col-span-2' : ''} shadow-sm`}>
        <div className="flex items-center gap-2 mb-1.5">
            {icon && React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-4 h-4 ${highlight ? 'text-red-400' : 'text-gray-500'}` })}
            <span className={`text-xs font-bold ${highlight ? 'text-red-300' : 'text-gray-400'}`}>{label}</span>
        </div>
        <p className="font-bold text-white text-base break-words tracking-wide">{value}</p>
    </div>
);

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, onApprove, onDelete }) => {

    const handleApprove = () => {
        onApprove(user.id, { status: 'active' });
    };

    const handleDelete = () => {
        if (window.confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) {
            onDelete(user.id);
        }
    };

    const formattedDate = (() => {
        try {
            const d = new Date(user.createdAt);
            if (isNaN(d.getTime())) return 'غير متوفر';
            return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'غير متوفر';
        }
    })();

    // Helper to determine cover color based on role
    const getCoverGradient = () => {
        switch(user.role) {
            case 'driver': return 'from-orange-900/80 to-gray-900';
            case 'merchant': return 'from-purple-900/80 to-gray-900';
            case 'admin': return 'from-red-900/80 to-gray-900';
            default: return 'from-blue-900/80 to-gray-900';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex justify-center items-end sm:items-center z-50 p-0 sm:p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1a1a1a] w-full sm:max-w-lg h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#333] shadow-2xl flex flex-col relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                {/* Header Image Background */}
                <div className={`h-40 bg-gradient-to-br ${getCoverGradient()} relative`}>
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors z-20 border border-white/10"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="absolute top-4 right-4 z-20">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg ${
                            user.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                            {user.status === 'active' ? '● حساب نشط' : user.status === 'pending' ? '○ قيد المراجعة' : '× محظور'}
                        </span>
                    </div>
                </div>

                {/* Profile Image & Main Info (Floating) */}
                <div className="px-6 relative -mt-16 flex flex-col items-center z-10">
                    <div className="w-32 h-32 rounded-3xl bg-[#252525] p-1 shadow-2xl relative group">
                        <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-[#1a1a1a] relative bg-gray-800 flex items-center justify-center">
                            {user.storeImage ? (
                                <img src={user.storeImage} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-12 h-12 text-gray-500" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-gray-800 text-[10px] px-2 py-1 rounded-lg font-bold text-white border border-[#444] shadow-md flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            ID: {user.id}
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mt-4 text-center tracking-tight">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-2 bg-[#252525] px-4 py-1.5 rounded-full border border-[#333]">
                        <span className="text-gray-400 text-sm font-medium">{getRoleName(user.role)}</span>
                        {user.role === 'driver' && <span className="text-gray-600">•</span>}
                        {user.role === 'driver' && <span className="text-orange-400 text-xs font-bold">Driver App</span>}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    
                    {/* Basic Info Section */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-red-500" />
                            البيانات الشخصية
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <InfoTile label="رقم الهاتف" value={user.phone || 'غير متوفر'} icon={<PhoneIcon />} fullWidth highlight />
                            <InfoTile label="تاريخ الانضمام" value={formattedDate} icon={<CalendarIcon />} fullWidth />
                            {user.email && <InfoTile label="البريد الإلكتروني" value={user.email} icon={<MailIcon />} fullWidth />}
                            {user.addresses && user.addresses.length > 0 && (
                                <InfoTile label="العنوان الرئيسي" value={user.addresses[0]} icon={<MapPinIcon />} fullWidth />
                            )}
                        </div>
                    </div>

                    {/* Merchant Specifics */}
                    {user.role === 'merchant' && (
                        <div>
                            <div className="h-px bg-[#333] mb-6"></div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <GridIcon className="w-4 h-4 text-purple-500" />
                                تفاصيل المتجر
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <InfoTile label="فئة النشاط" value={getCategoryName(user.storeCategory)} />
                                {user.workingHours ? (
                                    <InfoTile label="ساعات العمل" value={`${user.workingHours.start} - ${user.workingHours.end}`} icon={<ClockIcon />} />
                                ) : (
                                    <InfoTile label="ساعات العمل" value="غير محدد" icon={<ClockIcon />} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Driver Specifics */}
                    {user.role === 'driver' && (
                        <div>
                            <div className="h-px bg-[#333] mb-6"></div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <SettingsIcon className="w-4 h-4 text-orange-500" />
                                إعدادات العمل والعمولة
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <InfoTile label="نظام العمولة" value={user.commissionType === 'fixed' ? 'مبلغ ثابت' : 'نسبة مئوية'} />
                                <InfoTile label="القيمة" value={user.commissionType === 'fixed' ? `${user.commissionRate} ج.م` : `${user.commissionRate}%`} highlight />
                                <InfoTile label="نظام العمل" value={user.dailyLogMode === 'always_open' ? 'مفتوح دائماً' : 'ورديات (12 ساعة)'} fullWidth />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Action Footer */}
                <div className="p-5 bg-[#1a1a1a] border-t border-[#333] flex gap-4 pb-8 sm:pb-5">
                    {user.status === 'pending' ? (
                        <>
                            <button
                                onClick={handleApprove}
                                className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                قبول وتفعيل
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-red-900/20 hover:bg-red-900/30 text-red-500 border border-red-500/20 font-bold py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <TrashIcon className="w-5 h-5" />
                                رفض
                            </button>
                        </>
                    ) : (
                        <div className="w-full flex gap-3">
                             <button
                                onClick={onClose}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-4 rounded-xl transition-colors border border-gray-700"
                            >
                                إغلاق
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-16 bg-red-900/10 hover:bg-red-900/20 text-red-500 border border-red-500/10 font-bold py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center"
                                title="حذف الحساب"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
