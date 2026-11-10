import { getT } from "@/i18n/server";
import { NoChild, PageHeader } from "@/features/parent/ui";
import { RoutineBuilder } from "@/features/parent/routines/routine-builder";
import { db } from "@/lib/db";
import { requireParent } from "@/server/auth/guards";
import { TEMPLATES } from "@/server/catalog/templates";
import { selectedChild } from "@/server/queries/selected-child";

export async function generateMetadata() {
  return { title: (await getT())("parent.routines.meta") };
}

export default async function RoutinesPage() {
  const { family } = await requireParent();
  const t = await getT();
  const { child } = await selectedChild(family.id);
  if (!child) return <NoChild />;
  const routines = await db.routine.findMany({
    where: { childId: child.id },
    include: { tasks: { orderBy: [{ sortOrder: "asc" }, { time: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div>
      <PageHeader title={t("parent.routines.title", { name: child.name })} subtitle={t("parent.routines.subtitle")} />
      <RoutineBuilder
        childId={child.id}
        childName={child.name}
        templates={TEMPLATES.map(({ key, name, icon, description }) => ({ key, name, icon, description }))}
        routines={routines.map((r) => ({
          id: r.id,
          name: r.name,
          icon: r.icon,
          category: r.category,
          isActive: r.isActive,
          daysMask: r.daysMask,
          tasks: r.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            icon: t.icon,
            time: t.time,
            kind: t.kind,
            difficulty: t.difficulty,
            xp: t.xp,
            coins: t.coins,
            isRequired: t.isRequired,
            isActive: t.isActive,
            daysMask: t.daysMask,
            prayerName: t.prayerName,
            quranMinutes: t.quranMinutes,
            quranPages: t.quranPages,
            quranSurah: t.quranSurah,
          })),
        }))}
      />
    </div>
  );
}
