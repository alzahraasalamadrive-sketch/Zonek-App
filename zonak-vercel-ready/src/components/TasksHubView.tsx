import React, { useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  Check,
  Clock,
  Moon,
  Plus,
  Sparkles,
} from 'lucide-react';
import { ScreenId, ZonakTask } from '../types/zonak';
import { toArabicDigits } from '../data/initialData';

interface TasksHubViewProps {
  tasks: ZonakTask[];
  onToggleTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onRestoreTask: (taskId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const TasksHubView: React.FC<TasksHubViewProps> = ({
  tasks,
  onToggleTask,
  onSelectTask,
  onRestoreTask,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'postponed' | 'done'>('all');

  const visibleTasks = tasks.filter((t) => {
    if (t.archived) return false;
    if (filter === 'active') return !t.completed && !t.postponedToTomorrow;
    if (filter === 'postponed') return Boolean(t.postponedToTomorrow);
    if (filter === 'done') return t.completed;
    return true;
  });

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2230]">مهامي وتقاريري</h1>
          <p className="text-sm text-[#5C6676] mt-0.5">
            رتّب خطواتك على مهلك أو ابدأ جلسة تصفية الذهن
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('brain-dump')}
          className="min-h-[44px] px-4 py-2 rounded-full bg-[#0A467E] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#083968] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تفريغ دماغ جديد</span>
        </button>
      </div>

      {/* Quick Feature Cards: Evening Wind-down & Weekly Report */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => onNavigate('weekly-report')}
          className="bg-gradient-to-l from-[#FEF7DB] to-white rounded-3xl p-5 border border-[#EFEAE0] text-right hover:border-[#E2D4A0] transition-colors flex items-center justify-between gap-3 cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-[#8D6E18] block mb-1">
              ملخص الأسبوع
            </span>
            <h2 className="text-lg font-bold text-[#1A2230]">تقرير الأسبوع المريح ✨</h2>
            <p className="text-xs text-[#5C6676] mt-1">
              حصاد خطواتك وساعات راحتك مع ستوديو الستوري
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F6D258] text-[#3F2D00] flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('evening')}
          className="bg-gradient-to-l from-[#E8EFF7] to-white rounded-3xl p-5 border border-[#EFEAE0] text-right hover:border-[#C9D8EB] transition-colors flex items-center justify-between gap-3 cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-[#0A467E] block mb-1">
              ختام اليوم
            </span>
            <h2 className="text-lg font-bold text-[#1A2230]">تصفية الذهن المسائية 🌙</h2>
            <p className="text-xs text-[#5C6676] mt-1">
              اقفل يومك برضا ورحّل المهام لبكرة من غير ذنب
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0A467E] text-white flex items-center justify-center shrink-0">
            <Moon className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#EFECE4] rounded-2xl overflow-x-auto">
        {[
          { id: 'all' as const, label: 'الكل' },
          { id: 'active' as const, label: 'النهارده' },
          { id: 'postponed' as const, label: 'مؤجلة لبكرة' },
          { id: 'done' as const, label: 'تمت بروقان' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filter === tab.id
                ? 'bg-white text-[#0A467E] shadow-xs'
                : 'text-[#5C6676] hover:text-[#1A2230]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtered Tasks */}
      {visibleTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#EFEAE0] space-y-2">
          <Sparkles className="w-8 h-8 text-[#A67916] mx-auto" />
          <h3 className="font-bold text-base text-[#1A2230]">مفيش مهام في القسم ده</h3>
          <p className="text-xs text-[#6B7280]">كل شيء ماشي بهدوء وعلى مهلك.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFEAE0] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    task.completed
                      ? 'bg-[#0A467E] text-white'
                      : 'bg-[#F3F1EC] border border-[#E2DDD0] text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTask(task.id)}
                  className="text-right min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-bold text-base ${
                        task.completed
                          ? 'line-through text-[#6B7280]'
                          : 'text-[#1A2230]'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.postponedToTomorrow && (
                      <span className="text-[11px] font-semibold bg-[#FAF0C8] text-[#7D5E0D] px-2 py-0.5 rounded-full">
                        لبكرة بروقان
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                    {task.subtitle} • {toArabicDigits(task.microSteps.length)} خطوات صغيرة
                  </p>
                </button>
              </div>

              {task.postponedToTomorrow ? (
                <button
                  type="button"
                  onClick={() => onRestoreTask(task.id)}
                  className="min-h-[38px] px-3 rounded-xl bg-[#EEF4FA] text-[#0A467E] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>رجّعها لليوم</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-[#6B7280] flex items-center gap-1 shrink-0 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{task.timeLabel}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
