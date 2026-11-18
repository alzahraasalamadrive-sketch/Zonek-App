import { supabase, isSupabaseConfigured } from './supabase';

export interface BrainDumpRequest {
  text?: string;
  audioBase64?: string;
  audioMimeType?: string;
  tone?: string;
  isLowEnergy?: boolean;
  context?: 'today' | 'tomorrow';
}

export interface ParsedTaskResponseItem {
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

export interface BrainDumpResponse {
  reflect: string;
  transcript?: string;
  unclear?: boolean;
  clarificationQuestion?: string;
  tasks: ParsedTaskResponseItem[];
}

/**
 * Calls the secure Serverless / Supabase Edge Function (`parse-brain-dump`)
 * running `gemini-2.5-flash` so that NO Gemini API key ever exists in Frontend code.
 */
export async function parseEgyptianBrainDump(
  payload: BrainDumpRequest
): Promise<BrainDumpResponse> {
  // 1. If Supabase Edge Function is configured and available, try invoking it first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('parse-brain-dump', {
        body: payload,
      });
      if (!error && data && Array.isArray(data.tasks)) {
        return data as BrainDumpResponse;
      }
    } catch {
      // Fallback to our local/Vercel serverless endpoint /api/ai/parse-brain-dump
    }
  }

  // 2. Call our Serverless API endpoint (/api/ai/parse-brain-dump)
  const res = await fetch('/api/ai/parse-brain-dump', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'تعذّر تنظيم الأفكار حالياً.');
  }

  return data as BrainDumpResponse;
}
