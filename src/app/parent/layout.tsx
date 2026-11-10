import { redirect } from "next/navigation";
import { ParentNav } from "@/features/parent/parent-nav";
import { db } from "@/lib/db";
import { requireParent } from "@/server/auth/guards";
import { selectedChild } from "@/server/queries/selected-child";

export default async function ParentLayout({ children }: LayoutProps<"/parent">) {
  const { family, parent } = await requireParent();
  if (!family.onboardedAt) redirect("/onboarding");
  const [{ children: kids, child }, pending] = await Promise.all([
    selectedChild(family.id),
    db.rewardRedemption.count({ where: { status: "PENDING", child: { familyId: family.id } } }),
  ]);

  return (
    <div className="min-h-dvh bg-[#f6f4fb] lg:flex">
      <ParentNav kids={kids.map((k) => ({ id: k.id, name: k.name }))} selectedId={child?.id ?? null} pendingRewards={pending} displayName={parent.displayName} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
