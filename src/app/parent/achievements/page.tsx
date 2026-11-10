import { getT } from "@/i18n/server";
import { BadgeGrid } from "@/features/shared/badge-grid";
import { NoChild, PageHeader } from "@/features/parent/ui";
import { db } from "@/lib/db";
import { requireParent } from "@/server/auth/guards";
import { selectedChild } from "@/server/queries/selected-child";
import { achievementProgress } from "@/server/services/achievements";

export async function generateMetadata() {
  return { title: (await getT())("parent.achievements.meta") };
}

export default async function AchievementsPage() {
  const { family } = await requireParent();
  const t = await getT();
  const { child } = await selectedChild(family.id);
  if (!child) return <NoChild />;
  const items = await achievementProgress(db, child.id);
  const unlocked = items.filter((i) => i.unlockedAt).length;
  return (
    <div>
      <PageHeader title={t("parent.achievements.title", { name: child.name })} subtitle={t("parent.achievements.subtitle", { done: unlocked, total: items.length })} />
      <div className="rounded-3xl bg-white p-5 shadow-soft">
        <BadgeGrid items={items} compact />
      </div>
    </div>
  );
}
