/**
 * Daily schedule, progress snapshots and streaks.
 * Pure service functions: the database client is injected so the same code
 * runs inside server actions, transactions and the seed script.
 */
import { CATEGORY_META } from "../../config/game";
import { addDays, weekdayOf } from "../../lib/dates";
import { includesDay } from "../../lib/days-mask";
import type { DB } from "./types";

/** Share of required missions needed for a day to count toward the streak. */
export const STREAK_DAY_THRESHOLD = 0.8;

export async function scheduledRoutines(db: DB, childId: string, date: string) {
  const weekday = weekdayOf(date);
  const routines = await db.routine.findMany({
    where: { childId, isActive: true },
    include: { tasks: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { time: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return routines
    .filter((r) => includesDay(r.daysMask, weekday))
    .map((r) => ({ ...r, tasks: r.tasks.filter((t) => includesDay(t.daysMask, weekday)) }))
    .filter((r) => r.tasks.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || CATEGORY_META[a.category].order - CATEGORY_META[b.category].order);
}

export type ScheduledRoutine = Awaited<ReturnType<typeof scheduledRoutines>>[number];

/** Recompute the DailyProgress + DailyStat snapshot for one child and day. */
export async function recomputeDay(db: DB, childId: string, date: string) {
  const routines = await scheduledRoutines(db, childId, date);
  const completions = await db.taskCompletion.findMany({ where: { childId, date }, select: { taskId: true } });
  const done = new Set(completions.map((c) => c.taskId));

  let total = 0;
  let completed = 0;
  let required = 0;
  let requiredCompleted = 0;
  const dims = new Map<string, { total: number; completed: number }>();
  const bump = (key: string, isDone: boolean) => {
    const d = dims.get(key) ?? { total: 0, completed: 0 };
    d.total += 1;
    if (isDone) d.completed += 1;
    dims.set(key, d);
  };

  for (const r of routines) {
    for (const t of r.tasks) {
      const isDone = done.has(t.id);
      total += 1;
      if (isDone) completed += 1;
      if (t.isRequired) {
        required += 1;
        if (isDone) requiredCompleted += 1;
      }
      bump(`cat:${r.category}`, isDone);
      bump(`kind:${t.kind}`, isDone);
    }
  }

  const isPerfect = required > 0 ? requiredCompleted === required : total > 0 && completed === total;
  const isSuccess = required > 0 ? requiredCompleted / required >= STREAK_DAY_THRESHOLD : completed > 0;

  const progress = await db.dailyProgress.upsert({
    where: { childId_date: { childId, date } },
    create: { childId, date, totalTasks: total, completedTasks: completed, requiredTasks: required, requiredCompleted, isPerfect, isSuccess },
    update: { totalTasks: total, completedTasks: completed, requiredTasks: required, requiredCompleted, isPerfect, isSuccess },
  });

  // Upsert each dimension instead of delete-then-insert: two page loads can
  // recompute the same day at the same time, and PostgreSQL's ON CONFLICT
  // upsert keeps that race safe.
  const entries = [...dims.entries()];
  await db.dailyStat.deleteMany({ where: { childId, date, dimension: { notIn: entries.map(([d]) => d) } } });
  for (const [dimension, v] of entries) {
    await db.dailyStat.upsert({
      where: { childId_date_dimension: { childId, date, dimension } },
      create: { childId, date, dimension, total: v.total, completed: v.completed },
      update: { total: v.total, completed: v.completed },
    });
  }
  return progress;
}

/** Count consecutive successful days ending today (or yesterday if today isn't done yet). */
export async function updateStreak(db: DB, childId: string, today: string) {
  const rows = await db.dailyProgress.findMany({
    where: { childId, isSuccess: true, date: { lte: today } },
    select: { date: true },
    orderBy: { date: "desc" },
    take: 400,
  });
  const set = new Set(rows.map((r) => r.date));
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  const child = await db.childProfile.findUniqueOrThrow({ where: { id: childId }, select: { longestStreak: true } });
  await db.childProfile.update({
    where: { id: childId },
    data: { currentStreak: streak, longestStreak: Math.max(child.longestStreak, streak) },
  });
  return streak;
}
