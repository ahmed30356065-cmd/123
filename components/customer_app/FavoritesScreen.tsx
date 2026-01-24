
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User, Product, AppTheme } from '../../types';
import { ChevronRightIcon, HeartIcon, StoreIcon, GridIcon, PlusIcon, ShoppingCartIcon, StarIcon, XIcon } from '../icons';

interface FavoritesScreenProps {
  merchants: User[];
  favoriteIds: string[];
  toggleFavorite: (productId: string) => void;
  addToCart: (product: Product, merchant: User) => void;
  onBack: () => void;
  appTheme?: AppTheme;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ merchants, favoriteIds, toggleFavorite, addToCart, onBack, appTheme }) => {
  // Header Scroll Effect State
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const favoriteProducts = useMemo(() => {
      const allProducts: { product: Product, merchant: User }[] = [];
      merchants.forEach(merchant => {
          if (merchant.products) {
              merchant.products.forEach(product => {
                  if (favoriteIds.includes(product.id)) {
                      allProducts.push({ product, merchant });
                  }
              });
          }
      });
      return allProducts;
  }, [merchants, favoriteIds]);

  const handleAddToCart = (item: { product: Product, merchant: User }) => {
      addToCart(item.product, item.merchant);
  };

  return (
    <div className="bg-[#1A1A1A] h-[100dvh] flex flex-col relative animate-page-enter font-sans overflow-hidden">
      
      {/* Dynamic Header with Safe Area */}
      <div 
        className="absolute top-0 left-0 right-0 z-40 pt-safe px-4 pb-4 flex items-center justify-between transition-all duration-300 pointer-events-none box-content h-14"
        style={{ 
            backgroundColor: `rgba(26, 26, 26, ${headerOpacity})`, 
            backdropFilter: headerOpacity > 0.5 ? 'blur(12px)' : 'none',
            borderBottom: headerOpacity > 0.5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            boxShadow: headerOpacity > 0.5 ? '0 4px 30px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={onBack} className="bg-[#252525] hover:opacity-80 p-2.5 rounded-full text-white transition-colors border border-white/5 active:scale-95 shadow-sm">
                <ChevronRightIcon className="w-5 h-5" />
            </button>
            <div style={{ opacity: headerOpacity > 0.2 ? 1 : 0, transition: 'opacity 0.3s' }}>
                <h1 className="text-xl font-black text-white leading-none flex items-center gap-2">
                    المفضلة
                    <HeartIcon className="w-5 h-5 text-red-500 fill-current animate-pulse" />
                </h1>
                <p className="text-xs text-gray-400 font-medium mt-1">منتجاتك المميزة ({favoriteProducts.length})</p>
            </div>
        </div>
      </div>

      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto pt-24 px-4 pb-24 scroll-smooth overscroll-none"
        onScroll={(e) => {
            const opacity = Math.min(e.currentTarget.scrollTop / 60, 0.95);
            setHeaderOpacity(opacity);
        }}
      >
        
        {!headerOpacity && (
             <div className="mb-4 transition-opacity duration-300">
                <h1 className="text-2xl font-black text-white leading-none flex items-center gap-2">
                    المفضلة
                    <HeartIcon className="w-6 h-6 text-red-500 fill-current" />
                </h1>
                <p className="text-sm text-gray-400 font-medium mt-2">منتجاتك المميزة ({favoriteProducts.length})</p>
            </div>
        )}

        {favoriteProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fadeIn">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl"></div>
                <div className="w-24 h-24 bg-[#252525] rounded-full flex items-center justify-center relative z-10 shadow-inner border border-white/5">
                    <HeartIcon className="w-10 h-10 text-gray-500" />
                </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">قائمة المفضلة فارغة</h3>
            <p className="text-sm text-gray-400 max-w-[200px] leading-relaxed">
                اضغط على أيقونة القلب <HeartIcon className="w-3 h-3 inline text-red-500"/> في صفحات المتاجر لحفظ المنتجات هنا.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favoriteProducts.map(({ product, merchant }, idx) => (
                <div 
                    key={product.id} 
                    className="group bg-[#252525] rounded-[1.5rem] overflow-hidden border border-white/5 shadow-md hover:shadow-xl hover:border-gray-600 transition-all duration-300 flex flex-col animate-fade-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                    {/* Image Area */}
                    <div className="relative aspect-square w-full bg-[#1A1A1A] overflow-hidden">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <GridIcon className="w-8 h-8 opacity-20" />
                            </div>
                        )}
                        
                        {/* Remove Fav Button */}
                        <button 
                            onClick={() => toggleFavorite(product.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-red-500 hover:text-white transition-all z-20 shadow-sm"
                        >
                            <XIcon className="w-3 h-3" />
                        </button>

                        {/* Merchant Tag */}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 max-w-[80%]">
                            <StoreIcon className="w-3 h-3 text-gray-300" />
                            <span className="text-[9px] text-white font-bold truncate">{merchant.name}</span>
                        </div>
                    </div>
                    
                    {/* Details */}
                    <div className="p-3 flex-1 flex flex-col">
                        <h3 className="font-bold text-white text-sm mb-1 line-clamp-1 leading-snug">{product.name}</h3>
                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-3 flex-1 opacity-80">{product.description}</p>
                        
                        <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-white font-black text-sm">{product.price}</span>
                                <span className="text-red-500 text-[9px] font-bold">ج.م</span>
                            </div>
                            
                            <button 
                                onClick={() => handleAddToCart({ product, merchant })}
                                className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 active:scale-90 transition-all shadow-lg"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesScreen;
