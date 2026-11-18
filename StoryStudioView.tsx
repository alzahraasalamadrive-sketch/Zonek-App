import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  Eye,
  GripVertical,
  Link2,
  Move,
  Palette,
  RotateCcw,
  RotateCw,
  Share2,
  Sparkles,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';
import { StoryConfig, StorySticker, StoryTheme } from '../types/zonak';
import {
  DEFAULT_STORY_CONFIG,
  EGYPTIAN_STICKER_SUGGESTIONS,
  STICKER_COLORS,
  toArabicDigits,
} from '../data/initialData';
import { CozyTeaGirlArt, ZonakLogoMark } from './ZonakArt';
import { renderStoryToPngBlob } from '../utils/storyExport';

interface StoryStudioViewProps {
  stats: {
    completedSteps: number;
    restHours: number;
    recoveryDays: number;
    peacePct: number;
  };
  onBack: () => void;
  onNotify: (msg: string) => void;
}

export const StoryStudioView: React.FC<StoryStudioViewProps> = ({
  stats,
  onBack,
  onNotify,
}) => {
  const [config, setConfig] = useState<StoryConfig>(DEFAULT_STORY_CONFIG);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    'sticker-farhada'
  );
  const [exporting, setExporting] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const selectedSticker =
    config.stickers.find((s) => s.id === selectedStickerId && s.visible) ?? null;

  const updateSticker = (id: string, patch: Partial<StorySticker>) => {
    setConfig((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const applyCustomSticker = (textToApply?: string) => {
    const finalText = (textToApply ?? config.customStickerText).trim();
    if (!finalText) return;
    const colorObj =
      STICKER_COLORS.find((c) => c.id === config.customStickerColor) ??
      STICKER_COLORS[0];

    setConfig((prev) => ({
      ...prev,
      customStickerText: finalText,
      stickers: prev.stickers.map((s) =>
        s.id === 'sticker-custom'
          ? {
              ...s,
              text: finalText,
              bgColor: colorObj.bg,
              textColor: colorObj.text,
              visible: true,
            }
          : s
      ),
    }));
    setSelectedStickerId('sticker-custom');
  };

  const applyCustomColor = (colorId: string) => {
    const colorObj =
      STICKER_COLORS.find((c) => c.id === colorId) ?? STICKER_COLORS[0];
    setConfig((prev) => ({
      ...prev,
      customStickerColor: colorId,
      stickers: prev.stickers.map((s) =>
        s.id === 'sticker-custom'
          ? { ...s, bgColor: colorObj.bg, textColor: colorObj.text }
          : s
      ),
    }));
  };

  const handlePointerDownSticker = (
    e: React.PointerEvent,
    sticker: StorySticker
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedStickerId(sticker.id);
    dragStateRef.current = {
      id: sticker.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: sticker.x,
      origY: sticker.y,
    };
  };

  const handlePointerMoveSticker = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    const card = cardRef.current;
    if (!drag || !card) return;
    const rect = card.getBoundingClientRect();
    const dxPct = ((e.clientX - drag.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startY) / rect.height) * 100;
    const clampedX = Math.max(12, Math.min(88, drag.origX + dxPct));
    const clampedY = Math.max(8, Math.min(92, drag.origY + dyPct));
    updateSticker(drag.id, { x: clampedX, y: clampedY });
  };

  const handlePointerUpSticker = () => {
    dragStateRef.current = null;
  };

  const handleDownloadStory = async (shareToSocial = false) => {
    setExporting(true);
    try {
      const blob = await renderStoryToPngBlob(config, stats);
      if (!blob) throw new Error('تعذّر إنشاء صورة الستوري.');

      if (
        shareToSocial &&
        typeof navigator !== 'undefined' &&
        'share' in navigator &&
        navigator.canShare
      ) {
        const file = new File([blob], 'zonak-weekly-story.png', {
          type: 'image/png',
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'تقرير أسبوعي المريح من زونك',
            text: 'أسبوعي مكنش سباق.. أسبوعي كان روقان حقيقي ☕💛 #zonak_weekly',
          });
          onNotify('تم فتح نافذة المشاركة بنجاح ✨');
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zonak-weekly-story.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onNotify(
        shareToSocial
          ? 'تم حفظ الستوري بجودة عالية! تقدر ترفعها على Instagram Story دلوقتي 📸'
          : 'تم حفظ صورة الستوري في جهازك بنجاح ✨'
      );
    } catch {
      onNotify('تعذّر تصدير الصورة حالياً.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = async () => {
    const shareText = `أسبوعي في زونك عدّى بروقان ✨ (${toArabicDigits(
      stats.completedSteps
    )} خطوات هادية • ${toArabicDigits(
      stats.restHours
    )} ساعة راحة مستحقة) #zonak_weekly`;
    try {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      onNotify('تم نسخ ملخص الستوري والرابط بنجاح 🔗');
    } catch {
      onNotify('تم تجهيز الرابط للمشاركة.');
    }
  };

  const themeBg =
    config.theme === 'warm_sunrise'
      ? 'bg-gradient-to-b from-[#FFF3CD] via-[#FCF8EE] to-[#F5EFE0]'
      : config.theme === 'calm_wave'
      ? 'bg-gradient-to-b from-[#DCEDFD] via-[#F2F7FC] to-[#E8F1F8]'
      : 'bg-gradient-to-b from-[#FFFFFF] to-[#F7F5EF]';

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
        <h1 className="text-base sm:text-lg font-bold text-[#1A2230]">
          تقرير الأسبوع المريح
        </h1>
      </div>

      {/* Preview meta & drag hint */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span className="flex items-center gap-1.5 font-semibold text-[#8D6E18]">
            <span className="w-2 h-2 rounded-full bg-[#F6D258]" />
            معاينة الستوري الجاهز للنشر
          </span>
          <span className="bg-[#EFECE4] px-2.5 py-1 rounded-full font-semibold tabular-nums">
            نسبة 9:16
          </span>
        </div>

        <div className="bg-[#FAF0C8] text-[#5C4911] rounded-2xl px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 text-center">
          <Move className="w-4 h-4 shrink-0" />
          <span>اسحب أي ستيكر وحركه • استخدم أداة التكبير والتدوير بالأسفل ✨</span>
        </div>
      </div>

      {/* Responsive 2-column on desktop: Preview Left / Controls Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 9:16 Story Preview Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <div
            ref={cardRef}
            onClick={() => setSelectedStickerId(null)}
            className={`relative w-full max-w-[360px] rounded-[2rem] p-4 sm:p-5 shadow-md border border-[#EAE3D2] overflow-hidden select-none ${themeBg}`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="bg-white/95 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-xs">
                <ZonakLogoMark size={24} />
                <span className="font-bold text-sm text-[#0A467E]">زونك</span>
                <span className="text-[11px] text-[#6B7280]">Zonak</span>
              </div>
              <span className="bg-[#F6D258] text-[#453100] text-[11px] font-bold px-3 py-1.5 rounded-full">
                أسبوع عدّى بروقان 🍃
              </span>
            </div>

            {/* Hero Inner Card */}
            <div className="bg-white rounded-3xl p-3.5 shadow-xs border border-[#F0ECE1] flex items-center gap-3 mb-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                <CozyTeaGirlArt className="w-full h-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-[#8D6E18] mb-0.5">
                  مزاج الأسبوع • رايق جداً
                </p>
                <h2 className="text-sm sm:text-base font-bold text-[#1A2230] leading-snug">
                  أسبوعي مكنش سباق.. أسبوعي كان روقان حقيقي ☕💛
                </h2>
              </div>
            </div>

            {/* 2x2 Stats Grid */}
            {config.showNumbers && (
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="bg-white rounded-2xl p-3 border border-[#F0ECE1]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-7 h-7 rounded-lg bg-[#FAF0C8] flex items-center justify-center text-xs">
                      ☕
                    </span>
                    <span className="text-[11px] font-semibold text-[#8D6E18]">
                      إنجاز هادي
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[#1A2230] tabular-nums">
                    {toArabicDigits(stats.completedSteps)} خطوات
                  </p>
                  <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">
                    صغيرة تمت بروقان ودون حرق دم ☕
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-[#F0ECE1]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-7 h-7 rounded-lg bg-[#E8F1FA] flex items-center justify-center text-xs">
                      🛋️
                    </span>
                    <span className="text-[11px] font-semibold text-[#0A467E]">
                      شحن طاقة
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[#1A2230] tabular-nums">
                    {toArabicDigits(stats.restHours)} ساعة
                  </p>
                  <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">
                    راحة مستحقة وتجديد شغف حقيقي 🛋️
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-[#F0ECE1]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-7 h-7 rounded-lg bg-[#FDECE8] flex items-center justify-center text-xs">
                      🔋
                    </span>
                    <span className="text-[11px] font-semibold text-[#A83724]">
                      فصلان معتمد
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[#1A2230] tabular-nums">
                    {stats.recoveryDays === 2
                      ? 'يومين'
                      : `${toArabicDigits(stats.recoveryDays)} أيام`}
                  </p>
                  <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">
                    فرهدة معتمدة بدون تأنيب ضمير 🔋
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-[#F0ECE1]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-7 h-7 rounded-lg bg-[#FAF0C8] flex items-center justify-center text-xs">
                      ☁️
                    </span>
                    <span className="text-[11px] font-semibold text-[#8D6E18]">
                      سلام داخلي
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[#2C2C2A] tabular-nums">
                    هادي ورايق
                  </p>
                  <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">
                    هدوء نفسي وسكينة بدون دوشة ☁️
                  </p>
                </div>
              </div>
            )}

            {/* 7-day Mood Curve */}
            {config.showChart && (
              <div className="bg-white rounded-2xl p-3 border border-[#F0ECE1] flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-[10px] text-[#6B7280]">مؤشر الانبساط خلال ٧ أيام</p>
                  <p className="text-xs font-bold text-[#1A2230]">
                    منحنى صاعد بلا ضغوطات 📈
                  </p>
                </div>
                <svg viewBox="0 0 110 36" className="w-24 h-8 shrink-0">
                  <path
                    d="M6 26 C26 28, 38 14, 56 20 C72 25, 84 8, 102 10"
                    fill="none"
                    stroke="#0A467E"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="102" cy="10" r="4.5" fill="#F6D258" />
                </svg>
              </div>
            )}

            {/* Navy Quote Banner */}
            <div className="bg-[#0A467E] text-white rounded-2xl p-3.5 text-xs leading-relaxed mb-3">
              <span className="text-[#F6D258] font-bold text-base ml-1">❝</span>
              إنتاجيتي مش مقياس قيمتي كإنسان.. الراحة استثمار حقيقي، والأيام الحلوة بتتعاش
              ببال رايق ودون مقارنات.
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between text-[11px] text-[#5C6676]">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-4 h-4 rounded-full bg-[#F6D258] text-[#3F2D00] flex items-center justify-center text-[9px] font-bold">
                  Z
                </span>
                تطبيق زونك • رفيق الروقان ☀️
              </span>
              <span className="bg-white/80 px-2 py-0.5 rounded-md font-mono text-[10px]">
                #zonak_weekly
              </span>
            </div>

            {/* Draggable Stickers Layer */}
            {config.stickers
              .filter((s) => s.visible)
              .map((sticker) => {
                const isSelected = selectedStickerId === sticker.id;
                return (
                  <div
                    key={sticker.id}
                    onPointerDown={(e) => handlePointerDownSticker(e, sticker)}
                    onPointerMove={handlePointerMoveSticker}
                    onPointerUp={handlePointerUpSticker}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStickerId(sticker.id);
                    }}
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                      backgroundColor: sticker.bgColor,
                      color: sticker.textColor,
                      touchAction: 'none',
                    }}
                    className={`absolute z-20 px-3.5 py-2 rounded-full shadow-md font-bold text-xs whitespace-nowrap flex items-center gap-1.5 cursor-grab active:cursor-grabbing ${
                      isSelected
                        ? 'ring-2 ring-dashed ring-[#0A467E] ring-offset-2'
                        : ''
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 opacity-60" />
                    <span>{sticker.text}</span>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSticker(sticker.id, { visible: false });
                          setSelectedStickerId(null);
                        }}
                        aria-label={`إخفاء ${sticker.text}`}
                        className="w-4 h-4 rounded-full bg-[#1A2230]/20 hover:bg-[#1A2230]/40 flex items-center justify-center mr-1 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Selected Sticker Transform Controls */}
          {selectedSticker && (
            <div className="w-full max-w-[360px] bg-white rounded-3xl p-4 border border-[#EFEAE0] shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1A2230]">
                  تحكم بالستيكر: {selectedSticker.text}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateSticker(selectedSticker.id, { scale: 1, rotation: 0 })
                  }
                  className="text-[#0A467E] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة الوضع الأصلي</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    updateSticker(selectedSticker.id, {
                      rotation: Math.max(-45, selectedSticker.rotation - 10),
                    })
                  }
                  aria-label="تدوير لليسار"
                  className="w-9 h-9 rounded-xl bg-[#F4F2EC] flex items-center justify-center text-[#1A2230] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateSticker(selectedSticker.id, {
                      rotation: Math.min(45, selectedSticker.rotation + 10),
                    })
                  }
                  aria-label="تدوير لليمين"
                  className="w-9 h-9 rounded-xl bg-[#F4F2EC] flex items-center justify-center text-[#1A2230] cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min={0.7}
                  max={1.5}
                  step={0.05}
                  value={selectedSticker.scale}
                  onChange={(e) =>
                    updateSticker(selectedSticker.id, {
                      scale: Number(e.target.value),
                    })
                  }
                  aria-label="حجم الستيكر"
                  className="flex-1 accent-[#0A467E] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Customization Controls */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#EFEAE0] space-y-6">
          {/* Themes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base sm:text-lg text-[#1A2230] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#0A467E]" />
                <span>تخصيص لمسات الستوري</span>
              </h2>
              <span className="text-xs text-[#6B7280]">اختر ستايلك</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'warm_sunrise' as StoryTheme, label: 'شروق دافي', emoji: '☀️' },
                { id: 'calm_wave' as StoryTheme, label: 'روقان وهدوء', emoji: '🌊' },
                { id: 'minimal' as StoryTheme, label: 'بسيط مينيمال', emoji: '🤍' },
              ].map((th) => {
                const active = config.theme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, theme: th.id }))}
                    className={`min-h-[78px] rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      active
                        ? 'bg-white border-[#0A467E] ring-2 ring-[#0A467E]/15 shadow-xs'
                        : 'bg-[#F8F6F0] border-transparent hover:bg-[#F2EFE7]'
                    }`}
                  >
                    <span className="text-xl">{th.emoji}</span>
                    <span className="text-xs font-bold text-[#1A2230]">{th.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Text Sticker Box */}
          <div className="bg-[#FEF9E6] rounded-3xl p-4 sm:p-5 border border-[#F5E6B3] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#1A2230]">
                  ✍️ اكتب ستيكر كلامك المخصص
                </h3>
                <p className="text-xs text-[#6B7280]">
                  عبارة أو فكرة بروقانك الخاص على الكارت
                </p>
              </div>
              <span className="bg-[#FAF0C8] text-[#6B500E] text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0">
                + تعديل النص
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={config.customStickerText}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, customStickerText: e.target.value }))
                }
                placeholder="رايق وبشرب قهوتي ☕✨"
                className="flex-1 min-h-[46px] px-4 rounded-2xl bg-white border border-[#E7DEC3] text-sm font-semibold text-[#1A2230] focus:outline-none focus:border-[#0A467E]"
              />
              <button
                type="button"
                onClick={() => applyCustomSticker()}
                className="min-h-[46px] px-5 rounded-2xl bg-[#0A467E] hover:bg-[#083968] text-white font-bold text-sm shrink-0 cursor-pointer"
              >
                تطبيق
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#6B7280]">
                💡 اقتراحات مصرية رايقة بنقرة واحدة:
              </p>
              <div className="flex flex-wrap gap-2">
                {EGYPTIAN_STICKER_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => applyCustomSticker(sug)}
                    className="min-h-[36px] px-3 py-1.5 rounded-full bg-white border border-[#EAE1C6] text-xs font-semibold text-[#1A2230] hover:bg-[#FAF0C8] transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-[#5C6676]">
                لون شريط الستيكر:
              </span>
              <div className="flex items-center gap-2">
                {STICKER_COLORS.map((col) => {
                  const active = config.customStickerColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => applyCustomColor(col.id)}
                      aria-label={col.label}
                      style={{ backgroundColor: col.bg }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        active
                          ? 'border-[#0A467E] scale-110'
                          : 'border-[#E2DDD0]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stickers Toggle Strip */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-[#1A2230] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#A83724]" />
                <span>ملصقات وستيكرات زونك (Stickers)</span>
              </h3>
              <button
                type="button"
                onClick={() => setConfig(DEFAULT_STORY_CONFIG)}
                className="text-xs font-semibold text-[#0A467E] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الكل</span>
              </button>
            </div>
            <p className="text-xs text-[#6B7280]">
              اضغط لإظهار أو إخفاء الستيكر، واسحبه على الكارت لتغيير مكانه بكل سلاسة
            </p>

            <div className="flex flex-wrap gap-2">
              {config.stickers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    const nextVis = !s.visible;
                    updateSticker(s.id, { visible: nextVis });
                    if (nextVis) setSelectedStickerId(s.id);
                  }}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
                    s.visible
                      ? 'bg-[#FEF9E6] border-[#0A467E] text-[#1A2230]'
                      : 'bg-[#F8F6F0] border-[#E5E0D3] text-[#6B7280]'
                  }`}
                >
                  <span>{s.isCustom ? '✍️ ستيكرك المخصص' : s.text}</span>
                  {s.visible && (
                    <span className="w-4 h-4 rounded-full bg-[#0A467E] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-[#F0ECE1]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-[#1A2230] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#495464]" />
                <span>إظهار أرقام الإنجاز والراحة</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={config.showNumbers}
                onClick={() =>
                  setConfig((p) => ({ ...p, showNumbers: !p.showNumbers }))
                }
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                  config.showNumbers ? 'bg-[#0A467E]' : 'bg-[#D1D5DB]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    config.showNumbers ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-[#1A2230] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#495464]" />
                <span>مؤشر الانبساط البياني</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={config.showChart}
                onClick={() => setConfig((p) => ({ ...p, showChart: !p.showChart }))}
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                  config.showChart ? 'bg-[#0A467E]' : 'bg-[#D1D5DB]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    config.showChart ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Export / Share Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={exporting}
              onClick={() => handleDownloadStory(true)}
              className="w-full min-h-[54px] rounded-full bg-[#0A467E] hover:bg-[#083968] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md shadow-[#0A467E]/15 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Camera className="w-5 h-5 text-[#F6D258]" />
              <span>مشاركة على Instagram Story 📸✨</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={exporting}
                onClick={() => handleDownloadStory(false)}
                className="min-h-[48px] rounded-2xl bg-[#ECEAE4] hover:bg-[#E2DFD7] text-[#0A467E] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>حفظ في الاستوديو</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="min-h-[48px] rounded-2xl bg-[#ECEAE4] hover:bg-[#E2DFD7] text-[#1A2230] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                <span>نسخ الرابط</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="w-full min-h-[40px] text-xs font-semibold text-[#6B7280] hover:text-[#1A2230] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 opacity-0" />
              <span>الرجوع لتقرير الأسبوع بدون مشاركة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
