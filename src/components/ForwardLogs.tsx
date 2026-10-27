import React, { useState } from 'react';
import { 
  History, CheckCircle2, XCircle, Trash2, Search, ArrowRight, 
  ArrowLeft, Copy, AlertTriangle, ShieldCheck, Filter 
} from 'lucide-react';
import { ForwardLog } from '../types';
import { translations } from '../translations';

interface ForwardLogsProps {
  lang: 'ar' | 'en';
  logs: ForwardLog[];
  onClearLogs: () => void;
}

export const ForwardLogs: React.FC<ForwardLogsProps> = ({
  lang,
  logs,
  onClearLogs
}) => {
  const t = translations[lang];
  const [filterStatus, setFilterStatus] = useState<'all' | 'forwarded' | 'skipped_filter'>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log => {
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    if (search.trim() === '') return true;
    const q = search.toLowerCase();
    return (
      log.messageText.toLowerCase().includes(q) ||
      log.sourceChatTitle.toLowerCase().includes(q) ||
      log.destChatTitle.toLowerCase().includes(q) ||
      log.ruleName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {t.logsTitle}
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {logs.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {t.logsDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter Pills */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterStatus === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.allLogs}
            </button>
            <button
              onClick={() => setFilterStatus('forwarded')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterStatus === 'forwarded' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.onlyForwarded}
            </button>
            <button
              onClick={() => setFilterStatus('skipped_filter')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterStatus === 'skipped_filter' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.onlySkipped}
            </button>
          </div>

          {/* Clear Logs */}
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition-colors"
              title={t.clearLogs}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Logs */}
      {logs.length > 5 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute top-2.5 right-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في سجل العمليات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      )}

      {/* Log Items */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{t.noLogs}</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const isFwd = log.status === 'forwarded';

            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isFwd
                    ? 'bg-slate-950/80 border-slate-800/80 hover:border-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800/50 hover:border-amber-500/30 opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isFwd ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        تم التوجيه
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <XCircle className="w-3 h-3" />
                        مستبعد بالفلاتر
                      </span>
                    )}

                    <span className="font-semibold text-slate-200">
                      قاعدة: {log.ruleName}
                    </span>

                    {log.asCopy && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-400 font-mono">
                        <Copy className="w-2.5 h-2.5" />
                        نسخة
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {log.timestamp}
                  </span>
                </div>

                {/* Routing Line */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2 font-medium">
                  <span className="text-slate-300 truncate max-w-[180px]">{log.sourceChatTitle}</span>
                  <span className="text-sky-400">&rarr;</span>
                  <span className="text-slate-300 truncate max-w-[180px]">{log.destChatTitle}</span>
                </div>

                {/* Message snippet */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-slate-200 font-mono text-[11px] leading-relaxed break-words">
                  {log.messageText}
                </div>

                {/* Reason description if filtered or details */}
                {log.reason && (
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-500">ملاحظة:</span>
                    <span>{log.reason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
