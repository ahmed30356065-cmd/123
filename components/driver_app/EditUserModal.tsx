


import React, { useState } from 'react';
import { User, SupervisorPermission, Role } from '../../types';
import { XIcon } from '../icons';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updatedData: Partial<User>) => void;
  isLastAdmin: boolean;
  isPrimaryAdmin?: boolean;
  appName?: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, isLastAdmin, isPrimaryAdmin, appName }) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [status, setStatus] = useState(user.status);
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [commissionRate, setCommissionRate] = useState(user.commissionRate || 0);
  const [commissionType, setCommissionType] = useState(user.commissionType || 'percentage');
  const [incentivesActive, setIncentivesActive] = useState(user.incentivesActive || false);
  const [permissions, setPermissions] = useState<SupervisorPermission[]>(user.permissions || []);
  const [dailyLogMode, setDailyLogMode] = useState<'12_hour' | 'always_open'>(user.dailyLogMode || '12_hour');
  const [error, setError] = useState('');
  
  const commonInputStyle = "mt-1 w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500";

  const permissionOptions: { id: SupervisorPermission, label: string }[] = [
    { id: 'view_orders', label: 'عرض الطلبات' },
    { id: 'manage_orders', label: 'إدارة الطلبات' },
    { id: 'view_reports', label: 'عرض التقارير' },
    { id: 'view_users', label: 'عرض المستخدمين' },
    { id: 'manage_users', label: 'إدارة المستخدمين' },
    { id: 'view_wallet', label: 'عرض المحفظة' },
  ];
  
  const ROLES: { id: Role; label: string; }[] = [
      { id: 'driver', label: 'مندوب' },
      { id: 'merchant', label: 'تاجر' },
      { id: 'supervisor', label: 'مشرف' },
      { id: 'admin', label: 'مدير' },
  ];

  const displayedAppName = appName || 'GOO NOW';

  const handlePermissionChange = (permission: SupervisorPermission) => {
    setPermissions(prev => 
        prev.includes(permission) 
            ? prev.filter(p => p !== permission) 
            : [...prev, permission]
    );
  };

  const isEligibleForIncentives = () => {
    if (!user.createdAt) return false;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return new Date(user.createdAt) < threeMonthsAgo;
  };
  const eligibleForIncentives = isEligibleForIncentives();

  const handleSave = () => {
    if (!name) {
        setError('حقل الاسم لا يمكن أن يكون فارغاً.');
        return;
    }
    
    if (phone && !/^\d{11}$/.test(phone)) {
        setError('رقم الهاتف يجب أن يتكون من 11 رقم.');
        return;
    }

    if (password) {
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
    }
    setError('');
    
    const updatedData: Partial<User> = { name, phone, status, role };

    if (password) {
        updatedData.password = password;
    }

    if (role === 'driver') {
        updatedData.commissionRate = commissionRate;
        updatedData.commissionType = commissionType;
        updatedData.incentivesActive = incentivesActive;
        updatedData.dailyLogMode = dailyLogMode;
    }

    if (role === 'supervisor') {
        updatedData.permissions = permissions;
    }
    
    onSave(user.id, updatedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">تعديل المستخدم <span className="font-mono text-sm text-red-400">{user.id}</span></h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">الاسم</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={commonInputStyle} required />
            </div>
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">رقم الهاتف</label>
                <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={commonInputStyle} placeholder="يجب أن يتكون من 11 رقم" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الدور</label>
                <div className={`flex bg-gray-700 p-1 rounded-lg ${isLastAdmin || isPrimaryAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {ROLES.map(r => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => setRole(r.id)}
                            disabled={isLastAdmin || isPrimaryAdmin}
                            className={`w-full py-2 text-sm font-bold rounded-md transition-colors ${
                            role === r.id ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                            } disabled:hover:bg-gray-700 disabled:cursor-not-allowed`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                {isLastAdmin && !isPrimaryAdmin && <p className="text-xs text-yellow-400 mt-1">لا يمكن تغيير دور المسؤول الوحيد المتبقي.</p>}
                {isPrimaryAdmin && <p className="text-xs text-yellow-400 mt-1">لا يمكن تغيير دور المسؤول الأساسي.</p>}
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الحالة</label>
                <div className={`flex bg-gray-700 p-1 rounded-lg ${isPrimaryAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {([
                        { value: 'active', label: 'نشط' },
                        { value: 'pending', label: 'قيد المراجعة' },
                        { value: 'inactive', label: 'غير نشط' },
                    ] as const).map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setStatus(s.value)}
                            disabled={isPrimaryAdmin}
                            className={`w-full py-2 text-sm font-bold rounded-md transition-colors ${
                            status === s.value ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                            } disabled:hover:bg-gray-700 disabled:cursor-not-allowed`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
             <div className="space-y-4 pt-4 border-t border-gray-700">
                <h4 className="font-semibold text-gray-400">إعادة تعيين كلمة المرور</h4>
                 <div>
                    <label htmlFor="password"  className="block text-sm font-medium text-gray-300">
                        كلمة المرور الجديدة (اتركه فارغاً لعدم التغيير)
                    </label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={commonInputStyle} />
                </div>
                <div>
                    <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-300">
                        تأكيد كلمة المرور الجديدة
                    </label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={commonInputStyle} />
                </div>
            </div>

            {role === 'driver' && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                    <h4 className="font-semibold text-gray-400">إعدادات المندوب</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">نظام اليومية</label>
                        <div className="flex bg-gray-700 p-1 rounded-lg">
                            {[
                                { value: '12_hour', label: 'كل 12 ساعة' },
                                { value: 'always_open', label: 'مفتوح دائماً' },
                            ].map((mode) => (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => setDailyLogMode(mode.value as '12_hour' | 'always_open')}
                                    className={`w-full py-2 text-sm font-bold rounded-md transition-colors ${
                                    dailyLogMode === mode.value ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>
                   <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">نسبة عمولة {displayedAppName}</label>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">نسبة مئوية</p>
                                <div className="flex bg-gray-700 p-1 rounded-lg">
                                    {[0, 25, 50].map((rate) => (
                                        <button
                                            key={`perc-${rate}`}
                                            type="button"
                                            onClick={() => { setCommissionType('percentage'); setCommissionRate(rate); }}
                                            className={`w-full py-2 text-sm font-bold rounded-md transition-colors ${
                                                commissionType === 'percentage' && commissionRate === rate ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {rate}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">مبلغ ثابت (خصم على الأوردر)</p>
                                <div className="flex bg-gray-700 p-1 rounded-lg">
                                    {[5, 10].map((rate) => (
                                        <button
                                            key={`fixed-${rate}`}
                                            type="button"
                                            onClick={() => { setCommissionType('fixed'); setCommissionRate(rate); }}
                                            className={`w-full py-2 text-sm font-bold rounded-md transition-colors ${
                                                commissionType === 'fixed' && commissionRate === rate ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {rate} ج.م
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="incentivesActive"
                            type="checkbox"
                            checked={incentivesActive}
                            onChange={(e) => setIncentivesActive(e.target.checked)}
                            disabled={!eligibleForIncentives}
                            className="h-4 w-4 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500 disabled:opacity-50"
                        />
                        <label htmlFor="incentivesActive" className={`mr-2 text-sm font-medium ${!eligibleForIncentives ? 'text-gray-500' : 'text-gray-300'}`}>
                            تفعيل الحوافز
                        </label>
                    </div>
                    {!eligibleForIncentives && (
                        <p className="text-xs text-gray-500">الحوافز متاحة بعد 3 أشهر من تاريخ إنشاء الحساب.</p>
                    )}
                </div>
            )}

            {user.role === 'supervisor' && (
                <div className="space-y-3 pt-4 border-t border-gray-700">
                    <label className="block text-sm font-medium text-gray-300">صلاحيات المشرف</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {permissionOptions.map(opt => (
                            <label key={opt.id} className="flex items-center space-x-2 space-x-reverse p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                                <input 
                                    type="checkbox"
                                    checked={permissions.includes(opt.id)}
                                    onChange={() => handlePermissionChange(opt.id)}
                                    className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-200">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
        <div className="bg-gray-900 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-600 px-6 py-2 bg-transparent text-sm font-semibold text-gray-300 hover:bg-gray-700 shadow-sm focus:outline-none transition-all duration-150"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent px-6 py-2 text-sm font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-150 ease-in-out hover:shadow-lg hover:-translate-y-px bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;