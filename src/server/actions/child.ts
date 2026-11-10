"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { todayIn } from "@/lib/dates";
import { requireChild } from "@/server/auth/guards";
import { MissionError, completeMission, openChest, undoMission, type MissionResult } from "@/server/services/missions";
import { RewardError, availableCoins, requestReward } from "@/server/services/rewards";
import { AVATARS } from "@/server/catalog/avatars";

const id = z.string().min(1).max(40);
const TX = { timeout: 20000, maxWait: 10000 };

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function refresh() {
  revalidatePath("/child", "layout");
}

export async function completeTaskAction(taskId: string): Promise<Result<MissionResult>> {
  const t = await getT();
  const { child, family } = await requireChild();
  const parsed = id.safeParse(taskId);
  if (!parsed.success) return { ok: false, error: t("common.somethingWrong") };
  try {
    const data = await db.$transaction((tx) => completeMission(tx, child.id, parsed.data, todayIn(family.timezone)), TX);
    refresh();
    return { ok: true, data };
  } catch (e) {
    if (e instanceof MissionError && e.code === "ALREADY_DONE") return { ok: false, error: t("errors.alreadyDone") };
    console.error(e);
    return { ok: false, error: t("common.somethingWrong") };
  }
}

export async function undoTaskAction(taskId: string): Promise<Result<{ completed: number; total: number }>> {
  const t = await getT();
  const { child, family } = await requireChild();
  const parsed = id.safeParse(taskId);
  if (!parsed.success) return { ok: false, error: t("common.somethingWrong") };
  try {
    const r = await db.$transaction((tx) => undoMission(tx, child.id, parsed.data, todayIn(family.timezone)), TX);
    refresh();
    return { ok: true, data: r.progress };
  } catch {
    return { ok: false, error: t("common.somethingWrong") };
  }
}

export async function openChestAction(type: "SMALL" | "GOLDEN") {
  const t = await getT();
  const { child, family } = await requireChild();
  if (type !== "SMALL" && type !== "GOLDEN") return { ok: false as const, error: t("common.somethingWrong") };
  try {
    const data = await db.$transaction((tx) => openChest(tx, child.id, type, todayIn(family.timezone)), TX);
    refresh();
    return { ok: true as const, data };
  } catch (e) {
    if (e instanceof MissionError) return { ok: false as const, error: e.code === "ALREADY_OPEN" ? t("errors.chestOpen") : t("errors.notYet") };
    return { ok: false as const, error: t("common.somethingWrong") };
  }
}

export async function requestRewardAction(rewardId: string) {
  const t = await getT();
  const { child } = await requireChild();
  const parsed = id.safeParse(rewardId);
  if (!parsed.success) return { ok: false as const, error: t("common.somethingWrong") };
  try {
    await db.$transaction((tx) => requestReward(tx, child.id, parsed.data), TX);
    refresh();
    return { ok: true as const, wallet: await availableCoins(db, child.id) };
  } catch (e) {
    if (e instanceof RewardError) {
      const map = { NOT_ENOUGH: t("errors.keepCollecting"), TOO_MANY: t("child.shop.tooMany"), NOT_FOUND: t("common.somethingWrong"), ALREADY_DECIDED: "" };
      return { ok: false as const, error: map[e.code] };
    }
    return { ok: false as const, error: t("common.somethingWrong") };
  }
}

export async function markWelcomedAction() {
  const { child } = await requireChild();
  await db.childProfile.update({ where: { id: child.id }, data: { welcomedAt: new Date() } });
  refresh();
}

export async function chooseAvatarAction(avatarKey: string) {
  const { child } = await requireChild();
  if (!AVATARS.some((a) => a.key === avatarKey)) return { ok: false as const };
  await db.childProfile.update({ where: { id: child.id }, data: { avatarKey } });
  refresh();
  return { ok: true as const };
}

/** Equip (or unequip) an owned item. One item per slot. */
export async function toggleItemAction(itemId: string) {
  const t = await getT();
  const { child } = await requireChild();
  const owned = await db.childAvatarItem.findUnique({ where: { childId_itemId: { childId: child.id, itemId } }, include: { item: true } });
  if (!owned) return { ok: false as const, error: t("errors.locked") };
  await db.$transaction(async (tx) => {
    if (!owned.equipped) {
      await tx.childAvatarItem.updateMany({ where: { childId: child.id, item: { slot: owned.item.slot } }, data: { equipped: false } });
    }
    await tx.childAvatarItem.update({ where: { id: owned.id }, data: { equipped: !owned.equipped } });
  });
  refresh();
  return { ok: true as const };
}

/** Buy a cosmetic with coins (virtual — no parent approval needed). */
export async function buyItemAction(itemId: string) {
  const t = await getT();
  const { child } = await requireChild();
  try {
    await db.$transaction(async (tx) => {
      const item = await tx.avatarItem.findUnique({ where: { id: itemId } });
      if (!item || item.achievementKey || item.cost <= 0) throw new Error("NOT_BUYABLE");
      const has = await tx.childAvatarItem.findUnique({ where: { childId_itemId: { childId: child.id, itemId } } });
      if (has) throw new Error("OWNED");
      const { available } = await availableCoins(tx, child.id);
      if (available < item.cost) throw new Error("NOT_ENOUGH");
      await tx.coinTransaction.create({ data: { childId: child.id, amount: -item.cost, source: "AVATAR_ITEM", sourceId: item.id, reason: item.name } });
      const c = await tx.childProfile.findUniqueOrThrow({ where: { id: child.id }, select: { coins: true } });
      await tx.childProfile.update({ where: { id: child.id }, data: { coins: c.coins - item.cost } });
      await tx.childAvatarItem.updateMany({ where: { childId: child.id, item: { slot: item.slot } }, data: { equipped: false } });
      await tx.childAvatarItem.create({ data: { childId: child.id, itemId: item.id, equipped: true } });
    });
    refresh();
    return { ok: true as const };
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    return { ok: false as const, error: code === "NOT_ENOUGH" ? t("errors.keepCollecting") : t("common.somethingWrong") };
  }
}

export async function dismissChildNotificationsAction() {
  const { child } = await requireChild();
  await db.notification.updateMany({ where: { childId: child.id, readAt: null }, data: { readAt: new Date() } });
  refresh();
}
