import { getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { MagicSky } from "@/components/brand/magic-sky";
import { Logo } from "@/components/brand/mascot";
import { OnboardingWizard } from "@/features/parent/onboarding-wizard";
import { requireParent } from "@/server/auth/guards";
import { DEFAULT_REWARDS } from "@/server/catalog/rewards";
import { TEMPLATES } from "@/server/catalog/templates";

export async function generateMetadata() {
  return { title: (await getT())("parent.onboarding.meta") };
}

export default async function OnboardingPage() {
  const { family } = await requireParent();
  if (family.onboardedAt) redirect("/parent");
  return (
    <main className="relative flex min-h-dvh flex-col items-center px-4 pb-24 pt-8">
      <MagicSky part="morning" />
      <Logo className="mb-6 text-2xl" />
      <div className="w-full max-w-xl">
        <OnboardingWizard
          defaultFamilyName={family.name}
          templates={TEMPLATES.map(({ key, name, icon, description }) => ({ key, name, icon, description }))}
          rewards={DEFAULT_REWARDS}
        />
      </div>
    </main>
  );
}
