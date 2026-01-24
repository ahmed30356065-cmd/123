
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Product, CartItem, AppTheme, ProductSize } from '../../types';
import { ChevronRightIcon, PlusIcon, MinusIcon, GridIcon, ClockIcon, XIcon, StarIcon, TruckIconV2, HeartIcon, SearchIcon, CheckCircleIcon, PhoneIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';

interface StoreScreenProps {
  merchant: User;
  onBack: () => void;
  addToCart: (product: Product, selectedSize?: ProductSize) => void;
  cart: CartItem[];
  onViewCart: () => void;
  initialCategory?: string;
  toggleFavorite: (productId: string) => void;
  favoriteIds: string[];
  appTheme?: AppTheme;
}

const SizeSelectorModal: React.FC<{ product: Product; onClose: () => void; onConfirm: (size: ProductSize) => void }> = ({ product, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-pop-in" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]">
                    <h3 className="font-bold text-white text-base">اختر الحجم</h3>
                    <button onClick={onClose} className="p-1 rounded-full bg-gray-700 text-gray-400 hover:text-white clickable"><XIcon className="w-4 h-4"/></button>
                </div>
                <div className="p-4 space-y-2">
                    {product.sizes?.map((size, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => onConfirm(size)}
                            className="w-full flex justify-between items-center p-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 transition-all group clickable"
                        >
                            <span className="font-bold text-gray-200 group-hover:text-white text-sm">{size.name}</span>
                            <span className="font-bold text-green-400 text-sm">{size.price} ج.م</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StoreScreen: React.FC<StoreScreenProps> = ({ merchant, onBack, addToCart, cart, onViewCart, initialCategory, toggleFavorite, favoriteIds, appTheme }) => {
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isManualScroll = useRef(false);

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

  const categories = useMemo(() => {
      const distinctCats = Array.from(new Set((merchant.products || []).map(p => p.category || 'عام')));
      return distinctCats; 
  }, [merchant.products]);

  // Scrollspy Observer
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observerOptions = {
        root: container,
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
        if (isManualScroll.current) return;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const category = entry.target.getAttribute('data-category');
                if (category) {
                    setActiveCategory(category);
                    const btn = document.getElementById(`cat-btn-${category}`);
                    if (btn && categoryScrollRef.current) {
                        const navContainer = categoryScrollRef.current;
                        const scrollLeft = btn.offsetLeft - navContainer.offsetWidth / 2 + btn.offsetWidth / 2;
                        navContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                    }
                }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    Object.values(sectionRefs.current).forEach(ref => {
        if (ref) observer.observe(ref as Element);
    });

    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
      if (initialCategory && categories.includes(initialCategory)) {
           setTimeout(() => scrollToCategory(initialCategory), 100);
      } else if (categories.length > 0) {
           setActiveCategory(categories[0]);
      }
  }, [initialCategory]);

  // 🛡️ Internal Back Button Logic for Store Screen states
  useAndroidBack(() => {
      // 1. Close Size Modal
      if (selectedProductForSize) { setSelectedProductForSize(null); return true; }
      
      // 2. Close Zoomed Image
      if (zoomedImage) { setZoomedImage(null); return true; }
      
      // 3. Let parent (CustomerApp) handle navigation back to Home
      return false; 
  }, [zoomedImage, selectedProductForSize]);

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const groupedProducts = useMemo(() => {
      const groups: { [key: string]: Product[] } = {};
      const productList = merchant.products || [];
      productList.forEach(p => {
          const cat = p.category || 'عام';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(p);
      });
      return groups;
  }, [merchant.products]);

  const getCartItemQuantity = (productId: string) => {
      return cart.filter(i => i.id === productId).reduce((sum, i) => sum + i.quantity, 0);
  };

  const handleProductAdd = (product: Product) => {
      if (product.sizes && product.sizes.length > 0) {
          setSelectedProductForSize(product);
      } else {
          addToCart(product);
      }
  };

  const handleSizeConfirm = (size: ProductSize) => {
      if (selectedProductForSize) {
          const variantProduct = { ...selectedProductForSize, price: size.price };
          addToCart(variantProduct, size);
          setSelectedProductForSize(null);
      }
  };

  const scrollToCategory = (category: string) => {
      isManualScroll.current = true;
      setActiveCategory(category);
      
      const ref = sectionRefs.current[category];
      const container = scrollContainerRef.current;

      if (ref && container) {
          const headerHeight = 120; // Decreased offset slightly
          const topPos = ref.offsetTop - headerHeight; 
          container.scrollTo({ top: topPos, behavior: 'smooth' });
          setTimeout(() => { isManualScroll.current = false; }, 600);
      }
  };

  return (
    <div className="bg-[#1A1A1A] text-white h-[100dvh] flex flex-col relative animate-page-enter font-sans overflow-hidden">
      
      {/* 1. Header with pt-safe */}
      <div 
        className="absolute top-0 left-0 right-0 z-50 pt-safe px-4 pb-2 flex items-center justify-between transition-colors duration-200 pointer-events-none box-content h-12 will-change-transform"
        style={{ 
            backgroundColor: `rgba(26, 26, 26, ${headerOpacity})`, 
            backdropFilter: `blur(${headerOpacity * 12}px)`,
            borderBottom: `1px solid rgba(255,255,255,${headerOpacity * 0.05})`,
            boxShadow: `0 4px 20px rgba(0,0,0,${headerOpacity * 0.1})`
        }}
      >
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-95 shadow-lg pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 clickable"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-1 pt-safe transition-opacity duration-300 pointer-events-none"
            style={{ opacity: headerOpacity > 0.8 ? 1 : 0 }}
          >
              <h1 className="text-sm font-bold text-white shadow-sm text-center">{merchant.name}</h1>
          </div>
      </div>

      {/* Main Scroll Container */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pb-safe overscroll-none"
        onScroll={(e) => {
            const scrollY = e.currentTarget.scrollTop;
            const opacity = Math.min(scrollY / 100, 0.95);
            setHeaderOpacity(opacity);
        }}
      >
          
          {/* 2. Hero (Compact Height 44 - 176px) */}
          <div className="relative h-44 w-full flex-shrink-0">
              {merchant.storeImage ? (
                  <img src={merchant.storeImage} alt="cover" className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full bg-[#252525] flex items-center justify-center text-gray-600">
                      <GridIcon className="w-12 h-12 opacity-20" />
                  </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/40 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-[#1A1A1A] to-transparent">
                   <div className="flex justify-between items-end mb-1">
                       <h1 className="text-xl font-black text-white leading-tight shadow-sm drop-shadow-md">
                            {merchant.name}
                        </h1>
                        <div className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 flex items-center gap-0.5">
                            4.8 <StarIcon className="w-2.5 h-2.5 inline pb-0.5 fill-current"/>
                        </div>
                   </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300 font-medium opacity-90 mb-2">
                        <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded text-[10px] border border-red-500/30">{merchant.storeCategory || 'عام'}</span>
                        {merchant.phone && <span className="text-[10px] text-gray-400 font-mono selectable">{merchant.phone}</span>}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-bold w-fit">
                            <div className="flex items-center gap-1 text-gray-300 bg-white/5 px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
                                <ClockIcon className="w-3 h-3 text-blue-400" />
                                <span>{merchant.responseTime || '30'} د</span>
                            </div>
                            {merchant.hasFreeDelivery && (
                                <div className="flex items-center gap-1 text-gray-300 bg-white/5 px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
                                    <TruckIconV2 className="w-3 h-3 text-green-400" />
                                    <span>مجاني</span>
                                </div>
                            )}
                    </div>
              </div>
          </div>

          {/* 3. Sticky Menu (Scrollspy) */}
          <div className="sticky top-0 z-40 bg-[#1A1A1A] border-b border-white/5 shadow-xl pt-1 pb-1">
              <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat}
                        id={`cat-btn-${cat}`}
                        onClick={() => scrollToCategory(cat)}
                        className={`
                            px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-300 border clickable
                            ${activeCategory === cat 
                                ? 'bg-white text-black border-white shadow-sm scale-105' 
                                : 'bg-[#252525] text-gray-400 border-transparent hover:bg-[#303030]'
                            }
                        `}
                    >
                        {cat}
                    </button>
                ))}
              </div>
          </div>

          {/* 4. Menu Items List */}
          <div className="px-4 pt-3 space-y-5 pb-32">
            {categories.map((category) => (
                <div 
                    key={category} 
                    /* Fix: ensuring ref callback returns void to avoid type mismatch */
                    ref={(el) => { sectionRefs.current[category] = el; }}
                    data-category={category}
                    className="min-h-[60px]"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-base font-black text-white">{category}</h4>
                        <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
                    </div>
                    
                    <div className="grid gap-2">
                        {groupedProducts[category]?.map((product) => {
                            const qty = getCartItemQuantity(product.id);
                            const hasSizes = product.sizes && product.sizes.length > 0;
                            
                            return (
                                <div key={product.id} className="group bg-[#252525] rounded-xl p-2 border border-white/5 flex gap-3 relative overflow-hidden transition-all duration-300 active:bg-[#2a2a2a]">
                                    {/* Selection Indicator */}
                                    {qty > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}

                                    {/* Image (Compact Size) */}
                                    <div className="w-20 h-20 bg-[#1A1A1A] rounded-lg overflow-hidden flex-shrink-0 cursor-pointer relative clickable" onClick={() => product.image && setZoomedImage(product.image)}>
                                        {product.image ? (
                                            <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600"><GridIcon className="w-5 h-5 opacity-30" /></div>
                                        )}
                                        {!product.available && (
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-[9px] font-bold text-white bg-red-600 px-2 py-0.5 rounded shadow-lg">غير متاح</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-white text-xs mb-0.5 truncate">{product.name}</h4>
                                            </div>
                                            <p className="text-[9px] text-gray-400 line-clamp-2 leading-tight opacity-80">{product.description}</p>
                                        </div>
                                        
                                        <div className="flex items-end justify-between mt-1">
                                            <div className="flex flex-col">
                                                <span className="font-black text-white text-sm">
                                                    {product.price > 0 ? product.price : (hasSizes ? product.sizes?.[0].price : 0)} 
                                                    <span className="text-[9px] text-red-500 font-bold ml-0.5">ج.م</span>
                                                </span>
                                                {hasSizes && <span className="text-[8px] text-green-400 font-bold">يبدأ من</span>}
                                            </div>
                                            
                                            {/* Add Button / Counter */}
                                            {qty > 0 && !hasSizes ? (
                                                <div className="flex items-center bg-[#1A1A1A] rounded-full p-0.5 border border-green-500/30 shadow-lg">
                                                    <div className="px-2 text-xs font-bold text-white">{qty}</div>
                                                    <button 
                                                        onClick={() => addToCart(product)}
                                                        className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform clickable"
                                                    >
                                                        <PlusIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleProductAdd(product)}
                                                    disabled={!product.available}
                                                    className={`h-6 px-3 rounded-full flex items-center justify-center transition-all shadow active:scale-90 clickable ${
                                                        !product.available 
                                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                                            : qty > 0 ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {qty > 0 && hasSizes ? (
                                                        <span className="text-[9px] font-bold flex items-center gap-1"><PlusIcon className="w-2 h-2"/> أضف</span>
                                                    ) : (
                                                        <PlusIcon className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
          </div>
      </div>

      {/* Floating Cart Button */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A] to-transparent z-50 animate-slide-up">
          <button 
            onClick={onViewCart}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-between px-5 transition-all active:scale-[0.98] group border border-red-500/50 clickable"
          >
            <div className="flex items-center gap-3">
                <div className="bg-white text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm">
                    {cartTotalItems}
                </div>
                <span className="font-bold text-base">عرض السلة</span>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white">{cartTotalPrice} <span className="text-[10px] font-medium opacity-80">ج.م</span></span>
                <ChevronRightIcon className="w-4 h-4 rotate-180 opacity-80 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {zoomedImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn" onClick={() => setZoomedImage(null)}>
              <img src={zoomedImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-pop-in border border-white/10" onClick={e => e.stopPropagation()} />
              <button onClick={() => setZoomedImage(null)} className="absolute top-6 right-6 p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors border border-white/10 clickable"><XIcon className="w-5 h-5" /></button>
          </div>
      )}

      {selectedProductForSize && (
          <SizeSelectorModal 
            product={selectedProductForSize} 
            onClose={() => setSelectedProductForSize(null)} 
            onConfirm={handleSizeConfirm} 
          />
      )}
    </div>
  );
};

export default StoreScreen;
