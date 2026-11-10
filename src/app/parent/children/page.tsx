import { getT } from "@/i18n/server";
import { ChildrenManager } from "@/features/parent/children-manager";
import { PageHeader } from "@/features/parent/ui";
import { db } from "@/lib/db";
import { requireParent } from "@/server/auth/guards";
import { TEMPLATES } from "@/server/catalog/templates";

export async function generateMetadata() {
  return { title: (await getT())("parent.children.meta") };
}

export default async function ChildrenPage() {
  const { family } = await requireParent();
  const t = await getT();
  const kids = await db.childProfile.findMany({
    where: { familyId: family.id },
    include: { quranMemorizations: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return (
    <div>
      <PageHeader title={t("parent.children.title")} subtitle={t("parent.children.subtitle", { code: family.loginCode })} />
      <ChildrenManager
        templates={TEMPLATES.map((t) => ({ key: t.key, name: t.name }))}
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          age: k.age,
          avatarKey: k.avatarKey,
          loginMode: k.loginMode,
          quran: k.quranMemorizations.map((q) => ({ id: q.id, surah: q.surah, progress: q.progress })),
        }))}
      />
    </div>
  );
}
