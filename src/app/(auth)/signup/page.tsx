import { getT } from "@/i18n/server";
import { SignupForm } from "@/features/auth/auth-forms";

export async function generateMetadata() {
  return { title: (await getT())("auth.titleSignup") };
}

export default function SignupPage() {
  return (
    <div className="card-magic p-5 sm:p-7">
      <SignupForm />
    </div>
  );
}
