import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { TODAY_LABEL } from "../../data";
import { MenuButton } from "./Sidebar";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
  dateLabel = "SESSION DATE",
  dateText = TODAY_LABEL,
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
  return (
    <header
      className={`page-header z-20 mb-5 px-4 py-4 sm:mb-6 sm:px-6 sm:py-5 ${
        sticky ? "sticky top-3 sm:top-4" : "shrink-0"
      } ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <MenuButton onClick={onMenu} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-[1.75rem]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          </div>
        </div>
        <div className="shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {dateLabel}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <CalendarDays size={15} className="text-brand" strokeWidth={1.75} />
            <p className="text-sm font-medium text-ink dark:text-white">{dateText}</p>
          </div>
        </div>
      </div>
      {(eyebrow || action) && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
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
