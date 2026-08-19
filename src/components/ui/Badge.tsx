type Props = {
  children: string;
  tone?: "win" | "loss" | "neutral" | "grade" | "buy" | "sell";
};

const tones: Record<NonNullable<Props["tone"]>, string> = {
  win: "bg-emerald-500 text-white",
  loss: "bg-[#F07167] text-white",
  neutral: "bg-slate-100 text-ink-muted",
  grade: "bg-emerald-50 text-emerald-700",
  buy: "bg-brand/10 text-brand-700",
  sell: "bg-violet-50 text-purple-brand",
};

export function Badge({ children, tone = "neutral" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
