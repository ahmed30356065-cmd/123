
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, SupportChat, ChatMessage } from '../../types';
import { 
    SearchIcon, UserIcon, SendIcon, TrashIcon, 
    XIcon, ChevronLeftIcon, PaperClipIcon, BoltIcon, 
    CheckCircleIcon, HeadsetIcon, 
    PhoneIcon, SettingsIcon,
    PencilIcon, ReplyIcon, WhatsAppIcon, ChatIcon
} from '../icons';
import * as firebaseService from '../../services/firebase';
import useAndroidBack from '../../hooks/useAndroidBack';
import ConfirmationModal from './ConfirmationModal';

interface AdminSupportScreenProps {
    users: User[];
    currentUser: User;
    isRestricted?: boolean;
    onBack?: () => void;
}

const SUGGESTED_REPLIES = [
    "مرحباً، كيف يمكنني مساعدتك اليوم؟",
    "جاري مراجعة طلبك، يرجى الانتظار قليلاً.",
    "شكراً لتواصلك معنا.",
    "هل يمكنك تزويدي برقم الطلب؟",
    "تم حل المشكلة. هل هناك شيء آخر؟"
];

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const AdminSupportScreen: React.FC<AdminSupportScreenProps> = ({ users, currentUser, isRestricted, onBack }) => {
    const [chats, setChats] = useState<SupportChat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Input States
    const [replyText, setReplyText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSuggestedReplies, setShowSuggestedReplies] = useState(false);
    
    // Interaction States
    const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    
    // Context Menu State (Long Press)
    const [contextMenuMessage, setContextMenuMessage] = useState<ChatMessage | null>(null);

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [config, setConfig] = useState({
        isWhatsappEnabled: true,
        whatsappNumber: '',
        isChatEnabled: true, // Default true
        allowImageSending: true,
        isAutoReplyEnabled: false,
        autoReplyText: 'مرحباً، نحن مغلقون الآن. سنرد عليك قريباً.'
    });

    // UI Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<any>(null);

    // Zoom Image State
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    useAndroidBack(() => {
        if (contextMenuMessage) { setContextMenuMessage(null); return true; }
        if (isSettingsOpen) { setIsSettingsOpen(false); return true; }
        if (zoomedImage) { setZoomedImage(null); return true; }
        if (selectedChatId) { setSelectedChatId(null); return true; }
        if (onBack) { onBack(); return true; }
        return false;
    }, [zoomedImage, selectedChatId, onBack, isSettingsOpen, contextMenuMessage]);

    // Fetch Chats and Config
    useEffect(() => {
        const unsubChats = firebaseService.subscribeToCollection('support_chats', (data) => {
            const sortedChats = (data as SupportChat[]).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
            setChats(sortedChats);
        });

        const unsubSettings = firebaseService.subscribeToCollection('settings', (data) => {
            const conf = data.find(d => d.id === 'support_config');
            if (conf) {
                // Strip out allowVoiceNotes if present in saved config
                const { allowVoiceNotes, ...rest } = conf as any;
                setConfig(prev => ({ ...prev, ...rest }));
            }
        });

        return () => { unsubChats(); unsubSettings(); };
    }, []);

    // Scroll to bottom
    useEffect(() => {
        if (selectedChatId && messagesEndRef.current && !editingMessage && !contextMenuMessage) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chats, selectedChatId, editingMessage]);

    // Mark as read
    useEffect(() => {
        if (selectedChatId) {
            const chat = chats.find(c => c.id === selectedChatId);
            if (chat && chat.unreadCount > 0) {
                firebaseService.updateData('support_chats', selectedChatId, { unreadCount: 0 });
            }
        }
    }, [selectedChatId, chats]);

    const activeChat = useMemo(() => chats.find(c => c.id === selectedChatId), [chats, selectedChatId]);
    
    const activeChatUser = useMemo(() => {
        if (!activeChat) return null;
        return users.find(u => u.id === activeChat.userId);
    }, [activeChat, users]);

    const filteredChats = useMemo(() => {
        if (!searchQuery) return chats;
        return chats.filter(c => 
            c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.userPhone.includes(searchQuery)
        );
    }, [chats, searchQuery]);

    // --- Message Logic ---

    const handleSendMessage = async (text: string = replyText, img: string | null = image) => {
        if ((!text.trim() && !img) || !selectedChatId || !activeChat) return;

        let updatedMessages = [...(activeChat.messages || [])];
        let lastMsgText = text;

        if (editingMessage) {
            // Edit Mode
            updatedMessages = updatedMessages.map(msg => 
                msg.id === editingMessage.id 
                ? { ...msg, text: text, image: img || msg.image } 
                : msg
            );
            lastMsgText = "✏️ " + text;
        } else {
            // New Message
            let finalText = text;
            
            // Encode Reply in text
            if (replyToMessage) {
                const quotedText = replyToMessage.text.substring(0, 50) + (replyToMessage.text.length > 50 ? '...' : '');
                finalText = `[رد على: ${quotedText}]\n${text}`;
            }

            // Generate Ascending ID for Chat Message
            const maxMsgId = updatedMessages.reduce((max, msg) => {
                const num = parseInt(msg.id);
                return !isNaN(num) ? Math.max(max, num) : max;
            }, 0);
            const newMessageId = String(maxMsgId + 1);

            const newMessage: ChatMessage = {
                id: newMessageId,
                text: finalText,
                image: img || undefined,
                sender: 'admin',
                createdAt: new Date(),
                isRead: false
            };
            updatedMessages.push(newMessage);
            
            // Determine user role to send notification to the correct app
            const recipientRole = activeChatUser?.role || 'user';
            
            firebaseService.sendExternalNotification(
                recipientRole, 
                {
                    title: "رد جديد من الدعم",
                    body: finalText || "قام الدعم بإرسال صورة",
                    targetId: selectedChatId, 
                    url: '/?target=support'
                }
            );
        }
        
        await firebaseService.updateData('support_chats', selectedChatId, {
            messages: updatedMessages,
            lastMessage: img ? '📷 صورة' : lastMsgText,
            lastUpdated: new Date()
        });

        setReplyText('');
        setImage(null);
        setEditingMessage(null);
        setReplyToMessage(null);
        setShowEmojiPicker(false);
        setShowSuggestedReplies(false);
    };

    const handleReaction = async (msg: ChatMessage, emoji: string) => {
        if (!selectedChatId || !activeChat) return;
        const currentReactions = msg.reactions || [];
        const newReactions = currentReactions.includes(emoji) 
            ? currentReactions.filter(r => r !== emoji) 
            : [...currentReactions, emoji];
        
        const updatedMessages = activeChat.messages.map(m => m.id === msg.id ? { ...m, reactions: newReactions } : m);
        
        await firebaseService.updateData('support_chats', selectedChatId, { messages: updatedMessages });
        setContextMenuMessage(null);
    };

    const handleDeleteMessage = async () => {
        if (!messageToDelete || !selectedChatId || !activeChat) return;
        const updatedMessages = activeChat.messages.filter(m => m.id !== messageToDelete.id);
        const newLastMessage = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].text : 'تم حذف الرسائل';
        await firebaseService.updateData('support_chats', selectedChatId, { messages: updatedMessages, lastMessage: newLastMessage });
        setMessageToDelete(null);
    };

    const handleDeleteChat = async () => {
        if (!chatToDelete) return;
        await firebaseService.deleteData('support_chats', chatToDelete);
        setChatToDelete(null);
        setSelectedChatId(null);
    };

    // --- Interaction Handlers ---

    const handleLongPress = (msg: ChatMessage) => {
        setContextMenuMessage(msg);
    };

    const onTouchStart = (msg: ChatMessage) => {
        longPressTimer.current = setTimeout(() => handleLongPress(msg), 500);
    };

    const onTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const scrollToMessage = (textFragment: string) => {
        const elements = document.querySelectorAll('.message-text');
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].textContent?.includes(textFragment)) {
                elements[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
                elements[i].parentElement?.classList.add('ring-2', 'ring-yellow-400');
                setTimeout(() => elements[i].parentElement?.classList.remove('ring-2', 'ring-yellow-400'), 1500);
                break;
            }
        }
    };

    // --- Render Helpers ---

    const renderMessageText = (text: string) => {
        const replyMatch = text.match(/^\[رد على: (.*?)\]\n(.*)/s);
        
        if (replyMatch) {
            const quotedText = replyMatch[1];
            const mainText = replyMatch[2];
            
            return (
                <>
                    <div 
                        onClick={(e) => { e.stopPropagation(); scrollToMessage(quotedText); }}
                        className="mb-2 pb-1 border-b border-white/10 cursor-pointer active:opacity-70"
                    >
                        <p className="text-[10px] text-white/50 line-clamp-1 italic flex items-center gap-1">
                            <ReplyIcon className="w-3 h-3" />
                            {quotedText}
                        </p>
                    </div>
                    <span className="message-text">{renderLinks(mainText)}</span>
                </>
            );
        }
        return <span className="message-text">{renderLinks(text)}</span>;
    };

    const renderLinks = (text: string) => {
        const parts = text.split(/(https?:\/\/[^\s]+)/g);
        return parts.map((part, i) => 
            part.match(/^https?:\/\//) ? 
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">{part}</a> : 
                part
        );
    };

    // --- Input & Media Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveConfig = async () => {
        await firebaseService.updateData('settings', 'support_config', { id: 'support_config', ...config });
        setIsSettingsOpen(false);
    };
    
    // Helper to identify sticker/emoji (URL vs Data URI)
    const isSticker = (url: string) => url.startsWith('http');

    return (
        <div className="flex h-full bg-[#0f172a] text-white relative overflow-hidden">
            
            {/* Left Sidebar (Chat List) */}
            <div className={`w-full md:w-80 lg:w-96 bg-[#1e293b] border-l border-gray-700 flex flex-col absolute md:relative z-20 h-full transition-transform duration-300 ${selectedChatId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <HeadsetIcon className="w-6 h-6 text-teal-400" />
                        الدعم الفني
                    </h2>
                    <div className="flex items-center gap-2">
                        {!isRestricted && (
                            <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <SettingsIcon className="w-5 h-5" />
                            </button>
                        )}
                        {onBack && (
                            <button onClick={onBack} className="p-2 hover:bg-gray-700 rounded-full md:hidden">
                                <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="p-3">
                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="بحث عن مستخدم..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-2 pl-4 pr-10 text-sm focus:border-teal-500 outline-none text-white"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredChats.map(chat => {
                        const chatUser = users.find(u => u.id === chat.userId);
                        return (
                            <button 
                                key={chat.id} 
                                onClick={() => setSelectedChatId(chat.id)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-[#2a3649] transition-colors border-b border-gray-700/50 ${selectedChatId === chat.id ? 'bg-[#2a3649] border-r-4 border-r-teal-500' : ''}`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-600">
                                        {chatUser?.storeImage ? (
                                            <img src={chatUser.storeImage} alt={chat.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-6 h-6" />
                                        )}
                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#1e293b]">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 text-right overflow-hidden">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-white truncate">{chat.userName}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(chat.lastUpdated).toLocaleDateString()}</span>
                                    </div>
                                    <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-white font-bold' : 'text-gray-400'}`}>
                                        {chat.lastMessage || 'بدء المحادثة'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Side (Chat Window) */}
            <div className={`flex-1 flex flex-col bg-[#0f172a] absolute md:relative inset-0 z-10 transition-transform duration-300 ${selectedChatId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-[#151e2d] shadow-sm z-20">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedChatId(null)} className="md:hidden p-2 hover:bg-gray-700 rounded-full text-gray-400">
                                    <ChevronLeftIcon className="w-6 h-6" />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                    {activeChatUser?.storeImage ? (
                                        <img src={activeChatUser.storeImage} alt={activeChat.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">{activeChat.userName}</h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <PhoneIcon className="w-3 h-3" />
                                        <span className="font-mono">{activeChat.userPhone}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {!isRestricted && (
                                <button onClick={() => setChatToDelete(activeChat.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b1120] custom-scrollbar">
                            {activeChat.messages.map((msg, index) => {
                                const isMe = msg.sender === 'admin';
                                const isStickerImage = msg.image && isSticker(msg.image);

                                return (
                                    <div 
                                        key={index} 
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        onTouchStart={() => onTouchStart(msg)}
                                        onTouchEnd={onTouchEnd}
                                        onMouseDown={() => onTouchStart(msg)}
                                        onMouseUp={onTouchEnd}
                                        onContextMenu={(e) => { e.preventDefault(); handleLongPress(msg); }}
                                    >
                                        <div className={`relative max-w-[75%] rounded-2xl p-2 select-none shadow-sm ${isStickerImage ? 'bg-transparent shadow-none' : (isMe ? 'bg-teal-700 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none')}`}>
                                            {msg.image && (
                                                <img 
                                                    src={msg.image} 
                                                    className={isStickerImage ? "w-32 h-32 object-contain cursor-pointer drop-shadow-lg" : "rounded-lg mb-2 max-h-48 object-cover cursor-pointer"}
                                                    onClick={(e) => { e.stopPropagation(); setZoomedImage(msg.image!); }}
                                                    alt="attachment" 
                                                />
                                            )}
                                            {msg.text && <div className="text-sm whitespace-pre-wrap leading-relaxed px-1">{renderMessageText(msg.text)}</div>}
                                            
                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isStickerImage ? 'text-gray-400' : (isMe ? 'text-teal-200' : 'text-gray-400')}`}>
                                                <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                {isMe && <CheckCircleIcon className="w-3 h-3" />}
                                            </div>

                                            {/* Reactions */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <div className={`absolute -bottom-2 ${isMe ? 'left-0' : 'right-0'} flex -space-x-1`}>
                                                    {msg.reactions.map((r, i) => (
                                                        <div key={i} className="w-5 h-5 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-[10px] shadow-sm">{r}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-[#151e2d] border-t border-gray-700">
                            
                            {/* Reply / Edit Context Banner */}
                            {(replyToMessage || editingMessage) && (
                                <div className="flex justify-between items-center bg-gray-800 p-2 rounded-t-lg border-b border-gray-700 mb-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        {editingMessage ? (
                                            <>
                                                <PencilIcon className="w-4 h-4 text-blue-400" />
                                                <span className="text-blue-300 font-bold">جاري تعديل الرسالة</span>
                                            </>
                                        ) : (
                                            <>
                                                <ReplyIcon className="w-4 h-4 text-purple-400" />
                                                <span className="text-purple-300 font-bold">رد على:</span>
                                                <span className="text-gray-400 truncate max-w-[150px]">{replyToMessage?.text}</span>
                                            </>
                                        )}
                                    </div>
                                    <button onClick={() => { setReplyToMessage(null); setEditingMessage(null); setReplyText(''); setImage(null); }} className="text-gray-500 hover:text-white">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Attachments Preview */}
                            {image && (
                                <div className="relative w-fit mb-2">
                                    <img src={image} className="h-20 w-20 rounded-lg object-cover border border-gray-600" alt="preview" />
                                    <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><XIcon className="w-4 h-4" /></button>
                                </div>
                            )}

                            <div className="flex items-end gap-2">
                                <div className="flex-1 bg-gray-800 rounded-2xl flex items-center px-2 border border-gray-600 focus-within:border-teal-500 transition-colors">
                                    {config.allowImageSending && (
                                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-teal-400">
                                            <PaperClipIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setShowSuggestedReplies(!showSuggestedReplies)} 
                                        className={`p-2 transition-colors ${showSuggestedReplies ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                                    >
                                        <BoltIcon className="w-5 h-5" />
                                    </button>
                                    <textarea 
                                        ref={textareaRef}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="اكتب رسالتك هنا..."
                                        rows={1}
                                        className="flex-1 bg-transparent text-white p-3 text-sm outline-none resize-none max-h-24 custom-scrollbar"
                                    />
                                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-400 hover:text-yellow-400">
                                        <span className="text-lg">😊</span>
                                    </button>
                                </div>

                                <button 
                                    onClick={() => handleSendMessage()}
                                    disabled={!replyText.trim() && !image}
                                    className={`p-3 text-white rounded-full shadow-lg transition-transform active:scale-95 ${editingMessage ? 'bg-blue-600 hover:bg-blue-500' : 'bg-teal-600 hover:bg-teal-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {editingMessage ? <CheckCircleIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5 ml-0.5" />}
                                </button>
                            </div>
                            
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            
                            {/* Suggestions / Emojis */}
                            {(showSuggestedReplies || showEmojiPicker) && (
                                <div className="absolute bottom-20 left-4 right-4 bg-gray-800 border border-gray-600 rounded-xl p-2 shadow-2xl flex gap-2 overflow-x-auto z-30">
                                    {showSuggestedReplies && SUGGESTED_REPLIES.map((reply, i) => (
                                        <button key={i} onClick={() => { setReplyText(reply); setShowSuggestedReplies(false); }} className="whitespace-nowrap px-3 py-1.5 bg-gray-700 rounded-full text-xs text-white">{reply}</button>
                                    ))}
                                    {showEmojiPicker && EMOJIS.map(emoji => (
                                        <button key={emoji} onClick={() => setReplyText(prev => prev + emoji)} className="text-2xl hover:bg-white/10 p-2 rounded">{emoji}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <HeadsetIcon className="w-16 h-16 opacity-50 mb-4" />
                        <h3 className="text-xl font-bold text-gray-300">مركز الدعم الفني</h3>
                        <p className="text-sm mt-2">اختر محادثة للبدء</p>
                    </div>
                )}
            </div>

            {/* Context Menu Modal (Long Press) */}
            {contextMenuMessage && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn" onClick={() => setContextMenuMessage(null)}>
                    <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-gray-700 shadow-2xl p-4 animate-sheet-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold">خيارات الرسالة</h3>
                            <button onClick={() => setContextMenuMessage(null)}><XIcon className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        
                        <div className="flex gap-4 justify-center mb-6 bg-black/20 p-3 rounded-xl">
                            {EMOJIS.slice(0, 5).map(emoji => (
                                <button key={emoji} onClick={() => handleReaction(contextMenuMessage, emoji)} className="text-2xl hover:scale-125 transition-transform">{emoji}</button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <button onClick={() => { setReplyToMessage(contextMenuMessage); setContextMenuMessage(null); textareaRef.current?.focus(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-white">
                                <div className="p-2 bg-blue-500/20 rounded-full text-blue-400"><ReplyIcon className="w-4 h-4" /></div>
                                <span className="font-bold">رد على الرسالة</span>
                            </button>
                            
                            {/* Admin Only Actions */}
                            {contextMenuMessage.sender === 'admin' && (
                                <>
                                    <button onClick={() => { setEditingMessage(contextMenuMessage); setReplyText(contextMenuMessage.text); setImage(contextMenuMessage.image || null); setContextMenuMessage(null); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-white">
                                        <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-400"><PencilIcon className="w-4 h-4" /></div>
                                        <span className="font-bold">تعديل</span>
                                    </button>
                                    {!isRestricted && (
                                        <button onClick={() => { setMessageToDelete(contextMenuMessage); setContextMenuMessage(null); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-red-400">
                                            <div className="p-2 bg-red-500/20 rounded-full text-red-500"><TrashIcon className="w-4 h-4" /></div>
                                            <span className="font-bold">حذف</span>
                                        </button>
                                    )}
                                </>
                            )}
                            
                            {!isRestricted && contextMenuMessage.sender !== 'admin' && (
                                 <button onClick={() => { setMessageToDelete(contextMenuMessage); setContextMenuMessage(null); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-red-400">
                                    <div className="p-2 bg-red-500/20 rounded-full text-red-500"><TrashIcon className="w-4 h-4" /></div>
                                    <span className="font-bold">حذف (إداري)</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Other Modals (Settings, Zoom, Confirmations) */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsSettingsOpen(false)}>
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-6 border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6 text-teal-400" />
                            إعدادات الشات والدعم
                        </h3>
                        <div className="space-y-4">
                            {/* Communication Channels */}
                            <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 mb-2">
                                <h4 className="text-xs font-bold text-blue-400 mb-3 uppercase tracking-wider">قنوات التواصل</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-white cursor-pointer">
                                        <span className="text-sm font-bold flex items-center gap-2">
                                            <ChatIcon className="w-4 h-4 text-blue-400" />
                                            المحادثة الفورية (In-App)
                                        </span>
                                        <input 
                                            type="checkbox" 
                                            checked={config.isChatEnabled} 
                                            onChange={e => setConfig({...config, isChatEnabled: e.target.checked})} 
                                            className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                                        />
                                    </label>
                                    
                                    <div className="h-px bg-blue-500/10 w-full"></div>

                                    <label className="flex items-center justify-between text-white cursor-pointer">
                                        <span className="text-sm font-bold flex items-center gap-2">
                                            <WhatsAppIcon className="w-4 h-4 text-green-500" />
                                            تفعيل واتساب
                                        </span>
                                        <input 
                                            type="checkbox" 
                                            checked={config.isWhatsappEnabled} 
                                            onChange={e => setConfig({...config, isWhatsappEnabled: e.target.checked})} 
                                            className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                                        />
                                    </label>
                                    {config.isWhatsappEnabled && (
                                        <div className="mt-1 mr-6">
                                            <input 
                                                type="text" 
                                                value={config.whatsappNumber} 
                                                onChange={e => setConfig({...config, whatsappNumber: e.target.value})} 
                                                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 text-white text-sm outline-none focus:border-green-500 font-mono dir-ltr placeholder-gray-500"
                                                placeholder="201xxxxxxxxx"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <label className="flex items-center justify-between text-white cursor-pointer p-3 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors">
                                <span className="text-sm flex items-center gap-2"><PaperClipIcon className="w-4 h-4 text-blue-400" /> السماح بالصور</span>
                                <input type="checkbox" checked={config.allowImageSending} onChange={e => setConfig({...config, allowImageSending: e.target.checked})} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </label>
                            
                            <div className="p-3 bg-gray-800 rounded-xl">
                                <label className="flex items-center justify-between text-white cursor-pointer mb-2">
                                    <span className="text-sm flex items-center gap-2"><BoltIcon className="w-4 h-4 text-yellow-400" /> الرد التلقائي</span>
                                    <input type="checkbox" checked={config.isAutoReplyEnabled} onChange={e => setConfig({...config, isAutoReplyEnabled: e.target.checked})} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                                </label>
                                {config.isAutoReplyEnabled && <textarea value={config.autoReplyText} onChange={e => setConfig({...config, autoReplyText: e.target.value})} className="w-full bg-[#0f172a] rounded-lg p-2 text-white text-sm border border-gray-600 focus:border-teal-500 outline-none resize-none h-20" />}
                            </div>
                        </div>
                        <button onClick={handleSaveConfig} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl mt-6 transition-colors shadow-lg">حفظ الإعدادات</button>
                    </div>
                </div>
            )}

            {zoomedImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
                    <img src={zoomedImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                    <button className="absolute top-4 right-4 bg-white/10 p-2 rounded-full text-white hover:bg-white/20">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            )}

            {messageToDelete && (
                <ConfirmationModal 
                    title="حذف الرسالة"
                    message="هل أنت متأكد من حذف هذه الرسالة؟"
                    onClose={() => setMessageToDelete(null)}
                    onConfirm={handleDeleteMessage}
                    confirmButtonText="حذف"
                    confirmVariant="danger"
                />
            )}

            {chatToDelete && (
                <ConfirmationModal 
                    title="حذف المحادثة"
                    message="تحذير: سيتم حذف سجل المحادثة بالكامل."
                    onClose={() => setChatToDelete(null)}
                    onConfirm={handleDeleteChat}
                    confirmButtonText="حذف المحادثة"
                    confirmVariant="danger"
                />
            )}
        </div>
    );
};

export default AdminSupportScreen;
