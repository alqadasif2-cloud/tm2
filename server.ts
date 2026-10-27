import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
// @ts-ignore
import { computeCheck } from 'telegram/Password.js';

// Enable safe JSON serialization of Telegram BigInt values
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const PORT = 3000;
const SESSION_FILE = path.resolve('.telegram_session.json');

// Standard official Telegram Web credentials
const DEFAULT_API_ID = 2040;
const DEFAULT_API_HASH = 'b18441a1ff607e10a989891a5462e627';

app.use(express.json());

// In-memory Telegram Client and state
let telegramClient: TelegramClient | null = null;
let currentPhone: string = '';
let currentPhoneCodeHash: string = '';

// Helper to load saved session
function loadSavedSession(): string {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
      return data.session || '';
    }
  } catch (err) {
    console.warn('Failed to load session file:', err);
  }
  return '';
}

// Helper to save session
function saveSessionString(sessionStr: string, profile?: any) {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify({ session: sessionStr, profile, savedAt: new Date().toISOString() }, null, 2));
  } catch (err) {
    console.error('Failed to save session file:', err);
  }
}

// Helper to clear session
function clearSavedSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

// Get or initialize client
async function getClient(sessionStr?: string): Promise<TelegramClient> {
  const session = new StringSession(sessionStr ?? loadSavedSession());
  if (telegramClient) {
    if (telegramClient.connected) {
      return telegramClient;
    }
    await telegramClient.connect();
    return telegramClient;
  }

  telegramClient = new TelegramClient(session, DEFAULT_API_ID, DEFAULT_API_HASH, {
    connectionRetries: 5,
    useWSS: true,
  });

  await telegramClient.connect();
  return telegramClient;
}

// ----------------------------------------------------
// REAL TELEGRAM API ENDPOINTS
// ----------------------------------------------------

/**
 * 1. Send Code to Real Telegram Phone Number
 */
app.post('/api/telegram/send-code', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ success: false, error: 'رقم الهاتف مطلوب' });
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    console.log(`[Telegram MTProto] Sending real verification code to: ${cleanPhone}`);

    // Disconnect any existing unauthenticated client to start fresh
    if (telegramClient) {
      try {
        await telegramClient.disconnect();
      } catch (e) {}
      telegramClient = null;
    }

    const client = await getClient('');
    const result = await client.sendCode(
      { apiId: DEFAULT_API_ID, apiHash: DEFAULT_API_HASH },
      cleanPhone
    );

    currentPhone = cleanPhone;
    currentPhoneCodeHash = result.phoneCodeHash;

    console.log(`[Telegram MTProto] Code successfully dispatched by Telegram! phoneCodeHash: ${result.phoneCodeHash}`);

    return res.json({
      success: true,
      phoneCodeHash: result.phoneCodeHash,
      isCodeViaApp: result.isCodeViaApp,
      message: 'تم إرسال كود التأكيد الحقيقي إلى تطبيق تيليجرام الخاص بك'
    });
  } catch (err: any) {
    console.error('[Telegram MTProto Error] send-code failed:', err);
    let userMsg = err.message || 'حدث خطأ أثناء الاتصال بسيرفرات تيليجرام';

    if (userMsg.includes('PHONE_NUMBER_INVALID')) {
      userMsg = 'رقم الهاتف غير صحيح، تأكد من رمز الدولة ورقم الهاتف';
    } else if (userMsg.includes('FLOOD_WAIT')) {
      userMsg = 'تمت محاولة إرسال الكود عدة مرات، يرجى الانتظار قليلاً والمحاولة لاحقاً';
    } else if (userMsg.includes('PHONE_NUMBER_BANNED')) {
      userMsg = 'هذا الرقم محظور في تيليجرام';
    }

    return res.status(400).json({ success: false, error: userMsg });
  }
});

/**
 * 2. Verify 5-Digit Confirmation Code
 */
app.post('/api/telegram/verify-code', async (req: Request, res: Response) => {
  try {
    const { code, phoneCodeHash } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'رمز التأكيد مطلوب' });
    }

    const client = await getClient();
    const hashToUse = phoneCodeHash || currentPhoneCodeHash;
    const phoneToUse = currentPhone;

    console.log(`[Telegram MTProto] Verifying code for phone ${phoneToUse}`);

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phoneToUse,
          phoneCodeHash: hashToUse,
          phoneCode: code.toString().trim(),
        })
      );
    } catch (invokeErr: any) {
      if (invokeErr.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        console.log('[Telegram MTProto] 2FA Password is required for this account');
        return res.json({
          success: false,
          requiresPassword: true,
          message: 'الحساب محمي بكلمة مرور التحقق بخطوتين (2FA)'
        });
      }
      throw invokeErr;
    }

    // Successfully signed in!
    const me: any = await client.getMe();
    const sessionStr = String(client.session.save());
    
    const profile = {
      id: Number(me.id),
      firstName: me.firstName || '',
      lastName: me.lastName || '',
      username: me.username || '',
      phone: me.phone ? `+${me.phone}` : phoneToUse,
      isPremium: Boolean(me.premium),
    };

    saveSessionString(sessionStr, profile);
    console.log(`[Telegram MTProto] Real login success! User: ${profile.firstName} (@${profile.username})`);

    return res.json({
      success: true,
      requiresPassword: false,
      profile,
      message: 'تم تسجيل الدخول والربط بنجاح!'
    });
  } catch (err: any) {
    console.error('[Telegram MTProto Error] verify-code failed:', err);
    let userMsg = err.message || 'رمز التأكيد غير صحيح';

    if (userMsg.includes('PHONE_CODE_INVALID')) {
      userMsg = 'رمز التأكيد المدخل غير صحيح، يرجى التأكد وإعادة المحاولة';
    } else if (userMsg.includes('PHONE_CODE_EXPIRED')) {
      userMsg = 'انتهت صلاحية رمز التأكيد، يرجى طلب كود جديد';
    }

    return res.status(400).json({ success: false, error: userMsg });
  }
});

/**
 * 3. Verify 2FA Cloud Password (if enabled)
 */
app.post('/api/telegram/verify-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'كلمة المرور مطلوبة' });
    }

    const client = await getClient();
    console.log('[Telegram MTProto] Verifying 2FA password...');

    const passwordSrp: any = await client.invoke(new Api.account.GetPassword());
    const inputCheckPasswordSRP = await computeCheck(passwordSrp, password);

    await client.invoke(
      new Api.auth.CheckPassword({
        password: inputCheckPasswordSRP,
      })
    );

    const me: any = await client.getMe();
    const sessionStr = String(client.session.save());
    const profile = {
      id: Number(me.id),
      firstName: me.firstName || '',
      lastName: me.lastName || '',
      username: me.username || '',
      phone: me.phone ? `+${me.phone}` : currentPhone,
      isPremium: Boolean(me.premium),
    };

    saveSessionString(sessionStr, profile);
    console.log(`[Telegram MTProto] 2FA verified successfully for @${profile.username}`);

    return res.json({
      success: true,
      profile,
      message: 'تم التحقق بنجاح!'
    });
  } catch (err: any) {
    console.error('[Telegram MTProto Error] verify-password failed:', err);
    let userMsg = err.message || 'كلمة المرور غير صحيحة';
    if (userMsg.includes('PASSWORD_HASH_INVALID')) {
      userMsg = 'كلمة مرور التحقق بخطوتين غير صحيحة';
    }
    return res.status(400).json({ success: false, error: userMsg });
  }
});

/**
 * 4. Check Current Telegram Connection Status
 */
app.get('/api/telegram/status', async (req: Request, res: Response) => {
  try {
    const saved = loadSavedSession();
    if (!saved) {
      return res.json({ isConnected: false });
    }

    const client = await getClient(saved);
    const isAuth = await client.isUserAuthorized();
    if (!isAuth) {
      return res.json({ isConnected: false });
    }

    const me: any = await client.getMe();
    return res.json({
      isConnected: true,
      profile: {
        id: Number(me.id),
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        username: me.username || '',
        phone: me.phone ? `+${me.phone}` : '',
        isPremium: Boolean(me.premium),
      }
    });
  } catch (err: any) {
    return res.json({ isConnected: false, error: err.message });
  }
});

/**
 * 5. Fetch Real Dialogs (Channels, Groups, Chats) from Linked Telegram
 */
app.get('/api/telegram/dialogs', async (req: Request, res: Response) => {
  try {
    const saved = loadSavedSession();
    if (!saved) {
      return res.status(401).json({ success: false, error: 'غير مسجل الدخول' });
    }

    const client = await getClient(saved);
    const isAuth = await client.isUserAuthorized();
    if (!isAuth) {
      return res.status(401).json({ success: false, error: 'جلسة تيليجرام غير مصرحة' });
    }

    console.log('[Telegram MTProto] Fetching real user dialogs from Telegram servers (channels, groups, chats)...');
    const dialogs = await client.getDialogs({ limit: 300 });

    const chats = dialogs
      .filter((d: any) => d && d.id)
      .map((d: any) => {
        const isChannel = Boolean(d.isChannel || d.entity?.broadcast);
        const isSupergroup = Boolean(d.entity?.megagroup);
        const isGroup = Boolean(d.isGroup || isSupergroup);
        const type: 'channel' | 'supergroup' | 'group' | 'private' = isChannel 
          ? 'channel' 
          : isSupergroup 
            ? 'supergroup' 
            : isGroup 
              ? 'group' 
              : 'private';

        const idStr = String(d.id || '0');
        const idNum = Number(idStr);
        const isCreator = Boolean(d.entity?.creator);
        const hasAdminRights = Boolean(d.entity?.adminRights);

        return {
          id: idNum,
          idStr: idStr,
          title: d.title || (d.entity?.firstName ? `${d.entity.firstName} ${d.entity.lastName || ''}`.trim() : `محادثة (${idStr})`),
          type: type,
          username: d.entity?.username || undefined,
          membersCount: d.entity?.participantsCount ? Number(d.entity.participantsCount) : undefined,
          isCreator,
          hasAdminRights,
          avatarColor: isChannel ? 'bg-sky-600' : isGroup ? 'bg-indigo-600' : 'bg-emerald-600'
        };
      })
      // Sort channels and groups first, especially user's own channels
      .sort((a: any, b: any) => {
        if (a.isCreator && !b.isCreator) return -1;
        if (!a.isCreator && b.isCreator) return 1;
        if (a.type === 'channel' && b.type !== 'channel') return -1;
        if (a.type !== 'channel' && b.type === 'channel') return 1;
        return 0;
      });

    console.log(`[Telegram MTProto] Fetched ${chats.length} real dialogs! Channels & Groups: ${chats.filter((c: any) => c.type === 'channel' || c.type === 'group' || c.type === 'supergroup').length}`);
    return res.json({ success: true, count: chats.length, chats });
  } catch (err: any) {
    console.error('[Telegram MTProto Error] dialogs fetch failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. Send / Forward Real Message on Telegram
 */
app.post('/api/telegram/forward', async (req: Request, res: Response) => {
  try {
    const { destChatId, messageText, asCopy, sourceTitle } = req.body;
    const saved = loadSavedSession();
    if (!saved) {
      return res.status(401).json({ success: false, error: 'غير متصل بحساب تيليجرام' });
    }

    const client = await getClient(saved);
    const isAuth = await client.isUserAuthorized();
    if (!isAuth) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const textToSend = asCopy 
      ? messageText 
      : `↪️ محولة من: ${sourceTitle || 'مصدر خارجي'}\n\n${messageText}`;

    console.log(`[Telegram MTProto] Sending real message to dest chat ID: ${destChatId}`);
    await client.sendMessage(destChatId, { message: textToSend });

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Telegram MTProto Error] forward failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 7. Logout
 */
app.post('/api/telegram/logout', async (req: Request, res: Response) => {
  try {
    if (telegramClient) {
      try {
        await telegramClient.disconnect();
      } catch (e) {}
      telegramClient = null;
    }
    clearSavedSession();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TForwarder Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
