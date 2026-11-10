import { randomInt } from "node:crypto";
import { translateContent } from "../../i18n/content";
import type { Locale } from "../../i18n";
import { ACHIEVEMENTS } from "../catalog/achievements";
import { AVATARS, AVATAR_ITEMS, FREE_ITEM_KEYS } from "../catalog/avatars";
import { getTemplate, taskFields, type TemplateKey } from "../catalog/templates";
import type { DB } from "./types";

/** Human-friendly family code, e.g. "STAR-4821". */
export function generateFamilyCode(): string {
  const words = ["STAR", "MOON", "SUN", "CLOUD", "RAINBOW", "OWL", "CASTLE", "COMET"];
  return `${words[randomInt(words.length)]}-${randomInt(1000, 10000)}`;
}

export async function uniqueFamilyCode(db: DB): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateFamilyCode();
    if (!(await db.family.findUnique({ where: { loginCode: code } }))) return code;
  }
  throw new Error("Could not generate family code");
}

/** Copy a template into a child's routines, appended after existing ones. */
export async function applyTemplate(db: DB, childId: string, key: TemplateKey, locale: Locale = "en") {
  const template = getTemplate(key);
  if (!template) throw new Error(`Unknown template ${key}`);
  const last = await db.routine.findFirst({ where: { childId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  let order = (last?.sortOrder ?? -1) + 1;
  for (const r of template.routines) {
    await db.routine.create({
      data: {
        childId,
        name: translateContent(r.name, locale),
        icon: r.icon,
        category: r.category,
        daysMask: r.daysMask,
        isActive: r.isActive ?? true,
        sortOrder: order++,
        tasks: {
          create: r.tasks.map((t, i) => {
            const f = taskFields(t, i);
            return { ...f, title: translateContent(f.title, locale), description: f.description && translateContent(f.description, locale) };
          }),
        },
      },
    });
  }
}

/** Re-translate ready-made content (template routines, missions, default rewards) into `locale`. Custom text is untouched. */
export async function translateFamilyContent(db: DB, familyId: string, locale: Locale) {
  const routines = await db.routine.findMany({ where: { child: { familyId } }, include: { tasks: true } });
  for (const r of routines) {
    const name = translateContent(r.name, locale);
    if (name !== r.name) await db.routine.update({ where: { id: r.id }, data: { name } });
    for (const task of r.tasks) {
      const title = translateContent(task.title, locale);
      const description = task.description ? translateContent(task.description, locale) : null;
      if (title !== task.title || description !== task.description) {
        await db.routineTask.update({ where: { id: task.id }, data: { title, description } });
      }
    }
  }
  const rewards = await db.reward.findMany({ where: { familyId } });
  for (const rw of rewards) {
    const title = translateContent(rw.title, locale);
    if (title !== rw.title) await db.reward.update({ where: { id: rw.id }, data: { title } });
  }
  // Reward requests keep a title snapshot; translate the ones still waiting so parents and kids see one language.
  const pending = await db.rewardRedemption.findMany({ where: { status: "PENDING", child: { familyId } } });
  for (const r of pending) {
    const rewardTitle = translateContent(r.rewardTitle, locale);
    if (rewardTitle !== r.rewardTitle) await db.rewardRedemption.update({ where: { id: r.id }, data: { rewardTitle } });
  }
}

export async function grantStarterItems(db: DB, childId: string) {
  const items = await db.avatarItem.findMany({ where: { key: { in: FREE_ITEM_KEYS } } });
  for (const item of items) {
    await db.childAvatarItem.upsert({
      where: { childId_itemId: { childId, itemId: item.id } },
      create: { childId, itemId: item.id, equipped: item.slot === "HAT" || item.slot === "COMPANION" },
      update: {},
    });
  }
}

/** Idempotently sync global catalogs (achievements, avatars, items). */
export async function syncCatalogs(db: DB) {
  for (const [i, a] of ACHIEVEMENTS.entries()) {
    const data = {
      title: a.title,
      description: a.description,
      icon: a.icon,
      rule: a.rule,
      dimension: a.dimension ?? null,
      threshold: a.threshold,
      xpBonus: a.xpBonus ?? 0,
      coinBonus: a.coinBonus ?? 0,
      sortOrder: i,
    };
    await db.achievement.upsert({ where: { key: a.key }, create: { key: a.key, ...data }, update: data });
  }
  for (const [i, a] of AVATARS.entries()) {
    const data = { name: a.name, emoji: a.emoji, color: a.color, sortOrder: i };
    await db.avatar.upsert({ where: { key: a.key }, create: { key: a.key, ...data }, update: data });
  }
  for (const [i, it] of AVATAR_ITEMS.entries()) {
    const data = { name: it.name, emoji: it.emoji, slot: it.slot, cost: it.cost ?? 0, achievementKey: it.achievementKey ?? null, sortOrder: i };
    await db.avatarItem.upsert({ where: { key: it.key }, create: { key: it.key, ...data }, update: data });
  }
}
