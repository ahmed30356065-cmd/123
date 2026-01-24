
import React, { useState, useRef, useMemo } from 'react';
import { User, Product, ProductSize } from '../../types';
import { PlusIcon, TrashIcon, ImageIcon, XIcon, PencilIcon, GridIcon, EyeIcon, MinusIcon, UploadIcon } from '../icons';
import useAndroidBack from '../../hooks/useAndroidBack';
import ConfirmationModal from '../admin/ConfirmationModal';

interface MenuManagerProps {
  merchant: User;
  onUpdateMerchant: (merchantId: string, data: Partial<User>) => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({ merchant, onUpdateMerchant }) => {
  const [products, setProducts] = useState<Product[]>(merchant.products || []);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  
  // Size Management State
  const [currentSizes, setCurrentSizes] = useState<ProductSize[]>([]);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizePrice, setNewSizePrice] = useState('');

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('الكل');
  const [isUploading, setIsUploading] = useState(false); 
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  // Modal for delete confirmation
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useAndroidBack(() => {
      if (productToDelete) { setProductToDelete(null); return true; }
      if (zoomedImage) { setZoomedImage(null); return true; }
      if (isEditing) { setIsEditing(false); return true; }
      return false;
  }, [zoomedImage, isEditing, productToDelete]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'عام'));
    return ['الكل', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategoryFilter === 'الكل') return products;
    return products.filter(p => (p.category || 'عام') === activeCategoryFilter);
  }, [products, activeCategoryFilter]);

  // High Quality Image Processor for Products
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Enhanced Resolution
          const MAX_WIDTH = 1200; 
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              // High Quality Smoothing
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.9)); // Quality 90%
          } else {
              reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressedImage = await resizeImage(file);
        // Simulate a slight delay for the water effect to be visible
        setTimeout(() => {
            setCurrentProduct(prev => ({ ...prev, image: compressedImage }));
            setIsUploading(false);
        }, 800);
      } catch (error) {
        setIsUploading(false);
        alert("فشل تحميل الصورة.");
      }
    }
  };

  // --- Size Handlers ---
  const handleAddSize = () => {
      if (newSizeName && newSizePrice) {
          setCurrentSizes([...currentSizes, { name: newSizeName, price: parseFloat(newSizePrice) }]);
          setNewSizeName('');
          setNewSizePrice('');
      }
  };

  const handleRemoveSize = (index: number) => {
      setCurrentSizes(currentSizes.filter((_, i) => i !== index));
  };

  const handleSaveProduct = () => {
    if (!currentProduct.name) return;
    // Price is required unless sizes are present, but let's enforce a base price always as fallback or 'starts from'
    if (!currentProduct.price && currentSizes.length === 0) return;

    let updatedProducts = [...products];
    const categoryToSave = currentProduct.category?.trim() || 'عام';

    const productData: Product = {
      id: currentProduct.id || `PROD-${Date.now()}`,
      name: currentProduct.name,
      description: currentProduct.description || '',
      price: Number(currentProduct.price) || 0,
      image: currentProduct.image,
      available: currentProduct.available ?? true,
      category: categoryToSave,
      sizes: currentSizes.length > 0 ? currentSizes : undefined
    };

    if (currentProduct.id) {
      updatedProducts = updatedProducts.map(p => p.id === currentProduct.id ? productData : p);
    } else {
      updatedProducts.push(productData);
    }

    setProducts(updatedProducts);
    onUpdateMerchant(merchant.id, { products: updatedProducts });
    setIsEditing(false);
    setCurrentProduct({});
    setCurrentSizes([]);
    setActiveCategoryFilter(categoryToSave);
  };

  const confirmDeleteProduct = () => {
    if(!productToDelete) return;
    const updatedProducts = products.filter(p => p.id !== productToDelete);
    setProducts(updatedProducts);
    onUpdateMerchant(merchant.id, { products: updatedProducts });
    setProductToDelete(null);
  };

  const openEdit = (product?: Product) => {
    setCurrentProduct(product || { available: true, category: activeCategoryFilter !== 'الكل' ? activeCategoryFilter : '' });
    setCurrentSizes(product?.sizes || []);
    setIsEditing(true);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GridIcon className="w-6 h-6 text-red-500" />
            إدارة المنيو
        </h2>
        <button 
          onClick={() => openEdit()}
          className="flex items-center bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-red-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 ml-1" />
          إضافة منتج
        </button>
      </div>

      {/* Category Tabs */}
      {!isEditing && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4 px-1">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${
                        activeCategoryFilter === cat 
                        ? 'bg-red-600 text-white border-red-600 shadow-md' 
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                    }`}
                >
                    {cat}
                </button>
            ))}
          </div>
      )}

      {/* Add/Edit Form */}
      {isEditing && (
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4 mb-6 shadow-2xl animate-fadeIn">
          <div className="flex justify-between items-center border-b border-gray-700 pb-3">
            <h3 className="text-lg font-bold text-gray-200">{currentProduct.id ? 'تعديل منتج' : 'منتج جديد'}</h3>
            <button onClick={() => setIsEditing(false)}><XIcon className="w-5 h-5 text-gray-400 hover:text-white"/></button>
          </div>
          
          <div className="flex justify-center mb-4">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`w-full h-40 bg-gray-900 rounded-xl flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-600 hover:border-red-500 overflow-hidden relative group transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {/* Water Ripple Effect Overlay */}
              {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
                      <div className="relative">
                          <div className="w-12 h-12 bg-blue-500 rounded-full opacity-75 animate-ping absolute top-0 left-0"></div>
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-blue-500/50">
                              <UploadIcon className="w-6 h-6 text-white animate-bounce" />
                          </div>
                          <div className="w-20 h-20 border-4 border-blue-400/30 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                      </div>
                  </div>
              )}

              {currentProduct.image ? (
                <img src={currentProduct.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-xs">اضغط لإضافة صورة</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">اسم المنتج</label>
            <input 
                type="text" 
                value={currentProduct.name || ''} 
                onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-red-500 outline-none"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="w-1/2">
                <label className="block text-xs text-gray-400 mb-1">السعر الأساسي (ج.م)</label>
                <input 
                    type="number" 
                    value={currentProduct.price || ''} 
                    onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-red-500 outline-none font-bold"
                    placeholder="0"
                />
            </div>
            <div className="w-1/2">
                <label className="block text-xs text-gray-400 mb-1">القسم</label>
                <input 
                    type="text" 
                    list="category-suggestions"
                    value={currentProduct.category || ''} 
                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-red-500 outline-none"
                    placeholder="مثال: بيتزا"
                />
                <datalist id="category-suggestions">
                    {categories.filter(c => c !== 'الكل').map(cat => <option key={cat} value={cat} />)}
                </datalist>
            </div>
          </div>

          {/* SIZES SECTION */}
          <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700">
              <label className="block text-xs font-bold text-gray-300 mb-2">أحجام مختلفة (اختياري)</label>
              
              <div className="space-y-2 mb-3">
                  {currentSizes.map((size, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-800 p-2 rounded-md border border-gray-600">
                          <span className="flex-1 text-sm text-white">{size.name}</span>
                          <span className="text-sm font-bold text-green-400">{size.price.toLocaleString('en-US')} ج.م</span>
                          <button onClick={() => handleRemoveSize(idx)} className="text-red-400 hover:bg-red-500/10 p-1 rounded"><TrashIcon className="w-4 h-4"/></button>
                      </div>
                  ))}
              </div>

              <div className="flex gap-2">
                  <input 
                      type="text" 
                      placeholder="الحجم (مثال: كبير)" 
                      value={newSizeName}
                      onChange={e => setNewSizeName(e.target.value)}
                      className="flex-[2] bg-gray-700 text-white text-xs p-2 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  />
                  <input 
                      type="number" 
                      placeholder="السعر" 
                      value={newSizePrice}
                      onChange={e => setNewSizePrice(e.target.value)}
                      className="flex-1 bg-gray-700 text-white text-xs p-2 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  />
                  <button onClick={handleAddSize} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"><PlusIcon className="w-4 h-4" /></button>
              </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">الوصف</label>
            <textarea 
                value={currentProduct.description || ''} 
                onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-red-500 outline-none resize-none"
                rows={3}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
             <input 
                type="checkbox" 
                id="available"
                checked={currentProduct.available !== false}
                onChange={e => setCurrentProduct({...currentProduct, available: e.target.checked})}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500"
             />
             <label htmlFor="available" className="text-sm text-gray-300">المنتج متاح للطلب</label>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors font-bold">إلغاء</button>
            <button 
                onClick={handleSaveProduct} 
                disabled={isUploading}
                className="px-8 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg transition-colors font-bold disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isUploading ? 'جاري المعالجة...' : 'حفظ المنتج'}
            </button>
          </div>
        </div>
      )}

      {/* Products List Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn">
        {filteredProducts.map(product => (
          <div key={product.id} className="group bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-sm hover:shadow-xl hover:border-gray-500 transition-all duration-300 flex flex-col">
            <div className="relative aspect-square w-full bg-gray-900 overflow-hidden cursor-pointer" onClick={() => product.image && setZoomedImage(product.image)}>
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon className="w-10 h-10 opacity-30" /></div>
              )}
              {!product.available && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]"><span className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full font-bold shadow-md">غير متاح</span></div>}
            </div>

            <div className="p-3 flex-1 flex flex-col">
              <h4 className="font-bold text-white text-sm mb-1 line-clamp-1" title={product.name}>{product.name}</h4>
              <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-2 flex-1">{product.description}</p>
              
              <div className="flex justify-between items-center mt-auto">
                  <div className="flex flex-col">
                      <span className="text-red-400 font-black text-sm">{product.price.toLocaleString('en-US')} <span className="text-[9px]">ج.م</span></span>
                      {product.sizes && product.sizes.length > 0 && <span className="text-[9px] text-green-400">+ {product.sizes.length} أحجام</span>}
                  </div>
                  <span className="text-[9px] font-mono bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-600 truncate max-w-[60px]">{product.category || 'عام'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-gray-700 border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm">
                <button onClick={() => openEdit(product)} className="py-2.5 flex items-center justify-center text-blue-400 hover:bg-blue-500/10 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => setProductToDelete(product.id)} className="py-2.5 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !isEditing && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-800/30 rounded-3xl border border-dashed border-gray-700 mx-1">
                <GridIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold text-gray-400">القائمة فارغة</p>
            </div>
      )}

      {zoomedImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={() => setZoomedImage(null)}>
              <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-full text-white hover:bg-gray-700 transition-colors z-20"><XIcon className="w-6 h-6" /></button>
              <img src={zoomedImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()} />
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
          <ConfirmationModal 
            title="حذف المنتج"
            message="هل أنت متأكد من حذف هذا المنتج نهائياً من القائمة؟"
            onClose={() => setProductToDelete(null)}
            onConfirm={confirmDeleteProduct}
            confirmButtonText="حذف"
            confirmVariant="danger"
          />
      )}
    </div>
  );
};

export default MenuManager;
