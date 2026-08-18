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
  onMenu,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  action?: ReactNode;
  dateLabel?: string;
  onMenu: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <MenuButton onClick={onMenu} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-white sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-2 dark:border-brand/30 dark:bg-brand/10">
          <CalendarDays size={16} className="text-brand" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">
              {dateLabel}
            </p>
            <p className="text-sm font-medium text-ink dark:text-white">{TODAY_LABEL}</p>
          </div>
        </div>
      </div>
      {(eyebrow || action) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
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
    </div>
  );
}
