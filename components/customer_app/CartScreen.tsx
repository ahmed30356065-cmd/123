
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, AppTheme, PromoCode } from '../../types';
import { ChevronRightIcon, TrashIcon, MinusIcon, PlusIcon, ReceiptIcon, MapPinIcon, XIcon, CheckCircleIcon, ShoppingCartIcon, TruckIconV2, TicketIcon, CoinsIcon } from '../icons';

interface CartScreenProps {
  cart: CartItem[];
  onBack: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onPlaceOrder: (notes: string, address: string, phone: string, discountData?: { discountAmount: number, promoCode?: string, pointsUsed?: number, finalPrice: number }) => void;
  userPhone: string;
  savedAddresses?: string[];
  appTheme?: AppTheme;
  promoCodes: PromoCode[];
  userPoints: number;
  pointsConfig: { pointsPerCurrency: number; currencyPerPoint: number; isPointsEnabled?: boolean };
  onGoToStores?: () => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ cart, onBack, onUpdateQuantity, onRemoveItem, onPlaceOrder, savedAddresses = [], appTheme, promoCodes, userPoints, pointsConfig, userPhone, onGoToStores }) => {
  const [selectedAddress, setSelectedAddress] = useState<string>('all');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressInput, setNewAddressInput] = useState('');
  
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [promoError, setPromoError] = useState('');
  
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isPointsEnabled = pointsConfig?.isPointsEnabled ?? true;

  useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const handleScroll = () => {
          const scrollY = container.scrollTop;
          const opacity = Math.min(scrollY / 60, 0.95);
          setHeaderOpacity(opacity);
      };
      
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const getIcon = (key: string, DefaultIcon: any, className: string) => {
      const customIcon = appTheme?.customer?.icons?.[key];
      if (customIcon) {
          return <img src={customIcon} className={`${className} object-contain`} alt={key} />;
      }
      return <DefaultIcon className={className} />;
  };

  useEffect(() => {
      if (savedAddresses.length > 0) setSelectedAddress(savedAddresses[0]);
  }, [savedAddresses]);

  // --- Calculations ---
  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const maxPointsValue = userPoints * pointsConfig.currencyPerPoint;
  const pointsDiscount = (usePoints && isPointsEnabled) ? Math.min(maxPointsValue, subTotal) : 0;
  const pointsToRedeem = (usePoints && isPointsEnabled) ? Math.ceil(pointsDiscount / pointsConfig.currencyPerPoint) : 0;

  let promoDiscount = 0;
  if (appliedPromo) {
      if (appliedPromo.type === 'percentage') {
          promoDiscount = (subTotal * appliedPromo.value) / 100;
      } else {
          promoDiscount = appliedPromo.value;
      }
  }

  const totalDiscount = Math.min(pointsDiscount + promoDiscount, subTotal);
  const finalTotal = subTotal - totalDiscount;

  const handleApplyPromo = () => {
      setPromoError('');
      if (!promoInput.trim()) return;
      
      const code = promoInput.trim().toUpperCase();
      const promo = promoCodes.find(p => p.code === code && p.isActive);

      if (!promo) {
          setPromoError('كود الخصم غير صحيح أو منتهي.');
          setAppliedPromo(null);
          return;
      }

      if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
          setPromoError('هذا الكود منتهي الصلاحية.');
          setAppliedPromo(null);
          return;
      }

      if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
          setPromoError('تم الوصول للحد الأقصى لاستخدام هذا الكود.');
          setAppliedPromo(null);
          return;
      }

      setAppliedPromo(promo);
      setPromoInput('');
  };

  const removePromo = () => {
      setAppliedPromo(null);
      setPromoError('');
  };

  const handleSaveNewAddress = () => {
      if (!newAddressInput.trim()) return;
      setSelectedAddress(newAddressInput);
      setIsAddingAddress(false);
  };

  const handleSubmit = () => {
    // If adding address is open, try to save it first if not empty
    if (isAddingAddress && newAddressInput.trim()) {
        setSelectedAddress(newAddressInput);
        setIsAddingAddress(false);
    } else if (!selectedAddress || selectedAddress === 'all') {
        setIsAddingAddress(true); 
        return; 
    }
    
    setIsSubmitting(true);
    
    // Ensure we use the latest input if user hits submit while typing new address
    const finalAddress = (isAddingAddress && newAddressInput.trim()) ? newAddressInput : selectedAddress;

    const discountData = {
        discountAmount: totalDiscount,
        promoCode: appliedPromo?.code,
        pointsUsed: (usePoints && isPointsEnabled) ? pointsToRedeem : 0,
        finalPrice: finalTotal
    };

    onPlaceOrder(notes, finalAddress, userPhone, discountData);
  };

  return (
    <div className="bg-[#1A1A1A] h-full flex flex-col relative animate-page-enter font-sans overflow-hidden fixed inset-0">
      
      {/* 1. Header with pt-safe */}
      <div 
        className="absolute top-0 left-0 right-0 z-40 pt-safe px-4 pb-2 flex items-center justify-between transition-all duration-300 pointer-events-none box-content h-12"
        style={{ 
            backgroundColor: `rgba(26, 26, 26, ${headerOpacity})`, 
            backdropFilter: headerOpacity > 0.5 ? 'blur(12px)' : 'none',
            borderBottom: headerOpacity > 0.5 ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}
      >
        <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={onBack} className="bg-[#252525] hover:opacity-80 p-2 rounded-full text-white transition-colors border border-white/5 active:scale-95 shadow-sm">
                <ChevronRightIcon className="w-5 h-5" />
            </button>
            <div style={{ opacity: headerOpacity > 0.2 ? 1 : 0, transition: 'opacity 0.3s' }}>
                <h1 className="text-lg font-black text-white leading-none">سلة المشتريات</h1>
            </div>
        </div>
        <div className="bg-red-600/10 text-red-400 px-2 py-1 rounded-lg text-xs font-bold border border-red-500/20 font-mono shadow-sm pointer-events-auto">
            {cart.reduce((a, b) => a + b.quantity, 0)} عنصر
        </div>
      </div>

      <div 
        ref={scrollContainerRef} 
        // Changed overflow strategy to be stable and prevent jitter
        className="flex-1 overflow-y-auto pt-20 px-4 space-y-5 pb-48"
        style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}
        onScroll={(e) => {
            const opacity = Math.min(e.currentTarget.scrollTop / 60, 0.95);
            setHeaderOpacity(opacity);
        }}
      >
        {!headerOpacity && (
             <div className="mb-2 transition-opacity duration-300">
                <h1 className="text-2xl font-black text-white leading-none">سلة المشتريات</h1>
            </div>
        )}

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[50vh] animate-fadeIn">
            <div className="w-24 h-24 bg-[#252525] rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-700 shadow-inner">
                 <ShoppingCartIcon className="w-10 h-10 text-gray-600 opacity-50" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">السلة فارغة</h2>
            <p className="text-gray-500 text-xs mb-6">أضف بعض المنتجات اللذيذة.</p>
            <button onClick={onGoToStores || onBack} className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-all shadow-lg active:scale-95 text-sm">
                تصفح المتاجر
            </button>
          </div>
        ) : (
          <>
            {/* 2. Items List (Compact) */}
            <div className="space-y-3">
                {cart.map((item, index) => (
                    <div 
                        key={item.id + (item.selectedSize?.name || '')} 
                        className="flex gap-3 p-2 bg-[#252525] rounded-2xl border border-white/5 shadow-sm items-center"
                    >
                        {/* Image */}
                        <div className="w-16 h-16 bg-[#1A1A1A] rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                            {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    <ShoppingCartIcon className="w-6 h-6 opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-white text-sm truncate pl-2">{item.name}</h4>
                                <button onClick={() => onRemoveItem(item.id)} className="text-gray-500 hover:text-red-500 p-1"><TrashIcon className="w-3.5 h-3.5" /></button>
                            </div>
                            {item.selectedSize && <span className="text-[9px] text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded mb-1 inline-block">{item.selectedSize.name}</span>}
                            
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-red-400 text-xs">{item.price.toLocaleString('en-US')} ج.م</span>
                                <div className="flex items-center bg-[#1A1A1A] rounded-lg p-0.5 border border-white/5 h-7">
                                    <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-7 h-full flex items-center justify-center text-white hover:bg-white/10 rounded"><PlusIcon className="w-2.5 h-2.5"/></button>
                                    <span className="w-6 text-center font-bold text-xs text-white">{item.quantity}</span>
                                    <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-7 h-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"><MinusIcon className="w-2.5 h-2.5"/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Address & Notes */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-white text-xs">عنوان التوصيل</h3>
                    {!isAddingAddress && savedAddresses.length > 0 && (
                        <button onClick={() => { setIsAddingAddress(true); setNewAddressInput(''); }} className="text-[10px] text-red-400 font-bold hover:text-red-300 transition-colors">+ جديد</button>
                    )}
                </div>

                {isAddingAddress ? (
                    <div className="flex gap-2 items-center animate-fadeIn">
                        <input 
                            type="text" 
                            value={newAddressInput}
                            onChange={(e) => setNewAddressInput(e.target.value)}
                            placeholder="اكتب العنوان الجديد هنا (المنطقة، الشارع...)"
                            className="flex-1 bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 transition-all placeholder-gray-500"
                            autoFocus
                        />
                        <button 
                            onClick={handleSaveNewAddress}
                            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-all shadow-lg active:scale-95 flex-shrink-0"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                        </button>
                         <button 
                            onClick={() => setIsAddingAddress(false)}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-3 rounded-xl transition-all active:scale-95 flex-shrink-0"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    savedAddresses.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {savedAddresses.map((addr, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedAddress(addr)}
                                    className={`flex-shrink-0 min-w-[200px] p-3 rounded-xl border text-right transition-all text-xs ${selectedAddress === addr ? 'bg-red-900/20 border-red-500 text-white' : 'bg-[#252525] text-gray-400 border-white/5'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPinIcon className={`w-3.5 h-3.5 ${selectedAddress === addr ? 'text-red-500' : 'text-gray-500'}`} />
                                        <span className="font-bold line-clamp-1">{addr}</span>
                                    </div>
                                </button>
                            ))}
                            {/* Display custom selected address if not in list */}
                            {selectedAddress && selectedAddress !== 'all' && !savedAddresses.includes(selectedAddress) && (
                                <button
                                    onClick={() => setSelectedAddress(selectedAddress)}
                                    className={`flex-shrink-0 min-w-[200px] p-3 rounded-xl border text-right transition-all text-xs bg-red-900/20 border-red-500 text-white`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPinIcon className="w-3.5 h-3.5 text-red-500" />
                                        <span className="font-bold line-clamp-1">{selectedAddress}</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => setIsAddingAddress(true)} className="w-full p-4 rounded-xl border border-dashed border-gray-600 text-gray-400 text-xs flex items-center justify-center gap-2 hover:border-red-500/50 hover:text-red-400 transition-colors">
                            <PlusIcon className="w-4 h-4" /> إضافة عنوان
                        </button>
                    )
                )}

                <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="ملاحظات (اختياري)..."
                    className="w-full bg-[#252525] border border-white/5 rounded-xl p-3 text-white text-xs outline-none focus:border-red-500/50 resize-none h-16"
                />
            </div>

            {/* 4. Discounts (Compact) */}
            <div className="space-y-2">
                {/* Points */}
                {isPointsEnabled && userPoints > 0 && maxPointsValue >= 1 && (
                    <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${usePoints ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-[#252525] border-white/5'}`}>
                        <div className="flex items-center gap-2">
                            <CoinsIcon className="w-4 h-4 text-yellow-500" />
                            <div>
                                <p className="text-xs font-bold text-white">استبدال النقاط</p>
                                <p className="text-[10px] text-gray-400">رصيدك <span className="text-yellow-400">{userPoints}</span> = {maxPointsValue.toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</p>
                            </div>
                        </div>
                        <input type="checkbox" checked={usePoints} onChange={() => setUsePoints(!usePoints)} className="w-4 h-4 accent-yellow-500 rounded" />
                    </div>
                )}

                {/* Promo */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="كود الخصم"
                        className="flex-1 bg-[#252525] border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                        disabled={!!appliedPromo}
                    />
                    {appliedPromo ? (
                         <button onClick={removePromo} className="bg-green-600/20 text-green-400 px-3 py-2 rounded-xl text-xs font-bold border border-green-500/20">إلغاء ({appliedPromo.code})</button>
                    ) : (
                        <button onClick={handleApplyPromo} className="bg-[#252525] text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5">تطبيق</button>
                    )}
                </div>
                {promoError && <p className="text-red-400 text-[10px] px-1">{promoError}</p>}
            </div>

            {/* 5. Summary */}
            <div className="bg-[#eee] text-black rounded-xl p-4 shadow-lg font-mono text-xs space-y-2">
                <div className="flex justify-between"><span>القيمة</span><span className="font-bold">{subTotal.toLocaleString('en-US')} ج.م</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-green-700"><span>خصم</span><span className="font-bold">-{totalDiscount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>}
                <div className="border-t border-black/10 pt-2 flex justify-between items-end">
                    <span className="font-bold">الإجمالي</span>
                    <span className="font-black text-lg">{finalTotal.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-[10px]">ج.م</span></span>
                </div>
            </div>

          </>
        )}
      </div>

      {/* Checkout Bar - Moved up to accommodate Bottom Nav */}
      {cart.length > 0 && (
        <div className="fixed bottom-[74px] left-0 right-0 p-4 bg-[#1A1A1A] border-t border-white/5 z-30">
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-white text-black hover:bg-gray-200 py-3.5 rounded-xl font-black text-sm transition-all flex justify-between items-center px-5 active:scale-[0.98]"
            >
                <span>{isSubmitting ? 'جاري الطلب...' : 'تأكيد الطلب'}</span>
                {!isSubmitting && <span className="text-xs bg-black text-white px-2 py-0.5 rounded">{finalTotal.toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</span>}
            </button>
        </div>
      )}
    </div>
  );
};

export default CartScreen;
