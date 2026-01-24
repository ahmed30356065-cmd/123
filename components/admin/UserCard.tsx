
import React from 'react';
import { User } from '../../types';
import { UserIcon, TrashIcon, PencilIcon, CheckCircleIcon, PhoneIcon, CalendarIcon, ClockIcon, MapPinIcon, CrownIcon, VerifiedIcon, StarIcon, RocketIcon, ShieldCheckIcon, SettingsIcon, TruckIconV2, StoreIcon, HeadsetIcon, BoltIcon, HeartIcon, DollarSignIcon, BanIcon, LockOpenIcon } from '../icons';

interface UserCardProps {
    user: User;
    onEdit?: (user: User) => void;
    onDelete?: (user: User) => void;
    onApprove?: (userId: string) => void;
    onBlock?: (user: User) => void;
    onUnblock?: (user: User) => void;
    isPrimaryAdmin?: boolean;
}

const getStatusText = (status: string) => {
    switch (status) {
        case 'active': return 'نشط';
        case 'pending': return 'قيد المراجعة';
        case 'inactive': return 'غير نشط';
        case 'blocked': return 'محظور';
        default: return status;
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'green';
        case 'pending': return 'yellow';
        case 'inactive': return 'gray';
        case 'blocked': return 'red';
        default: return 'gray';
    }
}

const getRoleBadge = (role: string) => {
    switch (role) {
        case 'driver': return { label: 'مندوب', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
        case 'merchant': return { label: 'تاجر', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
        case 'admin': return { label: 'مدير', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' };
        case 'supervisor': return { label: 'مشرف', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' };
        case 'customer': return { label: 'عميل', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
        default: return { label: 'مستخدم', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
    }
}

// Reuse the Frame Style logic (duplicated to avoid circular deps for now, or could be utils)
const getFrameContainerClass = (type?: string) => {
    if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0';
    switch(type) {
        case 'gold': return 'p-[2px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.4)]';
        case 'neon': return 'p-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
        case 'royal': return 'p-[2px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-sm border border-purple-500/30';
        case 'fire': return 'p-[2px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
        default: return 'p-0'; // No frame
    }
};

const getBadgeIcon = (type?: string) => {
    if (!type || type === 'none') return null;

    if (type?.startsWith('data:') || type?.startsWith('http')) {
        return (
            <div className="w-6 h-6 min-w-[1.5rem] rounded bg-white/5 border border-white/10 flex items-center justify-center p-0.5 ml-1">
                <img src={type} className="w-full h-full object-contain" alt="badge" />
            </div>
        );
    }
    
    switch(type) {
        case 'verified': return <VerifiedIcon className="w-3 h-3 text-blue-400" />;
        case 'vip': return <CrownIcon className="w-3 h-3 text-yellow-400" />;
        case 'star': return <StarIcon className="w-3 h-3 text-purple-400" />;
        case 'popular': return <RocketIcon className="w-3 h-3 text-red-400" />;
        case 'shield': 
        case 'tier-1':
        case 'tier-2':
        case 'tier-3':
        case 'tier-4':
        case 'tier-5':
            return <ShieldCheckIcon className="w-3 h-3 text-orange-400" />;
        case 'admin-badge': return <SettingsIcon className="w-3 h-3 text-red-500" />;
        case 'mod-badge': return <ShieldCheckIcon className="w-3 h-3 text-green-500" />;
        case 'driver-badge': return <TruckIconV2 className="w-3 h-3 text-orange-500" />;
        case 'merchant-badge': return <StoreIcon className="w-3 h-3 text-purple-500" />;
        case 'support-badge': return <HeadsetIcon className="w-3 h-3 text-blue-500" />;
        case 'flash': return <BoltIcon className="w-3 h-3 text-yellow-400" />;
        case 'love': return <HeartIcon className="w-3 h-3 text-pink-400" />;
        case 'cool': return <StarIcon className="w-3 h-3 text-cyan-400" />;
        case 'fire-b': return <RocketIcon className="w-3 h-3 text-red-500" />;
        case 'check': return <CheckCircleIcon className="w-3 h-3 text-green-500" />;
        case 'money': return <DollarSignIcon className="w-3 h-3 text-emerald-400" />;
        case 'let-a': return <span className="text-[10px] font-bold font-mono text-white">A</span>;
        case 'let-b': return <span className="text-[10px] font-bold font-mono text-white">B</span>;
        case 'let-s': return <span className="text-[10px] font-bold font-mono text-yellow-400">S</span>;
        case 'let-x': return <span className="text-[10px] font-bold font-mono text-red-400">X</span>;
        case 'pro': return <span className="text-[8px] font-black text-white bg-black px-1 rounded border border-white/50">PRO</span>;
        case 'max': return <span className="text-[8px] font-black text-white bg-red-600 px-1 rounded">MAX</span>;
        case 'top': return <RocketIcon className="w-3 h-3 text-blue-500" />;
        default: return null;
    }
};

const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete, onApprove, onBlock, onUnblock, isPrimaryAdmin }) => {
    const { dateStr, timeStr, dayStr } = (() => {
        try {
            const d = new Date(user.createdAt);
            if (isNaN(d.getTime())) return { dateStr: '--', timeStr: '--', dayStr: '' };
            
            const dayStr = d.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long' });
            const dateStr = d.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: 'numeric' });
            
            return { dateStr, timeStr, dayStr };
        } catch (e) {
            return { dateStr: '--', timeStr: '--', dayStr: '' };
        }
    })();

    const statusColor = getStatusColor(user.status);
    const roleStyle = getRoleBadge(user.role);
    const frameClass = getFrameContainerClass(user.specialFrame);
    const isBlocked = user.status === 'blocked';
    
    return (
        <div className={`group relative rounded-2xl border shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full ${isBlocked ? 'bg-red-950/20 border-red-500/30' : 'bg-gray-800 border-gray-700/50 hover:border-gray-600 hover:shadow-xl'}`}>
            {/* Status Strip */}
            <div className={`absolute top-0 right-0 w-1.5 h-full bg-${statusColor}-500 opacity-80`}></div>
            
            <div className="p-5 flex-1">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        {/* Avatar with Frame */}
                        <div className={`relative w-14 h-14 flex items-center justify-center rounded-full ${!isCustomFrame(user.specialFrame) ? frameClass : ''} ${isBlocked ? 'grayscale' : ''}`}>
                             {isCustomFrame(user.specialFrame) && (
                                <img src={user.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-[1.6] pointer-events-none" alt="frame" />
                             )}
                             <div className={`${isCustomFrame(user.specialFrame) ? 'w-[85%] h-[85%]' : 'w-full h-full'} rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-800 relative z-0`}>
                                {user.storeImage ? (
                                    <img src={user.storeImage} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-7 h-7 text-gray-400" />
                                )}
                             </div>
                        </div>
                        
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-white text-lg leading-tight truncate max-w-[120px]" title={user.name}>{user.name}</h3>
                                {getBadgeIcon(user.specialBadge)}
                            </div>
                            <div className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                                {roleStyle.label}
                            </div>
                        </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold bg-${statusColor}-500/10 text-${statusColor}-400 border border-${statusColor}-500/20`}>
                        {getStatusText(user.status)}
                    </div>
                </div>

                {/* Info Grid */}
                <div className={`rounded-xl p-3 space-y-2.5 border ${isBlocked ? 'bg-red-900/10 border-red-500/20' : 'bg-[#1a1a1a]/60 border-gray-700/30'}`}>
                    <div className="flex items-center text-gray-300 text-xs font-medium">
                        <PhoneIcon className="w-3.5 h-3.5 text-gray-500 ml-2" />
                        <span className="font-mono dir-ltr selectable">{user.phone || 'غير متوفر'}</span>
                    </div>
                    {user.address && (
                        <div className="flex items-start text-gray-400 text-[11px] leading-snug">
                            <MapPinIcon className="w-3.5 h-3.5 text-gray-600 ml-2 mt-0.5 flex-shrink-0" />
                            <span className="truncate">{user.address}</span>
                        </div>
                    )}
                    
                    {/* Date & Time Section */}
                    <div className="pt-2 mt-2 border-t border-gray-700/50 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <CalendarIcon className="w-3 h-3 text-gray-500" />
                                <span>{dayStr}، {dateStr}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Footer - Split Left/Right */}
            <div className={`px-4 py-3 border-t flex justify-between items-center ${isBlocked ? 'bg-red-900/30 border-red-500/30' : 'bg-[#151515] border-gray-700/50'}`}>
                {/* Right Side (Edit/Approve/Block/Unblock) */}
                <div className="flex items-center gap-2 flex-1">
                    {user.status === 'pending' && onApprove && (
                        <button
                            onClick={() => onApprove(user.id)}
                            className="flex-1 flex items-center justify-center text-xs bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-2 rounded-lg shadow-lg shadow-green-900/20 transition-all active:scale-95 clickable"
                        >
                            <CheckCircleIcon className="w-3.5 h-3.5 ml-1.5" />
                            قبول
                        </button>
                    )}
                    
                    {/* Block/Unblock Logic */}
                    {isBlocked ? (
                        onUnblock && !isPrimaryAdmin && (
                            <button
                                onClick={() => onUnblock(user)}
                                className="flex-1 flex items-center justify-center text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-bold px-3 py-2 rounded-lg transition-all active:scale-95 clickable"
                                title="فك الحظر"
                            >
                                <LockOpenIcon className="w-3.5 h-3.5 ml-1.5" />
                                فك الحظر
                            </button>
                        )
                    ) : (
                         onBlock && !isPrimaryAdmin && (
                             <button
                                 onClick={() => onBlock(user)}
                                 className="p-2 text-gray-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors border border-gray-600 hover:border-red-500 clickable"
                                 title="حظر المستخدم"
                             >
                                 <BanIcon className="w-4 h-4" />
                             </button>
                         )
                    )}

                    {onEdit && (
                        <button 
                            onClick={() => onEdit(user)} 
                            className="p-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors border border-blue-500/20 bg-blue-500/10 clickable"
                            title="تعديل"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Left Side (Delete) */}
                {onDelete && !isPrimaryAdmin && (
                    <button 
                        onClick={() => onDelete(user)} 
                        className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors border border-blue-500/20 bg-red-500/10 mr-2 clickable"
                        title="حذف"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserCard;
