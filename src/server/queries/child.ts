import "server-only";
import { cache } from "react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { todayIn } from "@/lib/dates";
import { chestStatus } from "@/server/services/missions";
import { recomputeDay, scheduledRoutines, updateStreak } from "@/server/services/progress";

/** Refresh today's snapshot and streak once per request. */
export const refreshChildDay = cache(async (childId: string, timezone: string) => {
  const date = todayIn(timezone);
  const progress = await recomputeDay(db, childId, date);
  const streak = await updateStreak(db, childId, date);
  return { date, progress, streak };
});

export interface TodayTask {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  time: string | null;
  xp: number;
  coins: number;
  isRequired: boolean;
  kind: string;
  done: boolean;
}

export interface TodayRoutine {
  id: string;
  name: string;
  icon: string;
  category: string;
  tasks: TodayTask[];
}

export async function loadToday(childId: string, timezone: string) {
  const { date, progress } = await refreshChildDay(childId, timezone);
  const tr = await getT();
  const [routines, completions, chests] = await Promise.all([
    scheduledRoutines(db, childId, date),
    db.taskCompletion.findMany({ where: { childId, date }, select: { taskId: true } }),
    chestStatus(db, childId, date),
  ]);
  const done = new Set(completions.map((c) => c.taskId));
  const list: TodayRoutine[] = routines.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    category: r.category,
    tasks: r.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description:
        t.description ??
        (t.kind === "QURAN" && (t.quranMinutes || t.quranPages || t.quranSurah)
          ? [
              t.quranMinutes && tr("child.quranMinutes", { count: t.quranMinutes }),
              t.quranPages && tr("child.quranPages", { count: t.quranPages }),
              t.quranSurah && tr("child.surah", { name: t.quranSurah }),
            ]
              .filter(Boolean)
              .join(" · ")
          : null),
      icon: t.icon,
      time: t.time,
      xp: t.xp,
      coins: t.coins,
      isRequired: t.isRequired,
      kind: t.kind,
      done: done.has(t.id),
    })),
  }));
  return { date, routines: list, chests, progress };
}
