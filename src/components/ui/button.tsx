"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-magic text-white hover:bg-magic-dark",
  sun: "bg-sun text-ink hover:bg-sun-dark",
  mint: "bg-mint text-white hover:bg-mint-dark",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  outline: "bg-white text-ink border-2 border-ink/10 hover:border-magic/40",
  danger: "bg-coral text-white hover:bg-[#f0566a]",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-5 text-base rounded-2xl",
  lg: "h-14 px-7 text-lg rounded-2xl",
  xl: "h-16 px-8 text-xl rounded-3xl font-display",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  pop?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", pop, loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        pop && "btn-pop",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

/** Submit button that shows a spinner while its parent <form> is pending. */
export function SubmitButton(props: ButtonProps) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending} {...props} />;
}
