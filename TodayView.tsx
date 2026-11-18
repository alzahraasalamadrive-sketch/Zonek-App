import React, { useState } from 'react';
import {
  BatteryLow,
  Check,
  Clock,
  Coffee,
  Flame,
  Mic,
  Moon,
  Plus,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';
import { LowEnergyState, ScreenId, ToneStyle, ZonakTask } from '../types/zonak';
import { TONE_PRESETS, toArabicDigits } from '../data/initialData';
import { ZonakSmiley } from './ZonakArt';

interface TodayViewProps {
  tasks: ZonakTask[];
  tone: ToneStyle;
  lowEnergy: LowEnergyState;
  calmStreakDays: number;
  onToggleTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onQuickAddTask: (title: string) => void;
  onDisableLowEnergy: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  tone,
  lowEnergy,
  calmStreakDays,
  onToggleTask,
  onSelectTask,
  onNavigate,
  onQuickAddTask,
  onDisableLowEnergy,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const activeTasks = tasks.filter((t) => !t.archived && !t.postponedToTomorrow);
  const completedCount = activeTasks.filter((t) => t.completed).length;
  const totalCount = activeTasks.length;

  const tonePreset = TONE_PRESETS.find((t) => t.id === tone) ?? TONE_PRESETS[0];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(quickTitle.trim());
    setQuickTitle('');
    setShowQuickAdd(false);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header Hero */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2A]">النهارده</h1>
            <span
              className="w-3 h-3 rounded-full bg-[#F1CC51] inline-block"
              aria-hidden="true"
            />
          </div>
          <p className="text-[#5C6676] text-sm sm:text-base mt-1">
            {tonePreset.greetingMorning}
          </p>
        </div>

        {/* Show-up Streak Badge (#F1CC51 — Based on Showing Up, NOT completion) */}
        <button
          type="button"
          onClick={() => onNavigate('weekly-report')}
          className="min-h-[44px] px-4 py-2 rounded-full bg-[#F1CC51] hover:bg-[#E7C03E] text-[#2C2C2A] font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
        >
          <Flame className="w-4 h-4 text-[#2C2C2A]" />
          <span className="tabular-nums">
            {toArabicDigits(calmStreakDays)} أيام حضور وتواجد 🔥
          </span>
        </button>
      </div>

      {/* Low Energy Active Banner */}
      {lowEnergy.active && (
        <div className="bg-[#F1CC51]/25 border border-[#F1CC51] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F1CC51] flex items-center justify-center shrink-0 text-[#2C2C2A]">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#2C2C2A] text-base">
                وضع الفرهده والراحة التامة مفعّل
              </h2>
              <p className="text-sm text-[#5E5233] mt-0.5">
                {lowEnergy.level === 'empty'
                  ? 'بطاريتك فاضية.. كل المهام متأمنة ومفيش أي إشعارات أو زنّ.'
                  : lowEnergy.level === 'half'
                  ? 'طاقة نص نص: ركّز بس على خطوة واحدة خفيفة لو تحب.'
                  : 'تصفية ذهن هادية بدون ضغط ولا تأنيب.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDisableLowEnergy}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-[#185FA5] font-bold text-sm border border-[#E6E0D3] hover:bg-[#F5F2EA] transition-colors cursor-pointer shrink-0"
          >
            أنا جاهز أرجع بروقان
          </button>
        </div>
      )}

      {/* Calm Progress Summary Card — ZERO Percentages (صفر نسب مئوية %) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#E6E0D3]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <ZonakSmiley size={48} withHalo />
            <div>
              <h2 className="text-xl font-bold text-[#2C2C2A]">
                {tonePreset.progressHeadline(completedCount, totalCount)}
              </h2>
              <p className="text-sm text-[#5C6676] tabular-nums">
                {totalCount === 0
                  ? 'يومك صافي وهادي.. فرّغ اللي في دماغك وقت ما تحب'
                  : `خلصت ${toArabicDigits(completedCount)} من ${toArabicDigits(totalCount)} خطوات بهدوء ودون استعجال`}
              </p>
            </div>
          </div>
          <div className="bg-[#F1CC51]/25 text-[#2C2C2A] font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shrink-0">
            {completedCount > 0 ? 'خطوات هادية ✨' : 'على مهلك ☕'}
          </div>
        </div>

        {/* Calm Stepped Indicator (No percentage bar) */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2" aria-label="خطوات اليوم">
            {activeTasks.map((t) => (
              <div
                key={t.id}
                className={`h-2.5 flex-1 rounded-full transition-colors ${
                  t.completed
                    ? 'bg-[#185FA5]'
                    : t.isImportant || t.categoryTone === 'priority'
                    ? 'bg-[#F1CC51]'
                    : 'bg-[#E6E0D3]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Today's Plan Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-[#185FA5]" />
          <h2 className="text-xl font-bold text-[#2C2C2A]">خطة اليوم</h2>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('brain-dump')}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#185FA5] text-white text-xs font-bold hover:bg-[#134B84] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>تفريغ صوت/نص</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQuickAdd((v) => !v)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#E6E0D3] text-[#185FA5] text-xs font-bold hover:bg-[#F5F2EA] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سريعة</span>
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <form
          onSubmit={handleQuickSubmit}
          className="bg-white rounded-2xl p-4 border border-[#E6E0D3] shadow-xs flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="اكتب مهمة خفيفة تضاف ليومك..."
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#F5F2EA] border border-[#E2DDD0] text-sm text-[#2C2C2A] focus:outline-none focus:border-[#185FA5]"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-[#185FA5] text-white text-sm font-bold hover:bg-[#134B84] transition-colors cursor-pointer"
            >
              إضافة بهدوء
            </button>
            <button
              type="button"
              onClick={() => onNavigate('brain-dump')}
              className="min-h-[44px] px-4 rounded-xl bg-[#F1CC51] text-[#2C2C2A] text-sm font-bold hover:bg-[#E7C03E] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>تفريغ ذكي</span>
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      {activeTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#E6E0D3]">
          <ZonakSmiley size={60} withHalo className="mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#2C2C2A] mb-1">
            يومك لسه فاضي 🤍 قوللي اللي في دماغك ونظبّطه
          </h3>
          <p className="text-sm text-[#5C6676] mb-5">
            تقدر تفرّغ اللي في دماغك بالصوت أو الكتابة أو تاخد استراحة روقان دلوقتي.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('brain-dump')}
              className="min-h-[46px] px-6 py-2.5 rounded-full bg-[#185FA5] text-white text-sm font-bold cursor-pointer"
            >
              قوللي اللي في دماغك
            </button>
            <button
              type="button"
              onClick={() => onNavigate('break-picker')}
              className="min-h-[46px] px-5 py-2.5 rounded-full bg-[#F1CC51] text-[#2C2C2A] text-sm font-bold cursor-pointer"
            >
              استراحة روقان ☕
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {activeTasks.map((task) => {
            const isImportant = Boolean(
              task.isImportant || task.categoryTone === 'priority'
            );
            const categoryStyles = task.completed
              ? 'bg-[#E6E0D3] text-[#5C6676]'
              : isImportant
              ? 'bg-[#F1CC51] text-[#2C2C2A]'
              : task.categoryTone === 'health'
              ? 'bg-[#F5F2EA] text-[#2C2C2A]'
              : 'bg-[#185FA5]/10 text-[#185FA5]';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'border-[#E6E0D3] opacity-80'
                    : isImportant
                    ? 'border-[#F1CC51] ring-1 ring-[#F1CC51]/40 shadow-xs'
                    : 'border-[#E6E0D3] shadow-2xs hover:border-[#185FA5]/40'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Toggle complete button */}
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? `إلغاء إتمام ${task.title}`
                        : `تحديد ${task.title} كمكتملة`
                    }
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      task.completed
                        ? 'bg-[#185FA5] text-white'
                        : 'bg-[#F5F2EA] hover:bg-[#E6E0D3] text-transparent border border-[#D8D2C5]'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                  </button>

                  {/* Clickable task content */}
                  <button
                    type="button"
                    onClick={() => onSelectTask(task.id)}
                    className="text-right min-w-0 flex-1 cursor-pointer group"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-base sm:text-lg font-bold transition-colors group-hover:text-[#185FA5] ${
                          task.completed
                            ? 'line-through text-[#6B7280]'
                            : 'text-[#2C2C2A]'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${categoryStyles}`}
                      >
                        {isImportant && !task.completed && (
                          <Star className="w-3 h-3 fill-[#2C2C2A]" />
                        )}
                        <span>{task.completed ? 'تم بنجاح ✓' : task.category}</span>
                      </span>
                    </div>
                    <p className="text-sm text-[#5C6676] truncate">{task.subtitle}</p>
                  </button>
                </div>

                {/* Time label */}
                <button
                  type="button"
                  onClick={() => onSelectTask(task.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer tabular-nums ${
                    task.completed
                      ? 'bg-[#F5F2EA] text-[#7D8593]'
                      : 'bg-[#185FA5]/10 text-[#185FA5]'
                  }`}
                >
                  {task.completed ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>{task.timeLabel}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Evening Reflect Card on Home ("اليوم عدّى — نفرّغ ونظبّط بكرة؟") */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E0D3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#185FA5]/10 text-[#185FA5] flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#2C2C2A]">
              المسا 🌙 اليوم عدّى — نفرّغ ونظبّط بكرة؟
            </h3>
            <p className="text-xs sm:text-sm text-[#5C6676] mt-0.5">
              إغلاق هادي لليوم وترحيل اللي لسه واقف لبكرة من غير أي تأنيب ضمير.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('evening')}
          className="min-h-[44px] px-5 py-2 rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-xs sm:text-sm shrink-0 cursor-pointer"
        >
          تصفية المسا 🌙
        </button>
      </div>

      {/* Rest Space Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E0D3]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧘</span>
              <h3 className="text-lg font-bold text-[#2C2C2A]">مساحة راحة ومرونة</h3>
            </div>
            <p className="text-sm text-[#5C6676] leading-relaxed max-w-md">
              لو يومك مشي عكس التوقعات أو حاسس بفرهدة، عاير مهامك براحتك من غير أي إحساس بالذنب.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('low-energy')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F5F2EA] text-[#2C2C2A] font-bold text-xs sm:text-sm border border-[#E2DDD0] hover:bg-[#EAE5D9] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <BatteryLow className="w-4 h-4 text-[#D85A30]" />
                <span>وضع الفرهده</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('break-picker')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F1CC51] text-[#2C2C2A] font-bold text-xs sm:text-sm hover:bg-[#E7C03E] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Coffee className="w-4 h-4" />
                <span>أخذ استراحة دلوقتي</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
