import React, { useState } from 'react';
import { 
  Send, Check, CornerDownRight, Share2, Eye, ShieldCheck, 
  MessageSquare, MoreVertical, Copy 
} from 'lucide-react';
import { ForwardLog, TelegramChat } from '../types';
import { translations } from '../translations';
import { Store } from '../storage';

interface DestinationPreviewProps {
  lang: 'ar' | 'en';
  chats: TelegramChat[];
  logs: ForwardLog[];
}

export const DestinationPreview: React.FC<DestinationPreviewProps> = ({
  lang,
  chats,
  logs
}) => {
  const t = translations[lang];

  // Pick destination chats (or fallback to all)
  const destCandidates = chats.filter(c => c.id === -1002148596321 || c.id === -1002259684710 || c.isCustom);
  const [selectedDestId, setSelectedDestId] = useState<number>(
    destCandidates[0]?.id || chats[4]?.id || chats[0]?.id || 0
  );

  const selectedChat = chats.find(c => c.id === selectedDestId);
  const destLogs = logs.filter(l => l.destChatId === selectedDestId && l.status === 'forwarded');

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full">
      
      {/* Top Banner & Selector */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${selectedChat?.avatarColor || 'bg-sky-600'} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
            {selectedChat?.title.charAt(0) || 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                {selectedChat?.title || 'القناة الوجهة'}
              </h3>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <span>{selectedChat?.membersCount || 1} مشترك</span>
              <span>•</span>
              <span className="text-emerald-400">مباشر</span>
            </p>
          </div>
        </div>

        {/* Change Destination Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDestId}
            onChange={(e) => setSelectedDestId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
          >
            {chats.map(c => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Feed (Telegram UI Style) */}
      <div className="flex-1 p-4 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-900/95 overflow-y-auto min-h-[380px] max-h-[500px] space-y-3.5">
        
        {/* Date Divider */}
        <div className="flex justify-center">
          <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-medium shadow-sm">
            اليوم
          </span>
        </div>

        {/* Telegram Welcome Pill */}
        <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 text-center max-w-sm mx-auto text-xs text-sky-200">
          📍 هذه المحادثة تستقبل الرسائل المعاد توجيهها تلقائياً عبر TForwarder وفقاً للقواعد النشطة.
        </div>

        {destLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>لا توجد رسائل موجهة بعد إلى هذه الوجهة.</p>
            <p className="text-[10px] text-slate-600 mt-1">
              استخدم محاكي الرسائل أو شغّل التوجيه التلقائي لمشاهدة وصول الرسائل هنا!
            </p>
          </div>
        ) : (
          destLogs.map((item) => (
            <div 
              key={item.id} 
              className="max-w-md ml-auto bg-slate-800/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-md space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              {/* Telegram Forward Header: only shown if asCopy is FALSE */}
              {!item.asCopy ? (
                <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-semibold border-b border-slate-700/60 pb-1.5">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>محولة من:</span>
                  <span className="underline decoration-sky-500/50 hover:text-sky-300">
                    {item.sourceChatTitle}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-purple-400 font-medium pb-1 border-b border-slate-700/40">
                  <Copy className="w-2.5 h-2.5" />
                  <span>نسخة نظيفة (بدون رأس توجيه)</span>
                </div>
              )}

              {/* Message Content Body */}
              <p className="text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                {item.messageText}
              </p>

              {/* Message Metadata & TForwarder rule stamp */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-700/40">
                <span className="font-mono text-slate-500">
                  قاعدة: {item.ruleName}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono">{item.timestamp}</span>
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                </div>
              </div>
            </div>
          ))
        )}

      </div>

      {/* Chat Footer Mock */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>القناة قيد المراقبة والتوجيه المستمر</span>
        <span className="text-sky-400 font-mono text-[11px]">TForwarder Sync Active</span>
      </div>

    </div>
  );
};
