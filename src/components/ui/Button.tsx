import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "gradient" | "ghost" | "danger" | "danger-outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  gradient: "btn-gradient",
  ghost: "btn-ghost",
  danger: "btn bg-loss text-white hover:bg-red-600",
  "danger-outline":
    "btn border border-loss/40 bg-white text-loss hover:bg-loss-soft dark:bg-transparent dark:hover:bg-loss/10",
};

export function Button({
  variant = "primary",
  icon,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button className={`${variants[variant]} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
}
