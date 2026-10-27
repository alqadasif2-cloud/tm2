import React, { useState } from 'react';
import { X, Plus, Trash2, MessageSquare, AlertCircle, Hash, Check } from 'lucide-react';
import { TelegramChat } from '../types';
import { translations } from '../translations';
import { Store } from '../storage';

interface ChatManagerModalProps {
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
  chats: TelegramChat[];
  onChatsUpdated: () => void;
}

export const ChatManagerModal: React.FC<ChatManagerModalProps> = ({
  lang,
  isOpen,
  onClose,
  chats,
  onChatsUpdated
}) => {
  const t = translations[lang];

  const [title, setTitle] = useState('');
  const [chatId, setChatId] = useState('');
  const [chatType, setChatType] = useState<'channel' | 'supergroup' | 'group' | 'private'>('channel');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddChat = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const idNum = parseInt(chatId.trim(), 10);
    if (isNaN(idNum) || idNum === 0) {
      setError(lang === 'ar' ? 'معرف المحادثة يجب أن يكون رقماً صحيحاً (مثل -100192837465)' : 'Chat ID must be a valid integer');
      return;
    }

    if (!title.trim()) {
      setError(lang === 'ar' ? 'يرجى كتابة اسم المحادثة' : 'Please enter chat title');
      return;
    }

    const newChat: TelegramChat = {
      id: idNum,
      title: title.trim(),
      type: chatType,
      membersCount: 1,
      avatarColor: 'bg-teal-600',
      isCustom: true
    };

    Store.addCustomChat(newChat);
    setTitle('');
    setChatId('');
    onChatsUpdated();
  };

  const handleDelete = (id: number) => {
    Store.deleteCustomChat(id);
    onChatsUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.addCustomChat}
              </h3>
              <p className="text-xs text-slate-400">
                إدارة قنوات ومجموعات تيليجرام المتاحة للقواعد
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

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add form */}
          <form onSubmit={handleAddChat} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <span className="text-xs font-bold text-white block">إضافة محادثة جديدة:</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.chatTitle}
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قناتي الإخبارية"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.chatId}
                </label>
                <input
                  type="text"
                  required
                  placeholder="-100XXXXXXXXXX"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">{t.chatType}:</label>
                <select
                  value={chatType}
                  onChange={(e) => setChatType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                >
                  <option value="channel">قناة (Channel)</option>
                  <option value="supergroup">مجموعة خارقة (Supergroup)</option>
                  <option value="group">مجموعة (Group)</option>
                  <option value="private">محادثة خاصة (Private)</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </div>
          </form>

          {/* List of current chats */}
          <div>
            <span className="text-xs font-bold text-slate-300 mb-2 block">
              القنوات والمجموعات المسجلة ({chats.length}):
            </span>
            <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/80 bg-slate-950/40">
              {chats.map(c => (
                <div key={c.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${c.avatarColor || 'bg-slate-700'} flex items-center justify-center text-white text-xs font-bold`}>
                      {c.title.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {c.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {c.id} • {c.type}
                      </div>
                    </div>
                  </div>

                  {c.isCustom && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
