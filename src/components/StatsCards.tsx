import React from 'react';
import { Send, CheckCircle2, Sliders, MessageSquare, Power, ArrowUpRight, Sparkles, Plus } from 'lucide-react';
import { translations } from '../translations';

interface StatsCardsProps {
  lang: 'ar' | 'en';
  todayCount: number;
  totalCount: number;
  activeRulesCount: number;
  totalChatsCount: number;
  isRunning: boolean;
  onToggleRunning: (running: boolean) => void;
  onOpenNewRule: () => void;
  onOpenSimulator: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  lang,
  todayCount,
  totalCount,
  activeRulesCount,
  totalChatsCount,
  isRunning,
  onToggleRunning,
  onOpenNewRule,
  onOpenSimulator
}) => {
  const t = translations[lang];

  return (
    <div className="space-y-4">
      {/* Master Service Banner with Glow & Toggle */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isRunning 
          ? 'bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-sky-500/30 shadow-lg shadow-sky-500/5' 
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isRunning ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {t.autoForwardToggle}
                </h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isRunning 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {isRunning ? t.running : t.paused}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl mt-1">
                {t.autoForwardDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onOpenSimulator}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t.simulatorTitle}</span>
            </button>

            <button
              onClick={() => onToggleRunning(!isRunning)}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isRunning ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isRunning 
                    ? (lang === 'ar' ? '-translate-x-6' : 'translate-x-6') 
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Today's Forwarded Count */}
        <div className="bg-slate-900/80 border border-slate-800/80 hover:border-sky-500/30 p-4 rounded-2xl relative overflow-hidden group transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.todayForwarded}</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {todayCount}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              اليوم
            </span>
          </div>
        </div>

        {/* Total All-Time Count */}
        <div className="bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/30 p-4 rounded-2xl relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.totalForwarded}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-400">إجمالي</span>
          </div>
        </div>

        {/* Active Rules Count */}
        <div className="bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/30 p-4 rounded-2xl relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.activeRules}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {activeRulesCount}
            </span>
            <button
              onClick={onOpenNewRule}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 ml-auto cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              {t.newRule}
            </button>
          </div>
        </div>

        {/* Connected Chats */}
        <div className="bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/30 p-4 rounded-2xl relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.totalChannels}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {totalChatsCount}
            </span>
            <span className="text-[11px] text-slate-400">{t.chats}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
