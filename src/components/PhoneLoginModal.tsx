import React, { useState } from 'react';
import { 
  X, Smartphone, Lock, ShieldCheck, CheckCircle2, 
  ArrowLeft, ArrowRight, RefreshCw, AlertCircle, PhoneCall, LogOut, Check, Sparkles 
} from 'lucide-react';
import { AuthState } from '../types';
import { translations } from '../translations';
import { TgClient } from '../telegramClient';
import { Store } from '../storage';
import { COUNTRIES, Country } from '../countries';

interface PhoneLoginModalProps {
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
  authState: AuthState;
  onAuthComplete: () => void;
}

export const PhoneLoginModal: React.FC<PhoneLoginModalProps> = ({
  lang,
  isOpen,
  onClose,
  authState,
  onAuthComplete
}) => {
  const t = translations[lang];

  // Default country: Yemen (+967) or first country
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<AuthState>(authState === 'ready' ? 'ready' : 'phone');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const fullPhone = `${selectedCountry.dialCode}${phoneNumber.replace(/^0+/, '')}`;
  const profile = Store.getProfile();

  const handleSendPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setIsLoading(true);

    if (!phoneNumber || phoneNumber.trim().length < 5) {
      setError(lang === 'ar' ? 'يرجى كتابة رقم الهاتف بشكل صحيح' : 'Please enter a valid phone number');
      setIsLoading(false);
      return;
    }

    setStatusMessage('جاري الاتصال بسيرفرات تيليجرام وإرسال كود التأكيد الحقيقي...');
    const res = await TgClient.sendPhoneCode(fullPhone);
    setIsLoading(false);

    if (res.success) {
      setCode('');
      setStep('code');
      setStatusMessage('تم إرسال كود التأكيد الحقيقي إلى تطبيق تيليجرام الخاص برقمك');
    } else {
      setStatusMessage(null);
      setError(res.message || 'فشل إرسال كود التأكيد، تحقق من الرقم');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setIsLoading(true);

    if (!code || code.trim().length < 3) {
      setError(lang === 'ar' ? 'أدخل الرمز المكون من 5 أرقام' : 'Please enter the code');
      setIsLoading(false);
      return;
    }

    setStatusMessage('جاري التحقق من الرمز مع سيرفرات تيليجرام...');
    const res = await TgClient.verifyCode(code);
    setIsLoading(false);

    if (res.requiresPassword) {
      setStep('password');
      setStatusMessage(res.message || 'الحساب محمي بالتحقق بخطوتين (2FA)');
    } else if (res.success) {
      onAuthComplete();
      onClose();
    } else {
      setStatusMessage(null);
      setError(res.message || 'رمز التأكيد غير صحيح أو منتهي الصلاحية');
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setIsLoading(true);

    if (!password) {
      setError(lang === 'ar' ? 'يرجى إدخال كلمة مرور التحقق بخطوتين' : 'Please enter password');
      setIsLoading(false);
      return;
    }

    setStatusMessage('جاري التحقق من كلمة المرور السحابية...');
    const res = await TgClient.verifyPassword(password);
    setIsLoading(false);

    if (res.success) {
      onAuthComplete();
      onClose();
    } else {
      setStatusMessage(null);
      setError(res.message || 'كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await TgClient.logout();
    setIsLoading(false);
    setStep('phone');
    setPhoneNumber('');
    setCode('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{step === 'ready' ? t.connectedAccount : t.phoneTitle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30">
                  اتصال حقيقي MTProto
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                تسجيل دخول رسمي مباشر عبر سيرفرات تيليجرام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* SCREEN: CURRENTLY CONNECTED */}
          {step === 'ready' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {profile.firstName ? profile.firstName.charAt(0) : 'T'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">{profile.firstName || 'مستخدم تيليجرام'}</h4>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xs text-emerald-400 font-mono font-bold" dir="ltr">
                      {profile.phone}
                    </p>
                    {profile.username && (
                      <p className="text-[10px] text-slate-400">
                        معرف: @{profile.username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>حالة الجلسة:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    متصل حقيقي بسيرفرات تيليجرام
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  تم، العودة للشاشة الرئيسية
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  <span>تغيير الحساب</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: PHONE INPUT */}
          {step === 'phone' && (
            <form onSubmit={handleSendPhone} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                ادخل رقم هاتفك الفعلي. سيقوم سيرفر تيليجرام الرسمي بإرسال كود التأكيد مباشرة إلى تطبيق تيليجرام على جهازك.
              </div>

              {/* Country Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الدولة:
                </label>
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const c = COUNTRIES.find(x => x.code === e.target.value);
                    if (c) setSelectedCountry(c);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {lang === 'ar' ? c.name : c.nameEn} ({c.dialCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الهاتف:
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden focus-within:border-sky-500" dir="ltr">
                  <span className="px-3.5 py-2.5 text-xs font-bold font-mono text-sky-400 bg-slate-900 border-r border-slate-800 select-none">
                    {selectedCountry.dialCode}
                  </span>
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder="77XXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-100 font-mono tracking-wider focus:outline-none placeholder-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                <span>{isLoading ? 'جاري الاتصال بسيرفر تيليجرام...' : 'إرسال كود التأكيد الحقيقي إلى تيليجرام'}</span>
              </button>
            </form>
          )}

          {/* STEP 2: CODE VERIFICATION */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs text-slate-300 block">
                  تم إرسال كود التأكيد الحقيقي إلى حسابك:
                </span>
                <span className="text-xs font-bold text-sky-400 font-mono" dir="ltr">
                  {fullPhone}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/40 text-xs text-sky-200 leading-relaxed">
                💬 افتح الآن تطبيق <b>Telegram</b> على هاتفك، ستجد رسالة جديدة من حساب <b>Telegram</b> الرسمي تحتوي على كود تسجيل الدخول المكون من 5 أرقام.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                  أدخل رمز التأكيد (5 أرقام)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="•••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg text-center text-white tracking-[0.6em] font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  تغيير الرقم
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isLoading ? 'جاري التحقق...' : 'تأكيد الرمز وربط الحساب'}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: 2FA PASSWORD */}
          {step === 'password' && (
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200">
                🔒 هذا الحساب مفعل عليه التحقق بخطوتين (2FA). يرجى إدخال كلمة المرور السحابية للمتابعة.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كلمة المرور السحابية
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute top-3 right-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-9 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('code')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isLoading ? 'جاري التحقق...' : 'تأكيد كلمة المرور'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
