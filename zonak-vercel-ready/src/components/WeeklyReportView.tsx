import React, { useState } from 'react';
import {
  ArrowRight,
  Brain,
  Calendar,
  Check,
  Coffee,
  Compass,
  Flame,
  Footprints,
  Heart,
  Home,
  ListChecks,
  Moon,
  Share2,
  Shield,
  Sofa,
  Sparkles,
  Sun,
} from 'lucide-react';
import { WEEKLY_RHYTHM_DATA, toArabicDigits } from '../data/initialData';
import { ZonakSmiley } from './ZonakArt';

interface WeeklyReportViewProps {
  completedStepsCount: number;
  restHours: number;
  recoveryDays: number;
  calmStreakDays?: number;
  onOpenStoryStudio: () => void;
  onOpenTasksHub?: () => void;
  onBackHome: () => void;
}

const PACE_OPTIONS = [
  { id: 'turtle', label: 'على مهلي.. خطوة بخطوة 🐢', icon: '🐇' },
  { id: 'medium', label: 'طاقة متوسطة وتركيز هادي ☕', icon: '☕' },
  { id: 'flow', label: 'حسب ما تيجي وحسب طاقتي 🌤️', icon: '☁️' },
];

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  completedStepsCount,
  restHours,
  recoveryDays,
  calmStreakDays = 7,
  onOpenStoryStudio,
  onOpenTasksHub,
  onBackHome,
}) => {
  const [selectedDayId, setSelectedDayId] = useState<string>('mon');
  const [nextWeekPace, setNextWeekPace] = useState<string>('turtle');

  const activeDay =
    WEEKLY_RHYTHM_DATA.find((d) => d.id === selectedDayId) ?? WEEKLY_RHYTHM_DATA[2];

  const renderRhythmIcon = (icon: string) => {
    switch (icon) {
      case 'coffee':
        return <Coffee className="w-5 h-5" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'shield':
        return <Shield className="w-5 h-5" />;
      case 'brain':
        return <Brain className="w-5 h-5" />;
      case 'sun':
        return <Sun className="w-5 h-5" />;
      case 'heart':
        return <Heart className="w-5 h-5" />;
      default:
        return <Moon className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackHome}
          className="min-h-[44px] px-3 rounded-xl bg-white border border-[#E6E0D3] text-[#2C2C2A] font-semibold text-sm flex items-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <h1 className="text-base sm:text-lg font-bold text-[#2C2C2A]">
          تقدّمك • نمو وإنجاز بلا نسب %
        </h1>
      </div>

      {/* Hero Summary Card — Show-up Streak (#F1CC51) */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E0D3] text-center space-y-3 shadow-xs">
        <span className="inline-flex items-center gap-1.5 bg-[#F1CC51] text-[#2C2C2A] text-xs font-bold px-4 py-1.5 rounded-full">
          <Flame className="w-4 h-4" />
          <span>{toArabicDigits(calmStreakDays)} أيام حضور وتواجد (Show-up Streak)</span>
        </span>

        <div className="pt-2">
          <ZonakSmiley size={68} withHalo className="mx-auto" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-[#2C2C2A]">
          أسبوعك عدّى بروقان وسلام ✨
        </h2>
        <p className="text-sm text-[#5C6676] max-w-md mx-auto leading-relaxed">
          الـ Streak في زونك مبني على تواجدك (Show-up) مش على إكمال ١٠٠٪ من المهام. كل خطوة عملتها فرقت، وكل راحة أخدتها شحنتك بجد.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="inline-flex items-center gap-1.5 bg-[#F5F2EA] text-[#2C2C2A] text-xs font-semibold px-3.5 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-[#185FA5]" />
            <span>صفر نسب مئوية % • صفر لون أحمر</span>
          </div>
          {onOpenTasksHub && (
            <button
              type="button"
              onClick={onOpenTasksHub}
              className="inline-flex items-center gap-1.5 bg-[#185FA5]/10 text-[#185FA5] text-xs font-bold px-3.5 py-1.5 rounded-full cursor-pointer"
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>عرض كل مهامي</span>
            </button>
          )}
        </div>
      </div>

      {/* Harvest of Calm & Achievement */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2C2C2A]">🌱 لحظات نموّك وإنجازاتك</h3>
          <span className="text-xs text-[#6B7280]">مفيش سباق، ده أمان</span>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E0D3] flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F1CC51]/30 flex items-center justify-center shrink-0 text-[#2C2C2A]">
              <Footprints className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-lg text-[#2C2C2A] tabular-nums">
                  {toArabicDigits(completedStepsCount)} خطوات صغيرة تمت
                </h4>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F1CC51] text-[#2C2C2A]">
                  إنجاز رايق
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C6676] mt-1">
                كلها خطوات اتعملت بدون حرق دم أو توتر، وفي الوقت اللي ناسبك تماماً ☕
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E0D3] flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#185FA5]/10 flex items-center justify-center shrink-0 text-[#185FA5]">
              <Sofa className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-lg text-[#2C2C2A] tabular-nums">
                  {toArabicDigits(restHours)} ساعة راحة مستحقة
                </h4>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#185FA5]/10 text-[#185FA5]">
                  شحن حقيقي
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C6676] mt-1">
                أوقات فصلان وروقان حقيقي لنفسك؛ وقفت الدوشة وقعدت مع نفسك بصفاء 🛋️
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E0D3] flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D85A30]/15 flex items-center justify-center shrink-0 text-[#D85A30]">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-lg text-[#2C2C2A] tabular-nums">
                  {recoveryDays === 2
                    ? 'يومين فرهدة معتمدين'
                    : `${toArabicDigits(recoveryDays)} أيام فرهدة معتمدة`}
                </h4>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#D85A30]/15 text-[#2C2C2A]">
                  استشفاء محمي
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C6676] mt-1">
                بطارية شحنت بسلام ومن غير تأنيب ضمير، والراحة استثمار مش تقصير 🔋
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Calm Rhythm */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2C2C2A]">🎵 إيقاع أسبوعك الهادي</h3>
          <span className="text-xs text-[#185FA5] font-bold">٧ أيام بروح طيبة</span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-[#E6E0D3] space-y-4">
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {WEEKLY_RHYTHM_DATA.map((day) => {
              const isSelected = day.id === selectedDayId;
              const tintClass =
                day.tint === 'amber'
                  ? 'bg-[#F1CC51]/30 text-[#2C2C2A]'
                  : day.tint === 'sky'
                  ? 'bg-[#185FA5]/10 text-[#185FA5]'
                  : day.tint === 'peach'
                  ? 'bg-[#D85A30]/15 text-[#D85A30]'
                  : 'bg-[#F5F2EA] text-[#2C2C2A]';

              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayId(day.id)}
                  className={`min-w-[88px] rounded-2xl p-3 flex flex-col items-center gap-2 transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'border-[#185FA5] ring-2 ring-[#185FA5]/15 bg-white shadow-xs'
                      : 'border-transparent bg-[#F5F2EA] hover:bg-[#EAE5D9]'
                  }`}
                >
                  <span className="text-xs text-[#6B7280] font-medium">
                    {day.dayName}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${tintClass}`}
                  >
                    {renderRhythmIcon(day.icon)}
                  </div>
                  <span className="text-xs font-bold text-[#2C2C2A] whitespace-nowrap">
                    {day.moodLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-[#F5F2EA] rounded-2xl p-3.5 text-xs sm:text-sm text-[#2C2C2A] flex items-center gap-2.5">
            <Heart className="w-4 h-4 text-[#D85A30] shrink-0" />
            <span>{activeDay.note}</span>
          </div>
        </div>
      </div>

      {/* Zonak Whisper */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E0D3] space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#185FA5] text-white flex items-center justify-center font-bold">
            ❝
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#185FA5]">
              همسة زونك للأسبوع الجديد
            </p>
            <h3 className="text-lg font-bold text-[#2C2C2A]">أحلى حاجة في أسبوعك ده:</h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {[
            'عرفت توقّف لما حسيت بفرهدة، ومكملتش غصب عنك أو حرقت أعصابك.',
            'قسمت مهامك الكبيرة لحاجات تافهة وسهلة تخلص خطوة بخطوة.',
            'حافظت على هدوء بالك ومسمحتش للزنّ والضغط العصبي يسيطر عليك.',
          ].map((point, idx) => (
            <div
              key={idx}
              className="bg-[#F5F2EA] rounded-2xl p-3.5 border border-[#E6E0D3] flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-full bg-[#F1CC51] text-[#2C2C2A] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs sm:text-sm text-[#2C2C2A] leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Week Pace Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#2C2C2A] flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#185FA5]" />
          <span>داخلين على الأسبوع الجاي بروقان</span>
        </h3>

        <div className="bg-white rounded-3xl p-4 border border-[#E6E0D3] space-y-3">
          <p className="text-xs sm:text-sm text-[#5C6676]">
            تحب نبدأ الأسبوع الجاي برتم عامل إزاي؟
          </p>
          <div className="space-y-2">
            {PACE_OPTIONS.map((opt) => {
              const active = nextWeekPace === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNextWeekPace(opt.id)}
                  className={`w-full min-h-[48px] px-4 rounded-2xl flex items-center justify-between text-sm font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#F1CC51] text-[#2C2C2A]'
                      : 'bg-[#F5F2EA] text-[#2C2C2A] hover:bg-[#EAE5D9]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </span>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      active ? 'border-[#2C2C2A]' : 'border-[#CBD5E1]'
                    }`}
                  >
                    {active && <span className="w-2.5 h-2.5 rounded-full bg-[#2C2C2A]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Share & Back CTAs */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onOpenStoryStudio}
          className="w-full min-h-[54px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Share2 className="w-5 h-5" />
          <span>مبسوط بأسبوعي وحابب أشاركه 🌿✨</span>
        </button>

        <button
          type="button"
          onClick={onBackHome}
          className="w-full min-h-[48px] rounded-full bg-white border border-[#E6E0D3] hover:bg-[#F5F2EA] text-[#2C2C2A] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>الرجوع للنهارده</span>
        </button>
      </div>
    </div>
  );
};
