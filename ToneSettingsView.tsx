import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  BellOff,
  Check,
  Clock,
  Coffee,
  Flame,
  Mail,
  Mic,
  Moon,
  Music,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  UserCheck,
  Volume2,
} from 'lucide-react';
import { NotificationSound, ToneSettings, ZonakUserProfile } from '../types/zonak';
import { TONE_PRESETS, toArabicDigits } from '../data/initialData';
import { ZonakSmiley } from './ZonakArt';
import { playNotificationSound } from '../utils/audio';
import {
  requestMicrophonePermission,
  scheduleZonakDailyNotifications,
} from '../utils/mobile';
import { getSupabaseSyncStatus } from '../lib/supabase';

interface ToneSettingsViewProps {
  settings: ToneSettings;
  userProfile: ZonakUserProfile;
  onChange: (next: ToneSettings) => void;
  onLinkAccount: (
    provider: 'google' | 'email',
    email?: string,
    password?: string
  ) => Promise<void>;
  onTestNotification: () => void;
  onOpenLowEnergy: () => void;
  onOpenOnboarding: () => void;
  onSaveAndReturn: () => void;
  onNotify: (msg: string) => void;
}

const SOUND_OPTIONS: Array<{
  id: NotificationSound;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'tea_chime',
    label: 'طنين فنجان شاي هادي',
    icon: <Coffee className="w-4 h-4" />,
  },
  {
    id: 'soft_guitar',
    label: 'عزف جيتار ناعم',
    icon: <Music className="w-4 h-4" />,
  },
  {
    id: 'gentle_vibe',
    label: 'اهتزاز خفيف بدون صوت',
    icon: <Sparkles className="w-4 h-4" />,
  },
];

export const ToneSettingsView: React.FC<ToneSettingsViewProps> = ({
  settings,
  userProfile,
  onChange,
  onLinkAccount,
  onTestNotification,
  onOpenLowEnergy,
  onOpenOnboarding,
  onSaveAndReturn,
  onNotify,
}) => {
  const [emailInput, setEmailInput] = useState(userProfile.email || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [linking, setLinking] = useState(false);
  const [micStatus, setMicStatus] = useState<string>('اضغط لتفعيل واختبار صلاحية الميكروفون');
  const syncStatus = getSupabaseSyncStatus();

  const handleSelectSound = (sound: NotificationSound) => {
    onChange({ ...settings, sound });
    playNotificationSound(sound);
  };

  const handleScheduleLocalNudges = async () => {
    const res = await scheduleZonakDailyNotifications({
      morningTime: settings.morningNudgeTime || '09:00',
      eveningTime: settings.eveningCutoffTime || '21:30',
      morningEnabled: settings.quietNotificationsEnabled,
      eveningEnabled: settings.quietNotificationsEnabled,
    });
    onNotify(res.summary);
  };

  const handleCheckMic = async () => {
    const res = await requestMicrophonePermission();
    setMicStatus(res.message);
    onNotify(res.message);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSaveAndReturn}
          className="min-h-[44px] px-3 rounded-xl bg-white border border-[#E6E0D3] text-[#2C2C2A] font-semibold text-sm flex items-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <h1 className="text-base sm:text-lg font-bold text-[#2C2C2A]">
          حسابي ونبرة زونك
        </h1>
      </div>

      {/* Supabase Account & Anonymous Auth -> Account Linking Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E0D3] shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <ZonakSmiley size={52} withHalo />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-[#2C2C2A]">
                  {userProfile.display_name || 'صديق زونك'}
                </h2>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    userProfile.auth_provider === 'anonymous'
                      ? 'bg-[#F1CC51]/35 text-[#2C2C2A]'
                      : 'bg-[#185FA5] text-white'
                  }`}
                >
                  {userProfile.auth_provider === 'anonymous'
                    ? 'حساب زائر فوري (Anonymous)'
                    : `مرتبط بـ ${userProfile.auth_provider === 'google' ? 'Google' : 'الإيميل'}`}
                </span>
              </div>
              <p className="text-xs text-[#5C6676] mt-0.5">
                {userProfile.email
                  ? `البريد المرتبط بـ Supabase: ${userProfile.email}`
                  : 'المزامنة السحابية مفعّلة مع جداول Supabase (users & tasks).'}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#F1CC51] text-[#2C2C2A] text-xs font-bold px-3.5 py-1.5 rounded-full">
            <Flame className="w-4 h-4" />
            <span>{toArabicDigits(userProfile.streak_count)} أيام حضور</span>
          </div>
        </div>

        {/* Account Linking Actions */}
        <div className="bg-[#F5F2EA] rounded-2xl p-4 border border-[#E6E0D3] space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#2C2C2A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#185FA5]" />
              <span>مزامنة قاعدة بيانات Supabase (جداول users و tasks):</span>
            </span>
            <span className="text-xs font-bold text-[#185FA5] flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {syncStatus.connected ? 'متصل بـ Supabase Cloud ✓' : 'تخزين محلي'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={linking}
              onClick={async () => {
                setLinking(true);
                try {
                  await onLinkAccount('google');
                } finally {
                  setLinking(false);
                }
              }}
              className="min-h-[46px] px-4 rounded-xl bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>ربط الحساب بـ Google</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmailForm((v) => !v)}
              className="min-h-[46px] px-4 rounded-xl bg-white border border-[#185FA5] text-[#185FA5] hover:bg-[#185FA5]/5 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>تسجيل / ربط بالإيميل</span>
            </button>
          </div>

          {showEmailForm && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!emailInput.trim()) return;
                setLinking(true);
                try {
                  await onLinkAccount(
                    'email',
                    emailInput.trim(),
                    passwordInput.trim() || undefined
                  );
                  setShowEmailForm(false);
                } finally {
                  setLinking(false);
                }
              }}
              className="flex flex-col sm:flex-row gap-2 pt-1"
            >
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="البريد الإلكتروني (example@gmail.com)"
                className="flex-1 min-h-[42px] px-3.5 rounded-xl bg-white border border-[#E2DDD0] text-sm text-[#2C2C2A] focus:outline-none focus:border-[#185FA5]"
              />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="كلمة المرور (اختياري)"
                className="sm:w-44 min-h-[42px] px-3.5 rounded-xl bg-white border border-[#E2DDD0] text-sm text-[#2C2C2A] focus:outline-none focus:border-[#185FA5]"
              />
              <button
                type="submit"
                disabled={linking}
                className="min-h-[42px] px-5 rounded-xl bg-[#185FA5] text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                حفظ ومزامنة
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tone Voice Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2C2C2A]">🗣️ نبرة صوت زونك</h3>
          <span className="text-xs text-[#6B7280] bg-white border border-[#E6E0D3] px-3 py-1 rounded-full">
            اختر النمط الأنسب لك
          </span>
        </div>

        <div className="space-y-3">
          {TONE_PRESETS.map((preset) => {
            const active = settings.tone === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange({ ...settings, tone: preset.id })}
                className={`w-full text-right bg-white rounded-3xl p-4 sm:p-5 border transition-all space-y-3 cursor-pointer ${
                  active
                    ? 'border-[#185FA5] ring-2 ring-[#185FA5]/15 shadow-xs'
                    : 'border-[#E6E0D3] hover:border-[#DCD6C7]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                        active
                          ? 'bg-[#185FA5] border-[#185FA5] text-white'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="font-bold text-base text-[#2C2C2A]">
                      {preset.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F1CC51] text-[#2C2C2A] shrink-0">
                    {preset.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#5C6676] leading-relaxed">
                  {preset.description}
                </p>

                <div className="bg-[#F5F2EA] rounded-2xl p-3 text-xs sm:text-sm font-medium text-[#2C2C2A] italic">
                  {preset.quote}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scheduled Local Notifications & Capacitor Mobile Permissions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2C2C2A]">
            📱 إعدادات الموبايل والإشعارات المجدولة (Capacitor)
          </h3>
          <span className="text-xs font-bold text-[#185FA5]">Android & iOS</span>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E0D3] divide-y divide-[#F0ECE2]">
          {/* Morning Nudge Time */}
          <div className="pb-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-sm sm:text-base text-[#2C2C2A] block">
                تذكير الصباح الهادي (Morning Nudge)
              </span>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                إشعار محلي مجدول يفكرك الصبح تبص على خطتك أو تفرّغ يومك بروقان.
              </p>
            </div>
            <label className="min-h-[42px] px-3.5 py-1.5 rounded-full bg-[#F1CC51]/35 text-[#2C2C2A] font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer">
              <Sun className="w-3.5 h-3.5 text-[#185FA5]" />
              <input
                type="time"
                value={settings.morningNudgeTime || '09:00'}
                onChange={(e) =>
                  onChange({ ...settings, morningNudgeTime: e.target.value })
                }
                className="bg-transparent focus:outline-none tabular-nums cursor-pointer"
              />
            </label>
          </div>

          {/* Evening Reflect Time */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-sm sm:text-base text-[#2C2C2A] block">
                تذكير تصفية المسا (Evening Reflect)
              </span>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                الساعة اللي زونك بيفكرك فيها تقفل يومك بسلام وتجهّز خطة بكرة.
              </p>
            </div>
            <label className="min-h-[42px] px-3.5 py-1.5 rounded-full bg-[#185FA5]/10 text-[#185FA5] font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer">
              <Moon className="w-3.5 h-3.5" />
              <input
                type="time"
                value={settings.eveningCutoffTime}
                onChange={(e) =>
                  onChange({ ...settings, eveningCutoffTime: e.target.value })
                }
                className="bg-transparent focus:outline-none tabular-nums cursor-pointer"
              />
            </label>
          </div>

          {/* No Nag Rule */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-[#2C2C2A]">
                  قاعدة ممنوع الزنّ
                </span>
                <span className="text-[11px] font-bold bg-[#F1CC51] text-[#2C2C2A] px-2 py-0.5 rounded-full">
                  مفعّلة دائماً
                </span>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                إشعار واحد بس لكل لمسة. لو اتجاهلته مش هنكرر ولا هنبعت رنات تلاحقك أبداً.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.noNagRule}
              onClick={() =>
                onChange({ ...settings, noNagRule: !settings.noNagRule })
              }
              className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 cursor-pointer ${
                settings.noNagRule ? 'bg-[#185FA5]' : 'bg-[#D1D5DB]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.noNagRule ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Microphone & Local Notification Permissions Test Row */}
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCheckMic}
                className="min-h-[46px] px-4 rounded-2xl bg-[#F5F2EA] hover:bg-[#EAE5D9] text-[#2C2C2A] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-[#185FA5]" />
                <span>تفعيل صلاحية الميكروفون</span>
              </button>

              <button
                type="button"
                onClick={handleScheduleLocalNudges}
                className="min-h-[46px] px-4 rounded-2xl bg-[#185FA5]/10 hover:bg-[#185FA5]/20 text-[#185FA5] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>جدولة إشعارات الصباح والمساء</span>
              </button>
            </div>
            <p className="text-[11px] text-[#5C6676] flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#185FA5]" />
              <span>{micStatus}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Notification Sounds */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2C2C2A]">🎵 أصوات ونغمات التنبيه</h3>
          <span className="text-xs text-[#6B7280]">نغمات غير مجهدة للأذن</span>
        </div>

        <div className="space-y-2.5">
          {SOUND_OPTIONS.map((snd) => {
            const active = settings.sound === snd.id;
            return (
              <button
                key={snd.id}
                type="button"
                onClick={() => handleSelectSound(snd.id)}
                className={`w-full min-h-[52px] px-4 rounded-2xl font-bold text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#185FA5] text-white shadow-xs'
                    : 'bg-white border border-[#E6E0D3] text-[#2C2C2A] hover:bg-[#F5F2EA]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {snd.icon}
                  <span>{snd.label}</span>
                </span>
                {active && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenLowEnergy}
          className="min-h-[48px] px-4 rounded-2xl bg-white border border-[#E6E0D3] text-[#2C2C2A] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <BellOff className="w-4 h-4 text-[#D85A30]" />
          <span>فتح وضع الفرهده</span>
        </button>
        <button
          type="button"
          onClick={onOpenOnboarding}
          className="min-h-[48px] px-4 rounded-2xl bg-white border border-[#E6E0D3] text-[#2C2C2A] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <Clock className="w-4 h-4 text-[#185FA5]" />
          <span>جولة الترحيب (3 شاشات Onboarding)</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={() => {
            playNotificationSound(settings.sound);
            onTestNotification();
          }}
          className="w-full min-h-[50px] rounded-full bg-white border border-[#E6E0D3] text-[#185FA5] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
          <span>جرّب تسمع إشعار زونك دلوقتي 🔊</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            await handleScheduleLocalNudges();
            onSaveAndReturn();
          }}
          className="w-full min-h-[54px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Check className="w-5 h-5" />
          <span>حفظ الإعدادات والراحة ✨</span>
        </button>
      </div>
    </div>
  );
};
