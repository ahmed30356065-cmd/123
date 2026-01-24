
import React, { useState, useMemo, useEffect } from 'react';
import { User, Message } from '../../types';
import { XIcon, TrashIcon, ClockIcon, CheckCircleIcon, UserIcon, MessageSquareIcon, UploadIcon, SearchIcon, CheckSquareIcon, SquareIcon } from '../icons';
import ConfirmationModal from './ConfirmationModal';

interface AdminMessagesScreenProps {
  users: User[];
  onSendMessage: (messageData: { text: string; image?: string; targetRole: 'driver' | 'merchant' | 'customer'; targetIds: string[]; }) => void;
  messages?: Message[];
  deleteMessage?: (id: string) => void;
}

const AdminMessagesScreen: React.FC<AdminMessagesScreenProps> = ({ users, onSendMessage, messages = [], deleteMessage }) => {
    const [targetRole, setTargetRole] = useState<'driver' | 'merchant' | 'customer'>('driver');
    
    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [text, setText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

    const pushModalState = (modalName: string) => { try { window.history.pushState({ view: 'messages', modal: modalName }, '', window.location.pathname); } catch (e) {} };
    const closeModal = () => { if (window.history.state?.modal) window.history.back(); else setDeletingMessageId(null); };

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => { if (!event.state?.modal) setDeletingMessageId(null); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Filter users based on role
    const availableUsers = useMemo(() => users.filter(u => u.role === targetRole), [users, targetRole]);

    // Filter displayed users based on search
    const displayedUsers = useMemo(() => {
        if (!searchQuery) return availableUsers;
        return availableUsers.filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (u.phone && u.phone.includes(searchQuery))
        );
    }, [availableUsers, searchQuery]);

    // Reset selection when role changes
    useEffect(() => {
        setSelectedIds([]);
        setSearchQuery('');
    }, [targetRole]);

    const handleSelectAll = () => {
        if (selectedIds.length === displayedUsers.length && displayedUsers.length > 0) {
            setSelectedIds([]); // Deselect All
        } else {
            setSelectedIds(displayedUsers.map(u => u.id)); // Select All Visible
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const sortedMessages = useMemo(() => [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [messages]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setImage(reader.result as string); setImagePreview(URL.createObjectURL(file)); };
            reader.readAsDataURL(file);
        } else { setImage(null); setImagePreview(null); }
    };
    
    const handleSend = () => {
        if (selectedIds.length === 0) { setError('الرجاء اختيار مستلم واحد على الأقل.'); return; }
        if (!text.trim()) { setError('الرجاء كتابة نص الرسالة.'); return; }
        
        onSendMessage({ text, image: image || undefined, targetRole, targetIds: selectedIds });
        
        setText(''); setImage(null); setImagePreview(null); setSelectedIds([]); setError('');
    };

    const confirmDelete = () => { if (deletingMessageId && deleteMessage) deleteMessage(deletingMessageId); closeModal(); };

    const getRecipientLabel = (msg: Message) => {
        if (msg.targetId === 'all' || msg.targetId === 'multiple') {
            if (msg.targetRole === 'driver') return '📢 مجموعة مناديب';
            if (msg.targetRole === 'merchant') return '📢 مجموعة تجار';
            return '📢 مجموعة مستخدمين';
        }
        const user = users.find(u => u.id === msg.targetId);
        return user ? `👤 ${user.name}` : 'مستخدم غير معروف';
    };

    // Checkbox Icon Component
    const Checkbox = ({ checked }: { checked: boolean }) => (
        checked 
        ? <div className="bg-red-600 text-white rounded p-0.5"><CheckSquareIcon className="w-5 h-5" /></div>
        : <div className="text-gray-500"><SquareIcon className="w-5 h-5" /></div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Compose Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden sticky top-6">
                        <div className="p-5 border-b border-gray-700 bg-gray-900/50 flex items-center gap-3">
                            <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-900/20">
                                <MessageSquareIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">رسالة جديدة</h2>
                        </div>
                        
                        <div className="p-5 space-y-5">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">الفئة المستهدفة</label>
                                <div className="grid grid-cols-3 gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-700">
                                    {[
                                        { id: 'driver', label: 'المناديب' }, 
                                        { id: 'merchant', label: 'التجار' }, 
                                        { id: 'customer', label: 'العملاء' }
                                    ].map((role) => (
                                        <button 
                                            key={role.id} 
                                            onClick={() => setTargetRole(role.id as any)} 
                                            className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${targetRole === role.id ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recipient Selection (Multi-Select List) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">
                                    تحديد المستلمين ({selectedIds.length})
                                </label>
                                
                                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                                    {/* Search & Select All Header */}
                                    <div className="p-2 border-b border-gray-700 flex items-center gap-2">
                                        <button 
                                            onClick={handleSelectAll}
                                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold text-gray-300"
                                        >
                                            <Checkbox checked={selectedIds.length > 0 && selectedIds.length === displayedUsers.length} />
                                            الكل
                                        </button>
                                        <div className="h-6 w-px bg-gray-700 mx-1"></div>
                                        <div className="flex-1 relative">
                                            <SearchIcon className="absolute right-2 top-2 w-4 h-4 text-gray-500" />
                                            <input 
                                                type="text" 
                                                placeholder="بحث..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-transparent border-none text-white text-xs py-2 pr-8 pl-2 focus:ring-0 placeholder-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Scrollable List */}
                                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                        {displayedUsers.length > 0 ? (
                                            displayedUsers.map(user => (
                                                <div 
                                                    key={user.id} 
                                                    onClick={() => toggleSelection(user.id)}
                                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(user.id) ? 'bg-red-900/20' : 'hover:bg-gray-800'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox checked={selectedIds.includes(user.id)} />
                                                        <div>
                                                            <p className={`text-xs font-bold ${selectedIds.includes(user.id) ? 'text-red-200' : 'text-gray-300'}`}>{user.name}</p>
                                                            <p className="text-[10px] text-gray-500 font-mono">{user.phone}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 py-4 text-xs">لا يوجد نتائج</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Message Text */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">نص الرسالة</label>
                                <textarea 
                                    rows={4} 
                                    value={text} 
                                    onChange={e => setText(e.target.value)} 
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-white placeholder:text-gray-600 text-sm resize-none transition-all" 
                                    placeholder="اكتب رسالتك هنا..." 
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">صورة مرفقة (اختياري)</label>
                                <label className="flex items-center justify-center w-full px-4 py-3 bg-gray-900 border border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-red-500 hover:bg-gray-900/80 transition-all group">
                                    <div className="flex items-center gap-2">
                                        <UploadIcon className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
                                        <span className="text-xs text-gray-500 group-hover:text-gray-300">اضغط لرفع صورة</span>
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>

                            {imagePreview && (
                                <div className="relative rounded-xl overflow-hidden border border-gray-700 group">
                                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => { setImage(null); setImagePreview(null); }} className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><XIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )}

                            {error && <p className="text-red-400 text-xs font-bold text-center bg-red-900/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
                            
                            <button 
                                onClick={handleSend} 
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>إرسال ({selectedIds.length})</span>
                                <MessageSquareIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 pb-2 border-b border-gray-700">
                        <ClockIcon className="w-6 h-6 text-gray-500" />
                        سجل الرسائل المرسلة
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">{sortedMessages.length}</span>
                    </h3>
                    
                    <div className="space-y-4">
                        {sortedMessages.length === 0 ? (
                            <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
                                <MessageSquareIcon className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
                                <p className="text-gray-500 font-medium">لا توجد رسائل سابقة.</p>
                            </div>
                        ) : sortedMessages.map(msg => (
                            <div key={msg.id} className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-sm hover:border-gray-600 transition-all group relative overflow-hidden">
                                {/* Top Bar */}
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-full ${msg.targetRole === 'driver' ? 'bg-blue-900/20 text-blue-400' : msg.targetRole === 'merchant' ? 'bg-purple-900/20 text-purple-400' : 'bg-green-900/20 text-green-400'}`}>
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                                {getRecipientLabel(msg)}
                                                <span className={`text-[10px] px-2 py-0.5 rounded border ${msg.targetRole === 'driver' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : msg.targetRole === 'merchant' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-green-500/10 border-green-500/20 text-green-300'}`}>
                                                    {msg.targetRole === 'driver' ? 'مندوب' : msg.targetRole === 'merchant' ? 'تاجر' : 'عميل'}
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                                <ClockIcon className="w-3 h-3 ml-1" />
                                                {new Date(msg.createdAt).toLocaleString('ar-EG-u-nu-latn')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {deleteMessage && (
                                        <button 
                                            onClick={() => { pushModalState('deleteMessage'); setDeletingMessageId(msg.id); }} 
                                            className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="حذف الرسالة"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 relative z-10">
                                    {msg.image && (
                                        <div className="mb-3">
                                            <img src={msg.image} alt="مرفق" className="h-32 w-auto rounded-lg border border-gray-700 object-cover hover:scale-105 transition-transform cursor-pointer" />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                                </div>

                                {/* Read Receipt */}
                                <div className="mt-3 flex justify-end relative z-10">
                                    <span className={`text-xs font-bold flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md border border-white/5 ${msg.readBy?.length ? 'text-green-400' : 'text-gray-500'}`}>
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        {msg.readBy?.length ? `تمت القراءة بواسطة ${msg.readBy.length}` : 'لم تتم القراءة بعد'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {deletingMessageId && <ConfirmationModal title="حذف الرسالة" message="هل أنت متأكد من حذف هذه الرسالة من السجل؟" onClose={closeModal} onConfirm={confirmDelete} confirmButtonText="نعم، حذف" confirmVariant="danger" />}
        </div>
    );
};

export default AdminMessagesScreen;
