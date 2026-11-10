"use client";

import { startTransition, useActionState, useState } from "react";
import { Delete } from "lucide-react";
import { motion } from "motion/react";
import { Button, SubmitButton } from "@/components/ui/button";
import { Alert, Input } from "@/components/ui/form";
import { AvatarView, type EquippedLook } from "@/features/avatar/avatar-view";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { childLoginAction, forgetFamilyAction, rememberFamilyAction } from "@/server/actions/auth";

interface KidOption {
  id: string;
  name: string;
  avatarKey: string;
  loginMode: "PIN" | "PASSWORD";
  look: EquippedLook;
}

export function KidLogin({ family }: { family: { name: string; children: KidOption[] } | null }) {
  const t = useT();
  const [picked, setPicked] = useState<KidOption | null>(family?.children.length === 1 ? family.children[0] : null);

  if (!family) return <FamilyCodeForm />;

  if (!picked) {
    return (
      <div>
        <h1 className="mb-4 text-center font-display text-2xl font-bold">{t("auth.whoAreYou")}</h1>
        <div className="flex flex-wrap justify-center gap-4">
          {family.children.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPicked(c)}
              className="btn-pop flex w-40 flex-col items-center gap-2 rounded-3xl bg-white p-4 ring-2 ring-ink/5 hover:ring-magic/40"
            >
              <AvatarView avatarKey={c.avatarKey} look={c.look} size="lg" />
              <span className="font-display text-xl font-bold">{c.name}</span>
            </button>
          ))}
        </div>
        <ForgetFamily />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <AvatarView avatarKey={picked.avatarKey} look={picked.look} size="lg" />
      </motion.div>
      <p className="mt-2 font-display text-2xl font-bold">{picked.name}</p>
      {picked.loginMode === "PIN" ? <PinPad childId={picked.id} /> : <PasswordForm childId={picked.id} />}
      {family.children.length > 1 && (
        <button type="button" onClick={() => setPicked(null)} className="mt-4 text-sm font-bold text-ink-soft underline">
          {t.dir === "rtl" ? "→" : "←"} {t("auth.whoAreYou")}
        </button>
      )}
      <ForgetFamily />
    </div>
  );
}

function FamilyCodeForm() {
  const t = useT();
  const [state, action] = useActionState(rememberFamilyAction, {});
  return (
    <form action={action} className="space-y-4 text-center">
      <div className="text-6xl" aria-hidden>
        🏰
      </div>
      <label htmlFor="code" className="block font-display text-xl font-bold">
        {t("auth.familyCode")}
      </label>
      {state.error && <Alert>{state.error}</Alert>}
      <Input
        id="code"
        name="code"
        required
        autoCapitalize="characters"
        placeholder="STAR-1234"
        className="h-16 text-center font-display text-2xl tracking-widest uppercase"
      />
      <p className="text-sm text-ink-soft">{t("auth.familyCodeHint")}</p>
      <SubmitButton size="xl" variant="sun" pop className="w-full">
        {t("auth.login")}
      </SubmitButton>
      {process.env.NODE_ENV !== "production" && (
        <p className="rounded-xl bg-sun/20 px-3 py-2 text-xs font-semibold text-ink-soft">🧪 {t("auth.devOnly")}: STAR-1234 · Jouri · PIN 1234</p>
      )}
    </form>
  );
}

function ForgetFamily() {
  const t = useT();
  return (
    <form action={forgetFamilyAction} className="mt-6 text-center">
      <button type="submit" className="text-xs font-semibold text-ink-soft underline">
        {t("auth.differentFamily")}
      </button>
    </form>
  );
}

function PinPad({ childId }: { childId: string }) {
  const t = useT();
  const [pin, setPin] = useState("");
  const [state, action, pending] = useActionState(childLoginAction, {});
  const [shakes, setShakes] = useState(0);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    // New server answer → shake the dots on a wrong PIN.
    setSeen(state);
    if (state.error) setShakes((n) => n + 1);
  }

  const press = (d: string) => {
    if (pending) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      const fd = new FormData();
      fd.set("childId", childId);
      fd.set("secret", next);
      startTransition(() => action(fd));
      setTimeout(() => setPin(""), 400);
    }
  };

  return (
    <form className="mt-4 w-full max-w-xs" onSubmit={(e) => e.preventDefault()}>
      <p className="mb-3 text-center font-bold text-ink-soft">{t("auth.enterPin")}</p>
      <motion.div
        key={shakes}
        animate={shakes ? { x: [0, -12, 12, -8, 8, 0] } : {}}
        className="mb-4 flex justify-center gap-3"
        aria-live="polite"
        aria-label={t("auth.pinProgress", { count: pin.length })}
        dir="ltr"
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl border-4 text-2xl transition-colors",
              i < pin.length ? "border-magic bg-magic text-white" : "border-ink/10 bg-white",
            )}
          >
            {i < pin.length ? "⭐" : ""}
          </span>
        ))}
      </motion.div>
      {state.error && <Alert>{state.error}</Alert>}
      <div className="mt-3 grid grid-cols-3 gap-3" dir="ltr">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PadKey key={d} onClick={() => press(d)} disabled={pending}>
            {d}
          </PadKey>
        ))}
        <span />
        <PadKey onClick={() => press("0")} disabled={pending}>
          0
        </PadKey>
        <PadKey onClick={() => setPin((p) => p.slice(0, -1))} disabled={pending} aria-label={t("common.delete")}>
          <Delete className="size-7" />
        </PadKey>
      </div>
    </form>
  );
}

function PadKey(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="btn-pop flex h-16 items-center justify-center rounded-2xl bg-white font-display text-3xl font-bold ring-2 ring-ink/5 active:bg-lilac/30 disabled:opacity-50"
      {...props}
    />
  );
}

function PasswordForm({ childId }: { childId: string }) {
  const t = useT();
  const [state, action] = useActionState(childLoginAction, {});
  return (
    <form action={action} className="mt-4 w-full max-w-xs space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state.error && <Alert>{state.error}</Alert>}
      <Input name="secret" type="password" aria-label={t("auth.password")} required className="h-14 text-center text-xl" />
      <Button type="submit" size="xl" variant="sun" pop className="w-full">
        {t("auth.login")}
      </Button>
    </form>
  );
}
