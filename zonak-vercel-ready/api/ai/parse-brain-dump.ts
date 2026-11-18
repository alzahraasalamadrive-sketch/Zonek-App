// =============================================================================
// Zonak (زونك) — Vercel / Netlify Serverless Function: /api/ai/parse-brain-dump
// Model: gemini-2.5-flash (with automatic fallback to gemini-3-flash-preview / gemini-3.8-flash)
// Keeps GEMINI_API_KEY strictly on the server (never exposed in Frontend bundle)
// =============================================================================

import { GoogleGenAI, Type } from '@google/genai';

const TONE_GUIDES: Record<string, string> = {
  friends:
    'استخدم لهجة مصرية دافية وقريبة زي الصاحب المقرّب (مثل: عاش يا بطل، على مهلك، خطوة بسيطة تكفي، ولا تشيل هم).',
  direct:
    'استخدم عربية مصرية/بيضاء مختصرة وهادئة ومباشرة جداً بدون مقدمات طويلة، مع احترام طاقة المستخدم.',
  mentor:
    'استخدم نبرة حكيمة وهادئة ومطمئنة تذكّر الإنسان إن قيمته أكبر من قائمة مهامه وإن الراحة استثمار.',
};

export interface BrainDumpInput {
  text?: string;
  audioBase64?: string;
  audioMimeType?: string;
  tone?: string;
  isLowEnergy?: boolean;
  context?: 'today' | 'tomorrow';
}

export interface ParsedTaskItem {
  title: string;
  area: 'work' | 'study' | 'health' | 'personal';
  time: string;
  priority: 'high' | 'medium' | 'low';
  important: boolean;
  subtitle?: string;
  durationMinutes?: number;
  encouragement?: string;
  microSteps?: Array<{
    title: string;
    hint: string;
    durationMinutes: number;
  }>;
}

export interface BrainDumpResult {
  reflect: string;
  transcript?: string;
  unclear?: boolean;
  clarificationQuestion?: string;
  tasks: ParsedTaskItem[];
}

export function fallbackEgyptianNLU(input: BrainDumpInput): BrainDumpResult {
  const rawText = (input.text || '').trim();
  const segments = rawText
    ? rawText
        .split(
          /(?:،|,|\n| و(?=\s*(?:عايز|لازم|عندي|محتاج|هروح|هنزل|أخلص|اخلص|أكلم|اكلم|أذاكر|اذاكر|أجيب|اجيب)))/g
        )
        .map((s) => s.trim())
        .filter((s) => s.length > 2)
    : ['مراجعة خطة اليوم بهدوء'];

  const inferArea = (s: string): 'work' | 'study' | 'health' | 'personal' => {
    if (/(شغل|تقرير|اجتماع|ميتنج|إيميل|ايميل|عميل|مشروع|فريق|مدير)/.test(s))
      return 'work';
    if (/(مذاكرة|درس|امتحان|كورس|محاضرة|كتاب|كويز|جامعة)/.test(s)) return 'study';
    if (/(جيم|رياضة|مشي|تمرين|دكتور|دواء|صحة|مياه|نوم)/.test(s)) return 'health';
    return 'personal';
  };

  const inferTime = (s: string): string => {
    const timeMatch = s.match(
      /(\d+|١|٢|٣|٤|٥|٦|٧|٨|٩|١٠|١١|١٢)\s*(?:الصبح|ص|صباحاً|م|مساءً|بليل|العصر|الضهر)?/
    );
    if (timeMatch && /(الساعة|ساعة|ص|م|الصبح|بليل|اجتماع|ميتنج)/.test(s)) {
      const num = timeMatch[1];
      const isPm = /(م|مساء|بليل|العصر)/.test(s);
      return `${num}:00 ${isPm ? 'م' : 'ص'}`;
    }
    return '';
  };

  const tasks: ParsedTaskItem[] = segments.slice(0, 5).map((seg, idx) => {
    const area = inferArea(seg);
    const time = inferTime(seg);
    const cleanTitle =
      seg.replace(/^(بكرة|النهارده|عايز|لازم|محتاج|عندي)\s+/i, '').trim() || seg;

    return {
      title: cleanTitle,
      area,
      time,
      priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
      important: idx === 0,
      subtitle:
        area === 'work'
          ? 'شغل هادي • خطوة بخطوة من غير ضغط'
          : area === 'study'
          ? 'تركيز خفيف • على مهلك'
          : area === 'health'
          ? 'صحة ونشاط • لو تعبان مشي خفيف يكفي'
          : 'مشوار/حاجة شخصية • بروقان',
      durationMinutes: idx === 0 ? 25 : 15,
      encouragement:
        idx === 0
          ? 'دي أهم خطوة النهارده.. ابدأ بأول ٥ دقايق بس والباقي هييجي لوحده.'
          : 'خطوة بسيطة ومريحة، خلّصها وقت ما تروق.',
      microSteps: [
        {
          title: `تحضير سريع وبداية أول ٥ دقائق في: ${cleanTitle}`,
          hint: 'مجرد البداية بتكسر الرهبة وتفتح النفس',
          durationMinutes: 5,
        },
        {
          title: `إنجاز الجزء الأساسي من: ${cleanTitle}`,
          hint: 'على وتيرتك الخاصة وبدون استعجال',
          durationMinutes: 15,
        },
      ],
    };
  });

  const mainTaskTitle = tasks[0]?.title || 'ترتيب يومك';
  return {
    reflect: `فهمت إنك ناوي تركز على «${mainTaskTitle}» مع ${
      tasks.length > 1
        ? `${tasks.length - 1} حاجات تانية خفيفة`
        : 'روقان باقي اليوم'
    }.. رتبتهم لك بهدوء وحددت لك أهم مهمة تبدأ بيها من غير أي ضغط 🤍`,
    transcript: rawText || undefined,
    unclear: false,
    tasks,
  };
}

const CANDIDATE_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
];

export async function runGeminiBrainDump(
  input: BrainDumpInput,
  apiKey?: string
): Promise<BrainDumpResult> {
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return fallbackEgyptianNLU(input);
  }

  const ai = new GoogleGenAI({ apiKey });
  const toneGuide = TONE_GUIDES[input.tone || 'friends'] || TONE_GUIDES.friends;
  const energyContext = input.isLowEnergy
    ? 'المستخدم حالياً في وضع طاقة منخفضة (فرهدة): اجعل المهام لطيفة جداً وقصيرة (5-10 دقائق) واقترح تأجيل أي شيء ثقيل.'
    : 'اقترح خطوات صغيرة مريحة بدون ضغط أو مبالغة في الوقت.';

  const parts: Array<Record<string, unknown>> = [];
  if (input.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: input.audioMimeType || 'audio/webm',
        data: input.audioBase64,
      },
    });
  }

  const textPrompt = (input.text || '').trim();
  parts.push({
    text: textPrompt
      ? `رتّب التفريغ ده بالعامية المصرية لمهام بسيطة ومريحة نفسياً (${
          input.context === 'tomorrow' ? 'لخطة بكرة' : 'لخطة النهارده'
        }):\n"${textPrompt}"`
      : `اسمع التسجيل الصوتي ده بالعامية المصرية، افهم قصد المستخدم، وحوّله لخطة مهام بسيطة ومريحة نفسياً (${
          input.context === 'tomorrow' ? 'لخطة بكرة' : 'لخطة النهارده'
        }). لو الصوت فاضي أو مش واضح خالص، رجّع unclear: true وماتخترعش مهام.`,
  });

  const generationConfig = {
    systemInstruction: `أنت "زونك" (Zonak)، رفيق إنتاجية مصري دافي قائم على مبدأ "تفريغ بلا مجهود وإنجاز بلا ذنب".
${toneGuide}
${energyContext}
قواعد الفهم المصري (Egyptian NLU):
1. افهم العامية المصرية زي ما هي (مواصلات، جيم، ميتنج، كويز، "ماما قالتلي"، code-switching عربي/إنجليزي) من غير ما تصلّح لغة المستخدم لفصحى جامدة.
2. رجّع جملة reflect دافية بالعامية المصرية تبدأ بـ "فهمت إنك..." تعكس إنك سمعته وفهمته قبل ما تحفظ.
3. استخرج من 1 إلى 5 مهام مهضومة وواضحة.
4. مهم جداً: حدّد مهمة واحدة فقط كـ important: true (الأهم النهارده)، وباقي المهام important: false.
5. صنّف كل مهمة في area واحدة من: work | study | health | personal.
6. حدد priority لكل مهمة: high | medium | low.
7. لو الصوت أو الكلام مش مفهوم أو فاضي، خلّي unclear: true و tasks مصفوفة فاضية وماتخترعش مهام.`,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        reflect: {
          type: Type.STRING,
          description:
            'جملة مصرية دافية تبدأ بـ "فهمت إن..." تعكس فهم زونك للتفريغ',
        },
        transcript: {
          type: Type.STRING,
          description: 'النص المسموع من الصوت إن وُجد',
        },
        unclear: {
          type: Type.BOOLEAN,
          description:
            'true فقط إذا كان الصوت غير واضح إطلاقاً أو صامتاً',
        },
        clarificationQuestion: {
          type: Type.STRING,
          description: 'سؤال توضيحي واحد لطيف إذا كان هناك جزء غامض',
        },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              area: {
                type: Type.STRING,
                enum: ['work', 'study', 'health', 'personal'],
              },
              time: { type: Type.STRING },
              priority: {
                type: Type.STRING,
                enum: ['high', 'medium', 'low'],
              },
              important: { type: Type.BOOLEAN },
              subtitle: { type: Type.STRING },
              durationMinutes: { type: Type.INTEGER },
              encouragement: { type: Type.STRING },
              microSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    hint: { type: Type.STRING },
                    durationMinutes: { type: Type.INTEGER },
                  },
                  required: ['title', 'hint', 'durationMinutes'],
                },
              },
            },
            required: ['title', 'area', 'time', 'priority', 'important'],
          },
        },
      },
      required: ['reflect', 'tasks'],
    },
  };

  let lastError: unknown = null;
  for (const modelName of CANDIDATE_GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts }],
        config: generationConfig,
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw) as BrainDumpResult;

      // Enforce strictly ONE task with important: true
      if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
        let hasImportant = false;
        parsed.tasks = parsed.tasks.map((t) => {
          if (t.important && !hasImportant) {
            hasImportant = true;
            return { ...t, important: true };
          }
          return { ...t, important: false };
        });
        if (!hasImportant) {
          parsed.tasks[0].important = true;
        }
      }

      return parsed;
    } catch (err) {
      lastError = err;
    }
  }

  console.warn('All Gemini models failed, using fallback Egyptian NLU:', lastError);
  return fallbackEgyptianNLU(input);
}

// Vercel / Next.js Serverless handler export
export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const result = await runGeminiBrainDump(
      req.body,
      process.env.GEMINI_API_KEY
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error('Serverless parse-brain-dump error:', err);
    return res.status(500).json({
      error:
        err instanceof Error ? err.message : 'حدث خطأ أثناء تنظيم الأفكار.',
    });
  }
}
