export interface Rule {
  id: string;
  name: string;
  sources: number[]; // Chat IDs
  dest: number;      // Destination Chat ID
  include: string[]; // Keywords that must be in message (case-insensitive)
  exclude: string[]; // Keywords that disqualify message
  asCopy: boolean;   // Send as clean copy without "Forwarded from" header
  enabled: boolean;  // Active flag
  createdAt?: string;
  forwardedCount?: number;
}

export type ChatType = 'channel' | 'supergroup' | 'group' | 'private' | 'bot';

export interface TelegramChat {
  id: number;
  idStr?: string;
  title: string;
  type: ChatType;
  username?: string;
  membersCount?: number;
  avatarColor?: string;
  isCustom?: boolean;
  isCreator?: boolean;
  hasAdminRights?: boolean;
}

export interface ForwardLog {
  id: string;
  timestamp: string;
  sourceChatId: number;
  sourceChatTitle: string;
  destChatId: number;
  destChatTitle: string;
  ruleId: string;
  ruleName: string;
  messageText: string;
  mediaType: 'text' | 'photo' | 'video' | 'document' | 'audio' | 'link';
  asCopy: boolean;
  status: 'forwarded' | 'skipped_filter' | 'error';
  reason?: string;
}

export type AuthState = 
  | 'phone'          // Entering phone number
  | 'code'           // Entering 5-digit verification code
  | 'password'       // 2FA cloud password
  | 'qr'             // QR code scanner login
  | 'ready';         // Fully authenticated & connected

export interface TelegramProfile {
  id: number;
  firstName: string;
  lastName?: string;
  username: string;
  phone: string;
  isPremium?: boolean;
  avatarUrl?: string;
  linkedAt?: string;
  deviceSession?: string;
}

export interface DailyStats {
  date: string; // YYYYMMDD
  count: number;
  totalAllTime: number;
}
