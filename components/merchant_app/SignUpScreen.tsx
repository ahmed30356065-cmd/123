
import React, { useState } from 'react';
import { Role } from '../types';

interface SignUpScreenProps {
  onSignUp: (user: { name: string; phone: string; password?: string; role: Role }) => Promise<{ success: boolean; message: string }>;
  onBackToLogin: () => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp, onBackToLogin }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'driver' | 'merchant'>('driver');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !phone || !password || !confirmPassword) {
      setError('يرجى ملء جميع الحقول.');
      return;
    }

    if (!/^\d{11}$/.test(phone)) {
        setError('رقم الهاتف يجب أن يتكون من 11 رقم.');
        return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    const result = await onSignUp({
      name,
      phone,
      password,
      role,
    });

    if (!result.success) {
      setError(result.message);
    }
    // On success, App.tsx will handle navigation and notification.
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-red-500">إنشاء حساب جديد</h1>
          <p className="text-gray-400 mt-2">انضم إلى منصتنا</p>
        </div>
        
        <div className="flex justify-center mb-8">
            <button 
                onClick={() => setRole('driver')}
                className={`px-8 py-2 text-sm font-bold rounded-full transition-colors ${role === 'driver' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
                مندوب
            </button>
            <button 
                onClick={() => setRole('merchant')}
                className={`px-8 py-2 text-sm font-bold rounded-full transition-colors mr-2 ${role === 'merchant' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
                تاجر
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
              الاسم الكامل
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">
              رقم الهاتف (سيستخدم للدخول)
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              placeholder="يجب أن يتكون من 11 رقم"
            />
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-gray-400 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
           <div>
            <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-400 mb-2">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors mt-2"
          >
            إنشاء حساب
          </button>
        </form>
        <div className="text-center mt-6">
            <button onClick={onBackToLogin} className="text-sm text-gray-400 hover:text-red-500">
                لديك حساب بالفعل؟ <span className="font-bold">تسجيل الدخول</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;
