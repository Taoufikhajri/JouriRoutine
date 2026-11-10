import { MagicSky } from "@/components/brand/magic-sky";
import { Logo } from "@/components/brand/mascot";
import { LanguageSwitcher } from "@/features/auth/language-switcher";
import { getT } from "@/i18n/server";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getT();
  return (
    <main className="relative flex min-h-dvh flex-col items-center px-4 pb-24 pt-8">
      <MagicSky part="morning" />
      <Logo className="text-2xl text-ink" />
      <p className="mt-1 max-w-md text-center text-sm font-semibold text-ink-soft">{t("app.subtitle")}</p>
      <div className="mt-4">
        <LanguageSwitcher />
      </div>
      <div className="mt-4 w-full max-w-md">{children}</div>
    </main>
  );
}
