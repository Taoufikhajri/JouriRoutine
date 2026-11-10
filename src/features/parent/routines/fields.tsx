"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { daysFromMask } from "@/lib/days-mask";

const ICONS = ["⭐", "🌞", "🛏️", "🚿", "🦷", "👕", "🥣", "🎒", "🏫", "🕌", "📖", "🤲", "📚", "✏️", "🧸", "🎨", "❤️", "🧹", "🍽️", "🥛", "🚲", "⚽", "😴", "🌙", "🙏", "💝", "🧠", "🏠", "🐾", "🎵"];

export function IconField({ name, defaultValue, error }: { name: string; defaultValue: string; error?: string[] }) {
  const t = useT();
  const [value, setValue] = useState(defaultValue);
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-bold">{t("parent.routines.editor.icon")}</legend>
      <div className="flex items-center gap-3">
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={16}
          aria-label={t("parent.routines.editor.iconAria")}
          className="h-14 w-16 rounded-2xl border-2 border-ink/10 text-center text-3xl focus:border-magic focus:outline-none"
        />
        <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto py-1">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setValue(i)}
              className={cn("shrink-0 rounded-xl p-1.5 text-2xl hover:bg-ink/5", value === i && "bg-lilac/30")}
              aria-label={t("parent.routines.editor.useIcon", { icon: i })}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
      {error?.[0] && <p className="mt-1 text-sm font-semibold text-[#c2334a]">{error[0]}</p>}
    </fieldset>
  );
}

export function DaysField({ defaultMask, error }: { defaultMask: number; error?: string[] }) {
  const t = useT();
  const initial = new Set(daysFromMask(defaultMask));
  // Monday-first display
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-bold">{t("parent.routines.editor.repeat")}</legend>
      <div className="flex flex-wrap gap-1.5">
        {order.map((d) => (
          <label key={d} className="cursor-pointer">
            <input type="checkbox" name="days" value={d} defaultChecked={initial.has(d)} className="peer sr-only" />
            <span className="inline-flex h-10 min-w-12 items-center justify-center rounded-xl border-2 border-ink/10 px-2 text-sm font-bold text-ink-soft peer-checked:border-magic peer-checked:bg-magic peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-magic">
              {t.messages.days[d]}
            </span>
          </label>
        ))}
      </div>
      {error?.[0] && <p className="mt-1 text-sm font-semibold text-[#c2334a]">{error[0]}</p>}
    </fieldset>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-mint" : "bg-ink/20")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5")} />
    </button>
  );
}
