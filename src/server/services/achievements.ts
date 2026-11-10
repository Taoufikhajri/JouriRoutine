import type { Achievement, TaskKind } from "@prisma/client";
import { createTranslator, isLocale } from "../../i18n";
import { grant } from "./ledger";
import type { DB } from "./types";

export interface AchievementProgress {
  achievement: Achievement;
  value: number;
  unlockedAt: Date | null;
}

async function metric(db: DB, childId: string, a: Achievement, streak: number): Promise<number> {
  switch (a.rule) {
    case "TOTAL_TASKS":
      return db.taskCompletion.count({ where: { childId } });
    case "COMPLETION_COUNT":
      return db.taskCompletion.count({ where: { childId, taskKind: a.dimension as TaskKind } });
    case "FULL_DAYS": {
      const rows = await db.dailyStat.findMany({ where: { childId, dimension: a.dimension ?? "" }, select: { total: true, completed: true } });
      return rows.filter((r) => r.total > 0 && r.completed >= r.total).length;
    }
    case "ANY_DAYS":
      return db.dailyStat.count({ where: { childId, dimension: a.dimension ?? "", completed: { gt: 0 } } });
    case "PERFECT_DAYS":
      return db.dailyProgress.count({ where: { childId, isPerfect: true } });
    case "STREAK":
      return streak;
  }
}

/** All achievements with the child's current progress (for badge screens). */
export async function achievementProgress(db: DB, childId: string): Promise<AchievementProgress[]> {
  const [all, owned, child] = await Promise.all([
    db.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    db.childAchievement.findMany({ where: { childId } }),
    db.childProfile.findUniqueOrThrow({ where: { id: childId }, select: { currentStreak: true, longestStreak: true } }),
  ]);
  const unlocked = new Map(owned.map((o) => [o.achievementId, o.unlockedAt]));
  const streak = Math.max(child.currentStreak, child.longestStreak);
  return Promise.all(
    all.map(async (a) => ({
      achievement: a,
      unlockedAt: unlocked.get(a.id) ?? null,
      value: unlocked.has(a.id) ? a.threshold : Math.min(a.threshold, await metric(db, childId, a, streak)),
    })),
  );
}

/** Unlock any newly earned achievements, grant their bonuses and linked avatar items. */
export async function evaluateAchievements(db: DB, childId: string): Promise<Achievement[]> {
  const child = await db.childProfile.findUniqueOrThrow({
    where: { id: childId },
    select: { familyId: true, currentStreak: true, longestStreak: true, family: { select: { locale: true } }, achievements: { select: { achievementId: true } } },
  });
  const have = new Set(child.achievements.map((a) => a.achievementId));
  const candidates = await db.achievement.findMany({ where: { id: { notIn: [...have] } }, orderBy: { sortOrder: "asc" } });
  const streak = Math.max(child.currentStreak, child.longestStreak);
  const t = createTranslator(isLocale(child.family.locale) ? child.family.locale : "en");

  const unlocked: Achievement[] = [];
  for (const a of candidates) {
    if ((await metric(db, childId, a, streak)) < a.threshold) continue;
    await db.childAchievement.create({ data: { childId, achievementId: a.id } });
    if (a.xpBonus || a.coinBonus) {
      await grant(db, { childId, xp: a.xpBonus, coins: a.coinBonus, source: "ACHIEVEMENT", sourceId: a.id, reason: `Badge: ${a.title}` });
    }
    const items = await db.avatarItem.findMany({ where: { achievementKey: a.key } });
    for (const item of items) {
      await db.childAvatarItem.upsert({
        where: { childId_itemId: { childId, itemId: item.id } },
        create: { childId, itemId: item.id },
        update: {},
      });
    }
    await db.notification.create({
      data: {
        familyId: child.familyId,
        type: "BADGE_UNLOCKED",
        title: t("notify.badge", { icon: a.icon, title: t.badge(a.key, a).title }),
        body: t.badge(a.key, a).description,
      },
    });
    unlocked.push(a);
  }
  return unlocked;
}
