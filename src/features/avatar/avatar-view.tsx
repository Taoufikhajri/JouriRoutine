import { AVATARS } from "@/server/catalog/avatars";
import { cn } from "@/lib/cn";

export interface EquippedLook {
  HAT?: string;
  ACCESSORY?: string;
  COMPANION?: string;
  FRAME?: string;
}

const SIZES = {
  sm: { box: "size-12", face: "text-2xl", hat: "text-base -top-2", acc: "text-sm", pet: "text-base", frame: "text-xs" },
  md: { box: "size-20", face: "text-4xl", hat: "text-2xl -top-3", acc: "text-lg", pet: "text-2xl", frame: "text-sm" },
  lg: { box: "size-32", face: "text-6xl", hat: "text-4xl -top-5", acc: "text-2xl", pet: "text-4xl", frame: "text-lg" },
  xl: { box: "size-44", face: "text-8xl", hat: "text-5xl -top-7", acc: "text-3xl", pet: "text-5xl", frame: "text-2xl" },
} as const;

export function avatarMeta(key: string) {
  return AVATARS.find((a) => a.key === key) ?? AVATARS[0];
}

/** Original character portrait: base character + equipped hat, item, companion and frame. */
export function AvatarView({
  avatarKey,
  look = {},
  size = "md",
  className,
  label,
}: {
  avatarKey: string;
  look?: EquippedLook;
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
}) {
  const a = avatarMeta(avatarKey);
  const s = SIZES[size];
  return (
    <div className={cn("relative inline-flex shrink-0", className)} role="img" aria-label={label ?? a.name}>
      <div
        className={cn("relative flex items-center justify-center rounded-full border-4 border-white shadow-soft", s.box)}
        style={{ background: `radial-gradient(circle at 30% 25%, #fff 0%, ${a.color} 65%)` }}
      >
        <span className={cn("leading-none", s.face)} aria-hidden>
          {a.emoji}
        </span>
        {look.HAT && (
          <span className={cn("absolute left-1/2 -translate-x-1/2 leading-none", s.hat)} aria-hidden>
            {look.HAT}
          </span>
        )}
        {look.FRAME && (
          <>
            <span className={cn("absolute -left-1 top-1 leading-none", s.frame)} aria-hidden>
              {look.FRAME}
            </span>
            <span className={cn("absolute -right-1 bottom-2 leading-none", s.frame)} aria-hidden>
              {look.FRAME}
            </span>
          </>
        )}
        {look.ACCESSORY && (
          <span className={cn("absolute -right-2 top-1/2 leading-none", s.acc)} aria-hidden>
            {look.ACCESSORY}
          </span>
        )}
      </div>
      {look.COMPANION && (
        <span className={cn("absolute -bottom-1 -left-3 animate-bob leading-none drop-shadow", s.pet)} aria-hidden>
          {look.COMPANION}
        </span>
      )}
    </div>
  );
}
