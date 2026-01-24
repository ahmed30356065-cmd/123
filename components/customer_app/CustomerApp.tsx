
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Order, CartItem, Product, OrderStatus, SliderImage, SliderConfig, Message, AppTheme, ProductSize, PromoCode, ChatMessage, SupportConfig, AppConfig } from '../../types';
import LandingScreen from './LandingScreen';
import CustomerHome from './CustomerHome';
import StoreScreen from './StoreScreen';
import CartScreen from './CartScreen';
import CustomerOrders from './CustomerOrders';
import CustomerMessagesScreen from './CustomerMessagesScreen';
import SpecialRequestScreen from './SpecialRequestScreen';
import FavoritesScreen from './FavoritesScreen';
import ComingSoonScreen from './ComingSoonScreen';
import { HomeIcon, ShoppingCartIcon, UserIcon, LogoutIconV2, MessageSquareIcon, MapPinIcon, ChevronLeftIcon, SettingsIcon, CheckCircleIcon, XIcon, TrashIcon, ClipboardListIcon, CameraIcon, ExclamationTriangleIcon, ChevronRightIcon, ShieldCheckIcon, EyeIcon, EyeOffIcon, PhoneIcon, ClockIcon, PencilIcon, HeadsetIcon, WhatsAppIcon, SendIcon, ChatIcon, VerifiedIcon, CrownIcon, StarIcon, RocketIcon, ReplyIcon, BoltIcon } from '../icons';
import { setAndroidRole, NativeBridge } from '../../utils/NativeBridge';
import useAndroidBack from '../../hooks/useAndroidBack';
import ConfirmationModal from '../admin/ConfirmationModal';
import * as firebaseService from '../../services/firebase';

interface CustomerAppProps {
    user: User; merchants: User[]; orders: Order[]; onPlaceOrder: (order: any) => void; onLogout: () => void; onDeleteOrder: (orderId: string) => void; sliderImages?: SliderImage[]; sliderConfig?: SliderConfig; messages: Message[]; markMessageAsSeen: (id: string) => void; hideMessage: (id: string) => void; seenMessageIds: string[]; deletedMessageIds: string[]; onUpdateUser: (userId: string, data: Partial<User>) => void; adminUser?: User; appTheme: AppTheme; onUpdateTheme?: (config: any) => void; promoCodes: PromoCode[]; pointsConfig: { pointsPerCurrency: number; currencyPerPoint: number; isPointsEnabled?: boolean }; initialRoute?: { target: string; id?: string } | null; appConfig?: AppConfig;
}

// ... (Keep existing Emojis and SupportModal code unchanged) ...
// --- Microsoft 3D Emojis ---
const EMOJIS = [
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Grinning%20Face%20with%20Big%20Eyes.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Tears%20of%20Joy.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Heart-Eyes.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Hearts.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Star-Struck.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Thumbs%20Up.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Thinking%20Face.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Winking%20Face.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Waving%20Hand.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20Screaming%20in%20Fear.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pleading%20Face.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Angry%20Face.png",
    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20Blowing%20a%20Kiss.png"
];

const SupportModal: React.FC<{
    onClose: () => void;
    onOpenChat: () => void;
    onOpenWhatsapp: () => void;
    config?: SupportConfig;
}> = ({ onClose, onOpenChat, onOpenWhatsapp, config }) => (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-[#1e293b] w-full max-w-sm rounded-[2rem] border border-gray-700 shadow-2xl p-6 animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <HeadsetIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">مركز المساعدة</h3>
                <p className="text-gray-400 text-sm mt-1">كيف تفضل التواصل معنا؟</p>
            </div>

            <div className="space-y-3">
                {config?.isChatEnabled !== false && (
                    <button onClick={() => { onClose(); onOpenChat(); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700">
                        <div className="p-2 bg-blue-500/20 rounded-full text-blue-400"><ChatIcon className="w-6 h-6" /></div>
                        <div className="text-right">
                            <p className="font-bold text-white">محادثة فورية</p>
                            <p className="text-xs text-gray-400">تحدث مع خدمة العملاء مباشرة</p>
                        </div>
                    </button>
                )}

                {config?.isWhatsappEnabled !== false && (
                    <button onClick={() => { onClose(); onOpenWhatsapp(); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-900/20 hover:bg-green-900/30 transition-colors border border-green-500/20">
                        <div className="p-2 bg-green-500/20 rounded-full text-green-400"><WhatsAppIcon className="w-6 h-6" /></div>
                        <div className="text-right">
                            <p className="font-bold text-white">واتساب</p>
                            <p className="text-xs text-gray-400">تواصل معنا عبر واتساب</p>
                        </div>
                    </button>
                )}

                {config?.isChatEnabled === false && config?.isWhatsappEnabled === false && (
                    <div className="text-center text-gray-500 py-4 bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                        <p className="text-sm">لا توجد قنوات تواصل متاحة حالياً.</p>
                    </div>
                )}
            </div>
            <button onClick={onClose} className="mt-6 w-full py-3 text-gray-400 font-bold hover:text-white transition-colors">إلغاء</button>
        </div>
    </div>
);

const CustomerChatScreen: React.FC<{ user: User; onClose: () => void; config?: SupportConfig }> = ({ user, onClose, config }) => {
    // ... (Keep existing CustomerChatScreen logic exactly as is)
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [contextMenuMessage, setContextMenuMessage] = useState<ChatMessage | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useAndroidBack(() => {
        if (zoomedImage) { setZoomedImage(null); return true; }
        if (contextMenuMessage) { setContextMenuMessage(null); return true; }
        if (replyToMessage) { setReplyToMessage(null); return true; }
        if (showEmojiPicker) { setShowEmojiPicker(false); return true; }
        onClose(); return true;
    }, [zoomedImage, contextMenuMessage, replyToMessage, showEmojiPicker]);

    useEffect(() => {
        const unsub = firebaseService.subscribeToCollection('support_chats', (data) => {
            const myChat = data.find(c => c.id === user.id);
            if (myChat) {
                if (myChat.messages) {
                    setMessages(myChat.messages);
                }
            } else if (messages.length > 0) {
                setMessages([]);
                alert("تم إغلاق المحادثة من قبل الإدارة.");
                onClose();
            }
        });

        firebaseService.updateData('support_chats', user.id, { lastUpdated: new Date() });
        const interval = setInterval(() => {
            firebaseService.updateData('support_chats', user.id, { lastUpdated: new Date() });
        }, 60000);

        return () => { unsub(); clearInterval(interval); };
    }, [user.id]);

    useEffect(() => {
        // Mark admin messages as read when user opens screen
        const unreadAdminMsgs = messages.filter(m => m.sender === 'admin' && !m.isRead);
        if (unreadAdminMsgs.length > 0) {
            const updated = messages.map(m => m.sender === 'admin' ? { ...m, isRead: true } : m);
            // We update local state immediately for UI, and send update to server
            // setMessages(updated); // Let subscription handle state update to avoid conflicts
            firebaseService.updateData('support_chats', user.id, { messages: updated });
        }

        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length]); // Check length or dependency to trigger scroll/read mark

    const handleSend = async () => {
        if (!inputText.trim() && !image) return;

        let finalInput = inputText;
        if (replyToMessage) {
            const quotedText = replyToMessage.text.substring(0, 50) + (replyToMessage.text.length > 50 ? '...' : '');
            finalInput = `[رد على: ${quotedText}]\n${inputText}`;
        }

        const maxMsgId = messages.reduce((max, msg) => {
            const num = parseInt(msg.id);
            return !isNaN(num) ? Math.max(max, num) : max;
        }, 0);
        const newMessageId = String(maxMsgId + 1);

        const newMessage: ChatMessage = {
            id: newMessageId,
            text: finalInput,
            image: image || undefined,
            sender: 'user',
            createdAt: new Date(),
            isRead: false
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInputText('');
        setImage(null);
        setReplyToMessage(null);
        setShowEmojiPicker(false);

        await firebaseService.updateData('support_chats', user.id, {
            id: user.id,
            userId: user.id,
            userName: user.name,
            userPhone: user.phone,
            lastMessage: image ? '📷 صورة' : newMessage.text,
            lastUpdated: new Date(),
            unreadCount: 1,
            messages: updatedMessages
        });

        firebaseService.sendExternalNotification('admin', {
            title: "رسالة دعم جديدة",
            body: `${user.name}: ${image ? 'أرسل صورة' : finalInput}`,
            url: "/?target=support"
        });
    };

    // ... (rest of CustomerChatScreen code - handleImageUpload, etc. - keep existing)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scaleSize = 600 / img.width;
                    canvas.width = 600;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setImage(canvas.toDataURL('image/jpeg', 0.7));
                }
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleLongPress = (msg: ChatMessage) => { setContextMenuMessage(msg); };
    const onTouchStart = (msg: ChatMessage) => { longPressTimer.current = setTimeout(() => handleLongPress(msg), 500); };
    const onTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
    const handleReaction = async (emojiUrl: string) => {
        if (!contextMenuMessage) return;
        const currentReactions = contextMenuMessage.reactions || [];
        const newReactions = currentReactions.includes(emojiUrl) ? currentReactions.filter(r => r !== emojiUrl) : [...currentReactions, emojiUrl];
        const updatedMessages = messages.map(msg => msg.id === contextMenuMessage.id ? { ...msg, reactions: newReactions } : msg);
        setMessages(updatedMessages);
        setContextMenuMessage(null);
        await firebaseService.updateData('support_chats', user.id, { messages: updatedMessages });
    };
    const scrollToMessage = (textFragment: string) => {
        const elements = document.querySelectorAll('.message-text');
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].textContent?.includes(textFragment)) {
                elements[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
                elements[i].parentElement?.classList.add('ring-2', 'ring-teal-400');
                setTimeout(() => elements[i].parentElement?.classList.remove('ring-2', 'ring-teal-400'), 1500);
                break;
            }
        }
    };
    const renderMessageText = (text: string) => {
        const replyMatch = text.match(/^\[رد على: (.*?)\]\n(.*)/s);
        if (replyMatch) {
            const quotedText = replyMatch[1];
            const mainText = replyMatch[2];
            return (<> <div onClick={(e) => { e.stopPropagation(); scrollToMessage(quotedText); }} className="mb-1 pb-1 border-b border-white/10 cursor-pointer active:opacity-70" > <p className="text-[10px] text-white/50 line-clamp-1 italic flex items-center gap-1"> <ReplyIcon className="w-3 h-3" /> {quotedText} </p> </div> <span className="message-text">{mainText}</span> </>);
        }
        return <span className="message-text">{text}</span>;
    };
    const handleEmojiError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.style.display = 'none'; };
    const isSticker = (url: string) => url.startsWith('http');

    return (
        <div className="fixed inset-0 z-[90] bg-[#0b141a] flex flex-col animate-slide-up select-none touch-callout-none font-sans" onContextMenu={(e) => e.preventDefault()}>
            <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}></div>
            <style>{`.touch-callout-none { -webkit-touch-callout: none; } .select-none { -webkit-user-select: none; user-select: none; }`}</style>

            <div className="flex-none bg-[#202c33] border-b border-[#2f3b43] z-20 pt-safe shadow-sm">
                <div className="flex items-center gap-2 px-2 py-2 h-14">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-[#aebac1] transition-colors flex items-center justify-center"><ChevronRightIcon className="w-6 h-6 rotate-180" /></button>
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        <div className="relative flex-shrink-0"><div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white"><HeadsetIcon className="w-6 h-6" /></div></div>
                        <div className="flex flex-col justify-center flex-1"><h3 className="font-bold text-[#e9edef] text-base leading-tight truncate">الدعم الفني</h3><p className="text-xs text-[#8696a0] truncate">فريق خدمة العملاء</p></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 relative z-10 custom-scrollbar" ref={scrollRef}>
                {messages.length === 0 && <div className="text-center text-[#8696a0] py-4 bg-[#202c33]/80 rounded-lg mx-4 mt-4 shadow-sm text-xs border border-[#2f3b43]"><p className="text-[#ffd279] mb-1 font-bold">🔒 الرسائل مشفرة</p><p>مرحباً بك! كيف يمكننا مساعدتك اليوم؟</p></div>}
                {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    const isStickerImage = msg.image && isSticker(msg.image);

                    return (
                        <div key={msg.id} className={`flex w-full relative z-10 ${isUser ? 'justify-end' : 'justify-start'} mb-1`} > <div onTouchStart={() => onTouchStart(msg)} onTouchEnd={onTouchEnd} onMouseDown={() => onTouchStart(msg)} onMouseUp={onTouchEnd} className={`relative max-w-[80%] rounded-lg p-2 px-3 shadow-sm text-sm ${isStickerImage ? 'bg-transparent shadow-none' : (isUser ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none')}`} > {msg.image && (<div className={`mb-1.5 rounded-lg overflow-hidden relative group`}> <img src={msg.image} alt="attached" className={isStickerImage ? "w-28 h-28 object-contain cursor-pointer drop-shadow-lg" : "w-full h-auto object-cover max-h-64 pointer-events-auto cursor-pointer"} onClick={(e) => { e.stopPropagation(); setZoomedImage(msg.image!); }} /> </div>)} {msg.text && <div className="leading-relaxed whitespace-pre-wrap dir-rtl pt-0.5">{renderMessageText(msg.text)}</div>} <div className={`flex items-end justify-between gap-4 mt-1 -mb-1 ml-[-4px] ${isStickerImage ? 'text-gray-300' : 'text-[#8696a0]'}`}> <button onClick={(e) => { e.stopPropagation(); setReplyToMessage(msg); }} className="opacity-50 hover:opacity-100 transition-opacity p-0.5" > <ReplyIcon className="w-3.5 h-3.5" /> </button> <div className="flex items-center gap-1"> <span className="text-[10px] min-w-fit">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> {isUser && <div className="flex -space-x-1 space-x-reverse"><CheckCircleIcon className={`w-3.5 h-3.5 ${msg.isRead ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} /></div>} </div> </div> {msg.reactions && msg.reactions.length > 0 && (<div className={`absolute -bottom-2.5 ${isUser ? 'left-0' : 'right-0'} flex items-center -space-x-1 space-x-reverse`}> {msg.reactions.map((reaction, i) => (<div key={i} className="w-5 h-5 rounded-full bg-[#202c33] border border-[#0b141a] shadow-sm flex items-center justify-center p-0.5 scale-110"><img src={reaction} className="w-full h-full object-contain" /></div>))} </div>)} </div> </div>
                    );
                })}
            </div>

            {zoomedImage && <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={() => setZoomedImage(null)}><img src={zoomedImage} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-pop-in" onClick={(e) => e.stopPropagation()} /><button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-colors"><XIcon className="w-6 h-6" /></button></div>}

            {contextMenuMessage && (<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn" onClick={() => setContextMenuMessage(null)}> <div className="bg-[#202c33] w-full max-w-sm rounded-2xl border border-[#2f3b43] shadow-2xl p-6 animate-sheet-up" onClick={e => e.stopPropagation()}> <div className="mb-4"> <p className="text-xs font-bold text-[#8696a0] mb-3 text-center">تفاعل مع الرسالة</p> <div className="flex justify-between gap-2 bg-[#111b21] p-3 rounded-xl border border-[#2f3b43]"> {EMOJIS.slice(0, 5).map((url, i) => (<button key={i} onClick={() => handleReaction(url)} className="hover:scale-125 transition-transform p-1"><img src={url} className="w-8 h-8 object-contain drop-shadow-md" /></button>))} </div> </div> <button onClick={() => { setReplyToMessage(contextMenuMessage); setContextMenuMessage(null); }} className="w-full flex items-center gap-3 p-4 bg-[#111b21] hover:bg-[#2a3942] rounded-xl transition-colors border border-[#2f3b43]"> <ReplyIcon className="w-5 h-5 text-blue-400" /> <span className="font-bold text-sm text-[#e9edef]">رد على الرسالة</span> </button> </div> </div>)}

            <div className="bg-[#202c33] py-2 px-2 z-20 pb-safe relative border-t border-[#2f3b43]">
                {replyToMessage && (<div className="flex justify-between items-center bg-[#1e2a30] p-2 border-r-4 border-teal-500 mb-2 rounded-lg mx-1"> <div className="flex flex-col flex-1 overflow-hidden pr-2"> <span className="text-teal-500 text-xs font-bold mb-0.5">رد على رسالة</span> <p className="text-[#aebac1] text-xs truncate">{replyToMessage.image ? (isSticker(replyToMessage.image) ? 'ملصق' : '📷 صورة') : replyToMessage.text}</p> </div> <button onClick={() => setReplyToMessage(null)} className="p-1 text-[#8696a0] hover:text-white"><XIcon className="w-4 h-4" /></button> </div>)}

                <div className="flex items-end gap-2 px-1">
                    <div className="flex-1 bg-[#2a3942] rounded-3xl flex items-center px-3 py-1.5 min-h-[45px] border border-transparent focus-within:border-[#00a884] transition-colors">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-[#8696a0] hover:text-[#e9edef] transition-colors p-1"><span className="text-xl grayscale opacity-70 hover:opacity-100 transition-all">😊</span></button>
                        <textarea ref={textareaRef} value={inputText} onChange={e => setInputText(e.target.value)} placeholder="رسالة" rows={1} className="flex-1 bg-transparent text-[#e9edef] text-base outline-none resize-none max-h-24 py-1.5 px-2 placeholder-[#8696a0] leading-relaxed" style={{ minHeight: '24px' }} />
                        {config?.allowImageSending !== false && <button onClick={() => fileInputRef.current?.click()} className="text-[#8696a0] hover:text-[#e9edef] p-1.5 -rotate-45 transform"><BoltIcon className="w-6 h-6" /></button>}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>
                    {((inputText.trim() || image)) && (
                        <button onClick={() => { if (inputText.trim() || image) handleSend(); }} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all z-20 bg-[#00a884] hover:bg-[#008f6f] text-white`}> <SendIcon className="w-5 h-5 ml-0.5" /> </button>
                    )}
                </div>
                {image && <div className="absolute bottom-20 right-4 bg-[#202c33] p-2 rounded-xl border border-[#2f3b43] shadow-xl animate-pop-in"><div className="relative"><img src={image} className="h-20 w-20 rounded-lg object-cover" /><button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-[#2a3942] text-[#e9edef] p-1 rounded-full border border-[#8696a0]"><XIcon className="w-3 h-3" /></button></div></div>}
                {showEmojiPicker && (<div className="mt-2 bg-[#202c33] border border-[#2f3b43] rounded-t-2xl p-3 shadow-2xl grid grid-cols-6 gap-2 h-60 overflow-y-auto custom-scrollbar"> {EMOJIS.map((url, i) => (<button key={i} onClick={() => { const maxMsgId = messages.reduce((max, msg) => { const num = parseInt(msg.id); return !isNaN(num) ? Math.max(max, num) : max; }, 0); const newMessageId = String(maxMsgId + 1); const newMessage: ChatMessage = { id: newMessageId, text: '', image: url, sender: 'user', createdAt: new Date(), isRead: false }; const updated = [...messages, newMessage]; setMessages(updated); setShowEmojiPicker(false); firebaseService.updateData('support_chats', user.id, { messages: updated, lastMessage: 'هناك رسالة جديدة', lastUpdated: new Date(), unreadCount: 1 }); firebaseService.sendExternalNotification('admin', { title: "رسالة دعم جديدة", body: `${user.name} أرسل ملصق`, url: "/?target=support" }); }} className="hover:bg-white/5 p-1.5 rounded-xl transition-colors"><img src={url} className="w-8 h-8 object-contain" onError={handleEmojiError} /></button>))} </div>)}
            </div>
        </div>
    );
};

// ... existing code for CustomerApp ...

// ... (Retaining ProfileMenuItem, InfoModal, AddressesManagementModal, ChangePasswordModal, EditProfileModal, ProfileStatusModal components exactly as they are)
const ProfileMenuItem: React.FC<{ icon: React.ReactNode, label: string, subLabel?: string, onClick?: () => void, danger?: boolean, hasArrow?: boolean }> = ({ icon, label, subLabel, onClick, danger, hasArrow = true }) => (<button onClick={onClick} className={`w-full flex items-center justify-between p-3 transition-all active:bg-black/5 group ${danger ? 'text-red-500' : 'text-white'}`}> <div className="flex items-center gap-4"> <div className={`p-2 rounded-xl ${danger ? 'bg-red-500/10' : 'bg-gray-800 text-gray-400 group-hover:text-white transition-colors'}`}> {icon} </div> <div className="text-right"> <p className={`font-bold text-sm ${danger ? 'text-red-500' : 'text-gray-200'}`}>{label}</p> {subLabel && <p className="text-[10px] text-gray-500 mt-0.5">{subLabel}</p>} </div> </div> {!danger && hasArrow && <ChevronLeftIcon className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:-translate-x-1 transition-all" />} </button>);
const InfoModal: React.FC<{ title: string; content: string; onClose: () => void }> = ({ title, content, onClose }) => (<div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}> <div className="bg-[#1e293b] w-full max-w-md rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-pop-in flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}> <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]"> <h3 className="text-lg font-bold text-white">{title}</h3> <button onClick={onClose} className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"><XIcon className="w-5 h-5" /></button> </div> <div className="p-6 overflow-y-auto text-gray-300 text-sm leading-relaxed whitespace-pre-wrap"> {content} </div> </div> </div>);
const AddressesManagementModal: React.FC<{ user: User; onClose: () => void; onUpdate: (addresses: string[]) => void }> = ({ user, onClose, onUpdate }) => { const initialAddress = (user.addresses && user.addresses.length > 0) ? user.addresses[0] : (user.address || ''); const [address, setAddress] = useState(initialAddress); const [isEditing, setIsEditing] = useState(false); const [editValue, setEditValue] = useState(''); const handleSaveEdit = () => { if (!editValue.trim()) return; setAddress(editValue); onUpdate([editValue]); setIsEditing(false); }; return (<div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}> <div className="bg-[#1e293b] w-full max-w-md rounded-[2rem] border border-gray-700 shadow-2xl overflow-hidden animate-pop-in flex flex-col" onClick={e => e.stopPropagation()}> <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]"> <h3 className="text-lg font-bold text-white flex items-center gap-2"><MapPinIcon className="w-5 h-5 text-red-500" />عنوان التوصيل</h3> <button onClick={onClose} className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"><XIcon className="w-5 h-5" /></button> </div> <div className="p-6"> <p className="text-xs text-gray-400 mb-3 font-medium">العنوان المسجل (يستخدم لتوصيل الطلبات)</p> <div className="bg-[#0f172a] rounded-xl p-4 border border-gray-700 group transition-all hover:border-gray-600 shadow-inner"> {isEditing ? (<div className="space-y-3 animate-fade-slide-up"> <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-[#1e293b] border border-gray-600 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none resize-none h-28 leading-relaxed" placeholder="تفاصيل العنوان..." autoFocus /> <div className="flex gap-2"> <button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-lg">حفظ التغييرات</button> <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-700 text-gray-300 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-600 transition-colors">إلغاء</button> </div> </div>) : (<div className="flex justify-between items-start gap-3"> <div className="flex-1"> {address ? <p className="text-sm text-gray-200 leading-relaxed font-medium">{address}</p> : <p className="text-sm text-red-400 italic font-medium flex items-center gap-2"><ExclamationTriangleIcon className="w-4 h-4" />لا يوجد عنوان مسجل</p>} </div> <button onClick={() => { setIsEditing(true); setEditValue(address); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex-shrink-0" title="تعديل العنوان"><PencilIcon className="w-4 h-4" /></button> </div>)} </div> </div> </div> </div>); };
const ChangePasswordModal: React.FC<{ onClose: () => void; onSave: (password: string) => void }> = ({ onClose, onSave }) => { const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [show, setShow] = useState(false); const [error, setError] = useState(''); const handleSubmit = () => { if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; } if (password !== confirm) { setError('كلمات المرور غير متطابقة'); return; } onSave(password); onClose(); }; return (<div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}> <div className="bg-[#1e293b] w-full max-w-sm rounded-3xl border border-gray-700 shadow-2xl p-6 animate-pop-in" onClick={e => e.stopPropagation()}> <h3 className="text-lg font-bold text-white mb-4">تغيير كلمة المرور</h3> <div className="space-y-3"> <div className="relative"> <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500" /> <button onClick={() => setShow(!show)} className="absolute left-3 top-3.5 text-gray-500">{show ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button> </div> <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="تأكيد كلمة المرور" className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500" /> {error && <p className="text-red-400 text-xs font-bold">{error}</p>} <button onClick={handleSubmit} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">حفظ</button> </div> </div> </div>); };
const EditProfileModal: React.FC<{ user: User; onClose: () => void; onSave: (name: string, phone: string, image?: string) => void }> = ({ user, onClose, onSave }) => { const [name, setName] = useState(user.name); const [phone, setPhone] = useState(user.phone || ''); const [image, setImage] = useState<string | null>(user.storeImage || null); const fileInputRef = useRef<HTMLInputElement>(null); const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const img = new Image(); img.src = reader.result as string; img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 1024; const scaleSize = MAX_WIDTH / img.width; canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize; const ctx = canvas.getContext('2d'); if (ctx) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); setImage(canvas.toDataURL('image/jpeg', 0.9)); } }; }; reader.readAsDataURL(file); } }; return (<div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}> <div className="bg-[#1e293b] w-full max-w-sm rounded-[2rem] border border-gray-700 shadow-2xl overflow-hidden animate-pop-in" onClick={e => e.stopPropagation()}> <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]"> <h3 className="text-lg font-bold text-white flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-blue-500" />تعديل البيانات</h3> <button onClick={onClose} className="p-1.5 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"><XIcon className="w-5 h-5" /></button> </div> <div className="p-6 space-y-5"> <div className="flex flex-col items-center mb-2"> <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}> <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#0f172a] shadow-lg relative bg-gray-800 flex items-center justify-center"> {image ? (<img src={image} alt="Profile" className="w-full h-full object-cover" />) : (<UserIcon className="w-10 h-10 text-gray-500" />)} <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"> <CameraIcon className="w-8 h-8 text-white" /> </div> </div> <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 border-2 border-[#1e293b] shadow-md"> <CameraIcon className="w-4 h-4 text-white" /> </div> </div> <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /> <p className="text-xs text-gray-500 mt-2">اضغط لتغيير الصورة</p> </div> <div> <label className="block text-xs font-bold text-gray-400 mb-2">الاسم الكامل</label> <div className="relative"> <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pl-10" /> <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" /> </div> </div> <div> <label className="block text-xs font-bold text-gray-400 mb-2">رقم الهاتف</label> <div className="relative"> <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pl-10 text-right placeholder:text-right font-mono" dir="rtl" /> <PhoneIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" /> </div> <p className="text-[10px] text-yellow-500/80 mt-2 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">تنبيه: تغيير رقم الهاتف يتطلب مراجعة من الإدارة قبل تفعيله.</p> </div> <button onClick={() => onSave(name, phone, image || undefined)} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all mt-2">حفظ التغييرات</button> </div> </div> </div>); };
const ProfileStatusModal: React.FC<{ type: 'success' | 'pending'; onClose: () => void }> = ({ type, onClose }) => { return (<div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}> <div className="bg-[#1e293b] w-full max-w-sm rounded-[2rem] border border-gray-700 shadow-2xl p-8 text-center animate-pop-in" onClick={e => e.stopPropagation()}> <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${type === 'success' ? 'bg-green-500/20 text-green-500 ring-4 ring-green-500/10' : 'bg-yellow-500/20 text-yellow-500 ring-4 ring-yellow-500/10'}`}> {type === 'success' ? <CheckCircleIcon className="w-10 h-10 animate-pulse" /> : <ClockIcon className="w-10 h-10 animate-pulse" />} </div> <h3 className="text-xl font-black text-white mb-2">{type === 'success' ? 'تم التحديث بنجاح' : 'الطلب قيد المراجعة'}</h3> <p className="text-gray-400 text-sm leading-relaxed mb-8">{type === 'success' ? 'تم تحديث اسمك في الملف الشخصي بنجاح.' : 'تم إرسال طلب تغيير رقم الهاتف إلى الإدارة للمراجعة. سيتم التواصل معك قريباً لتأكيد التغيير.'}</p> <button onClick={onClose} className={`w-full font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-white ${type === 'success' ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}>حسناً، فهمت</button> </div> </div>); };

type CustomerView = 'landing' | 'store-list' | 'store' | 'cart' | 'orders' | 'messages' | 'special-request' | 'favorites' | 'coming-soon' | 'profile';

const CustomerApp: React.FC<any> = ({ user, merchants, orders, onPlaceOrder, onLogout, onDeleteOrder, sliderImages, sliderConfig, messages, markMessageAsSeen, hideMessage, seenMessageIds, deletedMessageIds, onUpdateUser, adminUser, appTheme, onUpdateTheme, promoCodes, pointsConfig, initialRoute, appConfig }) => {
    const [view, setView] = useState<CustomerView>('landing');
    const [selectedMerchant, setSelectedMerchant] = useState<User | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('favoriteProductIds') || '[]'); } catch { return []; } });

    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isAddressesOpen, setIsAddressesOpen] = useState(false);
    const [comingSoonData, setComingSoonData] = useState<{ title: string, desc: string }>({ title: '', desc: '' });
    const [infoModalData, setInfoModalData] = useState<{ title: string, content: string } | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [profileStatusModal, setProfileStatusModal] = useState<'success' | 'pending' | null>(null);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [supportConfig, setSupportConfig] = useState<SupportConfig | undefined>(undefined);
    const [initialCategory, setInitialCategory] = useState<string | undefined>(undefined);
    const [unreadSupportMessages, setUnreadSupportMessages] = useState<ChatMessage[]>([]);

    const appVersion = appConfig?.appVersion || 'VERSION 1.0.5';
    const appName = appConfig?.appName || 'GOO NOW';

    // Listen to support chat updates to count unread messages from admin
    useEffect(() => {
        const unsub = firebaseService.subscribeToCollection('support_chats', (data) => {
            const myChat = data.find(c => c.id === user.id);
            if (myChat && myChat.messages) {
                const unread = myChat.messages.filter((m: ChatMessage) => m.sender === 'admin' && !m.isRead);
                setUnreadSupportMessages(unread);
            }
        });

        // Also get settings for config
        const unsubSettings = firebaseService.subscribeToCollection('settings', (data) => {
            const config = data.find(d => d.id === 'support_config');
            if (config) {
                setSupportConfig(config as any);
            }
        });
        return () => { unsub(); unsubSettings(); };
    }, [user.id]);

    useEffect(() => {
        NativeBridge.reportContext(view);
    }, [view]);

    const themeColors = { bg: 'bg-[#1A1A1A]', text: 'text-white', subText: 'text-gray-400', card: 'bg-[#252525]', border: 'border-white/5', navBg: 'bg-[#1A1A1A]/90', navBorder: 'border-white/10' };

    useEffect(() => { setAndroidRole('user', user.id); }, [user.id]);

    useAndroidBack(() => {
        if (isChatOpen) { setIsChatOpen(false); return true; }
        if (isSupportModalOpen) { setIsSupportModalOpen(false); return true; }
        if (profileStatusModal) { setProfileStatusModal(null); return true; }
        if (showLogoutConfirm) { setShowLogoutConfirm(false); return true; }
        if (isChangePasswordOpen) { setIsChangePasswordOpen(false); return true; }
        if (infoModalData) { setInfoModalData(null); return true; }
        if (isEditProfileOpen) { setIsEditProfileOpen(false); return true; }
        if (isAddressesOpen) { setIsAddressesOpen(false); return true; }

        if (view === 'store') { setSelectedMerchant(null); setView('store-list'); return true; }
        if (view === 'cart' || view === 'favorites' || view === 'messages') { setView('landing'); return true; }
        if (view === 'special-request' || view === 'coming-soon' || view === 'store-list') { setView('landing'); return true; }
        if (view === 'profile') { setView('landing'); return true; }

        if (view === 'landing') {
            return false;
        }

        setView('landing');
        return true;
    }, [view, isEditProfileOpen, isAddressesOpen, infoModalData, showLogoutConfirm, isChangePasswordOpen, profileStatusModal, isChatOpen, isSupportModalOpen]);

    // ... (Existing helper functions: myOrders, handleSelectMerchant, addToCartSafe, etc.)
    const myOrders = useMemo(() => {
        if (!user.phone) return [];
        const normalizedUserPhone = user.phone.trim();
        return orders.filter(order => {
            const customerPhone = order.customer?.phone?.trim();
            return customerPhone === normalizedUserPhone;
        });
    }, [orders, user.phone]);

    const handleSelectMerchant = (merchant: User, category?: string) => {
        setSelectedMerchant(merchant);
        if (category) setInitialCategory(category);
        setView('store');
    };

    const addToCartSafe = (product: Product, selectedSize?: ProductSize) => { const uniqueId = selectedSize ? `${product.id}-${selectedSize.name}` : product.id; setCart(prev => { const existing = prev.find(item => item.id === uniqueId); if (existing) return prev.map(item => item.id === uniqueId ? { ...item, quantity: item.quantity + 1 } : item); return [...prev, { ...product, id: uniqueId, quantity: 1, merchantId: selectedMerchant?.id, selectedSize }]; }); };
    const toggleFavorite = (productId: string) => { setFavoriteIds(prev => { const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]; localStorage.setItem('favoriteProductIds', JSON.stringify(next)); return next; }); };
    const handlePlaceOrder = (notes: string, address: string, phone: string, discountData?: any) => {
        const isSpecialRequest = cart.length === 0;
        const newOrder: any = { id: Date.now().toString(), customer: { phone: phone || user.phone || '', address: address, name: user.name }, merchantId: isSpecialRequest ? 'delinow' : (cart[0].merchantId || ''), merchantName: isSpecialRequest ? 'طلب خاص' : (merchants.find(m => m.id === cart[0].merchantId)?.name || 'متجر'), status: isSpecialRequest ? OrderStatus.Pending : OrderStatus.WaitingMerchant, createdAt: new Date(), notes: notes, type: 'shopping_order' };
        if (!isSpecialRequest) { newOrder.items = [...cart]; newOrder.totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); if (discountData) Object.assign(newOrder, discountData); }
        onPlaceOrder(newOrder); setCart([]); setView('orders');
    };
    const handleNavigation = (target: string, params?: any) => {
        if (target === 'ride') { setComingSoonData({ title: 'خدمة وصلني', desc: 'نعمل حالياً على توفير أسطول من السيارات لتوصيلك لأي مكان بسرعة وأمان.' }); setView('coming-soon'); }
        else if (target === 'transport') { setComingSoonData({ title: 'خدمات النقل', desc: 'خدمة نقل البضائع والشحن ستكون متاحة قريباً لخدمتك.' }); setView('coming-soon'); }
        else { setView(target as CustomerView); }
    };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const result = canvas.toDataURL('image/jpeg', 0.9);
                        onUpdateUser(user.id, { storeImage: result });
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileUpdate = (name: string, phone: string, image?: string) => {
        if (phone !== user.phone) {
            firebaseService.sendExternalNotification('admin', { title: "طلب تغيير رقم هاتف", body: `المستخدم ${user.name} يريد تغيير الرقم من ${user.phone} إلى ${phone}`, url: '/?target=users' });
            firebaseService.sendExternalNotification('supervisor', { title: "طلب تغيير رقم هاتف", body: `المستخدم ${user.name} يريد تغيير الرقم من ${user.phone} إلى ${phone}`, url: '/?target=users' });
            setProfileStatusModal('pending');
        } else {
            if (name !== user.name || (image && image !== user.storeImage)) {
                const updates: Partial<User> = { name };
                if (image) updates.storeImage = image;
                onUpdateUser(user.id, updates);
                setProfileStatusModal('success');
            }
        }
        setIsEditProfileOpen(false);
    };
    const openWhatsapp = () => { const number = supportConfig?.whatsappNumber || '201000000000'; window.open(`https://wa.me/${number}`, '_blank'); };

    const renderBottomNav = () => (
        <nav
            className={`fixed left-4 right-4 ${themeColors.navBg} backdrop-blur-xl border ${themeColors.navBorder} rounded-[2rem] flex justify-between items-center h-[60px] z-50 shadow-2xl px-4`}
            style={{ bottom: 'calc(3rem + env(safe-area-inset-bottom))' }}
        >
            {[
                { id: 'landing', icon: HomeIcon, label: 'الرئيسية' },
                { id: 'orders', icon: ClipboardListIcon, label: 'طلباتي' },
                { id: 'cart', icon: ShoppingCartIcon, label: 'السلة', badge: cart.length },
                { id: 'profile', icon: UserIcon, label: 'حسابي' }
            ].map(item => (
                <button key={item.id} onClick={() => setView(item.id as any)} className={`relative flex flex-col items-center transition-all ${view === item.id ? 'text-red-500 -translate-y-2' : 'text-gray-400'}`}>
                    <div className={`p-2 rounded-full ${view === item.id ? 'bg-[#1A1A1A] ring-4 ring-[#252525]' : ''}`}><item.icon className="w-5 h-5" /></div>
                    {item.badge ? <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center">{item.badge}</span> : null}
                </button>
            ))}
        </nav>
    );

    const getFrameContainerClass = (type?: string) => {
        if (type?.startsWith('data:') || type?.startsWith('http')) return 'p-0';
        switch (type) {
            case 'gold': return 'p-[4px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_15px_rgba(252,246,186,0.5)]';
            case 'neon': return 'p-[4px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]';
            case 'royal': return 'p-[4px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-xl border border-purple-500/30';
            case 'fire': return 'p-[4px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]';
            default: return 'p-0';
        }
    };

    const getBadgeIcon = (type?: string) => {
        if (!type || type === 'none') return null;

        if (type?.startsWith('data:') || type?.startsWith('http')) {
            // Professional Container for Custom Images
            return (
                <div className="w-8 h-8 min-w-[2rem] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-sm overflow-hidden p-0.5 ml-2 backdrop-blur-sm">
                    <img src={type} className="w-full h-full object-contain drop-shadow-sm" alt="badge" />
                </div>
            );
        }

        let IconComponent = null;
        let styleClass = '';
        switch (type) {
            case 'verified': IconComponent = VerifiedIcon; styleClass = "text-blue-400 fill-blue-500/20"; break;
            case 'vip': IconComponent = CrownIcon; styleClass = "text-yellow-400 fill-yellow-500/20"; break;
            case 'star': IconComponent = StarIcon; styleClass = "text-purple-400 fill-purple-500/20"; break;
            case 'popular': IconComponent = RocketIcon; styleClass = "text-red-400 fill-red-500/20"; break;
        }

        if (IconComponent) return <IconComponent className={`w-4 h-4 ml-1 ${styleClass}`} />;
        return null;
    };

    const isCustomFrame = (frame?: string) => frame?.startsWith('data:') || frame?.startsWith('http');

    const unseenMessagesCount = useMemo(() =>
        messages.filter(m =>
            !deletedMessageIds.includes(m.id) &&
            !seenMessageIds.includes(m.id) &&
            (m.targetId === 'all' || m.targetId === user.id)
        ).length,
        [messages, seenMessageIds, deletedMessageIds, user.id]);

    return (
        <div className={`fixed inset-0 h-[100dvh] ${themeColors.bg} ${themeColors.text} flex flex-col transition-colors duration-300`} dir="rtl">
            <div className="flex-1 relative flex flex-col overflow-hidden bg-[#1A1A1A]">
                <div key={view} className="flex-1 flex flex-col h-full animate-page-enter">
                    {view === 'landing' && (
                        <LandingScreen
                            user={user}
                            onNavigate={handleNavigation}
                            sliderImages={sliderImages}
                            sliderConfig={sliderConfig}
                            adminUser={adminUser}
                            merchants={merchants}
                            messageCount={unseenMessagesCount}
                            onOpenMessages={() => setView('messages')}
                            onOpenSupport={() => setIsChatOpen(true)}
                            unreadSupportCount={unreadSupportMessages.length}
                        />
                    )}
                    {view === 'store-list' && (
                        <CustomerHome
                            user={user}
                            merchants={merchants}
                            onSelectMerchant={handleSelectMerchant}
                            sliderImages={sliderImages}
                            sliderConfig={sliderConfig}
                            onSpecialRequest={() => setView('special-request')}
                            onOpenFavorites={() => setView('favorites')}
                            adminUser={adminUser}
                            theme={appTheme}
                            messageCount={unseenMessagesCount}
                            onOpenMessages={() => setView('messages')}
                            onOpenSupport={() => setIsChatOpen(true)}
                            unreadSupportCount={unreadSupportMessages.length}
                        />
                    )}
                    {view === 'store' && selectedMerchant && <StoreScreen merchant={selectedMerchant} onBack={() => setView('store-list')} addToCart={addToCartSafe} cart={cart} onViewCart={() => setView('cart')} toggleFavorite={toggleFavorite} favoriteIds={favoriteIds} appTheme={appTheme} initialCategory={initialCategory} />}
                    {view === 'cart' && <CartScreen cart={cart} onBack={() => setView('landing')} onGoToStores={() => setView('store-list')} onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i))} onRemoveItem={(id) => setCart(prev => prev.filter(i => i.id !== id))} onPlaceOrder={handlePlaceOrder} userPhone={user.phone || ''} savedAddresses={user.addresses} appTheme={appTheme} promoCodes={promoCodes} userPoints={user.pointsBalance || 0} pointsConfig={pointsConfig} />}

                    {view === 'profile' && (
                        <div className="h-full overflow-y-auto bg-[#121212] pb-24">
                            {/* Profile View Content (Same as previous) */}
                            <div className="relative h-36 bg-gradient-to-br from-[#1e1e1e] to-[#121212]">
                                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                    <div className="relative">
                                        <div className={`relative w-24 h-24 flex items-center justify-center rounded-full ${!isCustomFrame(user.specialFrame) ? getFrameContainerClass(user.specialFrame) : ''}`}>
                                            {isCustomFrame(user.specialFrame) && (
                                                <img src={user.specialFrame} className="absolute inset-0 w-full h-full z-10 object-contain scale-[1.7] pointer-events-none" alt="frame" />
                                            )}
                                            <div className={`${isCustomFrame(user.specialFrame) ? 'w-[85%] h-[85%]' : 'w-full h-full'} rounded-full overflow-hidden bg-[#252525] border-4 border-[#121212] flex items-center justify-center shadow-2xl relative z-0`}>
                                                {user.storeImage ? (
                                                    <img src={user.storeImage} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-8 h-8 text-gray-500" />
                                                )}
                                                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#252525] p-1 rounded-full border-2 border-[#121212] text-gray-400 active:scale-90 hover:text-white transition-all">
                                                    <CameraIcon className="w-3 h-3" />
                                                </button>
                                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12 px-5 text-center">
                                <div className="flex items-center justify-center gap-2 mb-0.5">
                                    <h2 className="text-lg font-bold text-white">{user.name}</h2>
                                    {getBadgeIcon(user.specialBadge)}
                                </div>
                                <p className="text-gray-500 text-xs font-mono mb-4">{user.phone}</p>

                                <div className="flex justify-center gap-2 mb-6">
                                    <div className={`bg-[#1E1E1E] rounded-xl p-2 border border-white/5 shadow-sm ${pointsConfig?.isPointsEnabled === true ? 'flex-1' : 'w-full'}`}>
                                        <p className="text-[9px] text-gray-500 mb-0.5">الطلبات</p>
                                        <p className="text-base font-black text-white">{myOrders.filter(o => o.status === OrderStatus.Delivered).length}</p>
                                    </div>
                                    {pointsConfig?.isPointsEnabled === true && (
                                        <div className="flex-1 bg-[#1E1E1E] rounded-xl p-2 border border-white/5 shadow-sm">
                                            <p className="text-[9px] text-gray-500 mb-0.5">النقاط</p>
                                            <p className="text-base font-black text-yellow-500">{user.pointsBalance || 0}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 text-right">
                                    <button
                                        onClick={() => setIsSupportModalOpen(true)}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold p-3 rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-between mb-3 active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-white/20 text-white">
                                                <HeadsetIcon className="w-5 h-5" />
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">تواصل معنا</p>
                                                <p className="text-[9px] text-blue-200">نحن هنا لمساعدتك</p>
                                            </div>
                                        </div>
                                        <ChevronLeftIcon className="w-4 h-4 text-blue-200" />
                                    </button>

                                    <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/5">
                                        <ProfileMenuItem
                                            icon={<SettingsIcon className="w-4 h-4" />}
                                            label="تعديل البيانات"
                                            onClick={() => setIsEditProfileOpen(true)}
                                        />
                                        <div className="h-px bg-white/5 mx-4"></div>
                                        <ProfileMenuItem
                                            icon={<EyeIcon className="w-4 h-4" />}
                                            label="تغيير كلمة المرور"
                                            onClick={() => setIsChangePasswordOpen(true)}
                                        />
                                        <div className="h-px bg-white/5 mx-4"></div>
                                        <ProfileMenuItem
                                            icon={<MapPinIcon className="w-4 h-4" />}
                                            label="عناويني المحفوظة"
                                            onClick={() => setIsAddressesOpen(true)}
                                        />
                                    </div>

                                    <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/5">
                                        <ProfileMenuItem
                                            icon={<ShieldCheckIcon className="w-4 h-4" />}
                                            label="سياسة الخصوصية"
                                            onClick={() => setInfoModalData({ title: 'سياسة الخصوصية', content: '...' })}
                                        />
                                        <div className="h-px bg-white/5 mx-4"></div>
                                        <ProfileMenuItem
                                            icon={<ClipboardListIcon className="w-4 h-4" />}
                                            label="شروط الاستخدام"
                                            onClick={() => setInfoModalData({ title: 'شروط الاستخدام', content: '...' })}
                                        />
                                    </div>

                                    <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/5 mt-4">
                                        <ProfileMenuItem
                                            icon={<LogoutIconV2 className="w-4 h-4" />}
                                            label="تسجيل الخروج"
                                            danger
                                            onClick={() => setShowLogoutConfirm(true)}
                                        />
                                    </div>

                                    <p className="text-center text-[9px] text-gray-700 mt-4 font-mono">{appName} {appVersion}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'orders' && <CustomerOrders orders={myOrders} onDeleteOrder={onDeleteOrder} appTheme={appTheme} />}
                    {view === 'messages' && <CustomerMessagesScreen messages={messages.filter(m => !deletedMessageIds.includes(m.id) && (m.targetId === 'all' || m.targetId === user.id))} onMarkAsSeen={markMessageAsSeen} hideMessage={hideMessage} appTheme={appTheme} />}
                    {view === 'special-request' && <SpecialRequestScreen user={user} onBack={() => setView('landing')} onPlaceOrder={handlePlaceOrder} appTheme={appTheme} />}
                    {view === 'favorites' && <FavoritesScreen merchants={merchants} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} addToCart={(p, m) => { setSelectedMerchant(m); addToCartSafe(p); }} onBack={() => setView('store-list')} appTheme={appTheme} />}
                    {view === 'coming-soon' && <ComingSoonScreen title={comingSoonData.title} description={comingSoonData.desc} onBack={() => setView('landing')} />}
                </div>
            </div>

            {infoModalData && (
                <InfoModal
                    title={infoModalData.title}
                    content={infoModalData.content}
                    onClose={() => setInfoModalData(null)}
                />
            )}

            {isEditProfileOpen && (
                <EditProfileModal
                    user={user}
                    onClose={() => setIsEditProfileOpen(false)}
                    onSave={handleProfileUpdate}
                />
            )}

            {profileStatusModal && (
                <ProfileStatusModal
                    type={profileStatusModal}
                    onClose={() => setProfileStatusModal(null)}
                />
            )}

            {isChangePasswordOpen && (
                <ChangePasswordModal
                    onClose={() => setIsChangePasswordOpen(false)}
                    onSave={(newPass) => onUpdateUser(user.id, { password: newPass })}
                />
            )}

            {isAddressesOpen && (
                <AddressesManagementModal
                    user={user}
                    onClose={() => setIsAddressesOpen(false)}
                    onUpdate={(newAddresses) => onUpdateUser(user.id, { addresses: newAddresses })}
                />
            )}

            {isSupportModalOpen && (
                <SupportModal
                    onClose={() => setIsSupportModalOpen(false)}
                    onOpenChat={() => setIsChatOpen(true)}
                    onOpenWhatsapp={openWhatsapp}
                    config={supportConfig}
                />
            )}

            {isChatOpen && (
                <CustomerChatScreen
                    user={user}
                    onClose={() => setIsChatOpen(false)}
                    config={supportConfig}
                />
            )}

            {showLogoutConfirm && (
                <ConfirmationModal
                    title="تسجيل الخروج"
                    message="هل أنت متأكد أنك تريد تسجيل الخروج؟"
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={() => { setShowLogoutConfirm(false); onLogout(); }}
                    confirmButtonText="نعم، خروج"
                    cancelButtonText="تراجع"
                    confirmVariant="danger"
                />
            )}

            {view !== 'store' && view !== 'special-request' && view !== 'coming-soon' && renderBottomNav()}
        </div>
    );
};

export default CustomerApp;
