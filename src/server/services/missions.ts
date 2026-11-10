/** Completing / undoing missions and opening treasure chests. */
import type { Achievement, ChestType } from "@prisma/client";
import { CHESTS, STREAK_MILESTONES, levelForXp } from "../../config/game";
import { includesDay } from "../../lib/days-mask";
import { weekdayOf } from "../../lib/dates";
import { createTranslator, isLocale } from "../../i18n";
import { evaluateAchievements } from "./achievements";
import { grant } from "./ledger";
import { recomputeDay, updateStreak } from "./progress";
import type { DB } from "./types";

export class MissionError extends Error {
  constructor(public code: "NOT_FOUND" | "NOT_TODAY" | "ALREADY_DONE" | "NOT_DONE" | "NOT_READY" | "ALREADY_OPEN") {
    super(code);
  }
}

export interface MissionResult {
  xpGained: number;
  coinsGained: number;
  totals: { xp: number; coins: number };
  levelUp: { level: number; title: string; icon: string } | null;
  badges: Pick<Achievement, "key" | "title" | "icon" | "description">[];
  perfectDay: boolean;
  perfectBonus: number;
  streak: number;
  streakMilestone: number | null;
  progress: { completed: number; total: number };
}

export async function completeMission(db: DB, childId: string, taskId: string, date: string): Promise<MissionResult> {
  // Authorization: the task must belong to one of THIS child's routines.
  const task = await db.routineTask.findFirst({
    where: { id: taskId, isActive: true, routine: { childId, isActive: true } },
    include: { routine: true },
  });
  if (!task) throw new MissionError("NOT_FOUND");
  const wd = weekdayOf(date);
  if (!includesDay(task.daysMask, wd) || !includesDay(task.routine.daysMask, wd)) throw new MissionError("NOT_TODAY");

  const existing = await db.taskCompletion.findUnique({ where: { childId_taskId_date: { childId, taskId, date } } });
  if (existing) throw new MissionError("ALREADY_DONE");

  const before = await db.childProfile.findUniqueOrThrow({ where: { id: childId }, select: { xp: true, currentStreak: true, familyId: true, name: true, family: { select: { locale: true } } } });
  const t = createTranslator(isLocale(before.family.locale) ? before.family.locale : "en");

  const completion = await db.taskCompletion.create({
    data: { childId, taskId, date, xpAwarded: task.xp, coinsAwarded: task.coins, taskTitle: task.title, taskIcon: task.icon, taskKind: task.kind },
  });
  await grant(db, { childId, xp: task.xp, coins: task.coins, source: "TASK", sourceId: completion.id, reason: task.title });

  const progress = await recomputeDay(db, childId, date);
  let perfectBonus = 0;
  if (progress.isPerfect && !progress.perfectBonusGiven) {
    perfectBonus = CHESTS.perfectDayBonusCoins;
    await grant(db, { childId, coins: perfectBonus, source: "PERFECT_DAY", sourceId: progress.id, reason: "Perfect Day bonus" });
    await db.dailyProgress.update({ where: { id: progress.id }, data: { perfectBonusGiven: true } });
  }

  const streak = await updateStreak(db, childId, date);
  const streakMilestone =
    streak > before.currentStreak ? (STREAK_MILESTONES.find((m) => m === streak) ?? null) : null;

  const badges = await evaluateAchievements(db, childId);
  const after = await db.childProfile.findUniqueOrThrow({ where: { id: childId }, select: { xp: true, coins: true } });

  const lvBefore = levelForXp(before.xp);
  const lvAfter = levelForXp(after.xp);
  const levelUp = lvAfter.level > lvBefore.level ? { level: lvAfter.level, title: lvAfter.title, icon: lvAfter.icon } : null;
  if (levelUp) {
    await db.notification.create({
      data: { familyId: before.familyId, type: "LEVEL_UP", title: t("notify.levelUp", { icon: levelUp.icon, name: before.name, level: levelUp.level }), body: t.level(levelUp.level) },
    });
  }
  if (streakMilestone) {
    await db.notification.create({
      data: { familyId: before.familyId, type: "STREAK_MILESTONE", title: t("notify.streak", { name: before.name, count: streakMilestone }) },
    });
  }

  return {
    xpGained: task.xp,
    coinsGained: task.coins,
    totals: after,
    levelUp,
    badges: badges.map(({ key, title, icon, description }) => ({ key, title, icon, description })),
    perfectDay: perfectBonus > 0,
    perfectBonus,
    streak,
    streakMilestone,
    progress: { completed: progress.completedTasks, total: progress.totalTasks },
  };
}

/** "Oops, not yet!" — lets a child untick a mission done by mistake today. */
export async function undoMission(db: DB, childId: string, taskId: string, date: string) {
  const completion = await db.taskCompletion.findUnique({ where: { childId_taskId_date: { childId, taskId, date } } });
  if (!completion) throw new MissionError("NOT_DONE");
  await db.taskCompletion.delete({ where: { id: completion.id } });
  await grant(db, {
    childId,
    xp: -completion.xpAwarded,
    coins: -completion.coinsAwarded,
    source: "TASK_UNDO",
    sourceId: completion.id,
    reason: `Undo: ${completion.taskTitle}`,
  });
  const progress = await recomputeDay(db, childId, date);
  await updateStreak(db, childId, date);
  return { progress: { completed: progress.completedTasks, total: progress.totalTasks } };
}

function pick<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export async function chestStatus(db: DB, childId: string, date: string) {
  const [progress, opened] = await Promise.all([
    db.dailyProgress.findUnique({ where: { childId_date: { childId, date } } }),
    db.chestOpening.findMany({ where: { childId, date } }),
  ]);
  const completed = progress?.completedTasks ?? 0;
  return {
    small: {
      ready: completed >= CHESTS.smallAfterTasks,
      opened: opened.some((o) => o.type === "SMALL"),
      remaining: Math.max(0, CHESTS.smallAfterTasks - completed),
    },
    golden: {
      ready: !!progress?.isPerfect,
      opened: opened.some((o) => o.type === "GOLDEN"),
      remaining: Math.max(0, (progress?.requiredTasks ?? 0) - (progress?.requiredCompleted ?? 0)),
    },
  };
}

export async function openChest(db: DB, childId: string, type: ChestType, date: string, rnd: () => number = Math.random) {
  const status = await chestStatus(db, childId, date);
  const s = type === "SMALL" ? status.small : status.golden;
  if (s.opened) throw new MissionError("ALREADY_OPEN");
  if (!s.ready) throw new MissionError("NOT_READY");

  const table = type === "SMALL" ? CHESTS.small : CHESTS.golden;
  const coins = pick(table.coins, rnd);
  const xp = pick(table.xp, rnd);
  let item: { key: string; name: string; emoji: string } | null = null;

  if (type === "GOLDEN" && rnd() < 0.35) {
    const owned = await db.childAvatarItem.findMany({ where: { childId }, select: { itemId: true } });
    const options = await db.avatarItem.findMany({
      where: { id: { notIn: owned.map((o) => o.itemId) }, achievementKey: null, cost: { gt: 0 } },
    });
    if (options.length) {
      const chosen = pick(options, rnd);
      await db.childAvatarItem.create({ data: { childId, itemId: chosen.id } });
      item = { key: chosen.key, name: chosen.name, emoji: chosen.emoji };
    }
  }

  const opening = await db.chestOpening.create({ data: { childId, date, type, coins, xp, itemKey: item?.key } });
  const before = await db.childProfile.findUniqueOrThrow({ where: { id: childId }, select: { xp: true } });
  const totals = await grant(db, { childId, xp, coins, source: "CHEST", sourceId: opening.id, reason: type === "SMALL" ? "Small chest" : "Golden chest" });
  const lvBefore = levelForXp(before.xp);
  const lvAfter = levelForXp(totals.xp);
  return {
    coins,
    xp,
    item,
    totals,
    levelUp: lvAfter.level > lvBefore.level ? { level: lvAfter.level, title: lvAfter.title, icon: lvAfter.icon } : null,
  };
}
