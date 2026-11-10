import { getT } from "@/i18n/server";
import { requireChild } from "@/server/auth/guards";
import { equippedLook } from "@/server/queries/look";
import { WelcomeScreen } from "@/features/child/welcome-screen";

export async function generateMetadata() {
  return { title: (await getT())("child.welcome.subtitle") };
}

export default async function WelcomePage() {
  const { child } = await requireChild();
  return <WelcomeScreen name={child.name} avatarKey={child.avatarKey} look={await equippedLook(child.id)} />;
}
