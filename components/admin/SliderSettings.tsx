
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { SliderImage, User } from '../../types';
import { TrashIcon, ImageIcon, UploadIcon, CheckCircleIcon, PencilIcon, LinkIcon, XIcon, SearchIcon, GridIcon, UserIcon, EyeIcon, EyeOffIcon, BuildingStorefrontIcon, RocketIcon } from '../icons';
import SearchableSelect from './SearchableSelect';
import useAndroidBack from '../../hooks/useAndroidBack';

interface SliderSettingsProps {
    images: SliderImage[];
    isEnabled: boolean;
    onAddImage?: (image: SliderImage) => void;
    onDeleteImage?: (id: string) => void;
    onUpdateImage?: (id: string, data: Partial<SliderImage>) => void;
    onToggleSlider?: (isEnabled: boolean) => void;
    merchants?: User[]; 
    adminUser?: User;
}

// --- Internal Modal for Linking ---
const LinkMerchantModal: React.FC<{
    onClose: () => void;
    onSave: (merchantId: string, categoryId?: string, text?: string) => void;
    merchants: User[];
    adminUser?: User;
    initialMerchantId?: string;
    initialCategoryId?: string;
    initialText?: string;
}> = ({ onClose, onSave, merchants, adminUser, initialMerchantId, initialCategoryId, initialText }) => {
    const [selectedId, setSelectedId] = useState(initialMerchantId || '');
    const [selectedCategory, setSelectedCategory] = useState(initialCategoryId || '');
    const [textOverlay, setTextOverlay] = useState(initialText || '');
    
    useAndroidBack(() => {
        onClose();
        return true;
    }, []);

    const options = useMemo(() => {
        const list = merchants.map(m => ({
            value: m.id,
            label: m.name,
            sublabel: m.phone
        }));
        if (adminUser) {
            list.unshift({
                value: adminUser.id,
                label: `${adminUser.name} (الإدارة)`,
                sublabel: 'عروض التطبيق الرسمية'
            });
        }
        return list;
    }, [merchants, adminUser]);

    const categoryOptions = useMemo(() => {
        if (!selectedId) return [];
        if (adminUser && selectedId === adminUser.id) return [];
        const merchant = merchants.find(m => m.id === selectedId);
        if (!merchant || !merchant.products) return [];
        const cats = new Set(merchant.products.map(p => p.category || 'عام'));
        return Array.from(cats).map(cat => ({
            value: cat,
            label: cat
        }));
    }, [selectedId, merchants, adminUser]);

    const handleSave = () => onSave(selectedId, selectedCategory || undefined, textOverlay || undefined);
    const isSelectedAdmin = adminUser && selectedId === adminUser.id;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden animate-pop-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#151e2d]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg shadow-lg shadow-blue-900/20">
                            <LinkIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        ربط وتخصيص العرض
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-full hover:bg-gray-700">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar bg-[#1e293b]">
                    
                    {/* Step 1: Merchant Selection */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-blue-400 mb-1">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs border border-blue-500/30">1</span>
                            اختر الجهة (المتجر أو الإدارة)
                        </label>
                        <SearchableSelect 
                            options={options} 
                            value={selectedId} 
                            onChange={(val) => { setSelectedId(val); setSelectedCategory(''); }} 
                            placeholder="ابحث باسم المتجر..." 
                        />
                    </div>

                    {/* Step 2: Text Overlay */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-purple-400 mb-1">
                            <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs border border-purple-500/30">2</span>
                            نص العرض (اختياري)
                        </label>
                        <input 
                            type="text" 
                            value={textOverlay} 
                            onChange={(e) => setTextOverlay(e.target.value)} 
                            placeholder="مثال: خصم 50% لفترة محدودة!" 
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                        />
                        <p className="text-[10px] text-gray-500">سيظهر هذا النص فوق السلايدر</p>
                    </div>

                    {/* Step 3: Category Selection (Only if not Admin) */}
                    <div className={`transition-all duration-500 ease-in-out ${selectedId && !isSelectedAdmin ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale pointer-events-none'}`}>
                        <div className="h-px bg-gray-700 mb-6"></div>
                        <label className="flex items-center gap-2 text-sm font-bold text-orange-400 mb-4">
                            <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs border border-orange-500/30">3</span>
                            توجيه العميل إلى قسم محدد (اختياري)
                        </label>
                        
                        {isSelectedAdmin ? (
                             <div className="flex flex-col items-center justify-center p-6 bg-blue-900/10 rounded-xl border border-blue-500/20 text-center">
                                 <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                                     <UserIcon className="w-6 h-6 text-blue-400" />
                                 </div>
                                 <p className="text-blue-200 text-sm font-bold">تم اختيار حساب الإدارة</p>
                                 <p className="text-blue-400/60 text-xs mt-1">سيظهر شعار الإدارة على السلايدر</p>
                             </div>
                        ) : categoryOptions.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setSelectedCategory('')} 
                                    className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-24 group ${selectedCategory === '' ? 'bg-red-600/10 border-red-500 shadow-lg shadow-red-900/20' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                                >
                                    <BuildingStorefrontIcon className={`w-6 h-6 ${selectedCategory === '' ? 'text-red-500' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                    <span className={`text-xs font-bold ${selectedCategory === '' ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>عرض الكل</span>
                                    {selectedCategory === '' && <div className="absolute top-2 right-2"><CheckCircleIcon className="w-4 h-4 text-red-500" /></div>}
                                </button>
                                {categoryOptions.map(cat => (
                                    <button 
                                        key={cat.value} 
                                        onClick={() => setSelectedCategory(cat.value)} 
                                        className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-24 group ${selectedCategory === cat.value ? 'bg-red-600/10 border-red-500 shadow-lg shadow-red-900/20' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                                    >
                                        <GridIcon className={`w-6 h-6 ${selectedCategory === cat.value ? 'text-red-500' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                        <span className={`text-xs font-bold text-center line-clamp-2 leading-tight ${selectedCategory === cat.value ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{cat.label}</span>
                                        {selectedCategory === cat.value && <div className="absolute top-2 right-2"><CheckCircleIcon className="w-4 h-4 text-red-500" /></div>}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 bg-gray-800/50 rounded-xl border border-gray-700 text-center border-dashed">
                                <GridIcon className="w-10 h-10 text-gray-600 mb-2 opacity-50" />
                                <p className="text-gray-400 text-xs">لا توجد أقسام معرفة لهذا المتجر.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-gray-700 bg-[#151e2d] flex gap-3">
                    <button 
                        onClick={handleSave} 
                        disabled={!selectedId} 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        حفظ الإعدادات
                    </button>
                    {initialMerchantId && (
                        <button 
                            onClick={() => onSave('', undefined, '')} 
                            className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3.5 rounded-xl transition-colors border border-red-500/20 flex items-center justify-center" 
                            title="إلغاء الربط"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const SliderSettings: React.FC<SliderSettingsProps> = ({ images, isEnabled, onAddImage, onDeleteImage, onUpdateImage, onToggleSlider, merchants = [], adminUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkingImageId, setLinkingImageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Live Preview Auto-Play Logic
  useEffect(() => {
      if (images.length > 1) {
          const interval = setInterval(() => {
              setCurrentPreviewIndex((prev) => (prev + 1) % images.length);
          }, 3000);
          return () => clearInterval(interval);
      } else {
          setCurrentPreviewIndex(0);
      }
  }, [images.length]);

  const activeImages = useMemo(() => images.filter(img => img.active !== false), [images]);
  const activePreviewImages = activeImages.length > 0 ? activeImages : [{ id: 'placeholder', url: '', active: true }];

  // Helper: Get Merchant/Category Names
  const getLinkedInfo = (img: SliderImage) => {
      if (!img.linkedMerchantId) return { name: 'غير مرتبط', type: 'none' };
      if (adminUser && img.linkedMerchantId === adminUser.id) return { name: 'الإدارة (عرض عام)', type: 'admin' };
      const merchant = merchants.find(m => m.id === img.linkedMerchantId);
      return { 
          name: merchant ? merchant.name : 'متجر غير معروف', 
          category: img.linkedCategoryId,
          type: 'merchant'
      };
  };

  // Enhanced Image Compression & Clarification
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // High Quality Dimensions
          const MAX_WIDTH = 1920; 
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
              // Save with very high quality to preserve clarity
              resolve(canvas.toDataURL('image/jpeg', 0.95));
          } else {
              reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddImage) {
      setIsUploading(true);
      try {
          const compressedUrl = await resizeImage(file);
          const newImage: SliderImage = { 
              id: `SLIDE-${Date.now()}`, 
              url: compressedUrl, 
              active: true, 
              createdAt: new Date(),
              linkedMerchantId: '',
              linkedCategoryId: ''
          };
          onAddImage(newImage);
      } catch (error) {
          console.error("Image upload failed", error);
          alert("فشل تحميل الصورة. يرجى المحاولة مرة أخرى.");
      } finally {
          setIsUploading(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onUpdateImage && editingId) {
          setIsUploading(true);
          try {
              const compressedUrl = await resizeImage(file);
              onUpdateImage(editingId, { url: compressedUrl });
              setEditingId(null);
          } catch (error) {
              console.error("Image update failed", error);
              alert("فشل تحديث الصورة.");
          } finally {
              setIsUploading(false);
          }
      }
      if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 pb-32 animate-fadeIn">
      
      {/* 1. Top Section: Live Preview (Simulation) */}
      <div className="bg-[#111] p-6 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 px-2">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-900/20">
                      <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                      <h2 className="text-xl font-black text-white tracking-wide">عروض التطبيق</h2>
                      <p className="text-xs text-gray-400 font-medium">محاكاة حية لما يراه العميل</p>
                  </div>
              </div>
              
              {/* Global Toggle */}
              <button 
                onClick={() => onToggleSlider && onToggleSlider(!isEnabled)} 
                className={`group relative flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-full transition-all duration-300 border ${isEnabled ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}
              >
                  <span className={`text-[10px] font-bold ${isEnabled ? 'text-green-400' : 'text-red-400'}`}>{isEnabled ? 'مفعل' : 'معطل'}</span>
                  <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${isEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-spring ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
              </button>
          </div>

          {/* Phone-like Preview Container */}
          <div className="relative w-full max-w-sm mx-auto aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900 group">
              {activeImages.length > 0 ? (
                  activeImages.map((img, idx) => {
                      const isVisible = idx === currentPreviewIndex;
                      const hasText = !!img.textOverlay;
                      const isAdmin = adminUser && img.linkedMerchantId === adminUser.id;
                      
                      return (
                        <div 
                            key={img.id} 
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isVisible ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            <img src={img.url} className="w-full h-full object-cover" alt="Slide" />
                            {/* Gradient Overlay for Text */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                            
                            {/* Admin Avatar Overlay (Bottom) */}
                            {isAdmin && adminUser && (
                                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full animate-fade-slide-up">
                                    <div className="w-6 h-6 rounded-full border border-white/50 overflow-hidden bg-gray-800">
                                        {adminUser.storeImage ? <img src={adminUser.storeImage} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-1 text-gray-400" />}
                                    </div>
                                    {img.textOverlay ? (
                                        <span className="text-[10px] font-bold text-white max-w-[150px] truncate">{img.textOverlay}</span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-white">الإدارة</span>
                                    )}
                                </div>
                            )}

                            {/* Normal Text Overlay (If not admin or additional) */}
                            {hasText && !isAdmin && (
                                <div className="absolute bottom-4 right-4 max-w-[70%] text-right z-20">
                                    <p className="text-white font-bold text-sm drop-shadow-md bg-black/30 backdrop-blur-sm px-3 py-1 rounded-lg inline-block border border-white/10">
                                        {img.textOverlay}
                                    </p>
                                </div>
                            )}
                        </div>
                      );
                  })
              ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                      <span className="text-xs font-bold opacity-50">لا توجد صور نشطة</span>
                  </div>
              )}
              
              {/* Dots Indicator */}
              {activeImages.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-30">
                      {activeImages.map((_, idx) => (
                          <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentPreviewIndex ? 'bg-white w-4' : 'bg-white/30 w-1'}`}></div>
                      ))}
                  </div>
              )}
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">LIVE PREVIEW MODE</p>
      </div>

      {/* 2. Management Controls */}
      <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GridIcon className="w-5 h-5 text-gray-400" />
              إدارة الشرائح ({images.length})
          </h3>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading} 
            className="bg-red-600 hover:bg-red-700 text-white pl-4 pr-5 py-2.5 rounded-xl font-bold shadow-lg shadow-red-900/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {isUploading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <UploadIcon className="w-4 h-4" />}
              <span className="text-sm">إضافة جديد</span>
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAddImage} />
          <input ref={editFileInputRef} type="file" className="hidden" accept="image/*" onChange={handleEditImage} />
      </div>

      {/* 3. Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {images.map(img => {
            const info = getLinkedInfo(img);
            const isActive = img.active !== false;

            return (
                <div key={img.id} className={`group relative bg-[#1e1e1e] rounded-3xl overflow-hidden border transition-all duration-300 ${isActive ? 'border-gray-700 shadow-lg hover:border-gray-500' : 'border-gray-800 opacity-60 hover:opacity-100'}`}>
                    
                    {/* Image Area */}
                    <div className="relative aspect-video w-full bg-gray-900 overflow-hidden">
                        <img src={img.url} alt="Slider" className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isActive ? '' : 'grayscale'}`} />
                        
                        {/* Overlay Text Preview */}
                        {img.textOverlay && (
                            <div className="absolute bottom-2 right-2 left-2 z-10">
                                <span className="text-[10px] text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded truncate block text-center border border-white/10">
                                    {img.textOverlay}
                                </span>
                            </div>
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px] z-20">
                            <button onClick={() => { setEditingId(img.id); editFileInputRef.current?.click(); }} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform" title="تغيير الصورة"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => setLinkingImageId(img.id)} className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform" title="تخصيص وربط"><LinkIcon className="w-4 h-4" /></button>
                            <button onClick={() => onDeleteImage && onDeleteImage(img.id)} className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform" title="حذف"><TrashIcon className="w-4 h-4" /></button>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-20">
                            <button 
                                onClick={() => onUpdateImage && onUpdateImage(img.id, { active: !isActive })}
                                className={`p-1.5 rounded-full backdrop-blur-md border shadow-sm transition-colors ${isActive ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-black/40 border-white/10 text-gray-400'}`}
                            >
                                {isActive ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeOffIcon className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Details Footer */}
                    <div className="p-4 border-t border-gray-700/50 bg-[#252525]">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/5 ${info.type === 'admin' ? 'bg-blue-500/10 text-blue-400' : info.type === 'merchant' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-700 text-gray-500'}`}>
                                {info.type === 'admin' ? <UserIcon className="w-4 h-4" /> : info.type === 'merchant' ? <BuildingStorefrontIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{info.name}</p>
                                <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                    {info.category ? (
                                        <>
                                            <GridIcon className="w-3 h-3" />
                                            {info.category}
                                        </>
                                    ) : (
                                        info.type === 'none' ? 'غير مرتبط' : 'عرض عام'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
          })}
          
          {images.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-[2rem] bg-[#1a1a1a]/50">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto shadow-inner border border-gray-700">
                    <ImageIcon className="w-10 h-10 text-gray-600 opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">لا توجد عروض حالياً</h3>
                <p className="text-xs text-gray-500">أضف صور جذابة لزيادة مبيعات المتاجر</p>
            </div>
          )}
      </div>
      
      {linkingImageId && (
          <LinkMerchantModal 
            onClose={() => setLinkingImageId(null)} 
            onSave={(mid, cid, txt) => { 
                if (onUpdateImage && linkingImageId) { 
                    onUpdateImage(linkingImageId, { 
                        linkedMerchantId: mid || undefined, 
                        linkedCategoryId: cid || undefined,
                        textOverlay: txt || undefined
                    }); 
                    setLinkingImageId(null); 
                } 
            }} 
            merchants={merchants} 
            adminUser={adminUser}
            initialMerchantId={images.find(i => i.id === linkingImageId)?.linkedMerchantId} 
            initialCategoryId={images.find(i => i.id === linkingImageId)?.linkedCategoryId} 
            initialText={images.find(i => i.id === linkingImageId)?.textOverlay}
          />
      )}
    </div>
  );
};

export default SliderSettings;
