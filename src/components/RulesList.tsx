import React, { useState } from 'react';
import { 
  Sliders, Plus, Copy, ArrowLeft, ArrowRight, Check, X, 
  Trash2, Edit3, Tag, ShieldAlert, Sparkles, Filter, Download, Upload 
} from 'lucide-react';
import { Rule, TelegramChat } from '../types';
import { translations } from '../translations';
import { Store } from '../storage';

interface RulesListProps {
  lang: 'ar' | 'en';
  rules: Rule[];
  chats: TelegramChat[];
  onToggleRule: (rule: Rule, enabled: boolean) => void;
  onEditRule: (rule: Rule) => void;
  onDeleteRule: (id: string) => void;
  onNewRule: () => void;
  onImportRules: (rules: Rule[]) => void;
}

export const RulesList: React.FC<RulesListProps> = ({
  lang,
  rules,
  chats,
  onToggleRule,
  onEditRule,
  onDeleteRule,
  onNewRule,
  onImportRules
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');

  const chatMap = new Map<number, TelegramChat>();
  chats.forEach(c => chatMap.set(c.id, c));

  const filteredRules = rules.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.include.some(w => w.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.exclude.some(w => w.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tforwarder_rules_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportRules(parsed);
          }
        } catch (err) {
          alert('ملف غير صالح');
        }
      };
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="text-xl font-bold text-white">
              {t.rulesSection}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {rules.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة مسارات توجيه الرسائل وتحديد الكلمات المفتاحية ونسق التحويل
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Export / Import */}
          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            title="تصدير القواعد كملف JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <label 
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer transition-colors"
            title="استيراد قواعد من ملف JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          {/* New Rule Button */}
          <button
            onClick={onNewRule}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newRule}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      {rules.length > 2 && (
        <div className="relative">
          <Filter className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="تصفية القواعد بالاسم أو الكلمات المفتاحية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-10 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      )}

      {/* Rules Cards List */}
      {filteredRules.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Sliders className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-200 mb-1">{t.noRules}</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            حدد القناة المصدر التي ترغب بمراقبتها والقناة الوجهة مع فلاتر الكلمات.
          </p>
          <button
            onClick={onNewRule}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newRule}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRules.map((r) => {
            const destChat = chatMap.get(r.dest);
            const destTitle = destChat ? destChat.title : Store.getChatTitle(r.dest);

            return (
              <div 
                key={r.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                  r.enabled 
                    ? 'bg-slate-900/90 border-slate-700/80 hover:border-sky-500/50 shadow-sm' 
                    : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Info & Routing */}
                  <div className="space-y-3 flex-1">
                    
                    {/* Title & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-white">
                        {r.name}
                      </h4>
                      {r.asCopy ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          <Copy className="w-3 h-3" />
                          نسخة نظيفة (بدون رأس التوجيه)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          توجيه مباشر
                        </span>
                      )}
                      {r.forwardedCount !== undefined && r.forwardedCount > 0 && (
                        <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/50">
                          {r.forwardedCount} عملية توجيه
                        </span>
                      )}
                    </div>

                    {/* Routing Diagram: Sources -> Destination */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      
                      {/* Sources */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-400 font-medium">المصادر ({r.sources.length}):</span>
                        {r.sources.map(srcId => {
                          const c = chatMap.get(srcId);
                          const name = c ? c.title : `ID: ${srcId}`;
                          return (
                            <span 
                              key={srcId}
                              className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-medium text-[11px] truncate max-w-[200px]"
                              title={name}
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>

                      {/* Direction Arrow */}
                      <div className="text-sky-400 px-1 font-bold">
                        {lang === 'ar' ? (
                          <ArrowLeft className="w-4 h-4" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </div>

                      {/* Destination */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">الوجهة:</span>
                        <span className="px-2 py-0.5 rounded-md bg-sky-950/60 text-sky-200 border border-sky-800/60 font-semibold text-[11px] truncate max-w-[220px]">
                          {destTitle}
                        </span>
                      </div>

                    </div>

                    {/* Keywords Tagging */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {/* Included Keywords */}
                      <div className="flex flex-wrap items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-400 text-[11px]">يجب احتواء:</span>
                        {r.include.length > 0 ? (
                          r.include.map((inc, i) => (
                            <span 
                              key={i} 
                              className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono"
                            >
                              {inc}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">الكل (بدون فلتر)</span>
                        )}
                      </div>

                      {/* Excluded Keywords */}
                      {r.exclude.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-slate-400 text-[11px]">استثناء:</span>
                          {r.exclude.map((exc, i) => (
                            <span 
                              key={i} 
                              className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono"
                            >
                              {exc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right: Actions & Toggle */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    
                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">
                        {r.enabled ? t.enabled : 'معطلة'}
                      </span>
                      <button
                        onClick={() => onToggleRule(r, !r.enabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          r.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            r.enabled 
                              ? (lang === 'ar' ? '-translate-x-5' : 'translate-x-5') 
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        onClick={() => onEditRule(r)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                        title={t.edit}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t.edit}</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (confirm(t.confirmDeleteRule)) {
                            onDeleteRule(r.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t.delete}</span>
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
