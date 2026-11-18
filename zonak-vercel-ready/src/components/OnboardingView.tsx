import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Flame,
  Leaf,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { ToneStyle, ZonakTask, ZonakUserProfile } from '../types/zonak';
import { ZonakLogoMark, ZonakSmiley } from './ZonakArt';
import { BrainDumpView } from './BrainDumpView';

interface OnboardingViewProps {
  tone: ToneStyle;
  userProfile: ZonakUserProfile;
  currentTasks: ZonakTask[];
  onCompleteFirstDump: (newTasks: ZonakTask[], reflectMessage: string) => void;
  onLinkAccount: (
    provider: 'google' | 'email',
    email?: string
  ) => Promise<void>;
  onFinishOnboarding: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  tone,
  userProfile,
  currentTasks,
  onCompleteFirstDump,
  onLinkAccount,
  onFinishOnboarding,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [firstPlanTasks, setFirstPlanTasks] = useState<ZonakTask[]>(currentTasks);
  const [reflectMsg, setReflectMsg] = useState<string>(
    'فهمت يومك ورتبت لك أول خطة هادية.. أهم مهمة بارزة والباقي على مهلك خالص 🤍'
  );
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [linking, setLinking] = useState(false);

  const handleDumpTasksReady = (newTasks: ZonakTask[], message: string) => {
    setFirstPlanTasks(newTasks);
    setReflectMsg(message);
    onCompleteFirstDump(newTasks, message);
    setStep(3);
  };

  const handleConnectGoogle = async () => {
    setLinking(true);
    try {
      await onLinkAccount('google');
      onFinishOnboarding();
    } finally {
      setLinking(false);
    }
  };

  const handleConnectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setLinking(true);
    try {
      await onLinkAccount('email', emailInput.trim());
      onFinishOnboarding();
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EA] text-[#2C2C2A] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Step Progress Indicator (3 Onboarding Screens) */}
        <div className="flex items-center justify-between bg-white rounded-full px-5 py-3 border border-[#E6E0D3] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ZonakLogoMark size={28} />
            <span className="font-bold text-sm text-[#185FA5]">زونك — Zonak</span>
          </div>

          <div className="flex items-center gap-2" aria-label="خطوات البداية">
            {[
              { id: 1 as const, label: '١. الترحيب' },
              { id: 2 as const, label: '٢. أول تفريغ' },
              { id: 3 as const, label: '٣. أول خطة وحفظ الحساب' },
            ].map((s) => {
              const active = step === s.id;
              const done = step > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#185FA5] text-white'
                      : done
                      ? 'bg-[#F1CC51] text-[#2C2C2A]'
                      : 'bg-[#F5F2EA] text-[#5C6676]'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SCREEN 1: شاشة الترحيب (Welcome — وعد واحد في 5 ثواني) */}
        {step === 1 && (
          <div
            id="onboarding-step-1"
            className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E6E0D3] shadow-xs text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-[#F1CC51]/30 flex items-center justify-center">
                <ZonakSmiley size={84} withHalo />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-[#F5F2EA] text-[#2C2C2A] text-xs font-bold px-4 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4 text-[#185FA5]" />
                <span>تفريغ بلا مجهود • إنجاز بلا ذنب</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-[#185FA5] pt-1">
                أنا زونك 👋
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-[#2C2C2A] leading-snug max-w-md mx-auto">
                «قوللي اللي في دماغك، وأنا أظبّطهولك»
              </p>
              <p className="text-sm sm:text-base text-[#5C6676] max-w-md mx-auto leading-relaxed">
                من غير استمارات طويلة ولا ضغط ولا لون أحمر.. احكي بالعامية المصرية أو اكتب
                في ثواني وشوف السحر بنفسك.
              </p>
            </div>

            <div className="bg-[#F1CC51]/25 text-[#2C2C2A] rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
              <Leaf className="w-4 h-4 text-[#185FA5] shrink-0" />
              <span>تجربة فورية بدون حساب (Anonymous Auth) • صفر نسب مئوية %</span>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                id="btn-onboarding-start-dump"
                onClick={() => setStep(2)}
                className="w-full min-h-[54px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer"
              >
                <span>يلا نجرّب أول تفريغ</span>
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onFinishOnboarding}
                className="text-xs font-semibold text-[#5C6676] hover:text-[#185FA5] cursor-pointer"
              >
                تخطي والدخول لخطة النهارده مباشرة ←
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: أول تفريغ (First Dump — قلب الأونبوردينج) */}
        {step === 2 && (
          <div id="onboarding-step-2" className="space-y-4">
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E0D3] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[40px] px-3 rounded-xl bg-[#F5F2EA] text-xs font-bold text-[#2C2C2A] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-[#2C2C2A]">
                    خطوة ٢: أول تفريغ لدماغك 🎙️✍️
                  </h2>
                  <p className="text-xs text-[#5C6676]">
                    جرّب تقول أو تكتب: «بكرة عندي اجتماع 11، ولازم أخلص التقرير قبله، وعايز أنزل الجيم»
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs font-bold text-[#185FA5] hover:underline shrink-0 cursor-pointer"
              >
                معاينة أول خطة ←
              </button>
            </div>

            <BrainDumpView
              tone={tone}
              isLowEnergy={false}
              onBack={() => setStep(1)}
              onAddParsedTasks={handleDumpTasksReady}
              embeddedInOnboarding
            />
          </div>
        )}

        {/* SCREEN 3: أول خطة (الـ Aha Moment) + زر حفظ الحساب (Account Linking) */}
        {step === 3 && (
          <div
            id="onboarding-step-3"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E0D3] shadow-xs space-y-6"
          >
            {/* Header Celebration */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F5F2EA] p-4 sm:p-5 rounded-3xl border border-[#E6E0D3]">
              <div className="flex items-center gap-3.5">
                <ZonakSmiley size={56} withHalo />
                <div>
                  <span className="inline-flex items-center gap-1.5 bg-[#F1CC51] text-[#2C2C2A] text-xs font-bold px-3 py-1 rounded-full mb-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>أول خطة جاهزة • يوم ١ حضور (Show-up Streak)</span>
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2A]">
                    شوف الفوضى بقت خطة هادية إزاي ✨
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5C6676] mt-0.5">
                    {reflectMsg}
                  </p>
                </div>
              </div>
            </div>

            {/* Digested First Plan Tasks */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5C6676]">
                <span>خطتك المهضومة لليوم:</span>
                <span>مهمة واحدة الأهم ⭐ والباقي بروقان</span>
              </div>

              {firstPlanTasks.slice(0, 4).map((task) => {
                const isImp = Boolean(task.isImportant || task.categoryTone === 'priority');
                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${
                      isImp
                        ? 'bg-[#F1CC51]/15 border-[#F1CC51]'
                        : 'bg-[#F5F2EA] border-[#E6E0D3]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isImp
                            ? 'bg-[#F1CC51] text-[#2C2C2A]'
                            : 'bg-white text-[#185FA5] border border-[#E2DDD0]'
                        }`}
                      >
                        {isImp ? <Star className="w-4 h-4 fill-[#2C2C2A]" /> : <Check className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-[#2C2C2A]">
                            {task.title}
                          </span>
                          {isImp && (
                            <span className="text-[11px] font-bold bg-[#F1CC51] text-[#2C2C2A] px-2.5 py-0.5 rounded-full">
                              الأهم النهارده ⭐
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5C6676] truncate">{task.subtitle}</p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-[#185FA5] bg-white px-3 py-1.5 rounded-xl border border-[#E6E0D3] shrink-0 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{task.timeLabel}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Delayed Account Gate: "احفظ خطتك" (Link Anonymous Session to Google or Email) */}
            <div className="bg-[#F5F2EA] rounded-3xl p-5 sm:p-6 border-2 border-[#185FA5]/20 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#185FA5]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>احفظ خطتك وحسابك (بدون فقدان أي بيانات)</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#2C2C2A]">
                    عجبتك الخطة؟ اربط حسابك في ثانية عشان ماتضيعش
                  </h3>
                  <p className="text-xs text-[#5C6676] leading-relaxed">
                    بدأت التجربة كزائر ({userProfile.auth_provider === 'anonymous' ? 'حساب فوري' : 'متصل'}). لما تربط بـ Google أو الإيميل، كل مهامك والـ Streak هيفضلوا زي ما هما.
                  </p>
                </div>
                <Lock className="w-5 h-5 text-[#185FA5] shrink-0" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-save-plan-google"
                  disabled={linking}
                  onClick={handleConnectGoogle}
                  className="min-h-[50px] px-4 rounded-2xl bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>احفظ خطتك بحساب Google</span>
                </button>

                <button
                  type="button"
                  id="btn-save-plan-email-toggle"
                  onClick={() => setShowEmailForm((v) => !v)}
                  className="min-h-[50px] px-4 rounded-2xl bg-white border border-[#185FA5] text-[#185FA5] hover:bg-[#185FA5]/5 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>احفظ خطتك بالإيميل</span>
                </button>
              </div>

              {showEmailForm && (
                <form
                  onSubmit={handleConnectEmail}
                  className="bg-white rounded-2xl p-4 border border-[#E6E0D3] flex flex-col sm:flex-row gap-2.5"
                >
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="اكتب بريدك الإلكتروني لحفظ خطتك..."
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#F5F2EA] border border-[#E2DDD0] text-sm text-[#2C2C2A] focus:outline-none focus:border-[#185FA5]"
                  />
                  <button
                    type="submit"
                    disabled={linking}
                    className="min-h-[44px] px-5 rounded-xl bg-[#185FA5] text-white font-bold text-sm cursor-pointer"
                  >
                    ربط وحفظ الخطة
                  </button>
                </form>
              )}

              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-[#5C6676] hover:text-[#2C2C2A] cursor-pointer"
                >
                  ← تعديل التفريغ
                </button>
                <button
                  type="button"
                  id="btn-continue-to-home"
                  onClick={onFinishOnboarding}
                  className="text-xs font-bold text-[#185FA5] hover:underline cursor-pointer"
                >
                  كمّل لخطة النهارده دلوقتي (خطتك محفوظة محلياً) ←
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
