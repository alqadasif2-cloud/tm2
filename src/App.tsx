import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { RulesList } from './components/RulesList';
import { ChannelsManager } from './components/ChannelsManager';
import { RuleEditorModal } from './components/RuleEditorModal';
import { PhoneLoginModal } from './components/PhoneLoginModal';
import { MessageSimulator } from './components/MessageSimulator';
import { ForwardLogs } from './components/ForwardLogs';
import { DestinationPreview } from './components/DestinationPreview';
import { ChatManagerModal } from './components/ChatManagerModal';

import { Store } from './storage';
import { TgClient } from './telegramClient';
import { Rule, TelegramChat, ForwardLog, AuthState } from './types';
import { ForwardResult } from './forwarder';
import { translations } from './translations';
import { Sliders, Radio, Sparkles, History, Eye, Plus } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>(Store.getLanguage());
  const [isRunning, setIsRunning] = useState<boolean>(Store.isRunning());
  const [todayCount, setTodayCount] = useState<number>(Store.todayCount());
  const [totalCount, setTotalCount] = useState<number>(Store.totalCount());
  const [rules, setRules] = useState<Rule[]>(Store.getRules());
  const [chats, setChats] = useState<TelegramChat[]>(Store.getChats());
  const [logs, setLogs] = useState<ForwardLog[]>(Store.getLogs());
  const [authState, setAuthState] = useState<AuthState>(Store.getAuthState());

  // Active Main View Tab
  const [activeTab, setActiveTab] = useState<'rules' | 'channels' | 'simulator' | 'preview'>('rules');

  // Modals state
  const [editingRule, setEditingRule] = useState<Rule | null | undefined>(undefined); // undefined = closed, null = new rule, Rule = edit
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isChatManagerOpen, setIsChatManagerOpen] = useState(false);

  // Sync language with HTML dir and lang attributes
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    Store.setLanguage(lang);
  }, [lang]);

  // Subscribe to AuthState changes
  useEffect(() => {
    const unsubscribe = TgClient.subscribe((newState) => {
      setAuthState(newState);
      if (newState === 'ready') {
        TgClient.syncRealDialogs().then(synced => setChats(synced));
      }
    });

    // Check real server session on boot
    TgClient.checkConnectionStatus().then((connected) => {
      if (connected) {
        TgClient.syncRealDialogs().then(synced => setChats(synced));
      }
    });

    return unsubscribe;
  }, []);

  const handleToggleRunning = (running: boolean) => {
    Store.setRunning(running);
    setIsRunning(running);
  };

  const handleToggleRule = (rule: Rule, enabled: boolean) => {
    const updated = { ...rule, enabled };
    Store.upsertRule(updated);
    setRules(Store.getRules());
  };

  const handleSaveRule = (savedRule: Rule) => {
    Store.upsertRule(savedRule);
    setRules(Store.getRules());
    setEditingRule(undefined);
  };

  const handleDeleteRule = (id: string) => {
    Store.deleteRule(id);
    setRules(Store.getRules());
  };

  const handleImportRules = (imported: Rule[]) => {
    Store.saveRules(imported);
    setRules(imported);
  };

  const handleMessageProcessed = useCallback((results: ForwardResult[], newLog?: ForwardLog) => {
    setTodayCount(Store.todayCount());
    setTotalCount(Store.totalCount());
    setRules(Store.getRules());
    setLogs(Store.getLogs());
  }, []);

  const handleClearLogs = () => {
    Store.clearLogs();
    setLogs([]);
  };

  const handleChatsUpdated = () => {
    setChats(Store.getChats());
  };

  const handleSyncChats = async () => {
    const synced = await TgClient.syncRealDialogs();
    setChats(synced);
  };

  const handleCreateRuleWithChat = (chatId: number, asSource: boolean) => {
    const chatTitle = Store.getChatTitle(chatId);
    const newRuleDraft: Rule = {
      id: 'rule-' + Date.now(),
      name: asSource ? `توجيه من ${chatTitle}` : `توجيه إلى ${chatTitle}`,
      sources: asSource ? [chatId] : [],
      dest: asSource ? 0 : chatId,
      include: [],
      exclude: [],
      asCopy: true,
      enabled: true,
      createdAt: new Date().toISOString(),
      forwardedCount: 0
    };
    setEditingRule(newRuleDraft);
  };

  const handleLogout = () => {
    TgClient.logout();
    setAuthState('phone');
    setIsPhoneModalOpen(true);
  };

  const activeRulesCount = rules.filter(r => r.enabled).length;
  const isConnected = authState === 'ready';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Navigation */}
      <Header
        lang={lang}
        setLang={setLang}
        isRunning={isRunning}
        onToggleRunning={handleToggleRunning}
        authState={authState}
        onOpenPhoneLogin={() => setIsPhoneModalOpen(true)}
        onOpenChatManager={() => setIsChatManagerOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Stats & Service Power Toggle */}
        <StatsCards
          lang={lang}
          todayCount={todayCount}
          totalCount={totalCount}
          activeRulesCount={activeRulesCount}
          totalChatsCount={chats.length}
          isRunning={isRunning}
          onToggleRunning={handleToggleRunning}
          onOpenNewRule={() => setEditingRule(null)}
          onOpenSimulator={() => setActiveTab('simulator')}
        />

        {/* Primary Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-2xl gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>قواعد التوجيه</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'rules' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {rules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'channels'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>قنواتي ومجموعاتي</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'channels' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {chats.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>المحاكي والاختبار المباشر</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>معاينة القناة وسجل النشاط</span>
            {logs.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'preview' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: RULES ENGINE */}
        {activeTab === 'rules' && (
          <section className="space-y-6">
            <RulesList
              lang={lang}
              rules={rules}
              chats={chats}
              onToggleRule={handleToggleRule}
              onEditRule={(r) => setEditingRule(r)}
              onDeleteRule={handleDeleteRule}
              onNewRule={() => setEditingRule(null)}
              onImportRules={handleImportRules}
            />

            {/* Quick Preview of Channels below Rules */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-sky-400" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    لديك {chats.length} قناة ومجموعة مسجلة في النظام
                  </span>
                  <span className="text-[11px] text-slate-400">
                    يمكنك استعراض قنواتك أو جلب المزيد منها مباشرة من حسابك في تيليجرام.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('channels')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold border border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                استعراض قنواتي ومجموعاتي &larr;
              </button>
            </div>
          </section>
        )}

        {/* TAB 2: MY CHANNELS & GROUPS (ChannelsManager) */}
        {activeTab === 'channels' && (
          <section>
            <ChannelsManager
              lang={lang}
              chats={chats}
              isConnected={isConnected}
              onSyncChats={handleSyncChats}
              onOpenPhoneLogin={() => setIsPhoneModalOpen(true)}
              onCreateRuleWithChat={handleCreateRuleWithChat}
              onOpenAddCustomModal={() => setIsChatManagerOpen(true)}
            />
          </section>
        )}

        {/* TAB 3: SIMULATOR & TEST RUNNER */}
        {activeTab === 'simulator' && (
          <section>
            <MessageSimulator
              lang={lang}
              chats={chats}
              rules={rules}
              isRunning={isRunning}
              onMessageProcessed={handleMessageProcessed}
            />
          </section>
        )}

        {/* TAB 4: DESTINATION PREVIEW & FORWARD LOGS */}
        {activeTab === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <section className="h-full">
              <DestinationPreview
                lang={lang}
                chats={chats}
                logs={logs}
              />
            </section>

            <section className="h-full">
              <ForwardLogs
                lang={lang}
                logs={logs}
                onClearLogs={handleClearLogs}
              />
            </section>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">TForwarder Web</span>
            <span>•</span>
            <span>نظام التوجيه التلقائي المباشر برقم الهاتف</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsPhoneModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">
              ربط رقم الهاتف
            </button>
            <button onClick={() => setActiveTab('channels')} className="hover:text-white transition-colors cursor-pointer">
              قنواتي ومجموعاتي ({chats.length})
            </button>
            <button onClick={() => setIsChatManagerOpen(true)} className="hover:text-white transition-colors cursor-pointer">
              إضافة قناة بمعرف
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* Rule Editor Modal */}
      {editingRule !== undefined && (
        <RuleEditorModal
          lang={lang}
          rule={editingRule}
          chats={chats}
          onSave={handleSaveRule}
          onClose={() => setEditingRule(undefined)}
        />
      )}

      {/* Phone Number / Real MTProto Login Modal */}
      <PhoneLoginModal
        lang={lang}
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        authState={authState}
        onAuthComplete={() => {
          setAuthState('ready');
          setIsPhoneModalOpen(false);
          handleSyncChats();
        }}
      />

      {/* Chat Manager Modal */}
      <ChatManagerModal
        lang={lang}
        isOpen={isChatManagerOpen}
        onClose={() => setIsChatManagerOpen(false)}
        chats={chats}
        onChatsUpdated={handleChatsUpdated}
      />
    </div>
  );
}
