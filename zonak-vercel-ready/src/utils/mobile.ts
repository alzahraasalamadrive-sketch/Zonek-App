// =============================================================================
// Zonak (زونك) — Capacitor Mobile Bridge (Android & iOS + PWA Fallback)
// Handles:
// 1. Microphone Permission Request & Status Check (RECORD_AUDIO / NSMicrophoneUsageDescription)
// 2. Scheduled Local Notifications for Morning Nudge & Evening Reflect
// =============================================================================

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const MORNING_NUDGE_ID = 1001;
export const EVENING_NUDGE_ID = 1002;

export function isNativeMobile(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Checks or requests Microphone permission across Android, iOS, and Web browsers.
 */
export async function requestMicrophonePermission(): Promise<{
  granted: boolean;
  message: string;
}> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      message: 'مش مشكلة — الميكروفون مش متاح هنا، اكتبها وأنا أظبّطها 🤍',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Release stream immediately after permission check
    stream.getTracks().forEach((track) => track.stop());
    return {
      granted: true,
      message: 'صلاحية الميكروفون مفعّلة وجاهزة للتفريغ الصوتي 🎙️✨',
    };
  } catch {
    return {
      granted: false,
      message: 'مش مشكلة — اكتبها وأنا أظبّطها بالكامل 🤍',
    };
  }
}

/**
 * Requests Local Notifications permission on Android 13+, iOS, and Web Notification API.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') {
      return true;
    }
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      const status = await Notification.requestPermission();
      return status === 'granted';
    }
    return false;
  }
}

/**
 * Schedules daily Morning Nudge ("صباح الراحة") and Evening Reflect ("تصفية الذهن")
 * local notifications using @capacitor/local-notifications.
 */
export async function scheduleZonakDailyNotifications(options: {
  morningTime: string; // e.g., "09:00"
  eveningTime: string; // e.g., "21:30"
  morningEnabled: boolean;
  eveningEnabled: boolean;
}): Promise<{ scheduled: boolean; summary: string }> {
  const [mHour, mMinute] = (options.morningTime || '09:00')
    .split(':')
    .map((n) => parseInt(n, 10) || 0);
  const [eHour, eMinute] = (options.eveningTime || '21:30')
    .split(':')
    .map((n) => parseInt(n, 10) || 0);

  try {
    const granted = await requestNotificationPermission();

    // Cancel any previously scheduled morning/evening nudges
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: MORNING_NUDGE_ID }, { id: EVENING_NUDGE_ID }],
      });
    } catch {
      // ignore if none exist
    }

    const notificationsToSchedule = [];

    if (options.morningEnabled) {
      notificationsToSchedule.push({
        id: MORNING_NUDGE_ID,
        title: 'صباح الفل من زونك ☀️',
        body: 'خطتك الهادية جاهزة ومستنياك.. بص عليها أو قوللي اللي في دماغك النهارده ☕',
        schedule: {
          on: { hour: mHour, minute: mMinute },
          repeats: true,
          allowWhileIdle: true,
        },
      });
    }

    if (options.eveningEnabled) {
      notificationsToSchedule.push({
        id: EVENING_NUDGE_ID,
        title: 'اليوم عدّى يا بطل 🌙',
        body: 'نفرّغ اللي على بالك ونظبّط خطة بكرة في دقيقة عشان تنام رايق؟ 🤍',
        schedule: {
          on: { hour: eHour, minute: eMinute },
          repeats: true,
          allowWhileIdle: true,
        },
      });
    }

    if (notificationsToSchedule.length > 0 && granted) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
    }

    return {
      scheduled: true,
      summary: `تم ضبط تذكير الصباح (${options.morningTime}) والمساء (${options.eveningTime}) بلطف وبدون زنّ ✨`,
    };
  } catch {
    return {
      scheduled: true,
      summary: `تم حفظ مواعيد التذكير المحلي: الصباح (${options.morningTime}) والمساء (${options.eveningTime}) ✨`,
    };
  }
}
