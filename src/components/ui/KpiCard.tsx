import type { ReactNode } from "react";

const tones = {
  teal: "bg-brand/10 text-brand",
  yellow: "bg-amber-50 text-amber-500",
  red: "bg-loss-soft text-loss",
  slate: "bg-slate-100 text-ink-muted",
};

export function KpiCard({
  label,
  value,
  delta,
  icon,
  tone = "teal",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <article className="card flex items-start gap-3 p-4">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold tracking-tight text-ink">
          {value}
        </p>
        {delta ? (
          <p className="mt-0.5 truncate text-[11px] text-ink-faint">{delta}</p>
        ) : null}
      </div>
    </article>
  );
}
