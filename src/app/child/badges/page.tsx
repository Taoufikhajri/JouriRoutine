import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { requireChild } from "@/server/auth/guards";
import { achievementProgress } from "@/server/services/achievements";
import { BadgeGrid } from "@/features/shared/badge-grid";

export async function generateMetadata() {
  return { title: (await getT())("child.badges.title") };
}

export default async function BadgesPage() {
  const { child } = await requireChild();
  const t = await getT();
  const items = await achievementProgress(db, child.id);
  const count = items.filter((i) => i.unlockedAt).length;
  // Unlocked first, then closest to unlocking.
  items.sort((a, b) => Number(!!b.unlockedAt) - Number(!!a.unlockedAt) || b.value / b.achievement.threshold - a.value / a.achievement.threshold);
  return (
    <div className="space-y-4">
      <section className="card-magic flex items-center justify-between p-5">
        <h1 className="font-display text-2xl font-extrabold">⭐ {t("child.badges.title")}</h1>
        <span className="rounded-2xl bg-sun/30 px-3 py-1.5 font-display text-xl font-extrabold">
          {count} / {items.length}
        </span>
      </section>
      <BadgeGrid items={items} />
    </div>
  );
}
