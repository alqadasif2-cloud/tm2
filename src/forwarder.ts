import { Rule, ForwardLog, TelegramChat } from './types';
import { Store } from './storage';
import { TgClient } from './telegramClient';

export interface IncomingMessage {
  id: number;
  chatId: number;
  text: string;
  mediaType?: 'text' | 'photo' | 'video' | 'document' | 'audio' | 'link';
  mediaUrl?: string;
  date: number;
  author?: string;
}

export interface ForwardResult {
  rule: Rule;
  status: 'forwarded' | 'skipped_filter';
  reason?: string;
  destChatTitle: string;
}

export const Forwarder = {
  /**
   * Evaluates an incoming message against all configured rules.
   * Matches exact logic from Forwarder.kt:
   * - checks Store.running
   * - checks rule.enabled
   * - checks m.chatId in r.sources and m.chatId != r.dest
   * - checks r.include filter (must contain at least one if defined)
   * - checks r.exclude filter (must NOT contain any if defined)
   * - forwards with asCopy flag
   */
  async processMessage(
    msg: IncomingMessage,
    onLogAdded?: (log: ForwardLog) => void
  ): Promise<ForwardResult[]> {
    if (!Store.isRunning()) {
      return [];
    }

    const rules = Store.getRules();
    const normalizedText = msg.text.toLowerCase();
    const sourceChatTitle = Store.getChatTitle(msg.chatId);
    const results: ForwardResult[] = [];

    for (const rule of rules) {
      const destChatTitle = Store.getChatTitle(rule.dest);

      // 1. Is rule enabled?
      if (!rule.enabled) {
        continue;
      }

      // 2. Is incoming chat in sources?
      if (!rule.sources.includes(msg.chatId)) {
        continue;
      }

      // 3. Avoid loop (source == dest)
      if (msg.chatId === rule.dest) {
        continue;
      }

      // 4. Check include filter
      if (rule.include.length > 0) {
        const hasInclude = rule.include.some(word => 
          normalizedText.includes(word.toLowerCase().trim())
        );
        if (!hasInclude) {
          const log: ForwardLog = {
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            timestamp: new Date().toLocaleTimeString(),
            sourceChatId: msg.chatId,
            sourceChatTitle,
            destChatId: rule.dest,
            destChatTitle,
            ruleId: rule.id,
            ruleName: rule.name,
            messageText: msg.text,
            mediaType: msg.mediaType || 'text',
            asCopy: rule.asCopy,
            status: 'skipped_filter',
            reason: `لم تطابق كلمات التضمين (${rule.include.join(', ')})`
          };
          Store.addLog(log);
          onLogAdded?.(log);
          results.push({ rule, status: 'skipped_filter', reason: log.reason, destChatTitle });
          continue;
        }
      }

      // 5. Check exclude filter
      if (rule.exclude.length > 0) {
        const hitExclude = rule.exclude.find(word => 
          normalizedText.includes(word.toLowerCase().trim())
        );
        if (hitExclude) {
          const log: ForwardLog = {
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            timestamp: new Date().toLocaleTimeString(),
            sourceChatId: msg.chatId,
            sourceChatTitle,
            destChatId: rule.dest,
            destChatTitle,
            ruleId: rule.id,
            ruleName: rule.name,
            messageText: msg.text,
            mediaType: msg.mediaType || 'text',
            asCopy: rule.asCopy,
            status: 'skipped_filter',
            reason: `استُثنيت بسبب الكلمة: "${hitExclude}"`
          };
          Store.addLog(log);
          onLogAdded?.(log);
          results.push({ rule, status: 'skipped_filter', reason: log.reason, destChatTitle });
          continue;
        }
      }

      // Forwarding condition met!
      Store.inc();

      // Update rule count
      rule.forwardedCount = (rule.forwardedCount || 0) + 1;
      Store.upsertRule(rule);

      const log: ForwardLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toLocaleTimeString(),
        sourceChatId: msg.chatId,
        sourceChatTitle,
        destChatId: rule.dest,
        destChatTitle,
        ruleId: rule.id,
        ruleName: rule.name,
        messageText: msg.text,
        mediaType: msg.mediaType || 'text',
        asCopy: rule.asCopy,
        status: 'forwarded',
        reason: rule.asCopy 
          ? 'تم التحويل كنسخة نظيفة (بدون رأس التوجيه)' 
          : 'تم التحويل المباشر مع رأس التوجيه'
      };

      // Forward real message to Telegram if connected
      TgClient.forwardReal(rule.dest, msg.text, rule.asCopy, sourceChatTitle).catch(() => {});

      Store.addLog(log);
      onLogAdded?.(log);
      results.push({ rule, status: 'forwarded', destChatTitle });
    }

    return results;
  }
};
