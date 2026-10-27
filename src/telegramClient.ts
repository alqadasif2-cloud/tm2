import { AuthState, TelegramChat, TelegramProfile } from './types';
import { Store } from './storage';

export interface AuthStateListener {
  (state: AuthState): void;
}

let cachedPhoneCodeHash: string = '';

export const TgClient = {
  listeners: new Set<AuthStateListener>(),

  subscribe(listener: AuthStateListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },

  notify(state: AuthState) {
    this.listeners.forEach(l => l(state));
  },

  getAuthState(): AuthState {
    return Store.getAuthState();
  },

  /**
   * 1. Send real verification code to user's Telegram phone number
   */
  async sendPhoneCode(phone: string): Promise<{ success: boolean; message?: string }> {
    if (!phone || phone.trim().length < 7) {
      return { success: false, message: 'يرجى إدخال رقم هاتف صحيح مع رمز الدولة' };
    }

    try {
      const response = await fetch('/api/telegram/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone.trim() })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, message: data.error || 'فشل إرسال كود التأكيد' };
      }

      cachedPhoneCodeHash = data.phoneCodeHash || '';
      Store.setPhone(phone.trim());
      Store.setAuthState('code');
      this.notify('code');
      return { success: true, message: data.message };
    } catch (err: any) {
      console.error('sendPhoneCode error:', err);
      return { success: false, message: 'تعذر الاتصال بالخادم، تحقق من اتصال الإنترنت' };
    }
  },

  /**
   * 2. Verify real 5-digit confirmation code from Telegram
   */
  async verifyCode(code: string): Promise<{ success: boolean; requiresPassword?: boolean; message?: string }> {
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { success: false, message: 'يرجى كتابة رمز التأكيد' };
    }

    try {
      const response = await fetch('/api/telegram/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: cleanCode, 
          phoneCodeHash: cachedPhoneCodeHash 
        })
      });

      const data = await response.json();

      if (data.requiresPassword) {
        Store.setAuthState('password');
        this.notify('password');
        return { success: false, requiresPassword: true, message: data.message };
      }

      if (!response.ok || !data.success) {
        return { success: false, message: data.error || 'رمز التأكيد غير صحيح' };
      }

      // Success! Connected with real Telegram user account
      const profile: TelegramProfile = {
        id: data.profile.id,
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        username: data.profile.username,
        phone: data.profile.phone,
        isPremium: data.profile.isPremium,
        linkedAt: 'متصل الآن',
        deviceSession: 'Telegram MTProto Real Session'
      };

      Store.setProfile(profile);
      Store.setAuthState('ready');
      this.notify('ready');

      // Fetch real user dialogs from Telegram
      await this.syncRealDialogs();

      return { success: true, message: data.message };
    } catch (err: any) {
      console.error('verifyCode error:', err);
      return { success: false, message: 'حدث خطأ أثناء تأكيد الرمز' };
    }
  },

  /**
   * 3. Verify real 2FA Cloud Password
   */
  async verifyPassword(password: string): Promise<{ success: boolean; message?: string }> {
    if (!password || password.trim().length === 0) {
      return { success: false, message: 'يرجى كتابة كلمة المرور' };
    }

    try {
      const response = await fetch('/api/telegram/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, message: data.error || 'كلمة المرور غير صحيحة' };
      }

      const profile: TelegramProfile = {
        id: data.profile.id,
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        username: data.profile.username,
        phone: data.profile.phone,
        isPremium: data.profile.isPremium,
        linkedAt: 'متصل الآن',
        deviceSession: 'Telegram MTProto Real Session'
      };

      Store.setProfile(profile);
      Store.setAuthState('ready');
      this.notify('ready');

      // Fetch real user dialogs
      await this.syncRealDialogs();

      return { success: true };
    } catch (err: any) {
      console.error('verifyPassword error:', err);
      return { success: false, message: 'حدث خطأ أثناء التحقق' };
    }
  },

  /**
   * 4. Sync real dialogs (channels/groups) from linked Telegram account
   */
  async syncRealDialogs(): Promise<TelegramChat[]> {
    try {
      const response = await fetch('/api/telegram/dialogs');
      if (!response.ok) return Store.getChats();

      const data = await response.json();
      if (data.success && Array.isArray(data.chats) && data.chats.length > 0) {
        Store.saveChats(data.chats);
        return data.chats;
      }
    } catch (err) {
      console.warn('Failed to sync real dialogs:', err);
    }
    return Store.getChats();
  },

  /**
   * 5. Forward real message via Telegram MTProto
   */
  async forwardReal(destChatId: number | string, messageText: string, asCopy: boolean, sourceTitle?: string): Promise<boolean> {
    try {
      const response = await fetch('/api/telegram/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destChatId, messageText, asCopy, sourceTitle })
      });
      const data = await response.json();
      return Boolean(data.success);
    } catch (err) {
      console.warn('Forward real failed:', err);
      return false;
    }
  },

  /**
   * 6. Check real connection status on server boot
   */
  async checkConnectionStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/telegram/status');
      if (!response.ok) return false;
      const data = await response.json();

      if (data.isConnected && data.profile) {
        Store.setProfile({
          id: data.profile.id,
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          username: data.profile.username,
          phone: data.profile.phone,
          isPremium: data.profile.isPremium,
          linkedAt: 'متصل الآن',
          deviceSession: 'Telegram MTProto Real Session'
        });
        Store.setAuthState('ready');
        this.notify('ready');
        return true;
      } else {
        Store.setAuthState('phone');
        this.notify('phone');
        return false;
      }
    } catch (err) {
      return false;
    }
  },

  /**
   * 7. Real Logout
   */
  async logout() {
    try {
      await fetch('/api/telegram/logout', { method: 'POST' });
    } catch (e) {}
    Store.logout();
    this.notify('phone');
  },

  title(id: number): string {
    return Store.getChatTitle(id);
  },

  loadChats(): TelegramChat[] {
    return Store.getChats();
  }
};
