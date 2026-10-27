import React from 'react';
import { Send, Radio, Smartphone, Globe, ShieldCheck, PlusCircle, LogOut } from 'lucide-react';
import { Store } from '../storage';
import { translations } from '../translations';
import { AuthState } from '../types';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  isRunning: boolean;
  onToggleRunning: (state: boolean) => void;
  authState: AuthState;
  onOpenPhoneLogin: () => void;
  onOpenChatManager: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  isRunning,
  onToggleRunning,
  authState,
  onOpenPhoneLogin,
  onOpenChatManager,
  onLogout
}) => {
  const t = translations[lang];
  const profile = Store.getProfile();
  const isAuthReady = authState === 'ready';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
              <Send className="w-6 h-6 transform -rotate-12 translate-x-0.5" />
            </div>
            {isRunning && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {t.appName}
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Phone Session
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Real-time Status Badge */}
          <button
            onClick={() => onToggleRunning(!isRunning)}
            className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isRunning
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/40'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
            <span>{isRunning ? t.running : t.paused}</span>
          </button>

          {/* Add Custom Chat Button */}
          <button
            onClick={onOpenChatManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all"
            title={t.addCustomChat}
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">{t.addCustomChat}</span>
          </button>

          {/* Account & Phone Link Status */}
          {isAuthReady ? (
            <div 
              onClick={onOpenPhoneLogin}
              className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500/60 px-3.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all shadow-sm shadow-emerald-500/5"
              title="عرض وتعديل رقم الهاتف المرتبط"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-right flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-200">{profile.firstName || 'حساب تيليجرام'}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[11px] text-emerald-400 font-mono font-bold" dir="ltr">
                  {profile.phone}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-1"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenPhoneLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>{t.linkPhoneBtn}</span>
            </button>
          )}

          {/* Language Selector */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
