import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  xl?: boolean;
  dark?: boolean;
  stacked?: boolean;
  icon?: ReactNode;
  action?: ReactNode;
  glow?: boolean;
  muted?: boolean;
};

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide,
  xl,
  dark,
  stacked,
  icon,
  action,
  glow,
  muted,
}: Props) {
  return (
    <div className={`animate-overlay-in fixed inset-0 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 py-8 backdrop-blur-[5px] sm:p-8 ${stacked ? "z-[70]" : "z-50"}`}>
      <button
        aria-label="Close overlay"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={`animate-modal-in relative z-10 w-full overflow-hidden rounded-2xl shadow-modal ${
          dark ? "bg-[#2A3038] text-white" : "bg-white dark:bg-[#151a21]"
        } ${xl ? "max-w-6xl" : wide ? "max-w-3xl" : "max-w-xl"}`}
      >
        <header
          className={`relative flex items-start justify-between gap-4 border-b px-6 py-5 ${
            dark ? "border-white/10" : "border-line dark:border-[#243041]"
          }`}
        >
          {glow ? (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-teal-100/80 via-violet-50 to-transparent dark:from-brand/15 dark:via-violet-500/10 dark:to-transparent" />
          ) : null}
          <div className="relative flex items-start gap-3">
            {icon}
            <div>
              <h2 className={`text-lg font-semibold ${dark ? "text-white" : "text-ink dark:text-white"}`}>{title}</h2>
              {subtitle ? (
                <p className={`mt-1 text-sm ${dark ? "text-slate-300" : "text-ink-muted"}`}>{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            {action}
            <button
              aria-label="Close"
              onClick={onClose}
              className={`rounded-full p-1.5 ${dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "bg-slate-100 text-ink-faint hover:bg-slate-200 hover:text-ink dark:bg-white/10 dark:hover:bg-white/15"}`}
            >
              <X size={18} />
            </button>
          </div>
        </header>
        <div className={`px-6 py-5 ${muted ? "bg-slate-50 dark:bg-[#10151c]" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
