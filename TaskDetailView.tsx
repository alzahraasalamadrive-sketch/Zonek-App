import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock,
  Coffee,
  Lightbulb,
  Loader2,
  Mic,
  Moon,
  Pause,
  Play,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MicroStep, ToneStyle, ZonakTask } from '../types/zonak';
import { toArabicDigits } from '../data/initialData';
import { startAmbientCalmSound, stopAmbientCalmSound } from '../utils/audio';

interface TaskDetailViewProps {
  task: ZonakTask;
  tone: ToneStyle;
  onBack: () => void;
  onToggleMicroStep: (taskId: string, stepId: string) => void;
  onAddMicroStep: (taskId: string, title: string) => void;
  onReplaceMicroSteps: (taskId: string, steps: MicroStep[], newMsg?: string) => void;
  onPostponeTask: (taskId: string) => void;
  onStepTimerFinished: (taskId: string, stepTitle: string) => void;
  onOpenBrainDump: () => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  tone,
  onBack,
  onToggleMicroStep,
  onAddMicroStep,
  onReplaceMicroSteps,
  onPostponeTask,
  onStepTimerFinished,
  onOpenBrainDump,
}) => {
  const [newStepTitle, setNewStepTitle] = useState('');
  const [showAddStep, setShowAddStep] = useState(false);
  const [activeTimerStepId, setActiveTimerStepId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const completedSteps = task.microSteps.filter((s) => s.completed).length;
  const totalSteps = task.microSteps.length;

  const currentStep =
    task.microSteps.find((s) => !s.completed) ?? task.microSteps[task.microSteps.length - 1];

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          const finishedStep = task.microSteps.find((s) => s.id === activeTimerStepId);
          if (finishedStep) {
            onStepTimerFinished(task.id, finishedStep.title);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, activeTimerStepId, task.id, task.microSteps, onStepTimerFinished]);

  useEffect(() => {
    return () => {
      stopAmbientCalmSound();
    };
  }, []);

  const startStepTimer = (step: MicroStep) => {
    if (activeTimerStepId === step.id && timerRunning) {
      setTimerRunning(false);
      return;
    }
    setActiveTimerStepId(step.id);
    setSecondsLeft(step.durationMinutes * 60);
    setTimerRunning(true);
  };

  const toggleAmbient = () => {
    if (ambientPlaying) {
      stopAmbientCalmSound();
      setAmbientPlaying(false);
    } else {
      const ok = startAmbientCalmSound();
      if (ok) setAmbientPlaying(true);
    }
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    onAddMicroStep(task.id, newStepTitle.trim());
    setNewStepTitle('');
    setShowAddStep(false);
  };

  const handleAiBreakdown = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/breakdown-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          subtitle: task.subtitle,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذّر تفكيك المهمة');
      }
      if (Array.isArray(data.steps) && data.steps.length > 0) {
        const mapped: MicroStep[] = data.steps.map(
          (
            st: { title: string; hint: string; durationMinutes: number },
            idx: number
          ) => ({
            id: `ai-step-${Date.now()}-${idx}`,
            title: st.title,
            hint: st.hint,
            durationMinutes: st.durationMinutes || 5,
            completed: false,
          })
        );
        onReplaceMicroSteps(task.id, mapped, data.zonakMessage);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setAiLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${toArabicDigits(String(m).padStart(2, '0'))}:${toArabicDigits(
      String(s).padStart(2, '0')
    )}`;
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 rounded-xl bg-white border border-[#E6E0D3] text-[#2C2C2A] font-semibold text-sm flex items-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع لليوم</span>
        </button>

        <span className="text-xs font-bold bg-[#F1CC51] text-[#2C2C2A] px-3 py-1.5 rounded-full">
          مهمة اليوم الهادية
        </span>
      </div>

      {/* Hero Task Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E0D3] shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2A]">{task.title}</h1>
            <p className="text-sm text-[#5C6676] leading-relaxed">
              شكلها تقيل؟ ولا تشيل هم.. جزّأناها لخطوات ماتاخدش منك غلوة.
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F1CC51]/30 flex items-center justify-center shrink-0 text-[#185FA5]">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {task.contextTags.map((tag, i) => (
            <span
              key={i}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#F5F2EA] text-[#495464] flex items-center gap-1.5"
            >
              {i === 0 ? (
                <Sparkles className="w-3.5 h-3.5 text-[#185FA5]" />
              ) : i === 1 ? (
                <Clock className="w-3.5 h-3.5 text-[#185FA5]" />
              ) : (
                <Coffee className="w-3.5 h-3.5 text-[#785937]" />
              )}
              <span>{tag}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Zonak Message */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E0D3] flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F1CC51]/30 flex items-center justify-center shrink-0 text-xl">
          🌱
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="font-bold text-[#185FA5] text-sm">رسالة زونك ليك</h2>
            <span className="text-xs text-[#7D8593]">من غير ضغط</span>
          </div>
          <p className="text-sm text-[#2C2C2A] leading-relaxed">{task.encouragement}</p>
        </div>
      </div>

      {/* Micro-step Progress — Zero Percentage (%) */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E0D3]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-sm font-bold text-[#2C2C2A]">خطواتك على مهلك</span>
          <span className="text-xs font-bold text-[#185FA5] tabular-nums">
            {toArabicDigits(completedSteps)} من {toArabicDigits(totalSteps)} خطوات هادية
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2.5">
          {task.microSteps.map((s) => (
            <div
              key={s.id}
              className={`h-2.5 flex-1 rounded-full transition-colors ${
                s.completed ? 'bg-[#185FA5]' : 'bg-[#E6E0D3]'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[#5C6676]">
          مجرد البداية نص الإنجاز! إنت ماشي ممتاز ☕
        </p>
      </div>

      {/* Micro-steps Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#185FA5]" />
            <h2 className="text-lg font-bold text-[#2C2C2A]">تفكيك المهمة لجرعات خفيفة</h2>
          </div>
          <button
            type="button"
            onClick={handleAiBreakdown}
            disabled={aiLoading}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#185FA5]/10 text-[#185FA5] text-xs font-bold hover:bg-[#185FA5]/20 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {aiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>إعادة تفكيك ذكي</span>
          </button>
        </div>

        {aiError && (
          <div className="bg-[#D85A30]/10 text-[#2C2C2A] text-xs rounded-2xl p-3 border border-[#D85A30]/35">
            {aiError}
          </div>
        )}

        <div className="space-y-3">
          {task.microSteps.map((step, idx) => {
            const isCurrent = currentStep?.id === step.id && !step.completed;
            const isTimerActive = activeTimerStepId === step.id && timerRunning;

            return (
              <div
                key={step.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all ${
                  isCurrent
                    ? 'border-[#185FA5]/40 shadow-xs'
                    : 'border-[#E6E0D3]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleMicroStep(task.id, step.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-colors cursor-pointer ${
                        step.completed
                          ? 'bg-[#185FA5] text-white'
                          : 'bg-[#F5F2EA] text-[#5C6676] hover:bg-[#E7E2D5]'
                      }`}
                    >
                      {step.completed ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        toArabicDigits(idx + 1)
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      {isCurrent && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-[#185FA5] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            الخطوة الحالية
                          </span>
                          <span className="text-xs text-[#6B7280] flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3" />
                            {toArabicDigits(step.durationMinutes)} دقائق
                          </span>
                        </div>
                      )}

                      <h3
                        className={`font-bold text-base ${
                          step.completed
                            ? 'line-through text-[#6B7280]'
                            : 'text-[#2C2C2A]'
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                          step.completed ? 'text-[#8B7124]' : 'text-[#5C6676]'
                        }`}
                      >
                        {step.hint}
                      </p>

                      {!step.completed && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs text-[#6B7280] flex items-center gap-1 tabular-nums">
                            <Clock className="w-3.5 h-3.5" />
                            {isTimerActive || activeTimerStepId === step.id
                              ? `المتبقي: ${formatTimer(secondsLeft)}`
                              : `مؤقت هادي: ${toArabicDigits(step.durationMinutes)} دقائق`}
                          </span>

                          <button
                            type="button"
                            onClick={() => startStepTimer(step)}
                            className="min-h-[40px] px-4 py-2 rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {isTimerActive ? (
                              <>
                                <Pause className="w-3.5 h-3.5" />
                                <span>إيقاف مؤقت</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" />
                                <span>
                                  ابدأ الـ {toArabicDigits(step.durationMinutes)} دقائق
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-[#7D8593] tabular-nums shrink-0">
                    {toArabicDigits(step.durationMinutes)} د
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add small step row */}
        {showAddStep ? (
          <form
            onSubmit={handleAddStep}
            className="bg-white rounded-2xl p-3.5 border border-[#E6E0D3] flex gap-2"
          >
            <input
              type="text"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              placeholder="اكتب خطوة تافهة صغيرة..."
              className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#F5F2EA] border border-[#E6E0D3] text-sm focus:outline-none focus:border-[#185FA5]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-[#185FA5] text-white text-sm font-bold cursor-pointer"
            >
              إضافة
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddStep(true)}
              className="flex-1 min-h-[48px] rounded-2xl bg-white border border-[#E6E0D3] text-[#2C2C2A] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#F5F2EA] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#185FA5]" />
              <span>أضف خطوة صغيرة تانية</span>
            </button>
            <button
              type="button"
              onClick={onOpenBrainDump}
              aria-label="إضافة خطوة بالصوت"
              className="w-12 h-12 rounded-2xl bg-[#185FA5] text-white flex items-center justify-center hover:bg-[#134B84] transition-colors cursor-pointer shrink-0"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Calm Focus Session Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E0D3] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F1CC51]/30 flex items-center justify-center text-[#185FA5]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2C2C2A] text-base">جلسة الروقان الهادية</h3>
              <p className="text-xs text-[#6B7280]">بدون إشعارات ولا استعجال</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleAmbient}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              ambientPlaying
                ? 'bg-[#185FA5] text-white'
                : 'bg-[#F5F2EA] text-[#495464] hover:bg-[#EAE6DC]'
            }`}
          >
            {ambientPlaying ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>صوت الكافيه شغال</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>١٥ دقيقة مرنة</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-[#F5F2EA] rounded-2xl p-4 flex items-start gap-3">
          <Coffee className="w-5 h-5 text-[#785937] shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[#495464] leading-relaxed">
            هنشغّل لك أصوات كافيه هادية في الخلفية.. اخلص خطوة واحدة ولو حسيت إنك عايز
            تريح، حقك تماماً.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!ambientPlaying) toggleAmbient();
            if (currentStep) startStepTimer(currentStep);
          }}
          className="w-full min-h-[50px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>ابدأ أول خطوة بالراحة (٥ دقائق)</span>
        </button>
      </div>

      {/* Low Energy Postpone Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E0D3] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Moon className="w-5 h-5 text-[#D85A30] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[#2C2C2A] text-sm">حاسس بطاقتك مش تمام؟</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              عادي جداً تأجلها لبكرة من غير أي تأنيب ضمير.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPostponeTask(task.id)}
          className="min-h-[42px] px-4 py-2 rounded-full bg-[#F1CC51] hover:bg-[#E7C03E] text-[#2C2C2A] font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <CalendarClock className="w-4 h-4" />
          <span>أجّل لوقت أروق</span>
        </button>
      </div>

      <p className="text-center text-xs text-[#6B7280] pt-1">
        ✨ افتكر دايماً: إنتاجيتك مش قيمتك كإنسان. المهم إنك خطيت أول خطوة وبتراعي نفسك.
      </p>
    </div>
  );
};
