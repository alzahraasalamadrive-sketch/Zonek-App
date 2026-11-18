import React, { useState } from 'react';
import {
  ArrowRight,
  BatteryLow,
  BellOff,
  Check,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { EnergyDuration, EnergyLevel, LowEnergyState } from '../types/zonak';
import { MoonCloudArt } from './ZonakArt';

interface LowEnergyViewProps {
  lowEnergy: LowEnergyState;
  onActivate: (level: EnergyLevel, duration: EnergyDuration) => void;
  onBack: () => void;
}

const ENERGY_OPTIONS: Array<{
  id: EnergyLevel;
  title: string;
  desc: string;
}> = [
  {
    id: 'empty',
    title: 'بطارية فاضية خالص (طاقة منخفضة جداً)',
    desc: 'سرير، بطانية، ومش طالبة أي حاجة غير راحة تامة. (زونك هيقفل كل المهام فوراً بدون أسئلة)',
  },
  {
    id: 'half',
    title: 'فرهدة نص نص (طاقة خفيفة)',
    desc: 'عندي طاقة لحاجة واحدة بس تافهة وتاخد ٥ دقايق بالعافية وخلاص.',
  },
  {
    id: 'crowded',
    title: 'مش مفرهد بس دماغي زحمة',
    desc: 'محتاج بس أرتب أفكاري ومحدش يزنّ عليا ولا يحسسني بالذنب.',
  },
];

const DURATION_OPTIONS: Array<{ id: EnergyDuration; label: string }> = [
  { id: 'today', label: 'لباقي النهارده بس' },
  { id: '48h', label: 'النهارده وبكرة (٤٨ ساعة استراحة)' },
  { id: 'until_ready', label: 'لحد ما أقولك أنا جاهز' },
];

export const LowEnergyView: React.FC<LowEnergyViewProps> = ({
  lowEnergy,
  onActivate,
  onBack,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<EnergyLevel>(lowEnergy.level);
  const [selectedDuration, setSelectedDuration] = useState<EnergyDuration>(
    lowEnergy.duration
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 rounded-xl bg-white border border-[#E6E0D3] text-[#2C2C2A] font-semibold text-sm flex items-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <span className="bg-[#D85A30]/15 text-[#2C2C2A] text-xs font-bold px-3.5 py-1.5 rounded-full">
          مساحة آمنة بدون تأنيب ضمير 🛋️
        </span>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center text-center pt-1">
        <MoonCloudArt size={88} />
        <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2A] mt-4 max-w-md leading-snug">
          طاقتك مش دايمة في السما وده طبيعي جداً.. لما تحس إنك مش قادر، زونك هنا عشان يريّحك
          مش يضغطك.
        </h1>
      </div>

      {/* Energy Level Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2C2C2A] flex items-center gap-2">
            <BatteryLow className="w-5 h-5 text-[#D85A30]" />
            <span>طاقتك عاملة إيه النهارده؟</span>
          </h2>
          <span className="text-xs text-[#6B7280]">اختر حالتك</span>
        </div>

        <div className="space-y-3">
          {ENERGY_OPTIONS.map((opt) => {
            const active = selectedLevel === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedLevel(opt.id)}
                className={`w-full text-right bg-white rounded-3xl p-4 sm:p-5 border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  active
                    ? 'border-[#185FA5] ring-2 ring-[#185FA5]/15 shadow-xs'
                    : 'border-[#E6E0D3] hover:border-[#DCD6C7]'
                }`}
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-[#2C2C2A]">{opt.title}</h3>
                  <p className="text-xs sm:text-sm text-[#5C6676] leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 border ${
                    active
                      ? 'bg-[#185FA5] border-[#185FA5] text-white'
                      : 'border-[#CBD5E1] bg-white'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* What happens when enabled */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E0D3] space-y-4">
        <h2 className="font-bold text-base text-[#2C2C2A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#185FA5]" />
          <span>إيه اللي هيحصل لما تفعّل الوضع ده؟</span>
        </h2>

        <div className="space-y-3.5 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#185FA5]/10 flex items-center justify-center shrink-0 text-[#185FA5]">
              <BellOff className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#2C2C2A]">صفر إشعارات وزنّ</h3>
              <p className="text-xs text-[#6B7280]">
                مش هنبعتلك أي رنّة أو تفكير بمهام مؤجلة طول اليوم، هدوء تام.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F1CC51]/30 flex items-center justify-center shrink-0 text-[#2C2C2A]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#2C2C2A]">حماية الـ Streak (مبني على التواجد)</h3>
              <p className="text-xs text-[#6B7280]">
                أيامك المتتالية مش هتضيع؛ زونك بيحسب تواجدك واهتمامك بنفسك يوم ناجح.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D85A30]/15 flex items-center justify-center shrink-0 text-[#D85A30]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#2C2C2A]">تأجيل تلقائي بروقان</h3>
              <p className="text-xs text-[#6B7280]">
                المهام هتترحل بهدوء لبكرة أو بعده، بدون خطوط حمراء أو رسايل لوم.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Picker */}
      <div className="space-y-3">
        <h2 className="font-bold text-base text-[#2C2C2A] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#185FA5]" />
          <span>تحب الوضع يستمر لقد إيه؟</span>
        </h2>

        <div className="bg-white rounded-3xl p-2 border border-[#E6E0D3] space-y-1">
          {DURATION_OPTIONS.map((dur) => {
            const active = selectedDuration === dur.id;
            return (
              <button
                key={dur.id}
                type="button"
                onClick={() => setSelectedDuration(dur.id)}
                className={`w-full min-h-[46px] px-4 rounded-2xl text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#185FA5]/10 text-[#185FA5]'
                    : 'text-[#3B4454] hover:bg-[#F5F2EA]'
                }`}
              >
                <span>{dur.label}</span>
                {active && <Check className="w-4 h-4 text-[#185FA5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activate CTA */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => onActivate(selectedLevel, selectedDuration)}
          className="w-full min-h-[54px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
        >
          <span>تفعيل وضع الفرهده والراحة التامة 🛋️✨</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full min-h-[44px] text-sm font-semibold text-[#5C6676] hover:text-[#2C2C2A] transition-colors cursor-pointer"
        >
          لا خلاص، هجرّب أعمل خطوة واحدة خفيفة ☕
        </button>
      </div>
    </div>
  );
};
