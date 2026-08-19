import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Pencil,
  Plus,
  Trophy,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/Badge";
import { useMenu } from "../hooks";
import { formatPnl, journalPreview, parseRr, weekdayShort } from "../lib";
import { TODAY_ISO } from "../data";
import { useStore, type Trade } from "../store";
import { useModal } from "../context/ModalContext";

const ranges = ["30 days", "60 days", "90 days", "All"] as const;

export function DashboardPage() {
  const onMenu = useMenu();
  const { data, firstName } = useStore();
  const { setOpen } = useModal();
  const [range, setRange] = useState<(typeof ranges)[number]>("30 days");
  const today = new Date(`${TODAY_ISO}T12:00:00`);
  const [month, setMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(TODAY_ISO);
  const [hoverWeek, setHoverWeek] = useState<number | null>(null);

  const cutoff = range === "All" ? "2000-01-01" : daysBack(range);
  const trades = data.trades.filter((t) => t.date >= cutoff && t.outcome !== "OPEN");
  const wins = trades.filter((t) => t.outcome === "WIN").length;
  const losses = trades.filter((t) => t.outcome === "LOSS").length;
  const closed = wins + losses;
  const winRate = closed ? Math.round((wins / closed) * 100) : 0;
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgRr =
    trades.length === 0 ? 0 : trades.reduce((s, t) => s + parseRr(t.rr), 0) / trades.length;

  const weekRows = useMemo(() => weeksOfMonth(month.y, month.m, data.trades), [month, data.trades]);
  const dayTrades = data.trades.filter((t) => t.date === selected);
  const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
  const dayJournal = data.journals.find((j) => j.date === selected);
  const recent = [...data.trades].sort((a, b) => b.date.localeCompare(a.date) || b.no - a.no).slice(0, 8);

  const equity = cumulative(trades);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({
    day: day.slice(0, 3).toUpperCase(),
    win: trades.filter((t) => weekdayShort(t.date) === day && t.outcome === "WIN").length,
    loss: trades.filter((t) => weekdayShort(t.date) === day && t.outcome === "LOSS").length,
  }));

  function pickDay(iso: string) {
    setSelected(iso);
    const [y, m] = iso.split("-").map(Number);
    if (y !== month.y || m - 1 !== month.m) setMonth({ y, m: m - 1 });
  }

  return (
    <div>
      <PageHeader
        title="Trading Command Center"
        subtitle="Track performance, review timing, and stay aligned with your edge."
        onMenu={onMenu}
      />

      <div className="page-shell p-5 sm:p-7">
        <div className="rounded-[24px] bg-gradient-to-r from-violet-100/90 via-cyan-50 to-emerald-50 px-6 py-6 dark:from-violet-500/20 dark:via-brand/10 dark:to-transparent">
          <span className="inline-flex rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
            OVERVIEW
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-ink dark:text-white">Welcome back, {firstName} 👋</h2>
          <p className="mt-1 text-sm text-ink-muted">Here's your trading performance at a glance.</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<BookOpen size={18} />} value={String(trades.length)} numeric={trades.length} label="Total Trades" hint={range} tint="from-teal-50 to-emerald-50" iconBg="bg-brand/15 text-brand" />
          <StatCard icon={<Crosshair size={18} />} value={`${winRate}%`} numeric={winRate} suffix="%" label="Win Rate" hint="Based on outcomes" tint="from-sky-50 to-indigo-50" iconBg="bg-sky-100 text-sky-600" />
          <StatCard icon={<TrendingUp size={18} />} value={`1:${avgRr.toFixed(1)}`} numeric={avgRr} prefix="1:" decimals={1} label="Avg Risk:Reward" hint="Average RR" tint="from-amber-50 to-orange-50" iconBg="bg-amber-100 text-amber-600" />
          <StatCard icon={<Trophy size={18} />} value={formatPnl(pnl)} numeric={pnl} money label="Total PnL" hint={pnl === 0 ? "Flat" : "Net"} tint="from-emerald-50 to-teal-50" iconBg="bg-emerald-100 text-emerald-600" />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition duration-200 hover:-translate-y-0.5 ${
                  range === r
                    ? "bg-sky-500 text-white shadow-soft"
                    : "bg-slate-100 text-ink-muted hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            className="btn-ghost h-9 rounded-full px-3 text-xs hover:-translate-y-0.5"
            onClick={() => {
              pickDay(TODAY_ISO);
            }}
          >
            <CalendarDays size={14} /> Today
          </button>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_240px_280px]">
          <MonthCalendar
            year={month.y}
            month={month.m}
            trades={data.trades}
            selected={selected}
            hoverWeek={hoverWeek}
            onSelect={pickDay}
            onPrev={() => setMonth((m) => (m.m === 0 ? { y: m.y - 1, m: 11 } : { y: m.y, m: m.m - 1 }))}
            onNext={() => setMonth((m) => (m.m === 11 ? { y: m.y + 1, m: 0 } : { y: m.y, m: m.m + 1 }))}
          />
          <div className="card card-static p-4">
            <h3 className="text-sm font-semibold dark:text-white">
              P&L By Week — {new Date(month.y, month.m, 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <ul className="mt-3 space-y-2">
              {weekRows.map((w, i) => (
                <li
                  key={w.week}
                  className={`dash-row flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm ${
                    hoverWeek === i ? "bg-violet-50 dark:bg-violet-500/15" : "bg-slate-50 dark:bg-white/5"
                  }`}
                  onMouseEnter={() => setHoverWeek(i)}
                  onMouseLeave={() => setHoverWeek(null)}
                  onClick={() => w.firstIso && pickDay(w.firstIso)}
                >
                  <span className="text-ink-muted">{w.week}</span>
                  <span className="text-right">
                    <span className={`block font-semibold ${w.pnl > 0 ? "text-emerald-600" : w.pnl < 0 ? "text-loss" : "dark:text-white"}`}>
                      {formatPnl(w.pnl)}
                    </span>
                    <span className="text-[11px] text-ink-faint">{w.trades} Trades</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2.5 text-sm dark:bg-white/10">
              <span className="font-medium dark:text-white">Monthly Total</span>
              <span className="text-right">
                <span className="block font-semibold dark:text-white">{formatPnl(weekRows.reduce((s, w) => s + w.pnl, 0))}</span>
                <span className="text-[11px] text-ink-faint">{weekRows.reduce((s, w) => s + w.trades, 0)} Trades</span>
              </span>
            </div>
          </div>

          <div className="space-y-4" key={selected}>
            <div className="card card-static animate-details-in p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand">
                  <CalendarDays size={15} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold dark:text-white">Day Details</h3>
                  <p className="text-xs text-ink-faint">{selected}</p>
                </div>
              </div>
              {dayTrades.length === 0 ? (
                <p className="mt-4 text-sm text-ink-faint">No trades on this day. Click a calendar cell to inspect it.</p>
              ) : (
                <div className="mt-3 overflow-hidden rounded-xl border border-line dark:border-[#243041]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-ink-faint dark:bg-white/5">
                      <tr>
                        {["Pair", "Dir", "Result", "P&L", ""].map((h) => (
                          <th key={h || "a"} className="px-2 py-2 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dayTrades.map((t) => (
                        <tr key={t.id} className="dash-row border-t border-line dark:border-[#243041]">
                          <td className="px-2 py-2 font-semibold dark:text-white">{t.symbol || "—"}</td>
                          <td className="px-2 py-2 text-brand">{t.direction || "—"}</td>
                          <td className="px-2 py-2">
                            <Badge tone={t.outcome === "WIN" ? "win" : t.outcome === "LOSS" ? "loss" : "neutral"}>{t.outcome}</Badge>
                          </td>
                          <td className="px-2 py-2 font-semibold">{formatPnl(t.pnl)}</td>
                          <td className="px-2 py-2">
                            <div className="flex justify-end gap-1">
                              <button className="rounded-lg p-1 text-ink-faint hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10" onClick={() => setOpen("tradeView", { tradeId: t.id })} title="View">
                                <Eye size={13} />
                              </button>
                              <button className="rounded-lg p-1 text-ink-faint hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10" onClick={() => setOpen("trade", { tradeId: t.id })} title="Edit">
                                <Pencil size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-line bg-slate-50 dark:border-[#243041] dark:bg-white/5">
                        <td className="px-2 py-2 font-medium dark:text-white" colSpan={3}>Net P&L</td>
                        <td className="px-2 py-2 font-semibold dark:text-white" colSpan={2}>{formatPnl(dayPnl)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              <button
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                onClick={() => setOpen("trade", { date: selected })}
              >
                <Plus size={12} /> Add trade for this day
              </button>
            </div>
            <div className="animate-details-in min-h-[140px] rounded-2xl border border-dashed border-line bg-slate-50/70 p-4 transition hover:border-brand/40 hover:bg-white dark:border-[#243041] dark:bg-white/5 dark:hover:bg-white/10">
              <h3 className="text-sm font-semibold dark:text-white">Session Notes</h3>
              {dayJournal ? (
                <button className="mt-2 w-full text-left text-sm text-ink-muted" onClick={() => setOpen("editDay", { journalId: dayJournal.id })}>
                  <p className="font-medium capitalize dark:text-white">{dayJournal.title}</p>
                  <p className="mt-1 line-clamp-4 text-ink-faint">
                    {journalPreview(dayJournal) || "Open this day’s journal."}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    <Pencil size={12} /> Edit day
                  </span>
                </button>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-ink-faint">Empty widget — pin a note or journal snippet for the selected day.</p>
                  <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand" onClick={() => setOpen("newDay", { date: selected })}>
                    <Plus size={12} /> New day
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 className="mb-4 mt-8 text-lg font-semibold dark:text-white">Performance Analytics</h3>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="card card-static p-4">
            <p className="mb-3 text-sm font-semibold dark:text-white">Cumulative P&L</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={equity.length ? equity : [{ d: "—", v: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="v" stroke="none" fill="#22C55E" fillOpacity={0.12} />
                  <Line type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 3, fill: "#22C55E" }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card card-static p-4">
            <p className="mb-3 text-sm font-semibold dark:text-white">Winning and Loss Performance by Day of Week</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                  <Bar dataKey="win" fill="#22C55E" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="loss" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Losses</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Wins</span>
            </div>
          </div>
        </div>

        <div className="card card-static mt-5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-sm font-semibold dark:text-white">Recent Trades</h3>
            <button className="text-xs font-semibold text-brand hover:underline" onClick={() => setOpen("trade")}>
              + Add Trade
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-y border-line bg-slate-50 text-[10px] uppercase tracking-wide text-ink-faint dark:border-[#243041] dark:bg-white/5">
                <tr>
                  {["Date", "Pair", "Dir", "Session", "Grade", "Outcome", "P&L", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink-faint">No trades yet.</td>
                  </tr>
                ) : (
                  recent.map((t) => (
                    <tr key={t.id} className="dash-row border-b border-line last:border-0 dark:border-[#243041]">
                      <td className="px-4 py-3 text-ink-muted">{t.date}</td>
                      <td className="px-4 py-3 font-semibold dark:text-white">{t.symbol || "—"}</td>
                      <td className="px-4 py-3 text-brand">{t.direction || "—"}</td>
                      <td className="px-4 py-3 text-ink-muted">{t.session || "—"}</td>
                      <td className="px-4 py-3"><Badge tone="grade">{t.grade}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge tone={t.outcome === "WIN" ? "win" : t.outcome === "LOSS" ? "loss" : "neutral"}>{t.outcome}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatPnl(t.pnl)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-muted hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10" onClick={() => setOpen("tradeView", { tradeId: t.id })}>
                            <Eye size={13} /> View
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-muted hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10" onClick={() => setOpen("trade", { tradeId: t.id })}>
                            <Pencil size={13} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-modal dark:border-[#243041] dark:bg-[#151a21]">
      <p className="mb-1 font-medium text-ink-muted">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name === "v" ? "P&L" : p.name === "win" ? "Wins" : p.name === "loss" ? "Losses" : p.name}:{" "}
          {p.name === "v" ? formatPnl(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function daysBack(range: string) {
  const n = range.startsWith("30") ? 30 : range.startsWith("60") ? 60 : 90;
  const d = new Date(`${TODAY_ISO}T12:00:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function cumulative(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let v = 0;
  return sorted.map((t) => {
    v += t.pnl;
    return { d: t.date.slice(5), v };
  });
}

function weeksOfMonth(year: number, month: number, trades: Trade[]) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const rows = Math.ceil((first + days) / 7);
  return Array.from({ length: rows }, (_, w) => {
    const start = w * 7 - first + 1;
    let pnl = 0;
    let count = 0;
    let firstIso = "";
    for (let d = start; d < start + 7; d++) {
      if (d < 1 || d > days) continue;
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (!firstIso) firstIso = iso;
      const day = trades.filter((t) => t.date === iso);
      count += day.length;
      pnl += day.reduce((s, t) => s + t.pnl, 0);
    }
    return { week: `Week ${w + 1}`, pnl, trades: count, firstIso };
  });
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

function StatCard({
  icon, value, label, hint, tint, iconBg, numeric, prefix = "", suffix = "", decimals = 0, money,
}: {
  icon: React.ReactNode; value: string; label: string; hint: string; tint: string; iconBg: string;
  numeric: number; prefix?: string; suffix?: string; decimals?: number; money?: boolean;
}) {
  const n = useAnimatedNumber(numeric);
  const display = money ? formatPnl(n) : `${prefix}${decimals ? n.toFixed(decimals) : Math.round(n)}${suffix}`;
  return (
    <article className={`rounded-2xl bg-gradient-to-br p-4 shadow-soft transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-card ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-full ${iconBg}`}>{icon}</div>
        <span className="text-[11px] text-ink-faint">{hint}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold dark:text-white">{numeric === 0 && !money ? value : display}</p>
      <p className="text-sm text-ink-muted">{label}</p>
    </article>
  );
}

function MonthCalendar({
  year, month, trades, selected, hoverWeek, onSelect, onPrev, onNext,
}: {
  year: number; month: number; trades: Trade[]; selected: string; hoverWeek: number | null;
  onSelect: (iso: string) => void; onPrev: () => void; onNext: () => void;
}) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const total = Math.ceil((first + days) / 7) * 7;
  const title = new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  const cells = Array.from({ length: total }, (_, i) => {
    const d = i - first + 1;
    if (d < 1) {
      const day = prevDays + d;
      const dt = new Date(year, month - 1, day);
      return { day, other: true, iso: isoOf(dt), week: Math.floor(i / 7) };
    }
    if (d > days) {
      const day = d - days;
      const dt = new Date(year, month + 1, day);
      return { day, other: true, iso: isoOf(dt), week: Math.floor(i / 7) };
    }
    return { day: d, other: false, iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, week: Math.floor(i / 7) };
  });

  return (
    <div className="card card-static p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold dark:text-white">{title}</h3>
        <div className="flex gap-1">
          <button className="rounded-lg p-1 transition hover:bg-slate-50 hover:text-brand dark:hover:bg-white/10" onClick={onPrev}><ChevronLeft size={16} /></button>
          <button className="rounded-lg p-1 transition hover:bg-slate-50 hover:text-brand dark:hover:bg-white/10" onClick={onNext}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const dayTrades = trades.filter((t) => t.date === cell.iso);
          const pnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
          const isToday = cell.iso === TODAY_ISO;
          const isSel = cell.iso === selected;
          const wins = dayTrades.filter((t) => t.outcome === "WIN").length;
          const losses = dayTrades.filter((t) => t.outcome === "LOSS").length;
          const weekOn = hoverWeek === cell.week;
          const tint = isSel
            ? "border-violet-300 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/15"
            : weekOn
              ? "border-violet-200 bg-violet-50/70 dark:border-violet-500/20 dark:bg-violet-500/10"
              : cell.other
                ? "border-transparent bg-slate-50/80 text-ink-faint dark:bg-white/5"
                : wins && !losses
                  ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                  : losses && !wins
                    ? "border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-500/10"
                    : "border-line dark:border-[#243041]";
          return (
            <button
              key={i}
              onClick={() => onSelect(cell.iso)}
              className={`dash-cell min-h-[76px] rounded-xl border p-1.5 text-left ${tint}`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-sky-500 font-semibold text-white" : isSel ? "bg-violet-500 font-semibold text-white" : "text-ink-muted"}`}>
                {cell.day}
              </span>
              <p className={`mt-1 text-[11px] font-semibold ${pnl > 0 ? "text-emerald-600" : pnl < 0 ? "text-loss" : "dark:text-slate-200"}`}>{formatPnl(pnl)}</p>
              <p className="text-[10px] text-ink-faint">{dayTrades.length} {dayTrades.length === 1 ? "trade" : "trades"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
