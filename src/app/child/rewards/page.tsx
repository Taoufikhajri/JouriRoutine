import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { requireChild } from "@/server/auth/guards";
import { availableCoins } from "@/server/services/rewards";
import { RewardShop } from "@/features/child/reward-shop";

export async function generateMetadata() {
  return { title: (await getT())("child.shop.title") };
}

export default async function ChildRewardsPage() {
  const { child, family } = await requireChild();
  const [rewards, wallet, wishes] = await Promise.all([
    db.reward.findMany({ where: { familyId: family.id, isActive: true }, orderBy: [{ cost: "asc" }, { sortOrder: "asc" }] }),
    availableCoins(db, child.id),
    db.rewardRedemption.findMany({ where: { childId: child.id }, orderBy: { requestedAt: "desc" }, take: 12 }),
  ]);
  return (
    <RewardShop
      rewards={rewards.map((r) => ({ id: r.id, title: r.title, icon: r.icon, cost: r.cost }))}
      wallet={wallet}
      wishes={wishes.map((w) => ({ id: w.id, title: w.rewardTitle, icon: w.rewardIcon, cost: w.cost, status: w.status }))}
    />
  );
}
