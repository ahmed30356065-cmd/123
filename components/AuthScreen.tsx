
import React, { useState, useEffect } from 'react';
import { XIcon, PhoneIcon, EyeIcon, EyeOffIcon, ChevronLeftIcon } from './icons';
import { NativeBridge } from '../utils/NativeBridge';
import useAndroidBack from '../hooks/useAndroidBack';
import { AppConfig } from '../types';

const ForgotPasswordModal: React.FC<{
    onClose: () => void;
    onRequestReset: (phone: string) => Promise<{ success: boolean; message: string }>;
}> = ({ onClose, onRequestReset }) => {
    useAndroidBack(() => { onClose(); return true; });
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!phone) {
            setError('يرجى إدخال رقم الهاتف.');
            return;
        }


        setIsLoading(true);
        const result = await onRequestReset(phone);
        setIsLoading(false);

        if (result.success) {
            setIsSuccess(true);
            setMessage(result.message);
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[60] p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-sm text-white border border-white/10 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#151e2d]">
                    <h3 className="text-lg font-bold text-white tracking-wide">إعادة تعيين كلمة المرور</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {isSuccess ? (
                        <div className="text-center py-6 animate-fade-slide-up">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-green-500/30">
                                <PhoneIcon className="w-10 h-10 text-green-500" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">تم الإرسال</h4>
                            <p className="text-green-400 font-medium text-sm leading-relaxed">{message}</p>
                            <button onClick={onClose} className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all">
                                حسناً
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-slide-up">
                            <p className="text-sm text-gray-400 leading-relaxed text-center px-2">
                                أدخل رقم هاتفك المسجل. سنقوم بإرسال طلب إلى الإدارة لمساعدتك في استعادة حسابك.
                            </p>

                            <div className="space-y-2">
                                <label htmlFor="reset-phone" className="block text-xs font-bold text-gray-400 mr-1">
                                    رقم الهاتف
                                </label>
                                <div className="relative group">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-500 group-focus-within:text-red-500 transition-colors z-10 pointer-events-none">
                                        <PhoneIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        id="reset-phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                        placeholder="01xxxxxxxxx"
                                        className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all text-right font-mono text-lg shadow-inner"
                                        required
                                        dir="rtl"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-center animate-pulse">
                                    <p className="text-red-400 text-xs font-bold">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'إرسال الطلب'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};


interface AuthScreenProps {
    onPasswordLogin: (identifier: string, pass: string) => { success: boolean; message: string };
    onGoToSignUp: () => void;
    onPasswordResetRequest: (phone: string) => Promise<{ success: boolean; message: string }>;
    appConfig?: AppConfig;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onPasswordLogin, onGoToSignUp, onPasswordResetRequest, appConfig }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Default config if not provided
    const config = appConfig || { appName: 'GOO NOW', appVersion: 'VERSION 1.0.5' };

    // Logic to split title for styling
    const titleParts = config.appName.split(' ');
    const mainTitle = titleParts[0];
    const subTitle = titleParts.slice(1).join(' ');

    useEffect(() => {
        NativeBridge.reportContext('login');
    }, []);

    // Back Logic: Exit App if on Auth Screen
    useAndroidBack(() => {
        if (isForgotPasswordOpen) {
            setIsForgotPasswordOpen(false);
            return true;
        }
        return false; // Let native logic exit app
    }, [isForgotPasswordOpen]);

    const openForgotPassword = () => {
        setIsForgotPasswordOpen(true);
    };

    const closeForgotPassword = () => {
        setIsForgotPasswordOpen(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check for empty input only. 
        // We allow any length to accommodate the custom admin ID (e.g. '5').
        if (!identifier) {
            setError('يرجى إدخال رقم الهاتف.');
            return;
        }

        if (!password) {
            setError('يرجى إدخال كلمة المرور.');
            return;
        }

        setIsSubmitting(true);

        // Simulate a tiny delay for UX feedback (optional)
        await new Promise(resolve => setTimeout(resolve, 300));

        const result = await onPasswordLogin(identifier, password);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <>
            <div className="bg-black h-dvh flex flex-col items-center justify-center p-6 pt-safe text-white relative overflow-hidden" dir="rtl" style={{ fontFamily: config?.customFont ? "'AppCustomFont', 'Cairo', sans-serif" : undefined }}>

                {/* Background Ambient Effects */}
                <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[50%] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="w-full max-w-sm relative z-10 flex flex-col justify-center h-full max-h-[800px]">

                    {/* Logo Section */}
                    <div className="text-center mb-10 transform transition-all duration-700 animate-slide-down">
                        <div className="inline-block relative">
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 drop-shadow-2xl relative z-10">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">{mainTitle}</span>
                                {subTitle && <span className="text-white ml-2">{subTitle}</span>}
                            </h1>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 rounded-full blur-[1px]"></div>
                        </div>
                        <p className="text-gray-400 text-sm font-medium tracking-widest uppercase opacity-80 mt-2">
                            بوابتك لخدمات التوصيل السريع
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6 w-full animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>

                        {/* Phone Input */}
                        <div className="space-y-2">
                            <label htmlFor="identifier" className="block text-xs font-bold text-gray-400 mr-1 transition-colors">
                                رقم الهاتف
                            </label>
                            <div className="relative group">
                                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-500 group-focus-within:text-red-500 transition-colors z-10 pointer-events-none">
                                    <PhoneIcon className="w-5 h-5" />
                                </div>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    id="identifier"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                                    placeholder="01xxxxxxxxx"
                                    className="w-full bg-[#1e293b]/80 border border-gray-700 rounded-2xl py-4 pl-12 pr-5 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 focus:bg-[#1e293b] outline-none transition-all duration-300 shadow-sm text-right font-mono text-lg tracking-wide"
                                    required
                                    maxLength={11}
                                    dir="rtl"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-xs font-bold text-gray-400 mr-1 transition-colors">
                                كلمة المرور
                            </label>
                            <div className="relative group">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute top-1/2 -translate-y-1/2 left-0 p-4 text-gray-500 hover:text-white transition-colors z-20 outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                                    className="w-full bg-[#1e293b]/80 border border-gray-700 rounded-2xl py-4 pl-12 pr-5 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 focus:bg-[#1e293b] outline-none transition-all duration-300 shadow-sm text-lg"
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={openForgotPassword}
                                className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors focus:outline-none"
                            >
                                هل نسيت كلمة المرور؟
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-center gap-2 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <p className="text-red-400 text-xs font-bold">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-900/30 active:scale-[0.98] flex justify-center items-center text-lg mt-6 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="relative z-10">تسجيل الدخول</span>
                                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="text-center mt-10 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                        <p className="text-sm text-gray-500 font-medium">
                            ليس لديك حساب؟
                            <button onClick={onGoToSignUp} className="text-white font-bold hover:text-red-500 transition-colors mr-2 hover:underline decoration-red-500 underline-offset-4">
                                إنشاء حساب جديد
                            </button>
                        </p>
                    </div>
                </div>

                {/* Version Footer */}
                <div className="absolute bottom-6 left-0 right-0 text-center opacity-40">
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest">{config.appVersion}</p>
                </div>
            </div>

            {isForgotPasswordOpen && (
                <ForgotPasswordModal
                    onClose={closeForgotPassword}
                    onRequestReset={onPasswordResetRequest}
                />
            )}
        </>
    );
};

export default AuthScreen;
