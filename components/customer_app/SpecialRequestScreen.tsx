
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, AppTheme } from '../../types';
import { ChevronRightIcon, SparklesIcon, MapPinIcon, PlusIcon, PencilIcon, StarIcon, RocketIcon, CheckCircleIcon, PhoneIcon } from '../icons';

interface SpecialRequestScreenProps {
  user: User;
  onBack: () => void;
  onPlaceOrder: (notes: string, address: string, phone: string) => void;
  appTheme?: AppTheme;
}

const SpecialRequestScreen: React.FC<SpecialRequestScreenProps> = ({ user, onBack, onPlaceOrder, appTheme }) => {
  const [requestDetails, setRequestDetails] = useState('');
  
  // Filter out any potential legacy addresses that might indicate pickup to strictly force Delivery flow
  const deliveryAddresses = useMemo(() => {
      return (user?.addresses || []).filter(addr => 
          !addr.includes('استلام') && 
          !addr.includes('فرع') && 
          !addr.includes('Pickup')
      );
  }, [user?.addresses]);

  const defaultAddress = deliveryAddresses.length > 0 ? deliveryAddresses[0] : '';
  const [selectedAddress, setSelectedAddress] = useState(defaultAddress);
  const [isCustomAddressMode, setIsCustomAddressMode] = useState(!defaultAddress);

  // Phone Logic
  const defaultPhone = user?.phone || '';
  const [selectedPhone, setSelectedPhone] = useState(defaultPhone);
  const [isCustomPhoneMode, setIsCustomPhoneMode] = useState(!defaultPhone);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Header Scroll Effect State
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const handleScroll = () => {
          const scrollY = container.scrollTop;
          const opacity = Math.min(scrollY / 100, 0.95);
          setHeaderOpacity(opacity);
      };
      
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = () => {
    if (!requestDetails.trim()) return;
    if (!selectedAddress.trim()) { alert('يرجى تحديد عنوان للتوصيل'); return; }
    if (!selectedPhone.trim()) { alert('يرجى تحديد رقم للتواصل'); return; }
    if (selectedPhone.length < 11) { alert('رقم الهاتف غير صحيح'); return; }

    setIsSubmitting(true);

    const finalNotes = requestDetails;
    
    // Simulate delay for animation
    setTimeout(() => {
        onPlaceOrder(finalNotes, selectedAddress, selectedPhone);
    }, 1500);
  };

  const handleAddressSelect = (addr: string) => {
      setSelectedAddress(addr);
      setIsCustomAddressMode(false);
  };

  const enableCustomAddress = () => {
      setSelectedAddress('');
      setIsCustomAddressMode(true);
  };

  const handlePhoneSelect = (phone: string) => {
      setSelectedPhone(phone);
      setIsCustomPhoneMode(false);
  };

  const enableCustomPhone = () => {
      setSelectedPhone('');
      setIsCustomPhoneMode(true);
  };

  return (
    <div className="bg-[#0f0f13] h-[100dvh] flex flex-col relative animate-page-enter font-sans overflow-hidden">
      
      {/* Premium Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#2D1B36] via-[#15101a] to-[#0f0f13] pointer-events-none"></div>
      <div className="absolute -top-40 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div 
        className="absolute top-0 left-0 right-0 z-40 pt-safe px-4 pb-4 flex items-center justify-between transition-all duration-500 pointer-events-none box-content h-14"
        style={{ 
            backgroundColor: `rgba(15, 15, 19, ${headerOpacity})`, 
            backdropFilter: headerOpacity > 0.5 ? 'blur(16px)' : 'none',
            borderBottom: headerOpacity > 0.5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            boxShadow: headerOpacity > 0.5 ? '0 10px 40px rgba(0,0,0,0.2)' : 'none'
        }}
      >
        <button onClick={onBack} className="bg-white/5 hover:bg-white/10 backdrop-blur-md p-3 rounded-full text-white transition-all border border-white/10 active:scale-95 pointer-events-auto group">
            <ChevronRightIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        
        {/* Fixed Rocket Icon in Header */}
        <div className={`flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 pointer-events-auto transition-all duration-500 ${headerOpacity > 0.5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <RocketIcon className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white tracking-wide">المساعد الشخصي</span>
        </div>
        
        <div className="w-10"></div> 
      </div>

      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto pt-28 px-5 space-y-8 pb-44 scroll-smooth relative z-10 overscroll-none"
        onScroll={(e) => {
            const opacity = Math.min(e.currentTarget.scrollTop / 100, 0.95);
            setHeaderOpacity(opacity);
        }}
      >
        
        {/* Hero Section */}
        <div className="text-center space-y-4 mt-2 mb-8 relative" style={{ opacity: Math.max(0, 1 - headerOpacity * 2), transform: `translateY(${headerOpacity * -20}px)`, transition: 'all 0.1s' }}>
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-3xl border border-white/10 shadow-2xl shadow-purple-900/20 mb-2 relative group">
                <div className="absolute inset-0 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <RocketIcon className="w-10 h-10 text-purple-300 animate-pulse" />
            </div>
            
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                أطلب <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">أي شيء</span>،<br/>
                نصلك <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">أينما كنت</span>.
            </h1>
            <p className="text-sm text-gray-400 max-w-[280px] mx-auto leading-relaxed font-medium">
                مساعدك الشخصي جاهز لتلبية طلباتك الخاصة. مشاوير، تسوق، أو استلام طرود.
            </p>
        </div>

        {/* 1. Request Details */}
        <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.2rem] opacity-30 blur group-hover:opacity-60 transition duration-1000"></div>
            <div className="relative bg-[#18181b] border border-white/10 rounded-[2rem] p-1 shadow-2xl">
                <div className="bg-[#131316] rounded-[1.8rem] p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
                            <PencilIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-lg tracking-wide">تفاصيل الطلب</h3>
                    </div>
                    
                    <div className="relative">
                        <textarea
                            value={requestDetails}
                            onChange={(e) => setRequestDetails(e.target.value)}
                            placeholder="اكتب طلبك هنا بوضوح...&#10;مثال: 'أحتاج دواء بنادول من صيدلية العزبي' أو 'استلام مفتاح من صديق في شارع الهرم'..."
                            className="w-full h-44 bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all resize-none text-base leading-relaxed shadow-inner"
                            autoFocus
                        />
                        <div className="absolute bottom-4 left-4 pointer-events-none">
                            <SparklesIcon className={`w-5 h-5 text-purple-500 transition-opacity duration-500 ${requestDetails ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. Destination (STRICTLY DELIVERY ONLY - Filtered) */}
        <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-gray-400 px-4 flex items-center gap-2 uppercase tracking-wider">
                <MapPinIcon className="w-4 h-4 text-purple-500" />
                عنوان التوصيل
            </h3>
            
            <div className="grid gap-3">
                {deliveryAddresses.map((addr, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAddressSelect(addr)}
                        className={`w-full text-right p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${selectedAddress === addr && !isCustomAddressMode ? 'bg-gradient-to-r from-purple-900/30 to-[#18181b] border-purple-500/50 shadow-lg shadow-purple-900/10 scale-[1.02]' : 'bg-[#18181b] border-white/5 hover:border-white/10 hover:bg-[#1f1f22]'}`}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-2.5 rounded-full transition-colors ${selectedAddress === addr && !isCustomAddressMode ? 'bg-purple-600 text-white shadow-md' : 'bg-[#27272a] text-gray-500'}`}>
                                <StarIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-sm font-bold line-clamp-1 ${selectedAddress === addr && !isCustomAddressMode ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{addr}</span>
                        </div>
                        {selectedAddress === addr && !isCustomAddressMode && <div className="bg-purple-500 rounded-full p-1"><CheckCircleIcon className="w-4 h-4 text-white" /></div>}
                    </button>
                ))}

                <button
                    onClick={enableCustomAddress}
                    className={`w-full text-right p-4 rounded-2xl border border-dashed transition-all duration-300 flex items-center gap-4 group ${isCustomAddressMode ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-transparent hover:bg-white/5 hover:border-gray-500'}`}
                >
                    <div className={`p-2.5 rounded-full transition-colors ${isCustomAddressMode ? 'bg-blue-600 text-white shadow-md' : 'bg-[#27272a] text-gray-500 group-hover:text-white'}`}>
                        <PlusIcon className="w-4 h-4" />
                    </div>
                    
                    {isCustomAddressMode ? (
                        <input 
                            type="text" 
                            value={selectedAddress} 
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            placeholder="اكتب العنوان الجديد..."
                            className="bg-transparent text-white text-sm font-bold outline-none w-full placeholder-blue-300/50"
                            autoFocus
                        />
                    ) : (
                        <span className="text-sm font-bold text-gray-400 group-hover:text-gray-300">توصيل لمكان آخر...</span>
                    )}
                </button>
            </div>
        </div>

        {/* 3. Phone Number Selection */}
        <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-gray-400 px-4 flex items-center gap-2 uppercase tracking-wider">
                <PhoneIcon className="w-4 h-4 text-green-500" />
                رقم التواصل
            </h3>
            
            <div className="grid gap-3">
                {/* Registered Phone Option */}
                {user?.phone && (
                    <button
                        onClick={() => handlePhoneSelect(user.phone || '')}
                        className={`w-full text-right p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${selectedPhone === user.phone && !isCustomPhoneMode ? 'bg-gradient-to-r from-green-900/30 to-[#18181b] border-green-500/50 shadow-lg shadow-green-900/10 scale-[1.02]' : 'bg-[#18181b] border-white/5 hover:border-white/10 hover:bg-[#1f1f22]'}`}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-2.5 rounded-full transition-colors ${selectedPhone === user.phone && !isCustomPhoneMode ? 'bg-green-600 text-white shadow-md' : 'bg-[#27272a] text-gray-500'}`}>
                                <PhoneIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-sm font-bold font-mono tracking-wide ${selectedPhone === user.phone && !isCustomPhoneMode ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{user.phone} (المسجل)</span>
                        </div>
                        {selectedPhone === user.phone && !isCustomPhoneMode && <div className="bg-green-500 rounded-full p-1"><CheckCircleIcon className="w-4 h-4 text-white" /></div>}
                    </button>
                )}

                {/* Custom Phone Option */}
                <button
                    onClick={enableCustomPhone}
                    className={`w-full text-right p-4 rounded-2xl border border-dashed transition-all duration-300 flex items-center gap-4 group ${isCustomPhoneMode ? 'border-green-500 bg-green-900/10' : 'border-gray-700 bg-transparent hover:bg-white/5 hover:border-gray-500'}`}
                >
                    <div className={`p-2.5 rounded-full transition-colors ${isCustomPhoneMode ? 'bg-green-600 text-white shadow-md' : 'bg-[#27272a] text-gray-500 group-hover:text-white'}`}>
                        <PlusIcon className="w-4 h-4" />
                    </div>
                    
                    {isCustomPhoneMode ? (
                        <input 
                            type="tel" 
                            value={selectedPhone} 
                            onChange={(e) => setSelectedPhone(e.target.value)}
                            placeholder="اكتب رقم الهاتف..."
                            className="bg-transparent text-white text-sm font-bold outline-none w-full placeholder-green-300/50 font-mono"
                            autoFocus
                            dir="ltr"
                        />
                    ) : (
                        <span className="text-sm font-bold text-gray-400 group-hover:text-gray-300">رقم هاتف آخر...</span>
                    )}
                </button>
            </div>
        </div>

      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-[#0f0f13] via-[#0f0f13] to-transparent z-30">
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !requestDetails}
                className="group relative w-full bg-white text-black hover:bg-gray-100 py-4 rounded-[2rem] font-black text-lg transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed shadow-2xl shadow-white/10 active:scale-[0.98] overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                <div className="relative z-10 flex justify-between items-center px-6">
                    <span className="flex items-center gap-3">
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                جاري المعالجة...
                            </>
                        ) : (
                            <>
                                <div className="bg-black text-white p-1.5 rounded-full">
                                    <RocketIcon className="w-4 h-4" />
                                </div>
                                إرسال الطلب
                            </>
                        )}
                    </span>
                    
                    {!isSubmitting && (
                        <span className="text-xs font-bold bg-black/5 px-3 py-1 rounded-lg border border-black/10">
                            سيتم تحديد السعر
                        </span>
                    )}
                </div>
            </button>
      </div>
    </div>
  );
};

export default SpecialRequestScreen;
