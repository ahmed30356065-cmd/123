
import React, { useState, useEffect, useMemo } from 'react';
import { Order, User, Customer, OrderStatus, CartItem, SupervisorPermission } from '../../types';
import { XIcon, CheckCircleIcon, ImageIcon, ChevronLeftIcon, PencilIcon, DollarSignIcon, LockIcon } from '../icons';

interface EditOrderModalProps {
  order: Order;
  merchants: User[];
  drivers: User[];
  onClose: () => void;
  onSave: (updatedData: {
    customer: Customer,
    notes?: string,
    merchantId: string,
    merchantName: string,
    driverId?: string | null,
    deliveryFee?: number | null,
    items?: CartItem[],
    totalPrice?: number,
    status?: OrderStatus // Allow status updates if needed
  }) => void;
  currentUserRole?: string;
  currentUserPermissions?: SupervisorPermission[];
  currentUser?: User;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, merchants, drivers, onClose, onSave, currentUserRole, currentUserPermissions, currentUser }) => {

  // 1. Check if user is Supervisor
  const isSupervisor = currentUserRole === 'supervisor';

  // 2. Check Permission
  const hasFinancialPermission = !isSupervisor || (currentUserPermissions?.includes('manage_advanced_financials'));

  // 3. Check Merchant Configuration (Does this merchant allow financial edits?)
  const selectedMerchantForCheck = merchants.find(m => m.id === order.merchantId);
  const merchantAllowsFinancials = selectedMerchantForCheck?.canManageAdvancedFinancials !== false; // Default allowed unless explicitly false

  // FINAL DECISION: Can this user edit price/payment?
  // Admin ALWAYS can. Supervisor needs Permission. Merchant Config is secondary layer if needed (but prompt focused on Supervisor Permission).
  // Let's enforce Supervisor Permission strictly.
  const canEditFinancials = currentUserRole === 'admin' || (isSupervisor && hasFinancialPermission);

  // EXCEPTION: Delivery Fee is editable by Supervisors (regardless of specific permissions for now, to fix user issue)
  const canEditDeliveryFee = currentUserRole === 'admin' || isSupervisor;





  // Safeguard: order.customer might be null in old records
  const [customer, setCustomer] = useState<Customer>(order.customer || { phone: '', address: '' });
  const [notes, setNotes] = useState(order.notes || '');
  const [merchantId, setMerchantId] = useState<string>(order.merchantId);
  const [driverId, setDriverId] = useState<string>(order.driverId || '');
  // Handle 0 correctly by checking against null/undefined specifically
  const [deliveryFee, setDeliveryFee] = useState<number | string>(order.deliveryFee !== undefined && order.deliveryFee !== null ? order.deliveryFee : '');

  // New state for editing items
  const [items, setItems] = useState<CartItem[]>(order.items || []);

  // Base Price Logic
  // If items exist, base is sum of items. If manual, base is originalPrice (preferred) or totalPrice.
  const initialBasePrice = (items.length > 0)
    ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : (order.originalPrice || order.totalPrice || 0);

  const [basePrice, setBasePrice] = useState<number>(initialBasePrice);
  const [discount, setDiscount] = useState<number>(order.discount || 0);

  const [error, setError] = useState('');

  // Tab State
  type Tab = 'details' | 'products' | 'delivery';
  const initialTab: Tab = (order.type === 'shopping_order' && items.length > 0) ? 'products' : 'details';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const commonInputStyle = "w-full px-4 py-3 border border-gray-600 bg-[#111] text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm";

  // Recalculate base price whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const newTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setBasePrice(newTotal);
    }
    // If no items, basePrice is manually controlled (we might need an input for it if type is manual)
  }, [items]);

  // Calculate Grand Total (Base - Discount + Fee)
  const grandTotal = useMemo(() => {
    const fee = deliveryFee === '' ? 0 : parseFloat(String(deliveryFee));
    const validFee = isNaN(fee) ? 0 : fee;
    const priceAfterDiscount = Math.max(0, basePrice - discount);
    return priceAfterDiscount + validFee;
  }, [basePrice, discount, deliveryFee]);

  const handleItemPriceChange = (index: number, newPrice: string) => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue)) return;

    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], price: priceValue };
    setItems(updatedItems);
  };

  const handleSave = () => {
    if (!customer.phone || !customer.address || !merchantId) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      // Switch to details tab if error is there
      if (!customer.phone || !customer.address || !merchantId) setActiveTab('details');
      return;
    }

    // Validating basic phone format
    if (!/^\d{11}$/.test(customer.phone)) {
      setError('رقم الهاتف يجب أن يتكون من 11 رقم.');
      setActiveTab('details');
      return;
    }

    // Logic for Fee: If empty, send null to clear it
    const fee = deliveryFee !== '' ? parseFloat(String(deliveryFee)) : null;

    // RULE: Only Admin can accept/assign with 0 fee
    // If NOT admin, and assigning driver (or updating pending w/ assign), fee must be > 0
    if (currentUserRole !== 'admin') {
      if (order.status === OrderStatus.Pending && driverId && (fee === undefined || fee === null || fee <= 0)) {
        setError('يجب تحديد سعر توصيل صالح (أكبر من صفر). فقط الإدارة يمكنها قبول طلبات مجانية.');
        setActiveTab('delivery');
        return;
      }
    }

    // Lookup merchant name to ensure consistency
    const selectedMerchant = merchants.find(m => m.id === merchantId);
    const merchantName = selectedMerchant ? selectedMerchant.name : (order.merchantName || 'Unknown');

    setError('');

    // Construct the update object
    const updatePayload: any = {
      customer,
      notes,
      merchantId,
      merchantName,
      driverId: driverId || null, // Send null if empty to unassign
      deliveryFee: fee,
      totalPrice: Math.max(0, basePrice - discount),
      originalPrice: basePrice,
      discount: discount
    };

    // If shopping order, include updated items
    if (order.type === 'shopping_order') {
      updatePayload.items = items;
      // totalPrice is already set above
    }



    onSave(updatePayload);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  // Render Tabs
  const renderTabButton = (id: Tab, label: string, icon: React.ReactNode, show: boolean = true) => {
    if (!show) return null;
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex-1 py-3 px-2 text-center text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${isActive
          ? 'border-blue-500 text-blue-400 bg-[#1f2937]'
          : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1f2937]/50'
          }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#111827] flex flex-col">

      {/* Full Page Header */}
      <div className="flex-none bg-[#1f2937] border-b border-gray-700 flex items-center justify-between px-4 pt-8 pb-4 min-h-[90px] shadow-xl z-20">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white transition-colors border border-gray-700">
            <ChevronLeftIcon className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PencilIcon className="w-4 h-4 text-blue-400" />
              تعديل الطلب
            </h3>
            <p className="font-mono text-[10px] text-blue-300 opacity-80 tracking-wider">#{order.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block text-right">
            <p className="text-[10px] text-gray-400">الإجمالي</p>
            <p className="text-sm font-bold text-green-400 font-mono">{grandTotal.toLocaleString()} ج.م</p>
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg active:scale-95 text-sm flex items-center gap-2"
          >
            <CheckCircleIcon className="w-4 h-4" />
            حفظ
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex-none bg-[#111] border-b border-gray-800 flex sticky top-0 z-10">
        {renderTabButton('details', 'البيانات', <div className="w-2 h-2 rounded-full bg-red-500" />)}
        {renderTabButton('products', 'المنتجات', <div className="w-2 h-2 rounded-full bg-yellow-500" />, order.type === 'shopping_order')}
        {renderTabButton('delivery', 'التوصيل', <div className="w-2 h-2 rounded-full bg-blue-500" />)}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#111827] relative">
        <div className="p-4 pb-12 space-y-4">

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/50 text-center animate-bounce mb-4">
              <p className="text-red-400 text-xs font-bold">{error}</p>
            </div>
          )}

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#1f2937] p-4 rounded-2xl border border-gray-700">
                <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">بيانات العميل والتاجر</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-bold">التاجر</label>
                    <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className={commonInputStyle} required>
                      <option value="" disabled>-- اختر التاجر --</option>
                      {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5 font-bold">رقم العميل</label>
                      <input type="tel" name="phone" value={customer.phone} onChange={handleCustomerChange} className={`${commonInputStyle} font-mono text-center text-lg tracking-widest`} required dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5 font-bold">العنوان التفصيلي</label>
                      <input type="text" name="address" value={customer.address} onChange={handleCustomerChange} className={commonInputStyle} required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-bold">ملاحظات إضافية</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${commonInputStyle} resize-none`}></textarea>
                  </div>

                  {/* Manual Price Editing for Non-Shopping Orders or overrides */}
                  {items.length === 0 && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700 mt-4">
                      <div>
                        {/* Check Permissions for Price Editing */}
                        <label className={`block text-xs mb-1.5 font-bold ${!canEditFinancials ? 'text-gray-600' : 'text-red-400'}`}>السعر الأصلي (قبل الخصم)</label>
                        <input
                          type="number"
                          value={basePrice}
                          onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                          className={`${commonInputStyle} ${!canEditFinancials ? 'opacity-50 cursor-not-allowed bg-gray-900 border-gray-800 text-gray-500' : ''}`}
                          placeholder="0.00"
                          disabled={!canEditFinancials}
                        />
                        {!canEditFinancials && <p className="text-[9px] text-red-500 mt-1">* يتطلب صلاحية مالية متقدمة</p>}
                      </div>
                      <div>
                        <label className={`block text-xs mb-1.5 font-bold ${!canEditFinancials ? 'text-gray-600' : 'text-yellow-500'}`}>الخصم</label>
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          className={`${commonInputStyle} ${!canEditFinancials ? 'opacity-50 cursor-not-allowed bg-gray-900 border-gray-800 text-gray-500' : ''}`}
                          placeholder="0.00"
                          disabled={!canEditFinancials}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl flex justify-between items-center mb-2">
                <span className="text-yellow-500 text-xs font-bold">يمكنك تعديل أسعار المنتجات مباشرة</span>
                <span className="text-white font-mono text-sm font-bold bg-yellow-500/20 px-2 py-1 rounded">{basePrice.toLocaleString()} ج.م</span>
              </div>

              {/* Discount Input for Products Tab */}
              <div className="bg-[#1f2937] p-3 rounded-xl border border-gray-700 flex justify-between items-center mb-2">
                <label className={`text-xs font-bold ${!canEditFinancials ? 'text-gray-500' : 'text-gray-400'}`}>قيمة الخصم</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    disabled={!canEditFinancials}
                    className={`w-24 border rounded-lg py-1 px-2 text-center font-bold ${!canEditFinancials ? 'bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed' : 'bg-[#111] border-gray-600 text-white'}`}
                  />
                  <span className="text-xs text-gray-500">ج.م</span>
                </div>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#1f2937] p-3 rounded-xl border border-gray-700 shadow-sm">
                  <div className="w-14 h-14 bg-[#111] rounded-lg overflow-hidden flex-shrink-0 border border-gray-600">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon className="w-5 h-5" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-1">الكمية: <span className="text-blue-300 font-mono font-bold">{item.quantity}</span></p>
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] text-gray-500 block mb-1 text-center">السعر</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                      disabled={!canEditFinancials}
                      className={`w-full border text-sm rounded-lg py-2 text-center font-bold ${!canEditFinancials ? 'bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed' : 'bg-[#111] border-gray-600 text-white focus:border-yellow-500 focus:outline-none'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DELIVERY */}
          {activeTab === 'delivery' && (
            <div className="space-y-4 animate-fadeIn">

              <div className="bg-[#1f2937] p-4 rounded-xl border border-gray-700">
                <label className={`block text-xs mb-2 font-bold uppercase ${!canEditDeliveryFee ? 'text-gray-600' : 'text-gray-400'}`}>سعر التوصيل (EGP)</label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    lang="en"
                    value={deliveryFee}
                    onChange={(e) => {
                      // Allow only numbers and decimals
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setDeliveryFee(val);
                    }}
                    placeholder="0"
                    dir="ltr"
                    disabled={!canEditDeliveryFee}
                    className={`w-full border text-xl font-bold py-3 px-4 pl-12 rounded-xl font-mono ${!canEditDeliveryFee ? 'bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed' : 'bg-[#111] border-gray-600 text-white focus:border-blue-500 focus:outline-none'}`}
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">EGP</span>
                </div>
                {!canEditDeliveryFee && <p className="text-[10px] text-red-500 mt-2 font-bold">* لا تملك صلاحية تعديل رسوم التوصيل</p>}
              </div>

              <div className="bg-[#1f2937] p-4 rounded-xl border border-gray-700 flex-1 flex flex-col">
                <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex justify-between items-center">
                  <span>اختر المندوب</span>
                  <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded-full text-white">{drivers.length} متاح</span>
                </h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => setDriverId('')}
                    className={`w-full flex justify-between items-center text-right p-3 rounded-xl transition-all border ${driverId === '' ? 'bg-red-500/10 border-red-500/50' : 'bg-[#111] border-gray-800 hover:border-gray-600'}`}
                  >
                    <span className={`text-sm font-bold ${driverId === '' ? 'text-red-400' : 'text-gray-400'}`}>بدون مندوب (إلغاء)</span>
                    {driverId === '' && <CheckCircleIcon className="w-5 h-5 text-red-500" />}
                  </button>
                  {drivers.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDriverId(d.id)}
                      className={`w-full flex justify-between items-center text-right p-3 rounded-xl transition-all border ${driverId === d.id
                        ? 'bg-blue-600 border-blue-500 shadow-lg scale-[1.01]'
                        : 'bg-[#111] border-gray-800 hover:border-gray-500'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${driverId === d.id ? 'bg-white text-blue-600' : 'bg-gray-800 text-gray-400'}`}>
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <span className={`font-bold text-sm block ${driverId === d.id ? 'text-white' : 'text-gray-200'}`}>{d.name}</span>
                          <span className={`text-[10px] font-mono ${driverId === d.id ? 'text-blue-100' : 'text-gray-500'}`}>{d.phone}</span>
                        </div>
                      </div>
                      {driverId === d.id && <CheckCircleIcon className="w-5 h-5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
