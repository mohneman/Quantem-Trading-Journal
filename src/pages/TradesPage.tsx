import { useState } from "react";
import { Eye, Medal, Plus, Search, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/Badge";
import { useMenu } from "../hooks";
import { useModal } from "../context/ModalContext";
import { useStore } from "../store";
import { TODAY_ISO } from "../data";

const ranges = ["All Time", "Last 7 days", "Last 14 days", "Last 30 days", "Last 90 days"] as const;

function cutoff(range: string) {
  if (range === "All Time") return "2000-01-01";
  const n = Number(range.replace(/\D/g, "")) || 30;
  const d = new Date(`${TODAY_ISO}T12:00:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
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

  const trades = data.trades.filter((t) => {
    if (t.date < cutoff(range)) return false;
    if (q && !`${t.symbol} ${t.notes} ${t.no}`.toLowerCase().includes(q.toLowerCase())) return false;
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
          </div>
          <button className="btn-primary" onClick={() => setOpen("trade")}>
            <Plus size={16} /> Add Trade
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Mini label="Total Trades" value={String(trades.length)} icon={<Medal size={16} />} tint="from-teal-50 to-emerald-50" />
          <Mini label="Win" value={String(wins)} icon={<TrendingUp size={16} />} tint="from-sky-50 to-indigo-50" />
          <Mini label="Loss" value={String(losses)} icon={<TrendingDown size={16} />} tint="from-orange-50 to-amber-50" />
          <Mini label="A+ Trades" value={String(aplus)} icon={<Medal size={16} />} tint="from-yellow-50 to-lime-50" />
        </div>

        <div className="relative mt-5">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="input pl-10" placeholder="Search by pair or notes..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Filter value={grade} onChange={setGrade} options={["All Grades", "A+", "A", "B", "C", "F"]} />
          <Filter value={status} onChange={setStatus} options={["All Status", "WIN", "LOSS", "BE", "OPEN"]} />
          <Filter value={pair} onChange={setPair} options={["All Pairs", ...pairs]} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${range === r ? "bg-brand text-white" : "bg-slate-100 text-ink-muted dark:bg-white/10"}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-line text-xs uppercase tracking-wide text-ink-faint dark:border-[#243041]">
              <tr>
                {["TRADE NO", "DATE", "PAIR/DIR", "SESSION", "GRADE", "CONFLUENCES", "PSYCHOLOGY", "STATUS", "ACTIONS"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0 dark:border-[#243041]">
                  <td className="px-4 py-3">#{t.no}</td>
                  <td className="px-4 py-3 text-ink-muted">{t.date}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold dark:text-white">{t.symbol || "—"}</p>
                    <p className="text-xs text-brand">{t.direction || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.session || "—"}</td>
                  <td className="px-4 py-3"><Badge tone="grade">{t.grade}</Badge></td>
                  <td className="px-4 py-3">
                    <p className="text-amber-500">{"★".repeat(Math.min(5, t.rules.filter((r) => r.checked).length))}</p>
                    <p className="text-[11px] text-ink-faint">{t.rules.filter((r) => r.checked).length}/{t.rules.length} matched</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.psychology.join(", ") || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={t.outcome === "WIN" ? "win" : t.outcome === "LOSS" ? "loss" : "neutral"}>{t.outcome}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand" onClick={() => setOpen("tradeView", { tradeId: t.id })}>
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Filter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-ink dark:bg-white/10 dark:text-slate-100" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function Mini({ label, value, icon, tint }: { label: string; value: string; icon: React.ReactNode; tint: string }) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br p-4 ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className="mb-3 text-brand">{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold dark:text-white">{value}</p>
    </article>
  );
}
