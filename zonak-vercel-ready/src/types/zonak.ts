export type ScreenId =
  | 'onboarding'
  | 'today'
  | 'tasks'
  | 'task-detail'
  | 'brain-dump'
  | 'low-energy'
  | 'evening'
  | 'notification'
  | 'break-picker'
  | 'tone-settings'
  | 'weekly-report'
  | 'story-studio';

export type ToneStyle = 'friends' | 'direct' | 'mentor';

export type NotificationSound = 'tea_chime' | 'soft_guitar' | 'gentle_vibe';

export type EnergyLevel = 'empty' | 'half' | 'crowded';

export type EnergyDuration = 'today' | '48h' | 'until_ready';

export type StoryTheme = 'warm_sunrise' | 'calm_wave' | 'minimal';

export type TaskArea = 'work' | 'study' | 'health' | 'personal';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface ZonakUserProfile {
  id: string;
  auth_provider: 'anonymous' | 'google' | 'email' | 'apple';
  email: string | null;
  display_name: string | null;
  morning_nudge_time: string;
  streak_count: number;
  last_active_day: string;
  dumped_today: boolean;
  is_anonymous?: boolean;
}

export interface ZonakHabit {
  id: string;
  user_id: string;
  title: string;
  area: TaskArea;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'flexible';
  streak_count: number;
  created_at: string;
}

export interface MicroStep {
  id: string;
  title: string;
  hint: string;
  durationMinutes: number;
  completed: boolean;
  completedInMinutes?: number;
}

export interface ZonakTask {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryTone: 'priority' | 'done' | 'health' | 'calm';
  area?: TaskArea;
  priority?: TaskPriority;
  isImportant?: boolean;
  timeLabel: string;
  durationMinutes: number;
  completed: boolean;
  postponedToTomorrow?: boolean;
  archived?: boolean;
  encouragement: string;
  contextTags: string[];
  microSteps: MicroStep[];
  createdAt?: string;
  completedAt?: string | null;
  habitId?: string | null;
  goalId?: string | null;
}

export interface ToneSettings {
  tone: ToneStyle;
  noNagRule: boolean;
  lowEnergyAutoDetect: boolean;
  morningNudgeTime: string;
  eveningCutoffTime: string;
  sound: NotificationSound;
  quietNotificationsEnabled: boolean;
}

export interface LowEnergyState {
  active: boolean;
  level: EnergyLevel;
  duration: EnergyDuration;
  activatedAt?: string;
}

export interface WeeklyDayRhythm {
  id: string;
  dayName: string;
  moodLabel: string;
  icon: 'coffee' | 'sparkles' | 'shield' | 'brain' | 'sun' | 'heart' | 'moon';
  tint: 'amber' | 'sky' | 'peach' | 'sage';
  note: string;
}

export interface StorySticker {
  id: string;
  text: string;
  bgColor: string;
  textColor: string;
  visible: boolean;
  x: number; // percentage 0..100 inside card
  y: number; // percentage 0..100 inside card
  scale: number; // 0.65..1.6
  rotation: number; // degrees -45..45
  isCustom?: boolean;
}

export interface StoryConfig {
  theme: StoryTheme;
  showNumbers: boolean;
  showChart: boolean;
  customStickerText: string;
  customStickerColor: string;
  stickers: StorySticker[];
}

export interface BreakState {
  active: boolean;
  activityId: string;
  durationMinutes: number | null; // null means open-ended
  startedAt?: number;
}
