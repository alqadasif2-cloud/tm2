import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertCircle, Plus, Search, Radio, Copy, Layers, 
  HelpCircle, MessageSquare, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { Rule, TelegramChat } from '../types';
import { translations } from '../translations';
import { Store } from '../storage';

interface RuleEditorModalProps {
  lang: 'ar' | 'en';
  rule: Rule | null; // null if creating a new rule
  chats: TelegramChat[];
  onSave: (rule: Rule) => void;
  onClose: () => void;
}

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({
  lang,
  rule,
  chats,
  onSave,
  onClose
}) => {
  const t = translations[lang];

  const [name, setName] = useState(rule?.name || '');
  const [sources, setSources] = useState<number[]>(rule?.sources || []);
  const [dest, setDest] = useState<number>(rule?.dest || 0);
  const [includeText, setIncludeText] = useState(rule?.include?.join(', ') || '');
  const [excludeText, setExcludeText] = useState(rule?.exclude?.join(', ') || '');
  const [asCopy, setAsCopy] = useState(rule?.asCopy ?? true);
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);

  const [activeTab, setActiveTab] = useState<'details' | 'sources' | 'dest'>('details');
  const [searchSources, setSearchSources] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filter sources & destination chats
  const filteredSources = chats.filter(c => 
    c.title.toLowerCase().includes(searchSources.toLowerCase()) ||
    (c.username && c.username.toLowerCase().includes(searchSources.toLowerCase())) ||
    c.id.toString().includes(searchSources)
  );

  const filteredDest = chats.filter(c => 
    c.title.toLowerCase().includes(searchDest.toLowerCase()) ||
    (c.username && c.username.toLowerCase().includes(searchDest.toLowerCase())) ||
    c.id.toString().includes(searchDest)
  );

  const parseWords = (str: string): string[] => {
    return str
      .split(/[,،\n]+/)
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);
  };

  const handleToggleSource = (id: number) => {
    if (sources.includes(id)) {
      setSources(sources.filter(s => s !== id));
    } else {
      setSources([...sources, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (sources.length === 0) {
      setError(lang === 'ar' ? 'يرجى تحديد مصدر واحد على الأقل' : 'Please select at least one source chat');
      setActiveTab('sources');
      return;
    }

    if (dest === 0) {
      setError(lang === 'ar' ? 'يرجى تحديد القناة أو المحادثة الوجهة' : 'Please select a destination chat');
      setActiveTab('dest');
      return;
    }

    if (sources.includes(dest)) {
      setError(lang === 'ar' ? 'لا يمكن أن تكون القناة الوجهة موجودة ضمن المصادر لتجنب التكرار اللانهائي' : 'Destination cannot be one of the sources');
      return;
    }

    const savedRule: Rule = {
      id: rule?.id || 'rule-' + Date.now(),
      name: name.trim() || (lang === 'ar' ? 'قاعدة توجيه' : 'Forward Rule'),
      sources,
      dest,
      include: parseWords(includeText),
      exclude: parseWords(excludeText),
      asCopy,
      enabled,
      createdAt: rule?.createdAt || new Date().toISOString(),
      forwardedCount: rule?.forwardedCount || 0
    };

    onSave(savedRule);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              {rule ? (lang === 'ar' ? 'تعديل القاعدة' : 'Edit Rule') : t.newRule}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديد شروط نقل الرسائل التلقائية بين قنوات ومجموعات تيليجرام
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. تفاصيل القاعدة والفلاتر
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sources'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>2. المصادر</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-sky-400">
              {sources.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dest')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dest'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>3. الوجهة</span>
            {dest !== 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: DETAILS & FILTERS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              
              {/* Rule Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.ruleName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: توجيه عروض التقنية والذكاء الاصطناعي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Routing Quick Summary Selector Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('sources')}
                  className="p-3 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-sky-500 text-right transition-colors"
                >
                  <span className="text-[11px] text-slate-400 block mb-1">المصادر المحددة:</span>
                  <span className="text-xs font-bold text-sky-400 flex items-center justify-between">
                    <span>{sources.length > 0 ? `${sources.length} محادثة مصدرية` : 'اختر المصادر (0)'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">تغيير &larr;</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('dest')}
                  className="p-3 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-sky-500 text-right transition-colors"
                >
                  <span className="text-[11px] text-slate-400 block mb-1">الوجهة المستهدفة:</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">
                      {dest !== 0 ? Store.getChatTitle(dest) : 'اختر الوجهة (غير محدد)'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">تغيير &larr;</span>
                  </span>
                </button>
              </div>

              {/* Included Words */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {t.includedWords}
                  </label>
                  <span className="text-[10px] text-slate-400">اتركها فارغة لتمرير كافة الرسائل</span>
                </div>
                <textarea
                  rows={2}
                  placeholder={t.includePlaceholder}
                  value={includeText}
                  onChange={(e) => setIncludeText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Excluded Words */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.excludedWords}
                </label>
                <textarea
                  rows={2}
                  placeholder={t.excludePlaceholder}
                  value={excludeText}
                  onChange={(e) => setExcludeText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* As Copy Checkbox (exact matching Android 'asCopy') */}
              <div className="p-3.5 rounded-xl border border-slate-700/80 bg-slate-950/70 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={asCopy}
                    onChange={(e) => setAsCopy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {t.asCopy}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {t.asCopyDesc}
                    </span>
                  </div>
                </label>
              </div>

            </div>
          )}

          {/* TAB 2: SELECT SOURCES (Multi-choice dialog) */}
          {activeTab === 'sources' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  {t.chooseSources} ({sources.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSources(chats.map(c => c.id))}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    تحديد الكل
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setSources([])}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute top-2.5 right-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.searchChats}
                  value={searchSources}
                  onChange={(e) => setSearchSources(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="border border-slate-800 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-800/80 bg-slate-950/40">
                {filteredSources.map((c) => {
                  const isSelected = sources.includes(c.id);
                  const isChannel = c.type === 'channel';
                  const isGroup = c.type === 'group' || c.type === 'supergroup';

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleToggleSource(c.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-sky-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full ${c.avatarColor || (isChannel ? 'bg-sky-600' : 'bg-indigo-600')} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {c.title.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate max-w-[280px]">
                              {c.title}
                            </span>
                            {c.isCreator && (
                              <span className="text-[10px] text-amber-400 font-semibold shrink-0">⭐ مالك</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                            {c.username ? <span className="text-sky-400">@{c.username}</span> : <span>ID: {c.id}</span>}
                            <span>•</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                              isChannel ? 'bg-sky-500/20 text-sky-300' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {isChannel ? 'قناة' : isGroup ? 'مجموعة' : 'محادثة'}
                            </span>
                            {c.membersCount && <span>• {c.membersCount} عضو</span>}
                          </div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected 
                          ? 'bg-sky-500 border-sky-400 text-white' 
                          : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  تم، العودة للشروط &larr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SELECT DESTINATION (Single-choice dialog) */}
          {activeTab === 'dest' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                {t.chooseDestination}
              </span>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute top-2.5 right-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.searchChats}
                  value={searchDest}
                  onChange={(e) => setSearchDest(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="border border-slate-800 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-800/80 bg-slate-950/40">
                {filteredDest.map((c) => {
                  const isSelected = dest === c.id;
                  const isSource = sources.includes(c.id);
                  const isChannel = c.type === 'channel';
                  const isGroup = c.type === 'group' || c.type === 'supergroup';

                  return (
                    <div
                      key={c.id}
                      onClick={() => !isSource && setDest(c.id)}
                      className={`p-3 flex items-center justify-between transition-colors ${
                        isSource 
                          ? 'opacity-40 cursor-not-allowed bg-slate-900/40' 
                          : isSelected 
                            ? 'bg-emerald-500/10 cursor-pointer' 
                            : 'cursor-pointer hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full ${c.avatarColor || (isChannel ? 'bg-sky-600' : 'bg-indigo-600')} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {c.title.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate max-w-[280px]">
                              {c.title}
                            </span>
                            {c.isCreator && (
                              <span className="text-[10px] text-amber-400 font-semibold shrink-0">⭐ مالك</span>
                            )}
                            {isSource && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 rounded shrink-0">مصدر محدد</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                            {c.username ? <span className="text-sky-400">@{c.username}</span> : <span>ID: {c.id}</span>}
                            <span>•</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                              isChannel ? 'bg-sky-500/20 text-sky-300' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {isChannel ? 'قناة' : isGroup ? 'مجموعة' : 'محادثة'}
                            </span>
                            {c.membersCount && <span>• {c.membersCount} عضو</span>}
                          </div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                          : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  تم، العودة للشروط &larr;
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
