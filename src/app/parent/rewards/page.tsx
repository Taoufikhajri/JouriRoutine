import { getT } from "@/i18n/server";
import { ApprovalList } from "@/features/parent/approval-list";
import { RewardManager } from "@/features/parent/reward-manager";
import { PageHeader } from "@/features/parent/ui";
import { db } from "@/lib/db";
import { requireParent } from "@/server/auth/guards";

export async function generateMetadata() {
  return { title: (await getT())("parent.rewards.meta") };
}

export default async function ParentRewardsPage() {
  const { family } = await requireParent();
  const t = await getT();
  const [rewards, pending, history] = await Promise.all([
    db.reward.findMany({ where: { familyId: family.id }, orderBy: [{ cost: "asc" }, { sortOrder: "asc" }] }),
    db.rewardRedemption.findMany({ where: { status: "PENDING", child: { familyId: family.id } }, include: { child: true }, orderBy: { requestedAt: "asc" } }),
    db.rewardRedemption.findMany({
      where: { status: { not: "PENDING" }, child: { familyId: family.id } },
      include: { child: true },
      orderBy: { decidedAt: "desc" },
      take: 15,
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("parent.rewards.title")} subtitle={t("parent.rewards.subtitle")} />
      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="font-display text-lg font-extrabold">{t("parent.rewards.waiting")}</h2>
        <ApprovalList
          items={pending.map((p) => ({
            id: p.id,
            title: p.rewardTitle,
            icon: p.rewardIcon,
            cost: p.cost,
            childName: p.child.name,
            childCoins: p.child.coins,
            requestedAt: p.requestedAt.toISOString(),
          }))}
        />
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="mb-3 font-display text-lg font-extrabold">{t("parent.rewards.shop")}</h2>
        <RewardManager rewards={rewards.map((r) => ({ id: r.id, title: r.title, icon: r.icon, cost: r.cost, isActive: r.isActive }))} />
      </section>
      {history.length > 0 && (
        <section className="rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-extrabold">{t("parent.rewards.history")}</h2>
          <ul className="mt-2 divide-y divide-ink/5 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2">
                <span aria-hidden>{h.rewardIcon}</span>
                <span className="flex-1 font-semibold">
                  {h.rewardTitle} · {h.child.name}
                </span>
                <span className="text-ink-soft">🪙 {h.cost}</span>
                <span className={h.status === "APPROVED" ? "font-bold text-mint-dark" : "font-bold text-ink-soft"}>{h.status === "APPROVED" ? t("parent.rewards.approved") : t("parent.rewards.notNow")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
