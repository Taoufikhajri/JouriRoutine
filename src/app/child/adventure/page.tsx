import { getT } from "@/i18n/server";
import { requireChild } from "@/server/auth/guards";
import { loadToday } from "@/server/queries/child";
import { equippedLook } from "@/server/queries/look";
import { AdventureMap } from "@/features/child/adventure-map";

export async function generateMetadata() {
  return { title: (await getT())("child.map.title") };
}

export default async function AdventurePage() {
  const { child, family } = await requireChild();
  const [today, look] = await Promise.all([loadToday(child.id, family.timezone), equippedLook(child.id)]);
  return <AdventureMap routines={today.routines} avatarKey={child.avatarKey} look={look} />;
}
