import { getT } from "@/i18n/server";
import { ForgotForm } from "@/features/auth/auth-forms";

export async function generateMetadata() {
  return { title: (await getT())("auth.titleForgot") };
}

export default function ForgotPage() {
  return (
    <div className="card-magic p-5 sm:p-7">
      <ForgotForm />
    </div>
  );
}
