import { MagicSky } from "@/components/brand/magic-sky";
import { BottomNav } from "@/features/child/bottom-nav";
import { GameProvider } from "@/features/child/game/game-provider";
import { Hud } from "@/features/child/hud";
import { db } from "@/lib/db";
import { dayPart, hourIn } from "@/lib/dates";
import { requireChild } from "@/server/auth/guards";
import { refreshChildDay } from "@/server/queries/child";
import { equippedLook } from "@/server/queries/look";

export default async function ChildLayout({ children }: LayoutProps<"/child">) {
  const { child: sessionChild, family } = await requireChild();
  const { streak } = await refreshChildDay(sessionChild.id, family.timezone);
  const [child, look, pending] = await Promise.all([
    db.childProfile.findUniqueOrThrow({ where: { id: sessionChild.id } }),
    equippedLook(sessionChild.id),
    db.rewardRedemption.count({ where: { childId: sessionChild.id, status: "PENDING" } }),
  ]);
  const part = dayPart(hourIn(family.timezone));

  return (
    <GameProvider childName={child.name} soundOn={family.soundEnabled} volume={family.soundVolume}>
      <MagicSky part={part} />
      <div className="min-h-dvh pb-32">
        <Hud xp={child.xp} coins={child.coins} streak={streak} avatarKey={child.avatarKey} look={look} />
        <main className="mx-auto max-w-3xl px-3 pt-4 sm:px-5">{children}</main>
      </div>
      <BottomNav pendingBadge={pending} />
    </GameProvider>
  );
}
