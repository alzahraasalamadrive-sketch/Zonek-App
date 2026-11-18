import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { TaskArea, TaskPriority, ToneStyle, ZonakTask } from '../types/zonak';
import { AREA_LABELS, BRAIN_DUMP_CHIPS, toArabicDigits } from '../data/initialData';
import { ZonakSmiley } from './ZonakArt';
import { parseEgyptianBrainDump } from '../lib/aiClient';
import { generateUUID } from '../lib/supabase';

interface BrainDumpViewProps {
  tone: ToneStyle;
  isLowEnergy: boolean;
  onBack: () => void;
  onAddParsedTasks: (newTasks: ZonakTask[], message: string) => void;
  embeddedInOnboarding?: boolean;
}

export const BrainDumpView: React.FC<BrainDumpViewProps> = ({
  tone,
  isLowEnergy,
  onBack,
  onAddParsedTasks,
  embeddedInOnboarding = false,
}) => {
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [listening, setListening] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<{
    type: 'silence' | 'stt_fail' | 'permission_denied' | 'general';
    message: string;
  } | null>(null);

  // Editable Reflect-back state
  const [reflectSentence, setReflectSentence] = useState<string | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const [editableTasks, setEditableTasks] = useState<ZonakTask[] | null>(null);

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

  // Cleanup active microphone stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const mapResponseToZonakTasks = (
    rawTasks: Array<{
      title: string;
      area: TaskArea;
      time: string;
      priority: TaskPriority;
      important: boolean;
      subtitle?: string;
      durationMinutes?: number;
      encouragement?: string;
      microSteps?: Array<{ title: string; hint: string; durationMinutes: number }>;
    }>
  ): ZonakTask[] => {
    let importantAssigned = false;
    return rawTasks.map((t, idx) => {
      const isImp = Boolean(t.important && !importantAssigned);
      if (isImp) importantAssigned = true;
      const area: TaskArea = t.area || 'personal';
      const areaLabel = AREA_LABELS[area] || 'بهدوء';

      return {
        id: generateUUID(),
        title: t.title,
        subtitle:
          t.subtitle ||
          (isImp ? 'الأهم النهارده • خطوة واحدة تكفي' : `${areaLabel} • على مهلك`),
        category: isImp ? 'الأهم ⭐' : areaLabel,
        categoryTone: isImp ? 'priority' : area === 'health' ? 'health' : 'calm',
        area,
        priority: t.priority || (isImp ? 'high' : 'medium'),
        isImportant: isImp,
        timeLabel: t.time && t.time.trim() ? t.time.trim() : 'وقت ما تروق',
        durationMinutes: t.durationMinutes || (isImp ? 25 : 15),
        completed: false,
        encouragement:
          t.encouragement ||
          (isImp
            ? 'دي أهم خطوة.. ابدأ بأول ٥ دقايق بس والباقي هييجي بسلاسة.'
            : 'خطوة خفيفة ومريحة بدون أي استعجال.'),
        contextTags: [
          isImp ? 'الأهم النهارده ⭐' : areaLabel,
          `${toArabicDigits(t.durationMinutes || 15)} دقيقة`,
        ],
        microSteps:
          Array.isArray(t.microSteps) && t.microSteps.length > 0
            ? t.microSteps.map((ms, sIdx) => ({
                id: `ms-${Date.now()}-${idx}-${sIdx}`,
                title: ms.title,
                hint: ms.hint,
                durationMinutes: ms.durationMinutes || 5,
                completed: false,
              }))
            : [
                {
                  id: `ms-${Date.now()}-${idx}-1`,
                  title: `بداية هادية (٥ دقائق) في: ${t.title}`,
                  hint: 'مجرد البداية بتشيل التوتر وتفتح النفس',
                  durationMinutes: 5,
                  completed: false,
                },
                {
                  id: `ms-${Date.now()}-${idx}-2`,
                  title: `إكمال الجزء الأساسي من: ${t.title}`,
                  hint: 'على مهلك وبوتيرتك الخاصة',
                  durationMinutes: 10,
                  completed: false,
                },
              ],
      };
    });
  };

  const processAudioOrTextWithAI = async (opts: {
    textInput?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }) => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await parseEgyptianBrainDump({
        text: opts.textInput ?? text.trim(),
        audioBase64: opts.audioBase64,
        audioMimeType: opts.audioMimeType,
        tone,
        isLowEnergy,
        context: 'today',
      });

      if (data.unclear || !Array.isArray(data.tasks) || data.tasks.length === 0) {
        setErrorState({
          type: 'stt_fail',
          message: 'الصوت مكانش واضح — تحب تعيد التسجيل ولا تكتبها وأنا أظبّطها؟ 🤍',
        });
        return;
      }

      if (data.transcript && !text.trim()) {
        setText(data.transcript);
      }

      const mapped = mapResponseToZonakTasks(data.tasks);
      // Guarantee strictly ONE task has isImportant = true
      if (mapped.length > 0 && !mapped.some((m) => m.isImportant)) {
        mapped[0].isImportant = true;
        mapped[0].category = 'الأهم ⭐';
        mapped[0].categoryTone = 'priority';
      }

      setReflectSentence(
        data.reflect || 'فهمت اللي في دماغك ورتبتهولك بهدوء.. راجع وعدّل أي سطر براحتك 🤍'
      );
      setClarificationQuestion(data.clarificationQuestion || null);
      setEditableTasks(mapped);
    } catch (err) {
      setErrorState({
        type: 'general',
        message:
          err instanceof Error
            ? err.message
            : 'حصلت لخبطة بسيطة وأنا بجمّع الكلام — جرّب تاني أو اكتبها هنا 🤍',
      });
    } finally {
      setLoading(false);
    }
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

  const stopRecordingAndSendToGemini = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    setListening(false);
  };

  const startVoiceRecording = async () => {
    setErrorState(null);
    setEditableTasks(null);
    setReflectSentence(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorState({
        type: 'permission_denied',
        message:
          'خطأ الوصول للمايكروفون: واجهة navigator.mediaDevices.getUserMedia غير مدعومة في هذا المتصفح (أو السياق غير آمن HTTPS/localhost).',
      });
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
          setErrorState({
            type: 'silence',
            message: 'التسجيل الصوتي قصير جداً أو لم يلتقط صوتاً — اضغط على المايك وجرّب تاني 🤍',
          });
          return;
        }

        // Convert recorded audio Blob to Base64 and send directly to Gemini API (gemini-2.5-flash)
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = String(reader.result || '');
          const base64Clean = base64data.includes(',')
            ? base64data.split(',')[1]
            : base64data;
          processAudioOrTextWithAI({
            textInput: text.trim(),
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
      console.error('[Zonak Microphone Error]:', err);
      // Do NOT silently switch to text mode — stay in voice mode and display exact err.message
      setErrorState({
        type: 'permission_denied',
        message: `تعذّر الوصول إلى الميكروفون (${errName}${errMsg})`,
      });
    }
  };

  const toggleVoiceRecording = () => {
    if (listening) {
      stopRecordingAndSendToGemini();
    } else {
      startVoiceRecording();
    }
  };

  // Handlers for editing tasks in the Reflect-back screen
  const handleUpdateTaskTitle = (id: string, nextTitle: string) => {
    setEditableTasks((prev) =>
      prev ? prev.map((t) => (t.id === id ? { ...t, title: nextTitle } : t)) : null
    );
  };

  const handleUpdateTaskTime = (id: string, nextTime: string) => {
    setEditableTasks((prev) =>
      prev ? prev.map((t) => (t.id === id ? { ...t, timeLabel: nextTime } : t)) : null
    );
  };

  const handleUpdateTaskArea = (id: string, nextArea: TaskArea) => {
    setEditableTasks((prev) =>
      prev
        ? prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  area: nextArea,
                  category: t.isImportant ? 'الأهم ⭐' : AREA_LABELS[nextArea],
                }
              : t
          )
        : null
    );
  };

  // Enforce strictly ONE task marked as important
  const handleSetSingleImportantTask = (id: string) => {
    setEditableTasks((prev) =>
      prev
        ? prev.map((t) => {
            const isImp = t.id === id;
            const area = t.area || 'personal';
            return {
              ...t,
              isImportant: isImp,
              priority: isImp ? 'high' : 'medium',
              category: isImp ? 'الأهم ⭐' : AREA_LABELS[area],
              categoryTone: isImp ? 'priority' : area === 'health' ? 'health' : 'calm',
            };
          })
        : null
    );
  };

  const handleDeleteParsedTask = (id: string) => {
    setEditableTasks((prev) => {
      if (!prev) return null;
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length > 0 && !filtered.some((t) => t.isImportant)) {
        filtered[0].isImportant = true;
        filtered[0].category = 'الأهم ⭐';
        filtered[0].categoryTone = 'priority';
      }
      return filtered;
    });
  };

  const handleAddBlankParsedTask = () => {
    setEditableTasks((prev) => {
      const list = prev || [];
      const isFirst = list.length === 0;
      const newTask: ZonakTask = {
        id: generateUUID(),
        title: 'خطوة جديدة خفيفة',
        subtitle: 'بهدوء • على مهلك',
        category: isFirst ? 'الأهم ⭐' : AREA_LABELS.personal,
        categoryTone: isFirst ? 'priority' : 'calm',
        area: 'personal',
        priority: isFirst ? 'high' : 'medium',
        isImportant: isFirst,
        timeLabel: 'وقت ما تروق',
        durationMinutes: 15,
        completed: false,
        encouragement: 'خطوة واحدة بسيطة كفاية.',
        contextTags: ['حياة وروقان', '١٥ دقيقة'],
        microSteps: [
          {
            id: `ms-manual-${Date.now()}`,
            title: 'أول ٥ دقائق بداية هادية',
            hint: 'من غير أي استعجال',
            durationMinutes: 5,
            completed: false,
          },
        ],
      };
      return [...list, newTask];
    });
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${toArabicDigits(String(mins).padStart(2, '0'))}:${toArabicDigits(
      String(rem).padStart(2, '0')
    )}`;
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Bar */}
      {!embeddedInOnboarding && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#E6E0D3] text-[#2C2C2A] font-semibold text-sm flex items-center gap-2 hover:bg-[#F5F2EA] cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع للنهارده</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#5C6676] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F1CC51]" />
              تفريغ بلا مجهود
            </span>
          </div>
        </div>
      )}

      {/* Mascot Greeting & Equal Voice + Text Mode Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E0D3] shadow-xs space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-4">
            <ZonakSmiley size={48} withHalo />
            <div className="bg-[#F5F2EA] rounded-full px-4 py-2 border border-[#E6E0D3] text-sm font-semibold text-[#2C2C2A]">
              🤍 قوللي اللي في دماغك… إيه اللي ناوي تعمله؟
            </div>
          </div>

          {/* Equal Side-by-Side Mode Switcher: Voice (صوت) + Text (أو اكتب) */}
          <div
            role="tablist"
            aria-label="طريقة التفريغ: صوت أو كتابة بالتساوي"
            className="w-full max-w-md grid grid-cols-2 gap-3 p-1.5 bg-[#F5F2EA] rounded-2xl border border-[#E6E0D3]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'voice'}
              onClick={() => setInputMode('voice')}
              className={`min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                inputMode === 'voice'
                  ? 'bg-[#185FA5] text-white shadow-xs'
                  : 'bg-white text-[#2C2C2A] hover:bg-[#FFFFFF]/80'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>بالصوت (مايك)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'text'}
              onClick={() => setInputMode('text')}
              className={`min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                inputMode === 'text'
                  ? 'bg-[#185FA5] text-white shadow-xs'
                  : 'bg-white text-[#2C2C2A] hover:bg-[#FFFFFF]/80'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>أو اكتب بالراحة</span>
            </button>
          </div>
        </div>

        {/* Voice Recording Section */}
        {inputMode === 'voice' && (
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="relative">
              <div
                className={`w-36 h-36 rounded-full flex items-center justify-center transition-all ${
                  listening
                    ? 'bg-[#F1CC51]/35 scale-105 animate-pulse'
                    : 'bg-[#185FA5]/10'
                }`}
              >
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center ${
                    listening ? 'bg-[#F1CC51]/55' : 'bg-[#185FA5]/20'
                  }`}
                >
                  <button
                    type="button"
                    id="btn-brain-dump-mic"
                    onClick={toggleVoiceRecording}
                    disabled={loading}
                    aria-label={listening ? 'خلصت التسجيل الصوتي' : 'بدء التسجيل الصوتي'}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50 ${
                      listening
                        ? 'bg-[#185FA5] text-white ring-4 ring-[#F1CC51]'
                        : 'bg-[#185FA5] hover:bg-[#134B84] text-white'
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
                </div>
              </div>
            </div>

            {listening ? (
              <div className="w-full max-w-sm bg-[#F5F2EA] rounded-2xl p-4 border border-[#F1CC51] space-y-3">
                {/* Audio Indicator Waveform + "بسمعك..." + Timer */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#185FA5] animate-ping" />
                    <span className="text-base font-bold text-[#185FA5]">
                      بسمعك...
                    </span>
                  </div>

                  {/* Animated Audio Bars Indicator */}
                  <div
                    aria-label="مؤشر التسجيل الصوتي"
                    className="flex items-end gap-1 h-5"
                  >
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

                <p className="text-xs text-[#5C6676]">
                  احكي براحتك بالعامية المصرية، ولما تخلص اضغط على زر «خلصت» تحت
                </p>

                <button
                  type="button"
                  id="btn-finish-voice-recording"
                  onClick={stopRecordingAndSendToGemini}
                  className="w-full min-h-[48px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Check className="w-5 h-5 text-[#F1CC51]" />
                  <span>خلصت — استخرج خطتي الآن ✨</span>
                </button>
              </div>
            ) : loading ? (
              <div className="space-y-1.5">
                <p className="text-base font-bold text-[#185FA5] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ببعت الصوت لـ Gemini وبجمّع خطتك بهدوء…</span>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-base font-bold text-[#2C2C2A]">
                  اضغط على المايك واحكي اللي في دماغك
                </p>
                <p className="text-xs text-[#5C6676]">
                  تسجيل صوتي مباشر عبر MediaRecorder وإرساله لـ Gemini 2.5 Flash
                </p>
              </div>
            )}

            {/* Real Error Banner with exact err.message + explicit "أكتب بدلاً من الصوت" button */}
            {errorState && (
              <div
                role="alert"
                className="w-full max-w-lg bg-[#D85A30]/10 border border-[#D85A30]/40 text-[#2C2C2A] rounded-2xl p-4 text-right space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#D85A30] shrink-0 mt-1" />
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-[#D85A30]">
                      تفاصيل خطأ الميكروفون (err.message):
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-[#2C2C2A] break-words leading-relaxed">
                      {errorState.message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-white border border-[#E6E0D3] text-xs font-bold text-[#185FA5] cursor-pointer"
                  >
                    إعادة محاولة التسجيل 🎙️
                  </button>
                  <button
                    type="button"
                    id="btn-switch-to-text-instead"
                    onClick={() => {
                      setErrorState(null);
                      setInputMode('text');
                      setTimeout(() => {
                        const el = document.getElementById('brain-dump-textarea');
                        if (el) el.focus();
                      }, 50);
                    }}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#185FA5] text-white text-xs font-bold cursor-pointer"
                  >
                    أكتب بدلاً من الصوت ✍️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Input Mode (Shown when user chooses 'text' or clicks 'أكتب بدلاً من الصوت') */}
        {inputMode === 'text' && (
          <div className="space-y-3">
            <label
              htmlFor="brain-dump-textarea"
              className="block text-xs font-bold text-[#5C6676]"
            >
              مساحة التفريغ النصي المباشر (بالعامية المصرية):
            </label>
            <textarea
              id="brain-dump-textarea"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="جرّب تقول أو تكتب: بكرة عندي اجتماع 11، ولازم أخلص التقرير قبله، وعايز أنزل الجيم..."
              className="w-full p-3.5 rounded-2xl bg-[#F5F2EA] border border-[#E2DDD0] text-sm sm:text-base text-[#2C2C2A] leading-relaxed focus:outline-none focus:border-[#185FA5]"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setEditableTasks(null);
                  setReflectSentence(null);
                  setErrorState(null);
                }}
                className="min-h-[40px] px-3 text-xs font-semibold text-[#5C6676] hover:text-[#2C2C2A] cursor-pointer"
              >
                مسح الكلام
              </button>

              <button
                type="button"
                id="btn-organize-ai"
                onClick={() => processAudioOrTextWithAI({ textInput: text.trim() })}
                disabled={loading || !text.trim()}
                className="min-h-[46px] px-6 py-2.5 rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ثانية بجمّع اللي قلته…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#F1CC51]" />
                    <span>افهمني ورتّب خطتي</span>
                  </>
                )}
              </button>
            </div>

            {errorState && (
              <div
                role="alert"
                className="bg-[#D85A30]/10 border border-[#D85A30]/35 text-[#2C2C2A] rounded-2xl p-3.5 text-xs font-bold"
              >
                {errorState.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editable Reflect-Back Screen (شاشة المراجعة القابلة للتعديل — Reflect-back) */}
      {editableTasks && (
        <div
          id="reflect-back-panel"
          className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#185FA5]/25 shadow-sm space-y-5"
        >
          {/* Warm Egyptian Reflect Bubble */}
          <div className="flex items-start gap-3.5 bg-[#F5F2EA] p-4 rounded-2xl border border-[#E6E0D3]">
            <ZonakSmiley size={44} />
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#185FA5]">
                  مراجعة الفهم (Reflect-back) • كل سطر قابل للتعديل
                </span>
                <span className="text-[11px] font-bold bg-[#F1CC51] text-[#2C2C2A] px-2.5 py-0.5 rounded-full">
                  مهمة واحدة الأهم ⭐
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-[#2C2C2A] leading-relaxed">
                {reflectSentence}
              </p>
              {clarificationQuestion && (
                <p className="text-xs font-semibold text-[#D85A30] pt-1">
                  💡 سؤال بسيط: {clarificationQuestion}
                </p>
              )}
            </div>
          </div>

          {/* Editable Tasks List */}
          <div className="space-y-3">
            {editableTasks.map((item) => {
              const isImp = Boolean(item.isImportant);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 border transition-all space-y-3 ${
                    isImp
                      ? 'bg-[#F1CC51]/15 border-[#F1CC51]'
                      : 'bg-[#F5F2EA] border-[#E6E0D3]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetSingleImportantTask(item.id)}
                      className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isImp
                          ? 'bg-[#F1CC51] text-[#2C2C2A] shadow-2xs'
                          : 'bg-white text-[#5C6676] border border-[#E2DDD0] hover:border-[#185FA5]'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isImp ? 'fill-[#2C2C2A] text-[#2C2C2A]' : 'text-[#5C6676]'
                        }`}
                      />
                      <span>{isImp ? 'المهمة الأهم النهارده ⭐' : 'تحديد كالأهم'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteParsedTask(item.id)}
                      aria-label={`حذف ${item.title}`}
                      className="p-1.5 rounded-lg text-[#D85A30] hover:bg-[#D85A30]/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Editable Title Input */}
                  <div>
                    <label className="sr-only">عنوان المهمة</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateTaskTitle(item.id, e.target.value)}
                      className="w-full min-h-[42px] px-3.5 rounded-xl bg-white border border-[#E2DDD0] font-bold text-sm sm:text-base text-[#2C2C2A] focus:outline-none focus:border-[#185FA5]"
                    />
                  </div>

                  {/* Editable Area & Time Row */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C6676] mb-1">
                        التصنيف (Area)
                      </label>
                      <select
                        value={item.area || 'personal'}
                        onChange={(e) =>
                          handleUpdateTaskArea(item.id, e.target.value as TaskArea)
                        }
                        className="w-full min-h-[38px] px-3 rounded-xl bg-white border border-[#E2DDD0] text-xs font-bold text-[#2C2C2A] focus:outline-none focus:border-[#185FA5]"
                      >
                        <option value="work">شغل هادي (work)</option>
                        <option value="study">مذاكرة وتركيز (study)</option>
                        <option value="health">صحة ونشاط (health)</option>
                        <option value="personal">حياة وروقان (personal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C6676] mb-1">
                        الوقت المقترح
                      </label>
                      <div className="relative flex items-center">
                        <Clock className="w-3.5 h-3.5 text-[#185FA5] absolute right-3 pointer-events-none" />
                        <input
                          type="text"
                          value={item.timeLabel}
                          onChange={(e) => handleUpdateTaskTime(item.id, e.target.value)}
                          placeholder="مثلاً: 11:00 ص"
                          className="w-full min-h-[38px] pr-8 pl-3 rounded-xl bg-white border border-[#E2DDD0] text-xs font-bold text-[#2C2C2A] focus:outline-none focus:border-[#185FA5]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add another task or confirm Reflect-back */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleAddBlankParsedTask}
              className="w-full sm:w-auto min-h-[46px] px-4 rounded-full bg-[#F5F2EA] hover:bg-[#EAE5D9] text-[#2C2C2A] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#185FA5]" />
              <span>إضافة سطر كمان</span>
            </button>

            <button
              type="button"
              id="btn-confirm-reflect-tasks"
              onClick={() =>
                onAddParsedTasks(
                  editableTasks,
                  reflectSentence || 'تم حفظ خطتك الهادية بنجاح ✨'
                )
              }
              disabled={editableTasks.length === 0}
              className="w-full flex-1 min-h-[50px] rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>تمام، اعتمد الخطة دي بهدوء ✨</span>
            </button>
          </div>
        </div>
      )}

      {/* Guided Prompt & Live Egyptian Examples (Rescue when brain is blank) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm text-[#5C6676]">
          <span className="font-semibold">
            دماغك فاضية؟ اضغط على مثال حي يبدأك فوراً:
          </span>
          <RotateCcw className="w-4 h-4 text-[#185FA5]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {BRAIN_DUMP_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setText(chip.sample);
                setErrorState(null);
              }}
              className="min-h-[48px] px-4 py-3 rounded-2xl bg-white border border-[#E6E0D3] text-right text-xs sm:text-sm font-semibold text-[#2C2C2A] hover:border-[#185FA5] transition-colors flex items-center justify-between gap-2 cursor-pointer"
            >
              <span>{chip.label}</span>
              <Sparkles className="w-4 h-4 text-[#F1CC51] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
