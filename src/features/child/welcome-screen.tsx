"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useTransition } from "react";
import { Mascot } from "@/components/brand/mascot";
import { Button } from "@/components/ui/button";
import { AvatarView, type EquippedLook } from "@/features/avatar/avatar-view";
import { useT } from "@/i18n/client";
import { markWelcomedAction } from "@/server/actions/child";
import { useGame } from "./game/game-provider";

export function WelcomeScreen({ name, avatarKey, look }: { name: string; avatarKey: string; look: EquippedLook }) {
  const router = useRouter();
  const { play } = useGame();
  const t = useT();
  const [pending, start] = useTransition();
  const go = () =>
    start(async () => {
      play("welcome");
      await markWelcomedAction();
      router.push("/child/today");
    });

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }}>
        <Mascot className="mx-auto size-24 animate-float" mood="wow" />
      </motion.div>
      <motion.div className="card-magic mt-4 w-full max-w-md p-6" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h1 className="font-display text-3xl font-extrabold">{t("child.welcome.title", { name })}</h1>
        <p className="mt-1 font-display text-xl font-bold text-magic-dark">{t("child.welcome.subtitle")}</p>
        <motion.div className="my-5 flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}>
          <AvatarView avatarKey={avatarKey} look={look} size="xl" />
        </motion.div>
        <p className="font-semibold text-ink-soft">{t("child.welcome.body")}</p>
        <div className="mt-4 flex justify-center gap-3 text-4xl" aria-hidden>
          <span>⭐</span>
          <span>🪙</span>
          <span>🎁</span>
          <span>🏆</span>
        </div>
        <Button size="xl" variant="sun" pop className="mt-6 w-full" onClick={go} loading={pending}>
          {t("child.welcome.start")} 🚀
        </Button>
      </motion.div>
    </div>
  );
}
