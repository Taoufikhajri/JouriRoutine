import type { DayPart } from "@/lib/dates";
import { cn } from "@/lib/cn";

const STARS = [
  [8, 12, 1.2], [22, 6, 0.8], [35, 18, 1], [52, 9, 1.4], [68, 15, 0.9], [83, 7, 1.1], [92, 22, 0.8],
  [15, 30, 0.9], [44, 28, 0.7], [76, 32, 1], [60, 40, 0.8], [5, 45, 1],
] as const;

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 80" className={className} style={style} aria-hidden>
      <path
        d="M30 70h140a28 28 0 0 0 0-56 40 40 0 0 0-74-6 30 30 0 0 0-46 18A26 26 0 0 0 30 70z"
        fill="#fff"
        opacity=".9"
      />
    </svg>
  );
}

/** Decorative, animated sky that changes with the time of day. Purely visual. */
export function MagicSky({ part, className }: { part: DayPart; className?: string }) {
  const night = part === "evening";
  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", `sky-${part}`, className)} aria-hidden>
      {night ? (
        <>
          {STARS.map(([x, y, s], i) => (
            <span
              key={i}
              className="absolute animate-twinkle text-white"
              style={{ left: `${x}%`, top: `${y}%`, fontSize: `${s}rem`, animationDelay: `${(i % 5) * 0.4}s` }}
            >
              ✦
            </span>
          ))}
          <div className="absolute right-[8%] top-[6%] size-20 rounded-full bg-[#fff6c9] shadow-[0_0_60px_20px_rgba(255,246,201,0.45)] md:size-28">
            <div className="absolute right-[-12%] top-[-8%] size-full rounded-full bg-[#4a3d93]" />
          </div>
        </>
      ) : (
        <>
          <div className="absolute right-[6%] top-[4%] size-24 animate-float rounded-full bg-[#ffe066] shadow-[0_0_80px_30px_rgba(255,224,102,0.55)] md:size-32" />
          <Cloud className="absolute top-[8%] w-40 animate-drift md:w-56" style={{ animationDuration: "80s" }} />
          <Cloud className="absolute top-[22%] w-28 animate-drift opacity-80 md:w-40" style={{ animationDuration: "110s", animationDelay: "-40s" }} />
          <Cloud className="absolute top-[40%] w-24 animate-drift opacity-70" style={{ animationDuration: "130s", animationDelay: "-90s" }} />
        </>
      )}
      {/* rolling hills */}
      <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute bottom-0 h-40 w-full md:h-56">
        <path d="M0 120 C 240 40 480 40 720 110 S 1200 180 1440 90 V220 H0z" fill={night ? "#3d3486" : "#b9f0c9"} opacity=".9" />
        <path d="M0 170 C 300 110 600 200 900 150 S 1300 120 1440 160 V220 H0z" fill={night ? "#2c2566" : "#8fe3b0"} />
      </svg>
    </div>
  );
}
