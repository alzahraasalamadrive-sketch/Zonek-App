// =============================================================================
// Zonak (زونك) — Supabase Edge Function: parse-brain-dump
// Model: gemini-2.5-flash (with automatic fallback to gemini-3-flash-preview / gemini-3.8-flash)
// Supports: Direct Multimodal Audio (base64 + mimeType) AND Egyptian Arabic Text
// Output: Structured JSON { reflect: string, tasks: [...] } with exactly ONE task marked important: true
// =============================================================================

import { GoogleGenAI, Type } from 'npm:@google/genai@^1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TONE_GUIDES: Record<string, string> = {
  friends:
    'استخدم لهجة مصرية دافية وقريبة زي الصاحب المقرّب (مثل: عاش يا بطل، على مهلك، خطوة بسيطة تكفي، ولا تشيل هم).',
  direct:
    'استخدم عربية مصرية/بيضاء مختصرة وهادئة ومباشرة جداً بدون مقدمات طويلة، مع احترام طاقة المستخدم.',
  mentor:
    'استخدم نبرة حكيمة وهادئة ومطمئنة تذكّر الإنسان إن قيمته أكبر من قائمة مهامه وإن الراحة استثمار.',
};

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'مفتاح GEMINI_API_KEY غير مضبوط في بيئة الخادم (Edge Function).',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const {
      text = '',
      audioBase64 = '',
      audioMimeType = 'audio/webm',
      tone = 'friends',
      isLowEnergy = false,
      context = 'today',
    } = body as {
      text?: string;
      audioBase64?: string;
      audioMimeType?: string;
      tone?: string;
      isLowEnergy?: boolean;
      context?: 'today' | 'tomorrow';
    };

    if (!text.trim() && !audioBase64) {
      return new Response(
        JSON.stringify({ error: 'من فضلك اكتب أو سجّل اللي في دماغك الأول.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const toneGuide = TONE_GUIDES[tone] || TONE_GUIDES.friends;
    const energyContext = isLowEnergy
      ? 'المستخدم حالياً في وضع طاقة منخفضة (فرهدة): اجعل المهام لطيفة جداً وقصيرة (5-10 دقائق) واقترح تأجيل أي شيء ثقيل.'
      : 'اقترح خطوات صغيرة مريحة بدون ضغط أو مبالغة في الوقت.';

    const parts: Array<Record<string, unknown>> = [];

    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: audioMimeType || 'audio/webm',
          data: audioBase64,
        },
      });
    }

    parts.push({
      text: text.trim()
        ? `رتّب التفريغ ده بالعامية المصرية لمهام بسيطة ومريحة نفسياً (${context === 'tomorrow' ? 'لخطة بكرة' : 'لخطة النهارده'}):\n"${text.trim()}"`
        : `اسمع التسجيل الصوتي ده بالعامية المصرية، افهم قصد المستخدم، وحوّله لخطة مهام بسيطة ومريحة نفسياً (${context === 'tomorrow' ? 'لخطة بكرة' : 'لخطة النهارده'}). لو الصوت فاضي أو مش واضح خالص، رجّع unclear: true وماتخترعش مهام.`,
    });

    const config = {
      systemInstruction: `أنت "زونك" (Zonak)، رفيق إنتاجية مصري دافي قائم على مبدأ "تفريغ بلا مجهود وإنجاز بلا ذنب".
${toneGuide}
${energyContext}
قواعد الفهم المصري (Egyptian NLU):
1. افهم العامية المصرية زي ما هي (مواصلات، جيم، ميتنج، كويز، "ماما قالتلي"، code-switching عربي/إنجليزي) من غير ما تصلّح لغة المستخدم لفصحى جامدة.
2. رجّع جملة reflect دافية بالعامية المصرية تبدأ بـ "فهمت إنك..." أو طمأنة لطيفة تعكس إنك سمعته وفهمته قبل ما تحفظ.
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
            description: 'جملة مصرية دافية تعكس فهم زونك للي قاله المستخدم (مثل: فهمت إن يومك فيه...)',
          },
          transcript: {
            type: Type.STRING,
            description: 'النص المسموع من الصوت إن وُجد',
          },
          unclear: {
            type: Type.BOOLEAN,
            description: 'true فقط إذا كان الصوت غير واضح إطلاقاً أو صامتاً',
          },
          clarificationQuestion: {
            type: Type.STRING,
            description: 'سؤال توضيحي واحد لطيف إذا كان هناك جزء غامض (اختياري)',
          },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'عنوان قصير وواضح بالمصري' },
                area: {
                  type: Type.STRING,
                  enum: ['work', 'study', 'health', 'personal'],
                },
                time: {
                  type: Type.STRING,
                  description: 'الوقت المقترح مثل "11:00 ص" أو "" لو مفيش',
                },
                priority: {
                  type: Type.STRING,
                  enum: ['high', 'medium', 'low'],
                },
                important: {
                  type: Type.BOOLEAN,
                  description: 'مهمة واحدة فقط في القائمة تكون true والباقي false',
                },
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

    let parsed: any = null;
    let lastErr: unknown = null;
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config,
        });
        const rawText = (response.text ?? '{}').trim();
        parsed = JSON.parse(rawText);
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!parsed) {
      throw lastErr || new Error('Failed to generate content');
    }

    // Ensure strictly ONE task has important: true if tasks exist
    if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
      let foundImportant = false;
      parsed.tasks = parsed.tasks.map((t: Record<string, unknown>) => {
        if (t.important && !foundImportant) {
          foundImportant = true;
          return { ...t, important: true };
        }
        return { ...t, important: false };
      });
      if (!foundImportant) {
        parsed.tasks[0].important = true;
      }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge Function parse-brain-dump error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'حدث خطأ أثناء تحليل التفريغ.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
