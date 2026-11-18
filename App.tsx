import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BatteryLow,
  Camera,
  Coffee,
  ListChecks,
  Mic,
  Moon,
  Smile,
  Sparkles,
  Sun,
} from 'lucide-react';
import {
  EnergyDuration,
  EnergyLevel,
  LowEnergyState,
  MicroStep,
  ScreenId,
  ToneSettings,
  ZonakTask,
  ZonakUserProfile,
} from './types/zonak';
import {
  DEFAULT_TONE_SETTINGS,
  INITIAL_TASKS,
  TONE_PRESETS,
  toArabicDigits,
} from './data/initialData';
import { ZonakLogoMark, ZonakSmiley } from './components/ZonakArt';
import { OnboardingView } from './components/OnboardingView';
import { TodayView } from './components/TodayView';
import { TaskDetailView } from './components/TaskDetailView';
import { BrainDumpView } from './components/BrainDumpView';
import { LowEnergyView } from './components/LowEnergyView';
import { EveningWindDownView } from './components/EveningWindDownView';
import { GentleNotificationView } from './components/GentleNotificationView';
import { BreakPickerView } from './components/BreakPickerView';
import { ToneSettingsView } from './components/ToneSettingsView';
import { WeeklyReportView } from './components/WeeklyReportView';
import { StoryStudioView } from './components/StoryStudioView';
import { TasksHubView } from './components/TasksHubView';
import { playNotificationSound } from './utils/audio';
import {
  ensureAnonymousSession,
  fetchTasksFromSupabase,
  generateUUID,
  insertTasksToSupabase,
  linkAnonymousAccount,
  loadLocalUserProfile,
  markUserDumpedToday,
  syncTasksToSupabase,
  syncUserProfileToSupabase,
} from './lib/supabase';

const STORAGE_KEY = 'zonak_app_state_v1';

interface PersistedState {
  tasks: ZonakTask[];
  toneSettings: ToneSettings;
  lowEnergy: LowEnergyState;
  restMinutesEarned: number;
  calmStreakDays: number;
}

function loadInitialState(): PersistedState {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        return {
          tasks:
            Array.isArray(parsed.tasks) && parsed.tasks.length > 0
              ? parsed.tasks
              : INITIAL_TASKS,
          toneSettings: { ...DEFAULT_TONE_SETTINGS, ...parsed.toneSettings },
          lowEnergy: parsed.lowEnergy ?? {
            active: false,
            level: 'empty',
            duration: 'today',
          },
          restMinutesEarned: parsed.restMinutesEarned ?? 14 * 60,
          calmStreakDays: parsed.calmStreakDays ?? 7,
        };
      }
    } catch {
      // ignore invalid storage
    }
  }
  return {
    tasks: INITIAL_TASKS,
    toneSettings: DEFAULT_TONE_SETTINGS,
    lowEnergy: { active: false, level: 'empty', duration: 'today' },
    restMinutesEarned: 14 * 60,
    calmStreakDays: 7,
  };
}

export function App() {
  const [initial] = useState<PersistedState>(() => loadInitialState());
  const [tasks, setTasks] = useState<ZonakTask[]>(initial.tasks);
  const [toneSettings, setToneSettings] = useState<ToneSettings>(
    initial.toneSettings
  );
  const [lowEnergy, setLowEnergy] = useState<LowEnergyState>(initial.lowEnergy);
  const [restMinutesEarned, setRestMinutesEarned] = useState<number>(
    initial.restMinutesEarned
  );
  const [calmStreakDays, setCalmStreakDays] = useState<number>(
    initial.calmStreakDays
  );
  const [userProfile, setUserProfile] = useState<ZonakUserProfile>(() =>
    loadLocalUserProfile()
  );

  const [screen, setScreen] = useState<ScreenId>('today');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initial.tasks[0]?.id ?? 'task-weekly-report'
  );
  const [notificationTaskTitle, setNotificationTaskTitle] = useState<string>(
    'تخلّص تقرير الشغل الأسبوعي'
  );
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 5200);
  };

  // Initialize Supabase Session (signInAnonymously) & upsert user row in public.users
  useEffect(() => {
    ensureAnonymousSession().then(async ({ profile, error }) => {
      setUserProfile(profile);
      if (profile.streak_count) {
        setCalmStreakDays(profile.streak_count);
      }
      if (error) {
        console.error('[Zonak App] Supabase initial session warning/error:', error);
        showToast(error);
      }
      const remoteTasks = await fetchTasksFromSupabase(profile.id);
      if (remoteTasks && remoteTasks.length > 0) {
        setTasks(remoteTasks);
      } else {
        // Seed initial tasks to Supabase if remote table is empty for this user
        await syncTasksToSupabase(profile.id, tasks);
      }
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tasks,
          toneSettings,
          lowEnergy,
          restMinutesEarned,
          calmStreakDays,
        })
      );
      syncTasksToSupabase(userProfile.id, tasks);
      syncUserProfileToSupabase({
        ...userProfile,
        streak_count: calmStreakDays,
        morning_nudge_time: toneSettings.morningNudgeTime || '09:00',
      });
    } catch {
      // ignore storage quota errors
    }
  }, [tasks, toneSettings, lowEnergy, restMinutesEarned, calmStreakDays, userProfile.id]);

  const selectedTask =
    tasks.find((t) => t.id === selectedTaskId) ?? tasks[0] ?? INITIAL_TASKS[0];

  const completedStepsTotal =
    6 +
    tasks.reduce(
      (acc, t) => acc + t.microSteps.filter((s) => s.completed).length,
      0
    );
  const restHoursTotal = Math.max(1, Math.round(restMinutesEarned / 60));
  const recoveryDaysTotal = lowEnergy.active ? 3 : 2;

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextDone = !t.completed;
        if (nextDone) {
          playNotificationSound(toneSettings.sound);
          if (t.isImportant || t.categoryTone === 'priority') {
            showToast(`خلّصت أهم حاجة النهارده 🔥 عاش يا بطل على روقانك!`);
          } else {
            showToast(`عاش عليك! تم إنجاز "${t.title}" بهدوء ✨`);
          }
        }
        return {
          ...t,
          completed: nextDone,
          completedAt: nextDone ? new Date().toISOString() : null,
        };
      })
    );
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setScreen('task-detail');
  };

  const handleQuickAddTask = async (title: string) => {
    const newTask: ZonakTask = {
      id: generateUUID(),
      title,
      subtitle: 'خطوة خفيفة • بدون استعجال',
      category: 'بهدوء',
      categoryTone: 'calm',
      area: 'personal',
      priority: 'medium',
      isImportant: false,
      timeLabel: 'براحتك',
      durationMinutes: 15,
      completed: false,
      encouragement: 'ابدأ بأصغر جزء ممكن، والباقي هييجي بسلاسة.',
      contextTags: ['على مهلك', '١٥ دقيقة تركيز مريح'],
      microSteps: [
        {
          id: `ms-${Date.now()}-1`,
          title: `أول ٥ دقائق في: ${title}`,
          hint: 'مجرد البداية بتفتح النفس وبتخفف التوتر',
          durationMinutes: 5,
          completed: false,
        },
        {
          id: `ms-${Date.now()}-2`,
          title: 'إكمال الجزء الأساسي بهدوء',
          hint: 'خد نفس عميق وكمل على وتيرتك',
          durationMinutes: 10,
          completed: false,
        },
      ],
    };
    setTasks((prev) => [newTask, ...prev]);

    const insertRes = await insertTasksToSupabase(userProfile.id, [newTask]);
    if (!insertRes.ok && insertRes.error) {
      showToast(insertRes.error);
    } else {
      showToast(`أضفنا "${title}" وتم حفظها في جدول Supabase (tasks) بنجاح ✨`);
    }
  };

  const handleToggleMicroStep = (taskId: string, stepId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextSteps = t.microSteps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                completed: !s.completed,
                hint: !s.completed
                  ? `خلصت في ${toArabicDigits(s.durationMinutes)} دقايق 👏 عظيم!`
                  : s.hint,
              }
            : s
        );
        const allDone =
          nextSteps.length > 0 && nextSteps.every((s) => s.completed);
        if (!t.microSteps.find((s) => s.id === stepId)?.completed) {
          playNotificationSound(toneSettings.sound);
        }
        return {
          ...t,
          microSteps: nextSteps,
          completed: allDone ? true : t.completed,
        };
      })
    );
  };

  const handleAddMicroStep = (taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              microSteps: [
                ...t.microSteps,
                {
                  id: `step-${Date.now()}`,
                  title,
                  hint: 'خطوة صغيرة ومريحة على مهلك',
                  durationMinutes: 5,
                  completed: false,
                },
              ],
            }
          : t
      )
    );
  };

  const handleReplaceMicroSteps = (
    taskId: string,
    steps: MicroStep[],
    newMsg?: string
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              microSteps: steps,
              encouragement: newMsg || t.encouragement,
            }
          : t
      )
    );
    showToast('تم تفكيك المهمة لجرعات خفيفة وسهلة ✨');
  };

  const handlePostponeTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, postponedToTomorrow: true } : t
      )
    );
    showToast('اترحلت لبكرة بكل روقان ومن غير أي تأنيب ضمير 🌿');
    setScreen('today');
  };

  const handleRestoreTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, postponedToTomorrow: false } : t
      )
    );
    showToast('رجعنا المهمة لخطة النهارده ✨');
  };

  const handleAddParsedTasks = async (
    newTasks: ZonakTask[],
    message: string
  ) => {
    setTasks((prev) => {
      // If the new dump contains an important task, demote existing priority tasks so strictly ONE is important
      const incomingHasImp = newTasks.some((t) => t.isImportant);
      const updatedExisting = incomingHasImp
        ? prev.map((t) => ({
            ...t,
            isImportant: false,
            category: t.category === 'الأهم ⭐' ? 'شغل هادي' : t.category,
            categoryTone: t.categoryTone === 'priority' ? 'calm' : t.categoryTone,
          }))
        : prev;
      return [...newTasks, ...updatedExisting];
    });
    markUserDumpedToday(userProfile).then(setUserProfile);
    setScreen('today');

    const insertRes = await insertTasksToSupabase(userProfile.id, newTasks);
    if (!insertRes.ok && insertRes.error) {
      showToast(insertRes.error);
    } else {
      showToast(`${message} (تم الحفظ في جدول Supabase tasks ✓)`);
    }
  };

  const handleLinkAccount = async (
    provider: 'google' | 'email',
    email?: string,
    password?: string
  ) => {
    const { profile, message } = await linkAnonymousAccount(
      provider,
      email,
      password,
      tasks
    );
    setUserProfile(profile);
    showToast(message);
  };

  const handleActivateLowEnergy = (
    level: EnergyLevel,
    duration: EnergyDuration
  ) => {
    setLowEnergy({
      active: true,
      level,
      duration,
      activatedAt: new Date().toISOString(),
    });
    setToneSettings((prev) => ({ ...prev, lowEnergyAutoDetect: true }));
    showToast('تم تفعيل وضع الفرهده والراحة التامة.. ارتاح ولا تشيل هم 🛋️✨');
    setScreen('today');
  };

  const handlePostponeSelected = (ids: string[]) => {
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id) ? { ...t, postponedToTomorrow: true } : t
      )
    );
    showToast('اترحّلوا لبكرة بهدوء، تصبح على خير ورضا 🌙');
    setScreen('today');
  };

  const handleDismissSelected = (ids: string[]) => {
    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, archived: true } : t))
    );
    showToast('اتشالوا خالص بدون أي ذنب.. يومك اتقفل بسلام ✨');
    setScreen('today');
  };

  const activeTonePreset =
    TONE_PRESETS.find((t) => t.id === toneSettings.tone) ?? TONE_PRESETS[0];

  // Onboarding 3-screen flow view
  if (screen === 'onboarding') {
    return (
      <OnboardingView
        tone={toneSettings.tone}
        userProfile={userProfile}
        currentTasks={tasks}
        onCompleteFirstDump={async (newTasks, msg) => {
          setTasks((prev) => [...newTasks, ...prev]);
          markUserDumpedToday(userProfile).then(setUserProfile);
          const insertRes = await insertTasksToSupabase(
            userProfile.id,
            newTasks
          );
          if (!insertRes.ok && insertRes.error) {
            showToast(insertRes.error);
          } else {
            showToast(`${msg} (تم الحفظ في Supabase tasks ✓)`);
          }
        }}
        onLinkAccount={handleLinkAccount}
        onFinishOnboarding={() => setScreen('today')}
      />
    );
  }

  const navItems: Array<{
    id: ScreenId;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'today', label: 'النهارده', icon: <Sun className="w-5 h-5" /> },
    { id: 'weekly-report', label: 'تقدّمك', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'evening', label: 'المسا', icon: <Moon className="w-5 h-5" /> },
    { id: 'tone-settings', label: 'حسابي', icon: <Smile className="w-5 h-5" /> },
    { id: 'tasks', label: 'كل مهامي', icon: <ListChecks className="w-5 h-5" /> },
    { id: 'break-picker', label: 'استراحة روقان', icon: <Coffee className="w-5 h-5" /> },
    { id: 'low-energy', label: 'وضع الفرهده', icon: <BatteryLow className="w-5 h-5" /> },
    { id: 'story-studio', label: 'ستوديو الستوري', icon: <Camera className="w-5 h-5" /> },
  ];

  const isBottomTabActive = (id: ScreenId) => {
    if (id === 'today') return screen === 'today' || screen === 'task-detail';
    if (id === 'weekly-report')
      return (
        screen === 'weekly-report' ||
        screen === 'tasks' ||
        screen === 'story-studio'
      );
    if (id === 'evening') return screen === 'evening';
    if (id === 'tone-settings')
      return (
        screen === 'tone-settings' ||
        screen === 'low-energy' ||
        screen === 'break-picker' ||
        screen === 'notification'
      );
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F5F2EA] text-[#2C2C2A]">
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#F5F2EA]/95 backdrop-blur-md border-b border-[#E6E0D3] px-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setScreen('today')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <ZonakLogoMark size={32} />
          <div className="text-right leading-tight">
            <span className="font-bold text-base text-[#185FA5] block">زونك</span>
            <span className="text-[11px] text-[#5C6676] block">
              مساحتك... على راحتك
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScreen('onboarding')}
            className="min-h-[36px] px-3 py-1 rounded-full bg-white border border-[#E6E0D3] text-[#185FA5] text-xs font-bold cursor-pointer"
          >
            جولة البداية
          </button>
          <button
            type="button"
            onClick={() => setScreen('low-energy')}
            className="min-h-[36px] px-3 py-1 rounded-full bg-[#F1CC51] text-[#2C2C2A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>
              {lowEnergy.active ? 'وضع الفرهده مفعّل' : 'براحتك'}
            </span>
          </button>
        </div>
      </header>

      {/* Desktop + Tablet Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-8 flex gap-7 items-start">
        {/* Desktop Right Sidebar (RTL) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-8 space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-[#E6E0D3] shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ZonakLogoMark size={40} />
                <div>
                  <h2 className="font-bold text-xl text-[#185FA5]">زونك</h2>
                  <p className="text-xs text-[#6B7280]">مساحتك... على راحتك</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScreen('brain-dump')}
              className="w-full min-h-[46px] rounded-2xl bg-[#185FA5] hover:bg-[#134B84] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>قوللي اللي في دماغك</span>
            </button>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = screen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScreen(item.id)}
                    className={`w-full min-h-[44px] px-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#185FA5]/10 text-[#185FA5]'
                        : 'text-[#495464] hover:bg-[#F5F2EA]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => setScreen('onboarding')}
              className="w-full min-h-[40px] px-3 rounded-2xl bg-[#F5F2EA] hover:bg-[#EAE5D9] text-[#185FA5] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>جولة الترحيب (Onboarding)</span>
            </button>
          </div>
        </aside>

        {/* Main Center Workspace */}
        <main className="flex-1 min-w-0 pt-4 lg:pt-0 pb-20">
          {screen === 'today' && (
            <TodayView
              tasks={tasks}
              tone={toneSettings.tone}
              lowEnergy={lowEnergy}
              calmStreakDays={calmStreakDays}
              onToggleTask={handleToggleTask}
              onSelectTask={handleSelectTask}
              onNavigate={setScreen}
              onQuickAddTask={handleQuickAddTask}
              onDisableLowEnergy={() => {
                setLowEnergy((p) => ({ ...p, active: false }));
                showToast('حمد لله على السلامة! رجعنا بخطوات خفيفة على مهلك ☕');
              }}
            />
          )}

          {screen === 'tasks' && (
            <TasksHubView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onSelectTask={handleSelectTask}
              onRestoreTask={handleRestoreTask}
              onNavigate={setScreen}
            />
          )}

          {screen === 'task-detail' && selectedTask && (
            <TaskDetailView
              task={selectedTask}
              tone={toneSettings.tone}
              onBack={() => setScreen('today')}
              onToggleMicroStep={handleToggleMicroStep}
              onAddMicroStep={handleAddMicroStep}
              onReplaceMicroSteps={handleReplaceMicroSteps}
              onPostponeTask={handlePostponeTask}
              onStepTimerFinished={(_taskId, stepTitle) => {
                playNotificationSound(toneSettings.sound);
                setNotificationTaskTitle(stepTitle);
                setScreen('notification');
              }}
              onOpenBrainDump={() => setScreen('brain-dump')}
            />
          )}

          {screen === 'brain-dump' && (
            <BrainDumpView
              tone={toneSettings.tone}
              isLowEnergy={lowEnergy.active}
              onBack={() => setScreen('today')}
              onAddParsedTasks={handleAddParsedTasks}
            />
          )}

          {screen === 'low-energy' && (
            <LowEnergyView
              lowEnergy={lowEnergy}
              onActivate={handleActivateLowEnergy}
              onBack={() => setScreen('today')}
            />
          )}

          {screen === 'evening' && (
            <EveningWindDownView
              tasks={tasks}
              calmStreakDays={calmStreakDays}
              tone={toneSettings.tone}
              isLowEnergy={lowEnergy.active}
              onPostponeSelected={handlePostponeSelected}
              onDismissSelected={handleDismissSelected}
              onAddTomorrowTasks={handleAddParsedTasks}
              onOpenBrainDump={() => setScreen('brain-dump')}
              onBack={() => setScreen('today')}
            />
          )}

          {screen === 'notification' && (
            <GentleNotificationView
              taskTitle={notificationTaskTitle}
              quietEnabled={toneSettings.quietNotificationsEnabled}
              onToggleQuiet={(val) =>
                setToneSettings((p) => ({
                  ...p,
                  quietNotificationsEnabled: val,
                }))
              }
              onTakeBreak={() => setScreen('break-picker')}
              onBackToPlan={() => setScreen('today')}
            />
          )}

          {screen === 'break-picker' && (
            <BreakPickerView
              onBack={() => setScreen('today')}
              onFinishBreak={(mins) => {
                setRestMinutesEarned((prev) => prev + mins);
                playNotificationSound(toneSettings.sound);
                showToast(
                  `استراحة هنية! اتشحنت بـ ${toArabicDigits(mins)} دقيقة روقان ☕`
                );
                setScreen('today');
              }}
            />
          )}

          {screen === 'tone-settings' && (
            <ToneSettingsView
              settings={toneSettings}
              userProfile={userProfile}
              onChange={setToneSettings}
              onLinkAccount={handleLinkAccount}
              onTestNotification={() => {
                setNotificationTaskTitle(selectedTask.title);
                setScreen('notification');
              }}
              onOpenLowEnergy={() => setScreen('low-energy')}
              onOpenOnboarding={() => setScreen('onboarding')}
              onSaveAndReturn={() => {
                showToast('تم حفظ نبرتك وإعدادات راحتك ✨');
                setScreen('today');
              }}
              onNotify={showToast}
            />
          )}

          {screen === 'weekly-report' && (
            <WeeklyReportView
              completedStepsCount={completedStepsTotal}
              restHours={restHoursTotal}
              recoveryDays={recoveryDaysTotal}
              calmStreakDays={calmStreakDays}
              onOpenStoryStudio={() => setScreen('story-studio')}
              onOpenTasksHub={() => setScreen('tasks')}
              onBackHome={() => setScreen('today')}
            />
          )}

          {screen === 'story-studio' && (
            <StoryStudioView
              stats={{
                completedSteps: completedStepsTotal,
                restHours: restHoursTotal,
                recoveryDays: recoveryDaysTotal,
                peacePct: 100,
              }}
              onBack={() => setScreen('weekly-report')}
              onNotify={showToast}
            />
          )}
        </main>

        {/* Desktop Left Companion Panel */}
        {screen !== 'story-studio' && (
          <aside className="hidden xl:flex flex-col w-80 shrink-0 sticky top-8 space-y-5">
            {/* Zonak Tone Whisper Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#E6E0D3] shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <ZonakSmiley size={44} />
                <div>
                  <span className="text-[11px] font-bold text-[#185FA5] block">
                    رفيقك الهادي • {activeTonePreset.title.split(' ')[0]}
                  </span>
                  <h3 className="font-bold text-sm text-[#2C2C2A]">همسة زونك ليك</h3>
                </div>
              </div>
              <p className="text-sm text-[#495464] leading-relaxed bg-[#F5F2EA] p-3.5 rounded-2xl border border-[#E6E0D3]">
                {activeTonePreset.quote}
              </p>
              <button
                type="button"
                onClick={() => setScreen('tone-settings')}
                className="text-xs font-bold text-[#185FA5] hover:underline cursor-pointer"
              >
                غيّر نبرة زونك من هنا ←
              </button>
            </div>

            {/* Quick Calm Shortcuts */}
            <div className="bg-white rounded-3xl p-5 border border-[#E6E0D3] space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#2C2C2A] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F1CC51]" />
                  <span>لمسة سريعة للروقان</span>
                </h3>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setScreen('break-picker')}
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-[#F5F2EA] border border-[#E6E0D3] text-xs font-bold text-[#2C2C2A] flex items-center justify-between hover:bg-[#EAE5D9] cursor-pointer"
                >
                  <span>بدء استراحة روقان</span>
                  <Coffee className="w-4 h-4 text-[#185FA5]" />
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('story-studio')}
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-[#F5F2EA] border border-[#E6E0D3] text-xs font-bold text-[#2C2C2A] flex items-center justify-between hover:bg-[#EAE5D9] cursor-pointer"
                >
                  <span>ستوديو ستوري الأسبوع</span>
                  <Camera className="w-4 h-4 text-[#185FA5]" />
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('notification')}
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-[#F5F2EA] border border-[#E6E0D3] text-xs font-bold text-[#2C2C2A] flex items-center justify-between hover:bg-[#EAE5D9] cursor-pointer"
                >
                  <span>معاينة إشعار زونك اللطيف</span>
                  <Sparkles className="w-4 h-4 text-[#185FA5]" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Microphone FAB (زر المايك العائم — FAB) */}
      {screen !== 'brain-dump' && (
        <div className="fixed bottom-20 left-5 z-40">
          <button
            type="button"
            id="fab-mic-trigger"
            onClick={() => setScreen('brain-dump')}
            aria-label="قوللي اللي في دماغك (تفريغ صوتي أو نصي)"
            className="h-14 px-5 rounded-full bg-[#185FA5] hover:bg-[#134B84] text-white shadow-lg shadow-[#185FA5]/30 flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer ring-4 ring-[#F1CC51]/40"
          >
            <Mic className="w-6 h-6" />
            <span className="text-xs font-bold hidden sm:inline">فرّغ دماغك</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar (الشريط السفلي: النهارده، تقدّمك، المسا، حسابي) */}
      <nav
        id="bottom-navigation-bar"
        aria-label="الشريط السفلي للتنقل الرئيسي"
        className="fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-white/95 backdrop-blur-md border-t border-[#E6E0D3] shadow-xs"
      >
        <div className="max-w-3xl mx-auto h-full grid grid-cols-4 items-center px-2">
          {[
            { id: 'today' as ScreenId, label: 'النهارده', icon: Sun },
            { id: 'weekly-report' as ScreenId, label: 'تقدّمك', icon: BarChart3 },
            { id: 'evening' as ScreenId, label: 'المسا', icon: Moon },
            { id: 'tone-settings' as ScreenId, label: 'حسابي', icon: Smile },
          ].map((tab) => {
            const active = isBottomTabActive(tab.id);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                id={`bottom-tab-${tab.id}`}
                onClick={() => setScreen(tab.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                  active ? 'text-[#185FA5]' : 'text-[#6B7280] hover:text-[#2C2C2A]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.9} />
                <span className="text-[11px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed top-16 lg:top-6 left-1/2 -translate-x-1/2 z-50 bg-[#185FA5] text-white px-5 py-3 rounded-full shadow-lg text-xs sm:text-sm font-bold max-w-[90vw] text-center"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
