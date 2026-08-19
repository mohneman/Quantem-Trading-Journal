import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Eye,
  Layers,
  Medal,
  Pencil,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { useMenu } from "../hooks";
import { useModal } from "../context/ModalContext";
import { useStore, type Trade, type TradeOutcome } from "../store";
import { TODAY_ISO } from "../data";
import { formatPnl } from "../lib";

const ranges = ["All Time", "Last 7 days", "Last 14 days", "Last 30 days", "Last 90 days", "Custom"] as const;

const statusOptions = [
  { label: "All Status", value: "All Status" },
  { label: "Win", value: "WIN" },
  { label: "Loss", value: "LOSS" },
  { label: "BE", value: "BE" },
  { label: "Open", value: "OPEN" },
];

function cutoff(range: string) {
  if (range === "All Time" || range === "Custom") return "2000-01-01";
  const n = Number(range.replace(/\D/g, "")) || 30;
  const d = new Date(`${TODAY_ISO}T12:00:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function outcomeLabel(outcome: TradeOutcome) {
  if (outcome === "WIN") return "Win";
  if (outcome === "LOSS") return "Loss";
  if (outcome === "BE") return "BE";
  return "Open";
}

function gradeTone(grade: string) {
  if (grade === "A+" || grade === "A") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (grade === "B") return "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
  if (grade === "C") return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-rose-50 text-loss dark:bg-red-500/15 dark:text-red-300";
}

export function TradesPage() {
  const onMenu = useMenu();
  const { setOpen } = useModal();
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [range, setRange] = useState<(typeof ranges)[number]>("All Time");
  const [grade, setGrade] = useState("All Grades");
  const [status, setStatus] = useState("All Status");
  const [pair, setPair] = useState("All Pairs");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const trades = data.trades.filter((t) => {
    if (range === "Custom") {
      if (customFrom && t.date < customFrom) return false;
      if (customTo && t.date > customTo) return false;
    } else if (t.date < cutoff(range)) {
      return false;
    }
    if (q && !`${t.symbol} ${t.notes} ${t.no} ${t.psychology.join(" ")}`.toLowerCase().includes(q.toLowerCase())) {
      return false;
    }
    if (grade !== "All Grades" && t.grade !== grade) return false;
    if (status !== "All Status" && t.outcome !== status) return false;
    if (pair !== "All Pairs" && t.symbol !== pair) return false;
    return true;
  });
  const wins = trades.filter((t) => t.outcome === "WIN").length;
  const losses = trades.filter((t) => t.outcome === "LOSS").length;
  const aplus = trades.filter((t) => t.grade === "A+").length;
  const pairs = Array.from(new Set(data.trades.map((t) => t.symbol).filter(Boolean)));

  return (
    <div>
      <PageHeader
        title="Trading Journal Archive"
        subtitle="Filter, compare, and review your complete execution history."
        onMenu={onMenu}
      />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              TRADING SETUP
            </span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">Trade Journal</h2>
            <p className="mt-1 text-sm text-ink-muted">Track your day, A+ setups, psychology, and performance.</p>
          </div>
          <button
            className="btn-gradient shadow-[0_8px_22px_rgba(0,209,193,0.28)] hover:shadow-[0_12px_28px_rgba(124,108,240,0.28)]"
            onClick={() => setOpen("trade")}
          >
            <Plus size={16} /> Add Trade
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Total Trades"
            value={trades.length}
            icon={<Layers size={16} />}
            tint="from-teal-50 to-emerald-50"
            iconBg="bg-brand/15 text-brand"
            valueClass="text-brand-700 dark:text-brand"
          />
          <Kpi
            label="Won"
            value={wins}
            icon={<TrendingUp size={16} />}
            tint="from-sky-50 to-indigo-50"
            iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
            valueClass="text-emerald-600"
          />
          <Kpi
            label="Loss"
            value={losses}
            icon={<TrendingDown size={16} />}
            tint="from-orange-50 to-rose-50"
            iconBg="bg-red-100 text-loss dark:bg-red-500/20"
            valueClass="text-loss"
          />
          <Kpi
            label="A+ Trades"
            value={aplus}
            icon={<Medal size={16} />}
            tint="from-lime-50 to-yellow-50"
            iconBg="bg-amber-100 text-amber-500 dark:bg-amber-500/20"
            valueClass="text-amber-500"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-brand/15 bg-teal-50/70 p-3 dark:border-brand/20 dark:bg-brand/5">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input border-brand/10 bg-white/90 pl-10 dark:bg-[#151a21]"
              placeholder="Search by pair or notes..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Filter value={grade} onChange={setGrade} options={["All Grades", "A+", "A", "B", "C", "F"]} />
            <select
              className="h-9 rounded-full bg-white/80 px-3 text-xs font-medium text-ink shadow-soft transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-slate-100"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Filter value={pair} onChange={setPair} options={["All Pairs", ...pairs]} />
            <div className="flex flex-wrap gap-1.5 sm:ml-auto">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`filter-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    range === r
                      ? "bg-brand text-white shadow-soft"
                      : "bg-white/80 text-ink-muted hover:bg-white dark:bg-white/10 dark:text-slate-300"
                  }`}
                >
                  {r === "Custom" ? <CalendarDays size={12} /> : null}
                  {r}
                </button>
              ))}
            </div>
          </div>
          {range === "Custom" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="label">Start Date</span>
                <input className="input h-10" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </label>
              <label className="block">
                <span className="label">End Date</span>
                <input className="input h-10" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </label>
            </div>
          ) : null}
        </div>

        {data.trades.length === 0 ? (
          <EmptyState onAdd={() => setOpen("trade")} />
        ) : trades.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line py-14 text-center dark:border-[#243041]">
            <p className="font-semibold dark:text-white">No trades match your filters</p>
            <p className="mt-1 text-sm text-ink-muted">Try a different search, grade, status, pair, or date range.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="trade-table min-w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <tr>
                  {["TRADE NO", "DATE", "PAIR/DIR", "SESSION", "GRADE", "CONFLUENCES", "PSYCHOLOGY", "STATUS", "P&L", "ACTIONS"].map((h) => (
                    <th key={h} className="px-4 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <TradeRow key={t.id} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TradeRow({ t }: { t: Trade }) {
  const { setOpen } = useModal();
  const checked = t.rules.filter((r) => r.checked).length;
  const dots = Math.max(5, t.rules.length);
  return (
    <tr className="trade-row bg-white dark:bg-[#1b2330]">
      <td className="rounded-l-2xl px-4 py-3.5 font-semibold dark:text-white">#{t.no}</td>
      <td className="px-4 py-3.5 text-ink-muted">{t.date}</td>
      <td className="px-4 py-3.5">
        <p className="font-semibold dark:text-white">{t.symbol || "—"}</p>
        <p className={`text-xs font-medium ${t.direction === "Sell" ? "text-loss" : "text-brand"}`}>
          {t.direction || "—"}
        </p>
      </td>
      <td className="px-4 py-3.5 text-ink-muted">{t.session || "—"}</td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${gradeTone(t.grade)}`}>
          {t.grade}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(dots, 5) }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${i < checked ? "bg-brand shadow-[0_0_0_3px_rgba(0,209,193,0.16)]" : "bg-slate-200 dark:bg-white/15"}`}
            />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-ink-faint">{checked}/{t.rules.length || 5} matched</p>
      </td>
      <td className="px-4 py-3.5">
        {t.psychology.length ? (
          <div className="flex flex-wrap gap-1">
            {t.psychology.map((p) => (
              <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-ink-muted dark:bg-white/10">
                {p}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${
            t.outcome === "WIN"
              ? "bg-emerald-500"
              : t.outcome === "LOSS"
                ? "bg-[#F07167]"
                : t.outcome === "BE"
                  ? "bg-amber-400"
                  : "bg-slate-400"
          }`}
        >
          {outcomeLabel(t.outcome)}
        </span>
      </td>
      <td className={`px-4 py-3.5 font-semibold ${t.pnl > 0 ? "text-emerald-600" : t.pnl < 0 ? "text-loss" : "text-ink-muted"}`}>
        {formatPnl(t.pnl)}
      </td>
      <td className="rounded-r-2xl px-4 py-3.5">
        <div className="flex items-center gap-1">
          {t.outcome === "OPEN" ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand transition hover:-translate-y-0.5 hover:bg-brand/15"
              onClick={() => setOpen("tradeOutcome", { tradeId: t.id })}
            >
              Log outcome
            </button>
          ) : null}
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand hover:shadow-soft dark:border-[#243041]"
            onClick={() => setOpen("tradeView", { tradeId: t.id })}
          >
            <Eye size={14} /> View
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-brand dark:hover:bg-white/10"
            onClick={() => setOpen("trade", { tradeId: t.id })}
          >
            <Pencil size={13} /> Edit
          </button>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-10 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-line text-center dark:border-[#243041]">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-gradient text-white shadow-soft">
        <Layers size={26} />
      </div>
      <h3 className="mt-4 text-xl font-semibold dark:text-white">No trades yet</h3>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        Log your first setup with checklist, psychology, and proof so you can review every execution later.
      </p>
      <button className="btn-gradient mt-5" onClick={onAdd}>
        <Plus size={16} /> Add your first trade
      </button>
    </div>
  );
}

function Filter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      className="h-9 rounded-full bg-white/80 px-3 text-xs font-medium text-ink shadow-soft transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-slate-100"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function useAnimatedNumber(target: number, duration = 420) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Kpi({
  label,
  value,
  icon,
  tint,
  iconBg,
  valueClass,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tint: string;
  iconBg: string;
  valueClass: string;
}) {
  const n = useAnimatedNumber(value);
  return (
    <article className={`trade-kpi rounded-2xl bg-gradient-to-br p-4 shadow-soft ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-full ${iconBg}`}>{icon}</div>
      <p className={`text-xs font-medium ${valueClass}`}>{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{Math.round(n)}</p>
    </article>
  );
}
