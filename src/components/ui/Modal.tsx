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
};

export function Modal({ title, subtitle, children, onClose, wide, xl, dark, stacked }: Props) {
  return (
    <div className={`fixed inset-0 flex items-start justify-center overflow-y-auto bg-slate-900/55 p-4 py-8 sm:p-8 ${stacked ? "z-[70]" : "z-50"}`}>
      <button
        aria-label="Close overlay"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full rounded-2xl shadow-modal ${
          dark ? "bg-[#2A3038] text-white" : "bg-white dark:bg-[#151a21]"
        } ${xl ? "max-w-5xl" : wide ? "max-w-3xl" : "max-w-xl"}`}
      >
        <header className={`flex items-start justify-between gap-4 border-b px-6 py-5 ${dark ? "border-white/10" : "border-line dark:border-[#243041]"}`}>
          <div>
            <h2 className={`text-lg font-semibold ${dark ? "text-white" : "text-ink dark:text-white"}`}>{title}</h2>
            {subtitle ? (
              <p className={`mt-1 text-sm ${dark ? "text-slate-300" : "text-ink-muted"}`}>{subtitle}</p>
            ) : null}
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className={`rounded-lg p-1.5 ${dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-ink-faint hover:bg-slate-50 hover:text-ink dark:hover:bg-white/10"}`}
          >
            <X size={18} />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
