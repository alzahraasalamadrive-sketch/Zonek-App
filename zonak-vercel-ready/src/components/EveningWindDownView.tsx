import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  Flame,
  Loader2,
  Mic,
  MicOff,
  Moon,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { TaskArea, TaskPriority, ToneStyle, ZonakTask } from '../types/zonak';
import { AREA_LABELS, toArabicDigits } from '../data/initialData';
import { ZonakSmiley } from './ZonakArt';
import { parseEgyptianBrainDump } from '../lib/aiClient';
import { generateUUID } from '../lib/supabase';

interface EveningWindDownViewProps {
  tasks: ZonakTask[];
  calmStreakDays: number;
  tone?: ToneStyle;
  isLowEnergy?: boolean;
  onPostponeSelected: (ids: string[]) => void;
  onDismissSelected: (ids: string[]) => void;
  onAddTomorrowTasks?: (newTasks: ZonakTask[], message: string) => void;
  onOpenBrainDump: () => void;
  onBack: () => void;
}

export const EveningWindDownView: React.FC<EveningWindDownViewProps> = ({
  tasks,
  calmStreakDays,
  tone = 'gentle',
  isLowEnergy = false,
  onPostponeSelected,
  onDismissSelected,
  onAddTomorrowTasks,
  onOpenBrainDump,
  onBack,
}) => {
  const pendingTasks = tasks.filter(
    (t) => !t.completed && !t.archived && !t.postponedToTomorrow
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    pendingTasks.map((t) => t.id)
  );

  // Direct Evening Microphone & Text State
  const [listening, setListening] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [tomorrowText, setTomorrowText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [reflectMessage, setReflectMessage] = useState<string | null>(null);
  const [extractedTomorrowTasks, setExtractedTomorrowTasks] = useState<
    ZonakTask[] | null
  >(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!listening) {
      setRecordingSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [listening]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${toArabicDigits(String(mins).padStart(2, '0'))}:${toArabicDigits(
      String(rem).padStart(2, '0')
    )}`;
  };

  const getSupportedAudioMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return '';
  };

  const processEveningDumpWithGemini = async (opts: {
    textInput?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }) => {
    setLoading(true);
    setMicError(null);
    try {
      const data = await parseEgyptianBrainDump({
        text: opts.textInput ?? tomorrowText.trim(),
        audioBase64: opts.audioBase64,
        audioMimeType: opts.audioMimeType,
        tone,
        isLowEnergy,
        context: 'tomorrow',
      });

      if (data.unclear || !Array.isArray(data.tasks) || data.tasks.length === 0) {
        setMicError(
          'الصوت مكانش واضح — تحب تعيد التسجيل ولا تكتبها؟ 🤍'
        );
        return;
      }

      if (data.transcript && !tomorrowText.trim()) {
        setTomorrowText(data.transcript);
      }

      let importantAssigned = false;
      const mapped: ZonakTask[] = data.tasks.map((t, idx) => {
        const isImp = Boolean(t.important && !importantAssigned);
        if (isImp) importantAssigned = true;
        const area: TaskArea = t.area || 'personal';
        const areaLabel = AREA_LABELS[area] || 'بهدوء';

        return {
          id: generateUUID(),
          title: t.title,
          subtitle:
            t.subtitle ||
            (isImp ? 'الأهم بكرة • خطوة واحدة تكفي' : `${areaLabel} • خطة بكرة`),
          category: isImp ? 'الأهم ⭐' : areaLabel,
          categoryTone: isImp ? 'priority' : area === 'health' ? 'health' : 'calm',
          area,
          priority: (t.priority || (isImp ? 'high' : 'medium')) as TaskPriority,
          isImportant: isImp,
          timeLabel: t.time && t.time.trim() ? t.time.trim() : 'بكرة الصبح',
          durationMinutes: t.durationMinutes || (isImp ? 25 : 15),
          completed: false,
          postponedToTomorrow: true,
          encouragement:
            t.encouragement || 'خطة بكرة جاهزة ومستنياك بهدوء.. نام مرتاح البال.',
          contextTags: ['خطة بكرة 🌙', areaLabel],
          microSteps: [
            {
              id: `ms-tom-${Date.now()}-${idx}-1`,
              title: `بداية هادية (٥ دقائق) في: ${t.title}`,
              hint: 'مجرد البداية بتفتح النفس',
              durationMinutes: 5,
              completed: false,
            },
          ],
        };
      });

      if (mapped.length > 0 && !mapped.some((m) => m.isImportant)) {
        mapped[0].isImportant = true;
        mapped[0].category = 'الأهم ⭐';
        mapped[0].categoryTone = 'priority';
      }

      setReflectMessage(
        data.reflect || 'سجّلتلك خطة بكرة عشان تصحى تلاقيها جاهزة وتنام مطمّن 🌙🤍'
      );
      setExtractedTomorrowTasks(mapped);
    } catch (err) {
      setMicError(
        err instanceof Error
          ? err.message
          : 'حصلت لخبطة بسيطة أثناء استخراج خطة بكرة — جرّب تاني أو اكتبها 🤍'
      );
    } finally {
      setLoading(false);
    }
  };

  const stopEveningRecordingAndSend = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    setListening(false);
  };

  const startEveningVoiceRecording = async () => {
    setMicError(null);
    setExtractedTomorrowTasks(null);
    setReflectMessage(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError(
        'خطأ الوصول للمايكروفون: واجهة navigator.mediaDevices.getUserMedia غير مدعومة في هذا المتصفح.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const supportedMime = getSupportedAudioMimeType();
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      const finalMimeType = (recorder.mimeType || supportedMime || 'audio/webm').split(';')[0];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        if (audioBlob.size < 200) {
          setMicError('التسجيل الصوتي قصير جداً — اضغط على المايك وجرّب تاني 🤍');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = String(reader.result || '');
          const base64Clean = base64data.includes(',')
            ? base64data.split(',')[1]
            : base64data;
          processEveningDumpWithGemini({
            textInput: tomorrowText.trim(),
            audioBase64: base64Clean,
            audioMimeType: finalMimeType,
          });
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setListening(true);
    } catch (err: any) {
      setListening(false);
      const errName = err?.name ? `${err.name}: ` : '';
      const errMsg = err?.message || String(err) || 'Unknown microphone error';
      console.error('[Zonak Evening Microphone Error]:', err);
      setMicError(`تعذّر الوصول إلى الميكروفون (${errName}${errMsg})`);
    }
  };

  const toggleEveningVoiceRecording = () => {
    if (listening) {
      stopEveningRecordingAndSend();
    } else {
      startEveningVoiceRecording();
    }
  };

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
        <span className="text-xs font-bold text-[#185FA5] flex items-center gap-1.5">
          <Moon className="w-4 h-4 text-[#185FA5]" />
          المسا • تصفية الذهن وإغلاق اليوم
        </span>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        <ZonakSmiley size={68} withHalo />
        <p className="text-xs text-[#6B7280] mt-3 flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5" />
          <span>إغلاق اليوم بسلام وصفر ذنب</span>
        </p>
      </div>

      {/* Day Summary Card — Show-up Streak (#F1CC51) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E0D3] shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2A]">
              يومك اتقفل – كنت جامد النهارده
            </h1>
            <p className="text-sm text-[#5C6676] mt-1">
              عملت اللي قدرت عليه، ومجرد تواجدك النهارده إنجاز يحسب لك.
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#F1CC51]/35 flex items-center justify-center shrink-0 text-[#2C2C2A]">
            <Sun className="w-5 h-5" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex items-center gap-1.5 bg-[#F1CC51] text-[#2C2C2A] px-3.5 py-1.5 rounded-full text-xs font-bold tabular-nums">
            <Flame className="w-4 h-4 text-[#2C2C2A]" />
            <span>{toArabicDigits(calmStreakDays)} أيام حضور وتواجد (Show-up Streak)</span>
          </div>
          <span className="text-xs text-[#6B7280]">بدون محاسبة ولا نسب %</span>
        </div>
      </div>

      {/* Pending tasks neutral choice (#D85A30 calm coral dot, zero red) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E0D3] space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#2C2C2A] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D85A30]" />
            <span>
              {pendingTasks.length > 0
                ? `في ${toArabicDigits(pendingTasks.length)} حاجات لسه واقفين`
                : 'مفيش حاجة واقفة.. يومك صافي ✨'}
            </span>
          </h2>
          <span className="text-xs font-bold bg-[#D85A30]/15 text-[#2C2C2A] px-2.5 py-1 rounded-full">
            ترحيل بلطف (صفر عقاب)
          </span>
        </div>

        {pendingTasks.length > 0 ? (
          <>
            <p className="text-sm text-[#5C6676]">
              الدنيا بتحصل وعادي جداً! تحب نرحّلهم لبكرة ولا نشيلهم خالص؟
            </p>

            <div className="space-y-2.5">
              {pendingTasks.map((task) => {
                const checked = selectedIds.includes(task.id);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleId(task.id)}
                    className={`w-full min-h-[50px] px-4 py-3 rounded-2xl border text-right flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      checked
                        ? 'bg-[#185FA5]/5 border-[#185FA5]/40'
                        : 'bg-[#F5F2EA] border-[#E6E0D3]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-[#185FA5] border-[#185FA5] text-white'
                            : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className="text-sm font-bold text-[#2C2C2A]">
                        {task.title}
                      </span>
                    </div>
                    <span className="text-xs text-[#6B7280] tabular-nums">
                      {toArabicDigits(task.durationMinutes)} د
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onPostponeSelected(selectedIds)}
                disabled={selectedIds.length === 0}
                className="min-h-[48px] rounded-2xl bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>رحّلهم لبكرة</span>
              </button>
              <button
                type="button"
                onClick={() => onDismissSelected(selectedIds)}
                disabled={selectedIds.length === 0}
                className="min-h-[48px] rounded-2xl bg-[#D85A30]/15 hover:bg-[#D85A30]/25 text-[#2C2C2A] font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-[#D85A30]" />
                <span>شيلهم خالص</span>
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#5C6676]">
            كل المهام اتصفت بهدوء، تقدر تنام مرتاح البال دلوقتي.
          </p>
        )}
      </div>

      {/* Quick Tomorrow Voice Brain Dump (Direct getUserMedia + MediaRecorder + Gemini 2.5 Flash) */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E0D3] text-center space-y-5">
        <div className="text-2xl">🛏️</div>
        <div>
          <h2 className="text-lg font-bold text-[#185FA5]">في حاجة على بالك لبكرة؟</h2>
          <p className="text-sm text-[#5C6676] mt-1">
            سجّلها في ثواني بصوتك عشان خطة بكرة تستنّاك جاهزة الصبح.
          </p>
        </div>

        <button
          type="button"
          id="btn-evening-mic"
          onClick={toggleEveningVoiceRecording}
          disabled={loading}
          aria-label={listening ? 'خلصت التسجيل لبكرة' : 'اضغط وسجّل صوتك لبكرة'}
          className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50 ${
            listening
              ? 'bg-[#185FA5] text-white ring-8 ring-[#F1CC51]/40 animate-pulse'
              : 'bg-[#185FA5] hover:bg-[#134B84] text-white shadow-[#185FA5]/20 ring-8 ring-[#185FA5]/10'
          }`}
        >
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : listening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {listening ? (
          <div className="w-full max-w-sm mx-auto bg-[#F5F2EA] rounded-2xl p-4 border border-[#F1CC51] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#185FA5] animate-ping" />
                <span className="text-base font-bold text-[#185FA5]">بسمعك...</span>
              </div>

              <div className="flex items-end gap-1 h-5">
                <span className="w-1.5 h-3 bg-[#185FA5] rounded-full animate-bounce" />
                <span className="w-1.5 h-5 bg-[#F1CC51] rounded-full animate-pulse" />
                <span className="w-1.5 h-4 bg-[#185FA5] rounded-full animate-bounce" />
                <span className="w-1.5 h-5 bg-[#185FA5] rounded-full animate-pulse" />
                <span className="w-1.5 h-2.5 bg-[#F1CC51] rounded-full animate-bounce" />
              </div>

              <span className="font-mono font-bold text-sm bg-white px-2.5 py-1 rounded-xl border border-[#E6E0D3] text-[#2C2C2A] tabular-nums">
                {formatTimer(recordingSeconds)}
              </span>
            </div>

            <button
              type="button"
              id="btn-evening-finish-recording"
              onClick={stopEveningRecordingAndSend}
              className="w-full min-h-[46px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Check className="w-5 h-5 text-[#F1CC51]" />
              <span>خلصت — استخرج خطة بكرة ✨</span>
            </button>
          </div>
        ) : loading ? (
          <p className="text-sm font-bold text-[#185FA5] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>ببعت الصوت لـ Gemini وبجهّز خطة بكرة…</span>
          </p>
        ) : (
          <div>
            <p className="text-sm font-bold text-[#2C2C2A]">اضغط على المايك وفرّغ لبكرة</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              هنفهمها بالعامية المصرية وننظمها تلقائياً
            </p>
          </div>
        )}

        {/* Exact Error Display (err.message) + "أكتب بدلاً من الصوت" button */}
        {micError && (
          <div
            role="alert"
            className="bg-[#D85A30]/10 border border-[#D85A30]/40 text-[#2C2C2A] rounded-2xl p-4 text-right space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#D85A30] shrink-0 mt-1" />
              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-[#D85A30]">
                  تفاصيل خطأ الميكروفون (err.message):
                </p>
                <p className="text-xs sm:text-sm font-bold leading-relaxed break-words">
                  {micError}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={startEveningVoiceRecording}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white border border-[#E6E0D3] text-xs font-bold text-[#185FA5] cursor-pointer"
              >
                إعادة محاولة التسجيل 🎙️
              </button>
              <button
                type="button"
                onClick={() => {
                  setMicError(null);
                  setShowTextInput(true);
                  setTimeout(() => {
                    const el = document.getElementById('evening-tomorrow-textarea');
                    if (el) el.focus();
                  }, 50);
                }}
                className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#185FA5] text-white text-xs font-bold cursor-pointer"
              >
                أكتب بدلاً من الصوت ✍️
              </button>
            </div>
          </div>
        )}

        {/* Toggle or Display Text Alternative */}
        {!showTextInput ? (
          <button
            type="button"
            onClick={() => setShowTextInput(true)}
            className="text-xs font-bold text-[#185FA5] hover:underline cursor-pointer"
          >
            أو اضغط هنا للكتابة بدلاً من الصوت ✍️
          </button>
        ) : (
          <div className="text-right space-y-2.5 pt-2 border-t border-[#E6E0D3]">
            <label
              htmlFor="evening-tomorrow-textarea"
              className="block text-xs font-bold text-[#5C6676]"
            >
              اكتب اللي على بالك لبكرة:
            </label>
            <textarea
              id="evening-tomorrow-textarea"
              rows={2}
              value={tomorrowText}
              onChange={(e) => setTomorrowText(e.target.value)}
              placeholder="مثلاً: بكرة الصبح محتاج أراجع البرزنتيشن الساعة 10 وأكلم دكتور الأسنان..."
              className="w-full p-3 rounded-2xl bg-[#F5F2EA] border border-[#E2DDD0] text-sm text-[#2C2C2A] focus:outline-none focus:border-[#185FA5]"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenBrainDump}
                className="text-xs font-bold text-[#185FA5] hover:underline cursor-pointer"
              >
                فتح شاشة التفريغ الكاملة ←
              </button>
              <button
                type="button"
                onClick={() =>
                  processEveningDumpWithGemini({ textInput: tomorrowText.trim() })
                }
                disabled={loading || !tomorrowText.trim()}
                className="min-h-[42px] px-5 py-2 rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>بجهّز خطة بكرة…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#F1CC51]" />
                    <span>جهّز خطة بكرة بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Extracted Tomorrow Plan Preview & Save Button */}
        {extractedTomorrowTasks && extractedTomorrowTasks.length > 0 && (
          <div className="bg-[#F5F2EA] rounded-2xl p-4 border border-[#185FA5]/30 text-right space-y-3">
            <p className="text-xs sm:text-sm font-bold text-[#185FA5]">
              ✨ {reflectMessage}
            </p>
            <div className="space-y-2">
              {extractedTomorrowTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl p-3 border border-[#E6E0D3] flex items-center justify-between gap-2"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#2C2C2A]">
                    {t.title}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F1CC51]/40 text-[#2C2C2A] shrink-0">
                    {t.isImportant ? 'الأهم بكرة ⭐' : t.timeLabel}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (onAddTomorrowTasks) {
                  onAddTomorrowTasks(
                    extractedTomorrowTasks,
                    reflectMessage || 'تم حفظ خطة بكرة في Supabase بنجاح 🌙✨'
                  );
                }
                setExtractedTomorrowTasks(null);
                setTomorrowText('');
              }}
              className="w-full min-h-[46px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>احفظ خطة بكرة وتصبح على خير 🌙</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer quote */}
      <div className="text-center space-y-1 pt-2">
        <p className="text-xs sm:text-sm italic text-[#5C6676]">
          &ldquo;أهم إنجاز في آخر اليوم هو أن تسامح نفسك على ما لم تنجزه، وتنام
          مطمئناً.&rdquo;
        </p>
        <p className="text-xs text-[#7D8593]">🌙 تصبح على خير ورضا</p>
      </div>
    </div>
  );
};

