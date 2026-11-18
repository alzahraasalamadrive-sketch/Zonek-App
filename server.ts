import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { runGeminiBrainDump } from './api/ai/parse-brain-dump';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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

async function startServer() {
  const app = express();
  // Support 15MB payload for Multimodal Audio base64 uploads
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'zonak-api',
      model: 'gemini-2.5-flash',
      geminiConfigured: Boolean(
        process.env.GEMINI_API_KEY &&
          process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
      supabaseConfigured: Boolean(process.env.SUPABASE_URL),
      multimodalAudio: true,
    });
  });

  app.post('/api/ai/parse-brain-dump', async (req, res) => {
    try {
      const {
        text = '',
        audioBase64 = '',
        audioMimeType = 'audio/webm',
        tone = 'friends',
        isLowEnergy = false,
        context = 'today',
      } = req.body as {
        text?: string;
        audioBase64?: string;
        audioMimeType?: string;
        tone?: string;
        isLowEnergy?: boolean;
        context?: 'today' | 'tomorrow';
      };

      if (!text.trim() && !audioBase64) {
        return res.status(400).json({
          error: 'من فضلك اكتب أو سجّل اللي في دماغك الأول.',
        });
      }

      const result = await runGeminiBrainDump(
        {
          text,
          audioBase64,
          audioMimeType,
          tone,
          isLowEnergy,
          context,
        },
        process.env.GEMINI_API_KEY
      );

      return res.json(result);
    } catch (err) {
      console.error('Gemini parse-brain-dump error:', err);
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء تنظيم الأفكار.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/breakdown-task', async (req, res) => {
    try {
      const { title, subtitle = '', tone = 'friends' } = req.body as {
        title?: string;
        subtitle?: string;
        tone?: string;
      };

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'عنوان المهمة مطلوب لتفكيكها.' });
      }

      const ai = getGeminiClient();
      const toneGuide = TONE_GUIDES[tone] || TONE_GUIDES.friends;

      if (ai) {
        for (const modelName of CANDIDATE_MODELS) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: `فكّك المهمة دي لـ 3 أو 4 خطوات صغيرة جداً ومريحة:\nالمهمة: "${title.trim()}"\nتفاصيل إضافية: "${subtitle.trim()}"`,
              config: {
                systemInstruction: `أنت "زونك"، رفيق إنتاجية هادي. ${toneGuide}
قسّم المهمة إلى جرعات خفيفة جداً (من 3 إلى 7 دقائق للخطوة) بحيث تبدأ بسهولة بدون رهبة البداية.`,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    zonakMessage: { type: Type.STRING },
                    steps: {
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
                  required: ['zonakMessage', 'steps'],
                },
              },
            });

            const raw = (response.text ?? '{}').trim();
            const parsed = JSON.parse(raw);
            return res.json(parsed);
          } catch {
            // Try next candidate model
          }
        }
      }

      // Fallback calm breakdown if API is unreachable
      return res.json({
        zonakMessage:
          'قسمنا المهمة لـ ٣ خطوات خفيفة جداً، ابدأ بأول واحدة بس وارتاح 🤍',
        steps: [
          {
            title: `تحضير سريع لـ: ${title.trim()}`,
            hint: 'افتح أو جهّز اللي محتاجه في ٣ دقايق من غير تفكير',
            durationMinutes: 3,
          },
          {
            title: 'التركيز على أول جزء بسيط بس',
            hint: '٥ دقايق هادية تكسر رهبة البداية',
            durationMinutes: 5,
          },
          {
            title: 'تقفيل الخطوة أو أخذ استراحة',
            hint: 'عاش عليك! كمل لو رايق أو ارتاح دلوقتي',
            durationMinutes: 7,
          },
        ],
      });
    } catch (err) {
      console.error('Gemini breakdown-task error:', err);
      const message =
        err instanceof Error ? err.message : 'تعذّر تفكيك المهمة حالياً.';
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zonak server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
