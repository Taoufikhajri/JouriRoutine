import { getT } from "@/i18n/server";
import { PageHeader } from "@/features/parent/ui";
import { SettingsForms } from "@/features/parent/settings-forms";
import { isLocale } from "@/i18n";
import { requireParent } from "@/server/auth/guards";

export async function generateMetadata() {
  return { title: (await getT())("parent.settings.meta") };
}

export default async function SettingsPage() {
  const { family, user } = await requireParent();
  const t = await getT();
  return (
    <div>
      <PageHeader title={t("parent.settings.title")} />
      <SettingsForms
        family={{ name: family.name, timezone: family.timezone, soundEnabled: family.soundEnabled, soundVolume: family.soundVolume, loginCode: family.loginCode, locale: isLocale(family.locale) ? family.locale : "en" }}
        email={user.email ?? ""}
      />
    </div>
  );
}
