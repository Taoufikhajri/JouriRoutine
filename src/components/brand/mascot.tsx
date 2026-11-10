import { APP } from "@/config/app";
import { cn } from "@/lib/cn";

/** "Noor", the original star guide of Little Star Adventure. */
export function Mascot({ className, mood = "happy" }: { className?: string; mood?: "happy" | "wow" | "sleepy" }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("drop-shadow-lg", className)} role="img" aria-label="Noor the star">
      <defs>
        <linearGradient id="mascot-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe68a" />
          <stop offset="1" stopColor="#ffb703" />
        </linearGradient>
      </defs>
      <path
        d="M60 8l14.5 31 33.5 4-24.8 23 6.6 33.5L60 83 30.2 99.5 36.8 66 12 43l33.5-4z"
        fill="url(#mascot-g)"
        stroke="#fff"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {mood === "sleepy" ? (
        <>
          <path d="M44 56q5 4 10 0M66 56q5 4 10 0" stroke="#2a2154" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="49" cy="55" rx="4.5" ry={mood === "wow" ? 6 : 5} fill="#2a2154" />
          <ellipse cx="71" cy="55" rx="4.5" ry={mood === "wow" ? 6 : 5} fill="#2a2154" />
          <circle cx="50.5" cy="53" r="1.6" fill="#fff" />
          <circle cx="72.5" cy="53" r="1.6" fill="#fff" />
        </>
      )}
      {mood === "wow" ? (
        <ellipse cx="60" cy="69" rx="5" ry="6" fill="#2a2154" />
      ) : (
        <path d="M51 66q9 8 18 0" stroke="#2a2154" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}
      <circle cx="41" cy="64" r="4.5" fill="#ff7a8a" opacity=".55" />
      <circle cx="79" cy="64" r="4.5" fill="#ff7a8a" opacity=".55" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-extrabold", className)}>
      <Mascot className="size-9" />
      <span>{APP.name}</span>
    </span>
  );
}
