import { getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { dayPart, hourIn } from "@/lib/dates";
import { requireChild } from "@/server/auth/guards";
import { loadToday } from "@/server/queries/child";
import { TodayBoard } from "@/features/child/today-board";

export async function generateMetadata() {
  return { title: (await getT())("child.nav.today") };
}

export default async function TodayPage() {
  const { child, family } = await requireChild();
  if (!child.welcomedAt) redirect("/child/welcome");
  const [today, notices] = await Promise.all([
    loadToday(child.id, family.timezone),
    db.notification.findMany({
      where: { childId: child.id, readAt: null, type: { in: ["REWARD_APPROVED", "REWARD_REJECTED"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);
  if (notices.length) {
    await db.notification.updateMany({ where: { id: { in: notices.map((n) => n.id) } }, data: { readAt: new Date() } });
  }
  return (
    <TodayBoard
      name={child.name}
      part={dayPart(hourIn(family.timezone))}
      routines={today.routines}
      chests={today.chests}
      notices={notices.map((n) => ({ id: n.id, title: n.title }))}
    />
  );
}
