import React, { useState, useEffect } from 'react';
import { 
  Send, Sparkles, Play, Pause, Image, FileText, Music, 
  Video, MessageSquare, CheckCircle, XCircle, ArrowLeft, ArrowRight 
} from 'lucide-react';
import { TelegramChat, Rule, ForwardLog } from '../types';
import { translations } from '../translations';
import { Forwarder, IncomingMessage, ForwardResult } from '../forwarder';

interface MessageSimulatorProps {
  lang: 'ar' | 'en';
  chats: TelegramChat[];
  rules: Rule[];
  isRunning: boolean;
  onMessageProcessed: (results: ForwardResult[], log?: ForwardLog) => void;
}

export const MessageSimulator: React.FC<MessageSimulatorProps> = ({
  lang,
  chats,
  rules,
  isRunning,
  onMessageProcessed
}) => {
  const t = translations[lang];

  // Pick first channel as default source
  const sourceChats = chats.filter(c => c.type === 'channel' || c.type === 'supergroup');
  const [selectedChatId, setSelectedChatId] = useState<number>(
    sourceChats[0]?.id || chats[0]?.id || 0
  );
  const [text, setText] = useState('🔥 عرض حصري: كود خصم 50% مجاني على كافة برامج الذكاء الاصطناعي والتطوير السحابي!');
  const [mediaType, setMediaType] = useState<'text' | 'photo' | 'video' | 'document'>('text');
  const [autoSimulate, setAutoSimulate] = useState(false);
  const [lastResults, setLastResults] = useState<ForwardResult[] | null>(null);

  const presets = [
    {
      label: 'خصم وعرض مجاني (مطابق)',
      text: '🎉 عرض خاص: كود خصم 40% مجاني لفترة محدودة على الاشتراك السنوي!'
    },
    {
      label: 'أخبار الذكاء الاصطناعي (مطابق)',
      text: '🚀 عاجل: إطلاق إصدار جديد من نماذج الذكاء الاصطناعي متعددة الوسائط فائق الدقة!'
    },
    {
      label: 'رسالة إعلانية سبام (مستبعدة)',
      text: '❌ إعلان ممول سبام: اضغط هنا لربح فوري بدون شروط (منتهي)'
    },
    {
      label: 'رسالة عادية لا تحتوي فلاتر',
      text: 'مرحبا بكم في تحديث اليوم نتمنى لكم يوما سعيدا وموفقا'
    }
  ];

  const handleSend = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : text;
    if (!textToSend.trim()) return;

    const msg: IncomingMessage = {
      id: Date.now(),
      chatId: selectedChatId,
      text: textToSend,
      mediaType: mediaType,
      date: Math.floor(Date.now() / 1000)
    };

    const results = await Forwarder.processMessage(msg, (log) => {
      onMessageProcessed(results, log);
    });

    setLastResults(results);
    onMessageProcessed(results);
  };

  // Background Auto-simulator effect
  useEffect(() => {
    if (!autoSimulate || !isRunning) return;

    const interval = setInterval(() => {
      const randomPreset = presets[Math.floor(Math.random() * presets.length)];
      const randomSource = sourceChats[Math.floor(Math.random() * sourceChats.length)] || chats[0];
      if (randomSource) {
        setSelectedChatId(randomSource.id);
        const msg: IncomingMessage = {
          id: Date.now(),
          chatId: randomSource.id,
          text: randomPreset.text,
          mediaType: 'text',
          date: Math.floor(Date.now() / 1000)
        };
        Forwarder.processMessage(msg).then(res => {
          setLastResults(res);
          onMessageProcessed(res);
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [autoSimulate, isRunning, chats, sourceChats]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {t.simulatorTitle}
            </h3>
            <p className="text-xs text-slate-400">
              {t.simulatorDesc}
            </p>
          </div>
        </div>

        {/* Auto simulate ticker toggle */}
        <button
          onClick={() => setAutoSimulate(!autoSimulate)}
          disabled={!isRunning}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            autoSimulate
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          } ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {autoSimulate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{autoSimulate ? t.autoSimulateOn : t.autoSimulate}</span>
        </button>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Source Channel Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t.selectSource}
          </label>
          <select
            value={selectedChatId}
            onChange={(e) => setSelectedChatId(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {chats.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* Media Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            نوع الوسائط:
          </label>
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMediaType('text')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                mediaType === 'text' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>نص</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType('photo')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                mediaType === 'photo' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Image className="w-3 h-3" />
              <span>صورة</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType('video')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                mediaType === 'video' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3 h-3" />
              <span>فيديو</span>
            </button>
          </div>
        </div>

        {/* Dispatch Action Button */}
        <div className="flex items-end">
          <button
            onClick={() => handleSend()}
            disabled={!isRunning}
            className={`w-full py-2 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isRunning 
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.sendTest}</span>
          </button>
        </div>

      </div>

      {/* Message Text Input */}
      <div>
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.messagePlaceholder}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-medium">{t.quickPresets}</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setText(p.text);
              handleSend(p.text);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-colors cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Evaluation Result Feedback */}
      {lastResults && lastResults.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 animate-in fade-in">
          <span className="text-[11px] font-semibold text-slate-400 block">نتيجة معالجة الفلاتر الآن:</span>
          {lastResults.map((res, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {res.status === 'forwarded' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-400" />
                )}
                <span className="font-semibold text-white">{res.rule.name}</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="text-sky-300">{res.destChatTitle}</span>
              </div>
              <div>
                {res.status === 'forwarded' ? (
                  <span className="text-[11px] text-emerald-400 font-medium">✓ تم التوجيه بنجاح</span>
                ) : (
                  <span className="text-[11px] text-amber-400 font-medium">{res.reason}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
