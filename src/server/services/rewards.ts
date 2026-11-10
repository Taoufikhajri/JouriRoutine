import { createTranslator, isLocale } from "../../i18n";
import type { DB } from "./types";

export class RewardError extends Error {
  constructor(public code: "NOT_FOUND" | "NOT_ENOUGH" | "TOO_MANY" | "ALREADY_DECIDED") {
    super(code);
  }
}

const MAX_PENDING = 5;

/** Coins not already reserved by pending requests. */
export async function availableCoins(db: DB, childId: string) {
  const [child, pending] = await Promise.all([
    db.childProfile.findUniqueOrThrow({ where: { id: childId }, select: { coins: true } }),
    db.rewardRedemption.aggregate({ where: { childId, status: "PENDING" }, _sum: { cost: true } }),
  ]);
  return { coins: child.coins, reserved: pending._sum.cost ?? 0, available: child.coins - (pending._sum.cost ?? 0) };
}

/** Child asks for a reward. Coins are only deducted when a parent approves. */
export async function requestReward(db: DB, childId: string, rewardId: string) {
  const child = await db.childProfile.findUniqueOrThrow({ where: { id: childId }, select: { familyId: true, name: true, family: { select: { locale: true } } } });
  const t = createTranslator(isLocale(child.family.locale) ? child.family.locale : "en");
  const reward = await db.reward.findFirst({ where: { id: rewardId, familyId: child.familyId, isActive: true } });
  if (!reward) throw new RewardError("NOT_FOUND");

  const pendingCount = await db.rewardRedemption.count({ where: { childId, status: "PENDING" } });
  if (pendingCount >= MAX_PENDING) throw new RewardError("TOO_MANY");

  const { available } = await availableCoins(db, childId);
  if (available < reward.cost) throw new RewardError("NOT_ENOUGH");

  const redemption = await db.rewardRedemption.create({
    data: { childId, rewardId, cost: reward.cost, rewardTitle: reward.title, rewardIcon: reward.icon },
  });
  await db.notification.create({
    data: {
      familyId: child.familyId,
      type: "REWARD_REQUESTED",
      title: t("notify.rewardRequested", { icon: reward.icon, name: child.name, reward: reward.title }),
      body: t("notify.rewardRequestedBody", { cost: reward.cost }),
    },
  });
  return redemption;
}

/** Parent approves / rejects. `familyId` comes from the parent's session. */
export async function decideReward(db: DB, familyId: string, parentProfileId: string, redemptionId: string, approve: boolean) {
  const r = await db.rewardRedemption.findFirst({ where: { id: redemptionId, child: { familyId } }, include: { child: { include: { family: { select: { locale: true } } } } } });
  if (!r) throw new RewardError("NOT_FOUND");
  const t = createTranslator(isLocale(r.child.family.locale) ? r.child.family.locale : "en");
  if (r.status !== "PENDING") throw new RewardError("ALREADY_DECIDED");

  if (approve) {
    if (r.child.coins < r.cost) throw new RewardError("NOT_ENOUGH");
    await db.coinTransaction.create({ data: { childId: r.childId, amount: -r.cost, source: "REDEMPTION", sourceId: r.id, reason: r.rewardTitle } });
    await db.childProfile.update({ where: { id: r.childId }, data: { coins: r.child.coins - r.cost } });
  }
  await db.rewardRedemption.update({
    where: { id: r.id },
    data: { status: approve ? "APPROVED" : "REJECTED", decidedAt: new Date(), decidedById: parentProfileId },
  });
  await db.notification.create({
    data: {
      familyId,
      childId: r.childId,
      type: approve ? "REWARD_APPROVED" : "REWARD_REJECTED",
      title: t(approve ? "notify.rewardApproved" : "notify.rewardRejected", { icon: r.rewardIcon, reward: r.rewardTitle }),
    },
  });
}
