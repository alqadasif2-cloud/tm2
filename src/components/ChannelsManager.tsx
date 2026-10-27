import React, { useState } from 'react';
import { 
  Radio, RefreshCw, Search, Users, ExternalLink, ShieldCheck, 
  Crown, Plus, Check, MessageSquare, Smartphone, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { TelegramChat, Rule } from '../types';
import { translations } from '../translations';
import { TgClient } from '../telegramClient';
import { Store } from '../storage';

interface ChannelsManagerProps {
  lang: 'ar' | 'en';
  chats: TelegramChat[];
  isConnected: boolean;
  onSyncChats: () => Promise<void>;
  onOpenPhoneLogin: () => void;
  onCreateRuleWithChat: (chatId: number, asSource: boolean) => void;
  onOpenAddCustomModal: () => void;
}

export const ChannelsManager: React.FC<ChannelsManagerProps> = ({
  lang,
  chats,
  isConnected,
  onSyncChats,
  onOpenPhoneLogin,
  onCreateRuleWithChat,
  onOpenAddCustomModal
}) => {
  const t = translations[lang];
  const [filterType, setFilterType] = useState<'all' | 'channel' | 'group' | 'owned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSync = async () => {
    if (!isConnected) {
      onOpenPhoneLogin();
      return;
    }
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await onSyncChats();
      setSyncFeedback(lang === 'ar' ? 'تم تحديث وجلب قنواتك بنجاح!' : 'Channels synced successfully!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      setSyncFeedback(lang === 'ar' ? 'تعذر جلب القنوات، تأكد من اتصال الجلسة' : 'Failed to sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredChats = chats.filter((c) => {
    // Type filter
    if (filterType === 'channel' && c.type !== 'channel') return false;
    if (filterType === 'group' && c.type !== 'group' && c.type !== 'supergroup') return false;
    if (filterType === 'owned' && !c.isCreator && !c.hasAdminRights) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchUsername = c.username ? c.username.toLowerCase().includes(q) : false;
      const matchId = c.id.toString().includes(q);
      return matchTitle || matchUsername || matchId;
    }
    return true;
  });

  const channelsCount = chats.filter(c => c.type === 'channel').length;
  const groupsCount = chats.filter(c => c.type === 'group' || c.type === 'supergroup').length;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      
      {/* Top Banner & Sync Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-sky-400" />
            <h3 className="text-xl font-bold text-white">
              قنواتي ومجموعاتي في تيليجرام
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono font-bold">
              {chats.length} محادثة
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            القنوات والمجموعات المتاحة للاستخدام كمصادر مراقبة أو وجهات لتحويل الرسائل
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="جلب قنواتك الحقيقية من حسابك"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جاري جلب قنواتك...' : 'مزامنة القنوات من حسابي'}</span>
          </button>

          {/* Add custom channel */}
          <button
            onClick={onOpenAddCustomModal}
            className="p-2 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="إضافة قناة بمعرف خاص"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">إضافة يدوية</span>
          </button>
        </div>
      </div>

      {/* Connection Notice if Not Connected */}
      {!isConnected && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-200">
                حسابك غير مرتبط بعد!
              </h4>
              <p className="text-[11px] text-amber-300/80">
                اربط رقم هاتفك الآن ليقوم التطبيق بسحب قنواتك ومجموعاتك الحقيقية من تيليجرام تلقائياً.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPhoneLogin}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            ربط رقم الهاتف الآن
          </button>
        </div>
      )}

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        
        {/* Type Filter Buttons */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-medium">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({chats.length})
          </button>
          <button
            onClick={() => setFilterType('channel')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'channel' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            قنواتي ({channelsCount})
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'group' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            المجموعات ({groupsCount})
          </button>
          <button
            onClick={() => setFilterType('owned')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'owned' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            أملكها / مشرف
          </button>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute top-3 right-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث في القنوات باسمها أو معرفها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredChats.map((c) => {
          const isChannel = c.type === 'channel';
          const isGroup = c.type === 'group' || c.type === 'supergroup';

          return (
            <div
              key={c.id}
              className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/70 hover:border-sky-500/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.avatarColor || 'bg-sky-600'} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
                  {c.title.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white truncate" title={c.title}>
                      {c.title}
                    </h4>
                    {c.isCreator && (
                      <span title="أنت مالك هذه القناة">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                    {c.username ? (
                      <span className="text-sky-400">@{c.username}</span>
                    ) : (
                      <span className="text-slate-500">خاصة (ID: {c.id})</span>
                    )}
                    {c.membersCount !== undefined && (
                      <>
                        <span>•</span>
                        <span>{c.membersCount} عضو</span>
                      </>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1">
                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                      isChannel 
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                        : isGroup 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isChannel ? 'قناة (Channel)' : isGroup ? 'مجموعة (Group)' : 'محادثة خاصة'}
                    </span>
                    {c.hasAdminRights && !c.isCreator && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        مشرف
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions to create rules */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
                <button
                  onClick={() => onCreateRuleWithChat(c.id, true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-sky-500/20 hover:text-sky-300 text-slate-400 border border-slate-800 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="استخدام هذه القناة كمصدر لتحويل رسائلها"
                >
                  <Plus className="w-3 h-3 text-sky-400" />
                  <span>توجيه منها (كمصدر)</span>
                </button>

                <button
                  onClick={() => onCreateRuleWithChat(c.id, false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 border border-slate-800 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="استخدام هذه القناة كوجهة لاستقبال الرسائل المحولة"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>تعيين كوجهة</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
