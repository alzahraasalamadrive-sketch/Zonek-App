import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Coffee,
  Headphones,
  Moon,
  Pause,
  Play,
  Power,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { BREAK_ACTIVITIES, toArabicDigits } from '../data/initialData';
import { CozyRestCharacterArt } from './ZonakArt';
import { startAmbientCalmSound, stopAmbientCalmSound } from '../utils/audio';

interface BreakPickerViewProps {
  onBack: () => void;
  onFinishBreak: (minutesAdded: number) => void;
}

export const BreakPickerView: React.FC<BreakPickerViewProps> = ({
  onBack,
  onFinishBreak,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string>('podcast');
  const [duration, setDuration] = useState<number | null>(15);
  const [activeBreak, setActiveBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [paused, setPaused] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);

  useEffect(() => {
    if (!activeBreak || paused || duration === null) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopAmbientCalmSound();
          setAmbientOn(false);
          setActiveBreak(false);
          onFinishBreak(duration);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeBreak, paused, duration, onFinishBreak]);

  useEffect(() => {
    return () => {
      stopAmbientCalmSound();
    };
  }, []);

  const handleStartBreak = () => {
    setSecondsLeft((duration ?? 15) * 60);
    setPaused(false);
    setActiveBreak(true);
  };

  const toggleSound = () => {
    if (ambientOn) {
      stopAmbientCalmSound();
      setAmbientOn(false);
    } else {
      if (startAmbientCalmSound()) setAmbientOn(true);
    }
  };

  const activityObj =
    BREAK_ACTIVITIES.find((a) => a.id === selectedActivity) ?? BREAK_ACTIVITIES[1];

  if (activeBreak) {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return (
      <div className="min-h-[78vh] flex flex-col items-center justify-center text-center px-4 py-10 space-y-6">
        <CozyRestCharacterArt size={124} />

        <div className="space-y-2">
          <span className="inline-block bg-[#FAF0C8] text-[#5C4911] text-xs font-bold px-4 py-1.5 rounded-full">
            وضع الروقان شغال دلوقتي 🌿
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2230]">
            {activityObj.title}
          </h1>
          <p className="text-sm text-[#5C6676] max-w-md mx-auto">
            خد نَفَس عميق، وسيب أي مهام أو تفكير لحد ما الاستراحة تخلص.
          </p>
        </div>

        <div className="bg-white rounded-3xl px-10 py-7 border border-[#EFEAE0] shadow-sm">
          {duration !== null ? (
            <div className="text-5xl font-bold text-[#0A467E] tabular-nums tracking-wide">
              {toArabicDigits(String(mins).padStart(2, '0'))}:
              {toArabicDigits(String(secs).padStart(2, '0'))}
            </div>
          ) : (
            <div className="text-2xl font-bold text-[#0A467E]">
              استراحة مفتوحة بروقان ☕
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {duration !== null && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="min-h-[48px] px-6 rounded-full bg-white border border-[#E5DEC9] text-[#1A2230] font-semibold text-sm flex items-center gap-2 cursor-pointer"
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{paused ? 'استكمال' : 'توقف مؤقت'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleSound}
            className="min-h-[48px] px-6 rounded-full bg-[#FAF0C8] text-[#5C4911] font-semibold text-sm flex items-center gap-2 cursor-pointer"
          >
            {ambientOn ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>إيقاف الصوت الهادي</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>شغّل صوت هادي</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            stopAmbientCalmSound();
            setAmbientOn(false);
            setActiveBreak(false);
            onFinishBreak(duration ?? 15);
          }}
          className="min-h-[48px] px-8 rounded-full bg-[#0A467E] text-white font-bold text-sm cursor-pointer"
        >
          خلّصت استراحتي ورايق ✨
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 rounded-xl bg-white border border-[#EFEAE0] text-[#1A2230] font-semibold text-sm flex items-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <span className="bg-[#F6D258] text-[#3F2D00] text-xs font-bold px-3.5 py-1.5 rounded-full">
          🌿 راحة مستحقة ☕🍃
        </span>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-b from-[#FEF8E2] to-white rounded-3xl p-6 border border-[#EFEAE0] text-center space-y-3">
        <div className="flex justify-center">
          <CozyRestCharacterArt size={110} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2230]">
          أحلى قرار.. افصل وريّح بالك ✨
        </h1>
        <p className="text-sm text-[#5C6676] leading-relaxed max-w-md mx-auto">
          المهام مش هتطير والدنيا مش واقفة على دقيقة. إنت عملت اللي عليك، ودلوقتي جه وقت
          نفسك بروقان.
        </p>
      </div>

      {/* Activity Choices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A2230]">تحب تروّق بإيه في الاستراحة دي؟</h2>
          <span className="text-xs text-[#6B7280]">اختيار اختياري</span>
        </div>

        <div className="space-y-3">
          {BREAK_ACTIVITIES.map((act) => {
            const active = selectedActivity === act.id;
            const Icon =
              act.icon === 'coffee'
                ? Coffee
                : act.icon === 'headphones'
                ? Headphones
                : act.icon === 'wind'
                ? Wind
                : Moon;

            return (
              <button
                key={act.id}
                type="button"
                onClick={() => setSelectedActivity(act.id)}
                className={`w-full text-right bg-white rounded-3xl p-4 border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  active
                    ? 'border-[#0A467E] ring-2 ring-[#0A467E]/15 shadow-sm'
                    : 'border-[#EFEAE0] hover:border-[#DCD6C7]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      active ? 'bg-[#0A467E] text-white' : 'bg-[#F5F2EA] text-[#0A467E]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-[#1A2230]">
                        {act.title}
                      </h3>
                      {act.badge && (
                        <span className="bg-[#0A467E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {act.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">{act.subtitle}</p>
                  </div>
                </div>
                <span
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-[#0A467E] border-[#0A467E] text-white'
                      : 'border-[#CBD5E1]'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Break Duration */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[#1A2230]">تحديد وقت الاستراحة:</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { val: 5, label: '٥ دقائق خفيفة' },
            { val: 15, label: '١٥ دقيقة كافية' },
            { val: null, label: 'مفتوحة بروقان ☕' },
          ].map((opt) => {
            const active = duration === opt.val;
            return (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => setDuration(opt.val)}
                className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#F6D258] text-[#3F2D00] shadow-sm'
                    : 'bg-white border border-[#EFEAE0] text-[#495464] hover:bg-[#FAF7EE]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quote */}
      <div className="bg-[#F3EFE6] rounded-3xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#F6D258] flex items-center justify-center shrink-0 text-[#3F2D00]">
          🤍
        </div>
        <div className="text-xs sm:text-sm text-[#495464]">
          «أي وقت بتقضيه في راحة نفسك مش وقت ضايع.. ده شحن حقيقي لروحك»
          <span className="block font-bold text-[#0A467E] mt-0.5">— زونك معاك دايماً</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleStartBreak}
          className="w-full min-h-[54px] rounded-full bg-[#0A467E] hover:bg-[#083968] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-[#0A467E]/15 cursor-pointer"
        >
          <span>بدء الروقان دلوقتي ☕✨</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full min-h-[48px] rounded-full bg-[#ECEAE4] hover:bg-[#E2DFD7] text-[#1A2230] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Power className="w-4 h-4" />
          <span>تمام، هقفل وأرجع لما أكون جاهز</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full min-h-[40px] text-xs font-semibold text-[#6B7280] hover:text-[#1A2230] cursor-pointer"
        >
          تراجع، هكمل خطوة صغيرة الأول
        </button>
      </div>
    </div>
  );
};
