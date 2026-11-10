import { Alert } from "@/components/ui/form";
import { getT } from "@/i18n/server";
import { ResetForm } from "@/features/auth/auth-forms";

export async function generateMetadata() {
  return { title: (await getT())("auth.titleReset") };
}

export default async function ResetPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const t = await getT();
  return (
    <div className="card-magic p-5 sm:p-7">
      {typeof token === "string" && token ? <ResetForm token={token} /> : <Alert>{t("auth.resetInvalid")}</Alert>}
    </div>
  );
}
