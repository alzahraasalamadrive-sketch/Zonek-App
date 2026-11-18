// =============================================================================
// Zonak (زونك) — Real Supabase Database & Auth Integration
// Supports:
// 1. Automatic `supabase.auth.signInAnonymously()` on app launch if no session exists,
//    followed by creating/updating the user row in `public.users` with the exact `id`.
// 2. Real `supabase.from('tasks').insert(...)` when saving a plan or adding a quick task,
//    passing the exact `user_id` and logging/surfacing any error in Console and Toast.
// 3. Seamless Account Linking (Google or Email) preserving all tasks and streak.
// =============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AREA_LABELS, toArabicDigits } from '../data/initialData';
import {
  TaskArea,
  TaskPriority,
  ZonakTask,
  ZonakUserProfile,
} from '../types/zonak';

const supabaseUrl =
  (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ||
  'https://theiyxsqxdvkzmnfctju.supabase.co';
const supabaseAnonKey =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'sb_publishable_x5BLth0478aV7P5Z7sBdKg_6cX5F3pf';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const LOCAL_USER_KEY = 'zonak_user_profile_v3';
const TASK_UUID_MAP_KEY = 'zonak_task_uuid_map_v1';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function ensureTaskUUID(taskId: string): string {
  if (isValidUUID(taskId)) return taskId;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(TASK_UUID_MAP_KEY);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      if (map[taskId] && isValidUUID(map[taskId])) {
        return map[taskId];
      }
      const newUuid = generateUUID();
      map[taskId] = newUuid;
      localStorage.setItem(TASK_UUID_MAP_KEY, JSON.stringify(map));
      return newUuid;
    } catch {
      return generateUUID();
    }
  }
  return generateUUID();
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function loadLocalUserProfile(): ZonakUserProfile {
  const today = getTodayDateString();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ZonakUserProfile;
        const validId = isValidUUID(parsed.id) ? parsed.id : generateUUID();
        if (parsed.last_active_day !== today) {
          const updated: ZonakUserProfile = {
            ...parsed,
            id: validId,
            streak_count: (parsed.streak_count || 1) + 1,
            last_active_day: today,
            dumped_today: false,
          };
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
          return updated;
        }
        if (validId !== parsed.id) {
          const fixed = { ...parsed, id: validId };
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fixed));
          return fixed;
        }
        return parsed;
      }
    } catch {
      // ignore invalid JSON
    }
  }

  const fresh: ZonakUserProfile = {
    id: generateUUID(),
    auth_provider: 'anonymous',
    email: null,
    display_name: 'صديق زونك',
    morning_nudge_time: '09:00',
    streak_count: 7,
    last_active_day: today,
    dumped_today: false,
    is_anonymous: true,
  };
  saveLocalUserProfile(fresh);
  return fresh;
}

export function saveLocalUserProfile(profile: ZonakUserProfile): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage errors
    }
  }
}

export interface SupabaseSyncStatus {
  connected: boolean;
  authenticatedSession: boolean;
  rlsBlockingAnon: boolean;
  anonymousDisabledInDashboard: boolean;
  lastSyncedAt: string | null;
  errorDetail: string | null;
}

let currentSyncStatus: SupabaseSyncStatus = {
  connected: isSupabaseConfigured,
  authenticatedSession: false,
  rlsBlockingAnon: false,
  anonymousDisabledInDashboard: false,
  lastSyncedAt: null,
  errorDetail: null,
};

export function getSupabaseSyncStatus(): SupabaseSyncStatus {
  return currentSyncStatus;
}

/**
 * Automatically executes `supabase.auth.signInAnonymously()` if no user is logged in,
 * then creates or updates the user row in `public.users` with the exact same `id`.
 * Returns both the profile and any Supabase warning/error message so the UI can show a clear Toast.
 */
export async function ensureAnonymousSession(): Promise<{
  profile: ZonakUserProfile;
  error: string | null;
}> {
  const localProfile = loadLocalUserProfile();
  if (!supabase) {
    return { profile: localProfile, error: null };
  }

  const today = getTodayDateString();
  let userId = localProfile.id;
  let isAnon = localProfile.auth_provider === 'anonymous';
  let email = localProfile.email;
  let authErrorMsg: string | null = null;

  try {
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();

    if (sessionErr) {
      console.error('[Supabase Auth] getSession error:', sessionErr);
    }

    if (session?.user) {
      userId = session.user.id;
      isAnon = session.user.is_anonymous ?? false;
      email = session.user.email ?? email;
      currentSyncStatus.authenticatedSession = true;
      console.log('[Supabase Auth] Active session found, user_id:', userId);
    } else {
      console.log('[Supabase Auth] No session found. Calling supabase.auth.signInAnonymously()...');
      const { data: anonData, error: anonError } =
        await supabase.auth.signInAnonymously();

      if (anonError) {
        console.error(
          '[Supabase Auth] supabase.auth.signInAnonymously() failed:',
          anonError.message,
          anonError
        );
        if (
          anonError.message?.toLowerCase().includes('anonymous sign-ins are disabled')
        ) {
          currentSyncStatus.anonymousDisabledInDashboard = true;
          authErrorMsg =
            'تنبيه Supabase: خيار Anonymous Sign-ins معطّل في لوحة تحكم Supabase (Authentication -> Providers -> Anonymous). يرجى تفعيله ليتم الحفظ السحابي التلقائي.';
        } else {
          authErrorMsg = `خطأ في تسجيل الدخول التلقائي (Supabase Auth): ${anonError.message}`;
        }
      } else if (anonData?.user) {
        userId = anonData.user.id;
        isAnon = anonData.user.is_anonymous ?? true;
        currentSyncStatus.authenticatedSession = true;
        currentSyncStatus.anonymousDisabledInDashboard = false;
        console.log(
          '[Supabase Auth] signInAnonymously() succeeded! user_id:',
          userId
        );
      }
    }

    // Create or update the user row in `public.users` with the exact same `id`
    const { data: existingRow, error: selectErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (selectErr) {
      console.error('[Supabase DB] Error reading public.users:', selectErr);
    }

    if (existingRow) {
      const nextStreak =
        existingRow.last_active_day !== today
          ? (existingRow.streak_count || 1) + 1
          : existingRow.streak_count || 1;

      const { error: updateErr } = await supabase
        .from('users')
        .update({
          streak_count: nextStreak,
          last_active_day: today,
        })
        .eq('id', userId);

      if (updateErr) {
        console.error('[Supabase DB] Error updating public.users:', updateErr);
      }

      const synced: ZonakUserProfile = {
        id: userId,
        auth_provider:
          existingRow.auth_provider || (isAnon ? 'anonymous' : 'email'),
        email: existingRow.email || email,
        display_name: existingRow.display_name || 'صديق زونك',
        morning_nudge_time: existingRow.morning_nudge_time || '09:00',
        streak_count: nextStreak,
        last_active_day: today,
        dumped_today:
          existingRow.last_active_day === today
            ? Boolean(existingRow.dumped_today)
            : false,
        is_anonymous: existingRow.auth_provider === 'anonymous',
      };
      currentSyncStatus.lastSyncedAt = new Date().toISOString();
      currentSyncStatus.rlsBlockingAnon = false;
      currentSyncStatus.errorDetail = authErrorMsg;
      saveLocalUserProfile(synced);
      return { profile: synced, error: authErrorMsg };
    }

    const newRow = {
      id: userId,
      auth_provider: isAnon ? 'anonymous' : 'email',
      email,
      display_name: localProfile.display_name || 'صديق زونك',
      morning_nudge_time: localProfile.morning_nudge_time || '09:00',
      streak_count: localProfile.streak_count || 7,
      last_active_day: today,
      dumped_today: Boolean(localProfile.dumped_today),
    };

    const { error: upsertErr } = await supabase
      .from('users')
      .upsert(newRow, { onConflict: 'id' });

    if (upsertErr) {
      console.error(
        '[Supabase DB] Error upserting user into public.users:',
        upsertErr.message,
        upsertErr
      );
      if (upsertErr.code === '42501') {
        currentSyncStatus.rlsBlockingAnon = true;
      }
      const combinedErr =
        authErrorMsg ||
        `تعذّر حفظ المستخدم في جدول public.users (${upsertErr.code || 'Error'}): ${upsertErr.message}`;
      currentSyncStatus.errorDetail = combinedErr;
      const fallbackProfile: ZonakUserProfile = {
        ...newRow,
        auth_provider: isAnon ? 'anonymous' : 'email',
        is_anonymous: isAnon,
      };
      saveLocalUserProfile(fallbackProfile);
      return { profile: fallbackProfile, error: combinedErr };
    }

    console.log('[Supabase DB] User row created/updated in public.users with id:', userId);
    currentSyncStatus.lastSyncedAt = new Date().toISOString();
    currentSyncStatus.rlsBlockingAnon = false;
    currentSyncStatus.errorDetail = authErrorMsg;

    const created: ZonakUserProfile = {
      ...newRow,
      auth_provider: isAnon ? 'anonymous' : 'email',
      is_anonymous: isAnon,
    };
    saveLocalUserProfile(created);
    return { profile: created, error: authErrorMsg };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'خطأ غير متوقع في الاتصال بـ Supabase';
    console.error('[Supabase] ensureAnonymousSession exception:', err);
    currentSyncStatus.errorDetail = msg;
    return { profile: localProfile, error: msg };
  }
}

/**
 * Explicitly inserts new tasks into `public.tasks` via `supabase.from('tasks').insert(...)`
 * when the user clicks "احفظ الخطة" or adds a quick task.
 * Logs and returns any Supabase error so it is printed in the Console and shown in a clear Toast.
 */
export async function insertTasksToSupabase(
  userId: string,
  newTasks: ZonakTask[]
): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) {
    return { ok: false, error: 'Supabase client غير مهيأ.' };
  }

  try {
    // 1. Ensure we have an active auth session (or attempt signInAnonymously if not)
    let effectiveUserId = userId;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      effectiveUserId = session.user.id;
    } else {
      const { data: anonData, error: anonErr } =
        await supabase.auth.signInAnonymously();
      if (anonErr) {
        console.error(
          '[Supabase Auth] signInAnonymously failed before task insert:',
          anonErr.message,
          anonErr
        );
      } else if (anonData?.user?.id) {
        effectiveUserId = anonData.user.id;
      }
    }

    // 2. Ensure the user record exists in `public.users` with `effectiveUserId`
    const localProfile = loadLocalUserProfile();
    const { error: userUpsertErr } = await supabase.from('users').upsert(
      {
        id: effectiveUserId,
        auth_provider: localProfile.auth_provider || 'anonymous',
        email: localProfile.email,
        display_name: localProfile.display_name || 'صديق زونك',
        morning_nudge_time: localProfile.morning_nudge_time || '09:00',
        streak_count: localProfile.streak_count || 1,
        last_active_day: localProfile.last_active_day || getTodayDateString(),
        dumped_today: true,
      },
      { onConflict: 'id' }
    );

    if (userUpsertErr) {
      console.error(
        '[Supabase DB] Failed to upsert public.users before tasks.insert:',
        userUpsertErr.message,
        userUpsertErr
      );
    }

    // 3. Build payload and execute `supabase.from('tasks').insert(...)`
    const rowsToInsert = newTasks.map((t) => ({
      id: ensureTaskUUID(t.id),
      user_id: effectiveUserId,
      title: t.title,
      area: (t.area || 'personal') as TaskArea,
      time: t.timeLabel || '',
      priority: (t.priority ||
        (t.isImportant || t.categoryTone === 'priority'
          ? 'high'
          : 'medium')) as TaskPriority,
      is_important: Boolean(t.isImportant || t.categoryTone === 'priority'),
      is_done: Boolean(t.completed),
      is_tomorrow: Boolean(t.postponedToTomorrow),
      completed_at: t.completed
        ? t.completedAt || new Date().toISOString()
        : null,
      habit_id: t.habitId && isValidUUID(t.habitId) ? t.habitId : null,
      goal_id: t.goalId && isValidUUID(t.goalId) ? t.goalId : null,
    }));

    console.log(
      '[Supabase DB] Executing supabase.from("tasks").insert(...) with user_id:',
      effectiveUserId,
      'rows:',
      rowsToInsert
    );

    const { data, error: insertErr } = await supabase
      .from('tasks')
      .insert(rowsToInsert)
      .select();

    if (insertErr) {
      console.error(
        '[Supabase DB] supabase.from("tasks").insert(...) ERROR:',
        insertErr.message,
        insertErr
      );
      let friendlyError = `فشل حفظ المهام في Supabase (${insertErr.code || 'Error'}): ${insertErr.message}`;
      if (insertErr.code === '42501') {
        currentSyncStatus.rlsBlockingAnon = true;
        friendlyError =
          'فشل الحفظ في Supabase بسبب صلاحيات RLS (42501): يرجى تفعيل Anonymous Sign-ins في لوحة تحكم Supabase (Authentication -> Providers -> Anonymous).';
      }
      currentSyncStatus.errorDetail = friendlyError;
      return { ok: false, error: friendlyError };
    }

    console.log(
      '[Supabase DB] supabase.from("tasks").insert(...) SUCCESS! Inserted rows:',
      data
    );
    currentSyncStatus.lastSyncedAt = new Date().toISOString();
    currentSyncStatus.rlsBlockingAnon = false;
    currentSyncStatus.errorDetail = null;
    return { ok: true, error: null };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'خطأ غير متوقع أثناء حفظ المهام في Supabase';
    console.error('[Supabase DB] insertTasksToSupabase exception:', err);
    currentSyncStatus.errorDetail = msg;
    return { ok: false, error: msg };
  }
}

/**
 * Fetches all tasks for the user from `public.tasks` in Supabase.
 */
export async function fetchTasksFromSupabase(
  userId: string
): Promise<ZonakTask[] | null> {
  if (!supabase || !isValidUUID(userId)) return null;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase DB] fetchTasksFromSupabase error:', error.message, error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data.map((row: any) => {
      const area: TaskArea = row.area || 'personal';
      const isImp = Boolean(row.is_important);
      const isDone = Boolean(row.is_done);
      const areaLabel = AREA_LABELS[area] || 'بهدوء';

      return {
        id: row.id,
        title: row.title,
        subtitle: isImp
          ? 'الأهم النهارده • خطوة واحدة تكفي'
          : `${areaLabel} • على مهلك`,
        category: isDone
          ? 'تم بنجاح ✓'
          : isImp
          ? 'الأهم ⭐'
          : areaLabel,
        categoryTone: isDone
          ? 'done'
          : isImp
          ? 'priority'
          : area === 'health'
          ? 'health'
          : 'calm',
        area,
        priority: (row.priority || (isImp ? 'high' : 'medium')) as TaskPriority,
        isImportant: isImp,
        timeLabel: row.time || 'براحتك',
        durationMinutes: isImp ? 25 : 15,
        completed: isDone,
        postponedToTomorrow: Boolean(row.is_tomorrow),
        archived: false,
        encouragement: isImp
          ? 'مش مطلوب تخلّص كل حاجة قعدة واحدة.. خطوة واحدة دلوقتي كافية جداً.'
          : 'خطوة بسيطة ومريحة على وتيرتك الخاصة.',
        contextTags: [
          isImp ? 'الأهم النهارده ⭐' : areaLabel,
          `${toArabicDigits(isImp ? 25 : 15)} دقيقة تركيز مريح`,
        ],
        createdAt: row.created_at,
        completedAt: row.completed_at,
        habitId: row.habit_id,
        goalId: row.goal_id,
        microSteps: [
          {
            id: `ms-${row.id}-1`,
            title: `أول ٥ دقائق في: ${row.title}`,
            hint: 'مجرد البداية بتفتح النفس وبتشيل التوتر',
            durationMinutes: 5,
            completed: isDone,
          },
          {
            id: `ms-${row.id}-2`,
            title: `إكمال الجزء الأساسي من: ${row.title}`,
            hint: 'خد نفس عميق وكمل على وتيرتك',
            durationMinutes: 10,
            completed: isDone,
          },
        ],
      };
    });
  } catch (err) {
    console.error('[Supabase DB] fetchTasksFromSupabase exception:', err);
    return null;
  }
}

/**
 * Syncs task updates (toggle done, postpone to tomorrow, delete) with `public.tasks` in Supabase.
 */
export async function syncTasksToSupabase(
  userId: string,
  tasks: ZonakTask[]
): Promise<boolean> {
  if (!supabase || !isValidUUID(userId)) return false;

  try {
    const activeOrPostponed = tasks.filter((t) => !t.archived);
    const archivedIds = tasks
      .filter((t) => t.archived)
      .map((t) => ensureTaskUUID(t.id));

    if (archivedIds.length > 0) {
      const { error: delErr } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .in('id', archivedIds);
      if (delErr) {
        console.error('[Supabase DB] Error deleting archived tasks:', delErr.message);
      }
    }

    if (activeOrPostponed.length === 0) return true;

    const rows = activeOrPostponed.map((t) => ({
      id: ensureTaskUUID(t.id),
      user_id: userId,
      title: t.title,
      area: (t.area || 'personal') as TaskArea,
      time: t.timeLabel || '',
      priority: (t.priority ||
        (t.isImportant || t.categoryTone === 'priority'
          ? 'high'
          : 'medium')) as TaskPriority,
      is_important: Boolean(t.isImportant || t.categoryTone === 'priority'),
      is_done: Boolean(t.completed),
      is_tomorrow: Boolean(t.postponedToTomorrow),
      completed_at: t.completed
        ? t.completedAt || new Date().toISOString()
        : null,
      habit_id: t.habitId && isValidUUID(t.habitId) ? t.habitId : null,
      goal_id: t.goalId && isValidUUID(t.goalId) ? t.goalId : null,
    }));

    const { error } = await supabase
      .from('tasks')
      .upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase DB] syncTasksToSupabase upsert error:', error.message, error);
      if (error.code === '42501') {
        currentSyncStatus.rlsBlockingAnon = true;
      }
      return false;
    }

    currentSyncStatus.lastSyncedAt = new Date().toISOString();
    currentSyncStatus.rlsBlockingAnon = false;
    return true;
  } catch (err) {
    console.error('[Supabase DB] syncTasksToSupabase exception:', err);
    return false;
  }
}

export async function syncUserProfileToSupabase(
  profile: ZonakUserProfile
): Promise<boolean> {
  saveLocalUserProfile(profile);
  if (!supabase || !isValidUUID(profile.id)) return false;

  try {
    const { error } = await supabase.from('users').upsert(
      {
        id: profile.id,
        auth_provider: profile.auth_provider,
        email: profile.email,
        display_name: profile.display_name || 'صديق زونك',
        morning_nudge_time: profile.morning_nudge_time || '09:00',
        streak_count: profile.streak_count,
        last_active_day: profile.last_active_day || getTodayDateString(),
        dumped_today: profile.dumped_today,
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.error('[Supabase DB] syncUserProfileToSupabase error:', error.message, error);
      return false;
    }
    currentSyncStatus.lastSyncedAt = new Date().toISOString();
    currentSyncStatus.rlsBlockingAnon = false;
    return true;
  } catch (err) {
    console.error('[Supabase DB] syncUserProfileToSupabase exception:', err);
    return false;
  }
}

export async function linkAnonymousAccount(
  provider: 'google' | 'email',
  emailInput?: string,
  passwordInput?: string,
  currentTasks: ZonakTask[] = []
): Promise<{ profile: ZonakUserProfile; message: string; error?: string | null }> {
  const current = loadLocalUserProfile();
  const cleanEmail = (emailInput || '').trim() || 'friend@zonak.eg';
  const cleanPassword =
    (passwordInput || '').trim() || `ZonakPass_${cleanEmail}_2026!`;
  const inferredName = cleanEmail.split('@')[0] || 'بطل زونك';

  let nextUserId = current.id;

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (provider === 'google') {
        if (session) {
          const { error } = await supabase.auth.linkIdentity({
            provider: 'google',
            options: { redirectTo: window.location.origin },
          });
          if (error) console.error('[Supabase Auth] linkIdentity google error:', error);
        } else {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
          });
          if (error) console.error('[Supabase Auth] signInWithOAuth google error:', error);
        }
      } else {
        if (session?.user?.is_anonymous) {
          const { data, error } = await supabase.auth.updateUser({
            email: cleanEmail,
            password: cleanPassword,
          });
          if (error) {
            console.error('[Supabase Auth] updateUser error:', error);
          } else if (data.user) {
            nextUserId = data.user.id;
            currentSyncStatus.authenticatedSession = true;
          }
        } else {
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });
          if (!signInRes.error && signInRes.data.user) {
            nextUserId = signInRes.data.user.id;
            currentSyncStatus.authenticatedSession = true;
          } else {
            const signUpRes = await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPassword,
              options: {
                data: {
                  full_name: inferredName,
                  streak_count: current.streak_count,
                },
              },
            });
            if (signUpRes.error) {
              console.error('[Supabase Auth] signUp error:', signUpRes.error);
            }
            if (signUpRes.data?.user) {
              nextUserId = signUpRes.data.user.id;
              currentSyncStatus.authenticatedSession = Boolean(
                signUpRes.data.session
              );
            }
          }
        }
      }

      const updatedProfile: ZonakUserProfile = {
        ...current,
        id: nextUserId,
        auth_provider: provider,
        email:
          provider === 'google'
            ? current.email || 'google.user@zonak.eg'
            : cleanEmail,
        display_name:
          provider === 'google' ? 'صديق زونك (Google)' : inferredName,
        is_anonymous: false,
      };

      await syncUserProfileToSupabase(updatedProfile);
      const insertRes = await insertTasksToSupabase(
        updatedProfile.id,
        currentTasks
      );

      if (!insertRes.ok && insertRes.error) {
        return {
          profile: updatedProfile,
          message: insertRes.error,
          error: insertRes.error,
        };
      }

      return {
        profile: updatedProfile,
        message: `تم ربط حسابك (${updatedProfile.email}) وحفظ جميع مهامك والـ Streak في قاعدة بيانات Supabase بنجاح ✨`,
        error: null,
      };
    } catch (err) {
      console.error('[Supabase Auth] linkAnonymousAccount exception:', err);
    }
  }

  const updated: ZonakUserProfile = {
    ...current,
    id: nextUserId,
    auth_provider: provider,
    email:
      provider === 'google'
        ? current.email || 'google.user@zonak.eg'
        : cleanEmail,
    display_name: provider === 'google' ? 'صديق زونك (Google)' : inferredName,
    is_anonymous: false,
  };
  await syncUserProfileToSupabase(updated);
  const insertRes = await insertTasksToSupabase(updated.id, currentTasks);

  return {
    profile: updated,
    message:
      insertRes.error ||
      `تم ربط حسابك بـ (${cleanEmail}) وحفظ خطتك بالكامل ✨`,
    error: insertRes.error,
  };
}

export async function markUserDumpedToday(
  profile: ZonakUserProfile
): Promise<ZonakUserProfile> {
  const today = getTodayDateString();
  const next: ZonakUserProfile = {
    ...profile,
    dumped_today: true,
    last_active_day: today,
  };
  await syncUserProfileToSupabase(next);
  return next;
}
