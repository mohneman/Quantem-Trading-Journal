import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { MenuButton } from "./Sidebar";

function sessionDates() {
  const d = new Date();
  return {
    long: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    short: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  };
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
  dateLabel = "SESSION DATE",
  dateText,
  sticky = true,
  onMenu,
  className = "",
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  action?: ReactNode;
  dateLabel?: string;
  dateText?: string;
  sticky?: boolean;
  onMenu: () => void;
  className?: string;
}) {
  const dates = sessionDates();

  return (
    <header
      className={`page-header z-20 mb-4 px-3 py-3 sm:mb-5 sm:px-5 sm:py-4 ${
        sticky ? "sticky top-3 sm:top-4" : "shrink-0"
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-4">
        <MenuButton onClick={onMenu} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-ink dark:text-white sm:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted sm:text-sm">{subtitle}</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-white px-2.5 py-2 shadow-soft ring-1 ring-black/[0.04] sm:px-3.5 dark:bg-white/5 dark:ring-white/10">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint sm:text-[10px]">
            {dateLabel}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <CalendarDays size={14} className="shrink-0 text-brand" strokeWidth={1.75} />
            <p className="whitespace-nowrap text-xs font-semibold text-ink dark:text-white sm:text-sm">
              <span className="sm:hidden">{dateText ? dateText : dates.short}</span>
              <span className="hidden sm:inline">{dateText ?? dates.long}</span>
            </p>
          </div>
        </div>
      </div>
      {(eyebrow || action) && (
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3 sm:mt-4">
          <div>
            {eyebrow ? (
              <span className="mb-2 inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                {eyebrow}
              </span>
            ) : null}
          </div>
          {action}
        </div>
      )}
    </header>
  );
}
