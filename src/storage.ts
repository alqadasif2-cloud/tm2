import { Rule, TelegramChat, AuthState, TelegramProfile, ForwardLog } from './types';

const STORAGE_KEYS = {
  RUNNING: 'tf_running',
  RULES: 'tf_rules',
  AUTH_STATE: 'tf_auth_state',
  PROFILE: 'tf_profile',
  PHONE: 'tf_phone',
  CHATS: 'tf_chats',
  LOGS: 'tf_forward_logs',
  TOTAL_COUNT: 'tf_total_forwarded',
  LANG: 'tf_language'
};

const DEFAULT_CHATS: TelegramChat[] = [
  {
    id: -1001452901234,
    title: 'قناة الأخبار العاجلة والتقنية ⚡',
    type: 'channel',
    username: 'breaking_tech_news',
    membersCount: 45200,
    avatarColor: 'bg-emerald-500'
  },
  {
    id: -1001893712345,
    title: 'عروض وتخفيضات البرمجيات 🏷️',
    type: 'channel',
    username: 'saudi_tech_deals',
    membersCount: 18900,
    avatarColor: 'bg-amber-500'
  },
  {
    id: -1001923849102,
    title: 'مجتمع مطوري الذكاء الاصطناعي 🤖',
    type: 'supergroup',
    username: 'ai_developers_mena',
    membersCount: 12450,
    avatarColor: 'bg-indigo-500'
  },
  {
    id: -1002039485721,
    title: 'أخبار العملات الرقمية والكريبتو 📊',
    type: 'channel',
    username: 'crypto_mena_signals',
    membersCount: 31000,
    avatarColor: 'bg-cyan-500'
  },
  {
    id: -1002148596321,
    title: 'قناة الأرشيف والنسخ الاحتياطي 📁 (وجهتي)',
    type: 'channel',
    username: 'my_backup_vault',
    membersCount: 1,
    avatarColor: 'bg-blue-600'
  },
  {
    id: -1002259684710,
    title: 'مجموعتي الخاصة للمتابعة 👥 (وجهتي)',
    type: 'group',
    username: 'my_private_group',
    membersCount: 5,
    avatarColor: 'bg-purple-600'
  },
  {
    id: 777000,
    title: 'Telegram Official Notifications 💬',
    type: 'private',
    username: 'telegram',
    avatarColor: 'bg-sky-500'
  }
];

const DEFAULT_RULES: Rule[] = [
  {
    id: 'rule-sample-1',
    name: 'توجيه عروض التخفيضات المهمة',
    sources: [-1001893712345],
    dest: -1002148596321,
    include: ['خصم', 'مجاني', 'عرض', 'كود', 'تخفيض'],
    exclude: ['منتهي', 'إعلان مدفوع'],
    asCopy: true,
    enabled: true,
    createdAt: new Date().toISOString(),
    forwardedCount: 14
  },
  {
    id: 'rule-sample-2',
    name: 'توجيه أخبار الذكاء الاصطناعي العاجلة',
    sources: [-1001452901234, -1001923849102],
    dest: -1002259684710,
    include: ['ذكاء اصطناعي', 'gemini', 'gpt', 'تحديث', 'جديد'],
    exclude: ['سبام', 'إشهار'],
    asCopy: false,
    enabled: true,
    createdAt: new Date().toISOString(),
    forwardedCount: 28
  }
];

const getTodayKey = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `tf_cnt_${y}${m}${day}`;
};

export const Store = {
  // Master Running Toggle
  isRunning(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.RUNNING);
    return val !== null ? val === 'true' : true;
  },
  setRunning(state: boolean) {
    localStorage.setItem(STORAGE_KEYS.RUNNING, state ? 'true' : 'false');
  },

  // Auth State
  getAuthState(): AuthState {
    const state = localStorage.getItem(STORAGE_KEYS.AUTH_STATE) as AuthState;
    if (state) return state;
    const phone = localStorage.getItem(STORAGE_KEYS.PHONE);
    return phone ? 'ready' : 'phone';
  },
  setAuthState(state: AuthState) {
    localStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
  },

  // Phone number
  getPhone(): string {
    return localStorage.getItem(STORAGE_KEYS.PHONE) || '';
  },
  setPhone(phone: string) {
    localStorage.setItem(STORAGE_KEYS.PHONE, phone);
  },

  // Linked User Profile
  getProfile(): TelegramProfile {
    const str = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        // fallback
      }
    }
    const phone = this.getPhone();
    return {
      id: 0,
      firstName: phone ? 'مستخدم تيليجرام' : '',
      username: '',
      phone: phone,
      isPremium: false,
      linkedAt: '',
      deviceSession: ''
    };
  },
  setProfile(p: TelegramProfile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(p));
  },

  // Rules list
  getRules(): Rule[] {
    const str = localStorage.getItem(STORAGE_KEYS.RULES);
    if (!str) {
      this.saveRules(DEFAULT_RULES);
      return DEFAULT_RULES;
    }
    try {
      return JSON.parse(str);
    } catch {
      return DEFAULT_RULES;
    }
  },
  saveRules(rules: Rule[]) {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  },
  upsertRule(rule: Rule) {
    const list = this.getRules();
    const idx = list.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      list[idx] = rule;
    } else {
      list.push(rule);
    }
    this.saveRules(list);
  },
  deleteRule(id: string) {
    const list = this.getRules().filter(r => r.id !== id);
    this.saveRules(list);
  },

  // Forward Counters
  todayCount(): number {
    const val = localStorage.getItem(getTodayKey());
    return val ? parseInt(val, 10) : 42;
  },
  totalCount(): number {
    const val = localStorage.getItem(STORAGE_KEYS.TOTAL_COUNT);
    return val ? parseInt(val, 10) : 348;
  },
  inc(): { today: number; total: number } {
    const key = getTodayKey();
    const currentToday = this.todayCount();
    const newToday = currentToday + 1;
    localStorage.setItem(key, newToday.toString());

    const currentTotal = this.totalCount();
    const newTotal = currentTotal + 1;
    localStorage.setItem(STORAGE_KEYS.TOTAL_COUNT, newTotal.toString());

    return { today: newToday, total: newTotal };
  },

  // Chats
  getChats(): TelegramChat[] {
    const str = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!str) {
      this.saveChats(DEFAULT_CHATS);
      return DEFAULT_CHATS;
    }
    try {
      return JSON.parse(str);
    } catch {
      return DEFAULT_CHATS;
    }
  },
  saveChats(chats: TelegramChat[]) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },
  addCustomChat(chat: TelegramChat) {
    const chats = this.getChats();
    const exists = chats.some(c => c.id === chat.id);
    if (!exists) {
      chats.unshift(chat);
      this.saveChats(chats);
    }
  },
  deleteCustomChat(id: number) {
    const chats = this.getChats().filter(c => c.id !== id);
    this.saveChats(chats);
  },
  getChatTitle(id: number): string {
    if (id === 0) return 'غير محدد';
    const chats = this.getChats();
    const found = chats.find(c => c.id === id);
    return found ? found.title : `محادثة (${id})`;
  },

  // Forwarding Logs
  getLogs(): ForwardLog[] {
    const str = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  },
  addLog(log: ForwardLog) {
    const logs = this.getLogs();
    logs.unshift(log);
    if (logs.length > 150) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },
  clearLogs() {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
  },

  // Language
  getLanguage(): 'ar' | 'en' {
    return (localStorage.getItem(STORAGE_KEYS.LANG) as 'ar' | 'en') || 'ar';
  },
  setLanguage(lang: 'ar' | 'en') {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  },

  // Logout / Disconnect Phone
  logout() {
    localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'phone');
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }
};
