import "server-only";
import { CATEGORY_META } from "@/config/game";
import { db } from "@/lib/db";
import { addDays, daysBetween } from "@/lib/dates";
import { refreshChildDay } from "./child";

export async function dashboardData(childId: string, timezone: string) {
  const { date, progress, streak } = await refreshChildDay(childId, timezone);
  const [child, stats, lastCompletion, recentBadges, pending, week] = await Promise.all([
    db.childProfile.findUniqueOrThrow({ where: { id: childId } }),
    db.dailyStat.findMany({ where: { childId, date, dimension: { startsWith: "cat:" } } }),
    db.taskCompletion.findFirst({ where: { childId }, orderBy: { completedAt: "desc" } }),
    db.childAchievement.findMany({ where: { childId }, include: { achievement: true }, orderBy: { unlockedAt: "desc" }, take: 6 }),
    db.rewardRedemption.findMany({ where: { childId, status: "PENDING" }, orderBy: { requestedAt: "asc" } }),
    db.dailyProgress.findMany({ where: { childId, date: { gte: addDays(date, -6), lte: date } } }),
  ]);
  const byDate = new Map(week.map((w) => [w.date, w]));
  return {
    date,
    child,
    streak,
    today: progress,
    categories: stats
      .map((s) => {
        const key = s.dimension.slice(4) as keyof typeof CATEGORY_META;
        return { key, label: CATEGORY_META[key]?.label ?? key, icon: CATEGORY_META[key]?.icon ?? "✨", total: s.total, completed: s.completed };
      })
      .sort((a, b) => (CATEGORY_META[a.key]?.order ?? 9) - (CATEGORY_META[b.key]?.order ?? 9)),
    lastCompletion,
    recentBadges,
    pending,
    week: daysBetween(addDays(date, -6), date).map((d) => {
      const p = byDate.get(d);
      return { date: d, ratio: p && p.totalTasks ? p.completedTasks / p.totalTasks : 0, isPerfect: !!p?.isPerfect, isSuccess: !!p?.isSuccess };
    }),
  };
}

export const HABITS = [
  { id: "prayer", key: "kind:PRAYER", label: "Prayer habits", icon: "🕌", mode: "ratio" },
  { id: "quran", key: "kind:QURAN", label: "Quran", icon: "📖", mode: "days" },
  { id: "morning", key: "cat:MORNING", label: "Morning routine", icon: "🌅", mode: "ratio" },
  { id: "reading", key: "kind:READING", label: "Reading", icon: "📚", mode: "anyDays" },
  { id: "teeth", key: "kind:TEETH", label: "Brushing teeth", icon: "🦷", mode: "ratio" },
  { id: "sleep", key: "kind:SLEEP", label: "Sleep routine", icon: "😴", mode: "ratio" },
  { id: "helping", key: "kind:HELPING", label: "Helping family", icon: "❤️", mode: "ratio" },
  { id: "homework", key: "kind:HOMEWORK", label: "Homework", icon: "✏️", mode: "ratio" },
] as const;

export async function analyticsData(childId: string, from: string, to: string) {
  const [days, stats] = await Promise.all([
    db.dailyProgress.findMany({ where: { childId, date: { gte: from, lte: to } }, orderBy: { date: "asc" } }),
    db.dailyStat.findMany({ where: { childId, date: { gte: from, lte: to } } }),
  ]);
  const total = days.reduce((s, d) => s + d.totalTasks, 0);
  const completed = days.reduce((s, d) => s + d.completedTasks, 0);
  const span = daysBetween(from, to).length;

  const habits = HABITS.map((h) => {
    const rows = stats.filter((s) => s.dimension === h.key && s.total > 0);
    const t = rows.reduce((s, r) => s + r.total, 0);
    const c = rows.reduce((s, r) => s + r.completed, 0);
    const fullDays = rows.filter((r) => r.completed >= r.total).length;
    const anyDays = rows.filter((r) => r.completed > 0).length;
    return {
      ...h,
      scheduledDays: rows.length,
      ratio: t ? c / t : null,
      fullDays,
      anyDays,
    };
  }).filter((h) => h.scheduledDays > 0);

  return {
    span,
    trackedDays: days.length,
    completion: total ? completed / total : null,
    perfectDays: days.filter((d) => d.isPerfect).length,
    goodDays: days.filter((d) => d.isSuccess).length,
    habits,
    days,
  };
}
