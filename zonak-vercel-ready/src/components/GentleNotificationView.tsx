import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  Coffee,
  Moon,
  Sofa,
  Zap,
} from 'lucide-react';
import { ZonakSmiley } from './ZonakArt';

interface GentleNotificationViewProps {
  taskTitle: string;
  quietEnabled: boolean;
  onToggleQuiet: (val: boolean) => void;
  onTakeBreak: () => void;
  onBackToPlan: () => void;
}

export const GentleNotificationView: React.FC<GentleNotificationViewProps> = ({
  taskTitle,
  quietEnabled,
  onToggleQuiet,
  onTakeBreak,
  onBackToPlan,
}) => {
  const [nextChoice, setNextChoice] = useState<'15m' | 'done_today' | 'ready_now'>('15m');

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToPlan}
          className="min-h-[44px] px-3 rounded-xl bg-white border border-[#EFEAE0] text-[#1A2230] font-semibold text-sm flex items-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <h1 className="text-base font-bold text-[#1A2230]">إشعار زونك اللطيف</h1>
      </div>

      {/* Live Notification Banner Preview */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFEAE0] shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <ZonakSmiley size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm text-[#0A467E]">
                زونك • عاش يا بطل ✨
              </span>
              <span className="text-xs text-[#7D8593]">الآن</span>
            </div>
            <p className="text-sm text-[#2A3342] leading-relaxed mt-1">
              خلّصت خطوتك وريّحت ضميرك! فنجان الشاي أو ٥ دقايق روقان يستاهلوك دلوقتي..
              خُد نفس عميق واسترخي ☕🍃
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onBackToPlan}
            className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#EFECE4] text-[#3B4454] text-xs font-semibold hover:bg-[#E5E0D4] cursor-pointer"
          >
            شكراً يا زونك
          </button>
          <button
            type="button"
            onClick={onTakeBreak}
            className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#F6D258] text-[#3F2D00] text-xs font-bold hover:bg-[#F2C73D] cursor-pointer"
          >
            استراحة روقان (٥ د)
          </button>
        </div>
      </div>

      {/* Peace Summary Card */}
      <div className="bg-gradient-to-b from-[#FEF8E2] to-white rounded-3xl p-6 border border-[#EFEAE0] text-center space-y-4">
        <ZonakSmiley size={64} withHalo className="mx-auto" />

        <div className="inline-flex items-center gap-1.5 bg-[#EFECE4] text-[#495464] text-xs font-semibold px-3 py-1 rounded-full">
          <span>تمت براحة بال 🌿</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1A2230]">{taskTitle}</h2>

        <p className="text-sm text-[#5C6676] leading-relaxed max-w-md mx-auto">
          إحنا مش في سباق ولا وراك حد بيحاسبك بالدقيقة.. كل خطوة بسيطة بتفرق. إشعار
          زونك مش هدفه يزنّ، هدفه بس يفكرك إنك إنسان ويستحق ياخد نَفَس عميق.
        </p>

        <div className="grid grid-cols-3 gap-2 bg-[#FBF9F5] rounded-2xl p-3.5 border border-[#EFEAE0] text-center">
          <div>
            <p className="text-[11px] text-[#6B7280]">الجهد المبذول</p>
            <p className="text-base font-bold text-[#0A467E] tabular-nums">٤٥ دقيقة</p>
          </div>
          <div className="border-x border-[#E7E1D3]">
            <p className="text-[11px] text-[#6B7280]">مستوى الروقان</p>
            <p className="text-base font-bold text-[#185FA5] tabular-nums">تام ومطمئن 🍵</p>
          </div>
          <div>
            <p className="text-[11px] text-[#6B7280]">الراحة المستحقة</p>
            <p className="text-base font-bold text-[#0A467E]">مفتوحة ✨</p>
          </div>
        </div>
      </div>

      {/* Next Step Choice */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-[#1A2230]">
          🤍 تحب أفكّرك بالخطوة الجاية بعد الاستراحة؟
        </h3>
        <p className="text-xs text-[#6B7280]">
          اختر اللي يريح دماغك، ومفيش أي إحراج لو اخترت ترتاح لباقي اليوم.
        </p>

        <div className="space-y-2.5">
          {[
            {
              id: '15m' as const,
              title: 'اه، نبهني بروقان كمان ربع ساعة',
              sub: 'إشعار هادئ وبدون تكرار مزعج',
              icon: <Sofa className="w-5 h-5 text-[#0A467E]" />,
            },
            {
              id: 'done_today' as const,
              title: 'لا، كفاية شغل النهارده خلاص',
              sub: 'هنقفل التنبيهات ونكمل بكرة برضا',
              icon: <Moon className="w-5 h-5 text-[#A67916]" />,
            },
            {
              id: 'ready_now' as const,
              title: 'أنا جاهز ومبسوط أكمّل دلوقتي',
              sub: 'الدافع عالي والطاقة حاضرة',
              icon: <Zap className="w-5 h-5 text-[#D97706]" />,
            },
          ].map((opt) => {
            const active = nextChoice === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setNextChoice(opt.id)}
                className={`w-full bg-white rounded-2xl p-4 border flex items-center justify-between gap-3 text-right transition-colors cursor-pointer ${
                  active ? 'border-[#0A467E] bg-[#F8FBFF]' : 'border-[#EFEAE0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F6F4EE] flex items-center justify-center shrink-0">
                    {opt.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1A2230]">{opt.title}</p>
                    <p className="text-xs text-[#6B7280]">{opt.sub}</p>
                  </div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-[#0A467E] border-[#0A467E] text-white'
                      : 'border-[#CBD5E1]'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiet Mode Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-[#EFEAE0] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF0C8] flex items-center justify-center text-[#8D6E18] shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#1A2230]">وضع الإشعارات الهادئة مفعّل</p>
            <p className="text-xs text-[#6B7280]">
              بدون رنات ترن في الودن، وتنبيه واحد لطيف ودافئ بس.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={quietEnabled}
          onClick={() => onToggleQuiet(!quietEnabled)}
          className={`w-12 h-7 rounded-full transition-colors p-1 cursor-pointer shrink-0 ${
            quietEnabled ? 'bg-[#0A467E]' : 'bg-[#D1D5DB]'
          }`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white transition-transform ${
              quietEnabled ? '-translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onTakeBreak}
          className="w-full min-h-[52px] rounded-full bg-[#0A467E] hover:bg-[#083968] text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
        >
          <Coffee className="w-5 h-5" />
          <span>أخذ استراحة دلوقتي ☕</span>
        </button>
        <button
          type="button"
          onClick={onBackToPlan}
          className="w-full min-h-[48px] rounded-full bg-white border border-[#E6E0D3] text-[#0A467E] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#FAF8F2] cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>الرجوع لخطة النهارده</span>
        </button>
      </div>
    </div>
  );
};
