import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-2xl border-2 border-ink/10 bg-white px-4 text-base text-ink placeholder:text-ink-soft/60 transition-colors focus:border-magic focus:outline-none aria-[invalid=true]:border-coral";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(fieldBase, "h-12", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, "min-h-20 py-3", className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(fieldBase, "h-12 appearance-none bg-[length:1rem] pr-8", className)} {...p} />;
});

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string[] | string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const err = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {err ? (
        <p className="text-sm font-semibold text-[#c2334a]" role="alert">
          {err}
        </p>
      ) : hint ? (
        <p className="text-sm text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const tones = {
    error: "bg-[#ffe3e7] text-[#9b1c31] border-[#ffb3bf]",
    success: "bg-[#dcf8ec] text-[#11603f] border-[#a6e9cc]",
    info: "bg-[#ece8ff] text-[#3d2a99] border-[#cfc4ff]",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-2xl border-2 px-4 py-3 text-sm font-semibold", tones[tone])}>
      {children}
    </div>
  );
}
