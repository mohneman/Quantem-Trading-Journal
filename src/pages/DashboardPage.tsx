import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Trophy,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { useMenu } from "../hooks";
import { formatPnl, journalSnippet, parseRr, weekdayShort } from "../lib";
import { TODAY_ISO } from "../data";
import { useStore, type Trade } from "../store";
import { useModal } from "../context/ModalContext";

const ranges = ["30 days", "60 days", "90 days", "All"] as const;

export function DashboardPage() {
  const onMenu = useMenu();
  const { data, firstName } = useStore();
  const { setOpen } = useModal();
  const [range, setRange] = useState<(typeof ranges)[number]>("30 days");
  const [month, setMonth] = useState({ y: 2026, m: 7 });
  const [selected, setSelected] = useState("2026-08-17");

  const cutoff = range === "All" ? "2000-01-01" : daysBack(range);
  const trades = data.trades.filter((t) => t.date >= cutoff && t.outcome !== "OPEN");
  const wins = trades.filter((t) => t.outcome === "WIN").length;
  const losses = trades.filter((t) => t.outcome === "LOSS").length;
  const closed = wins + losses;
  const winRate = closed ? Math.round((wins / closed) * 100) : 0;
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgRr =
    trades.length === 0
      ? 0
      : trades.reduce((s, t) => s + parseRr(t.rr), 0) / trades.length;

  const weekRows = useMemo(() => weeksOfMonth(month.y, month.m, data.trades), [month, data.trades]);
  const dayTrades = data.trades.filter((t) => t.date === selected);
  const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
  const dayJournal = data.journals.find((j) => j.date === selected);

  const equity = cumulative(trades);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({
    day: day.slice(0, 3).toUpperCase(),
    win: trades.filter((t) => weekdayShort(t.date) === day && t.outcome === "WIN").length,
    loss: trades.filter((t) => weekdayShort(t.date) === day && t.outcome === "LOSS").length,
  }));

  return (
    <div>
      <PageHeader
        title="Trading Command Center"
        subtitle="Track performance, review timing, and stay aligned with your edge."
        onMenu={onMenu}
      />

      <div className="page-shell p-5 sm:p-7">
        <div className="rounded-[24px] bg-gradient-to-r from-teal-100/90 via-cyan-50 to-white px-6 py-6 dark:from-brand/20 dark:via-brand/5 dark:to-transparent">
          <span className="inline-flex rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
            OVERVIEW
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-ink dark:text-white">
            Welcome back, {firstName} 👋
          </h2>
          <p className="mt-1 text-sm text-ink-muted">Here's your trading performance at a glance.</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<BookOpen size={18} />} value={String(trades.length)} label="Total Trades" hint={range} tint="from-teal-50 to-emerald-50" iconBg="bg-brand/15 text-brand" />
          <StatCard icon={<Crosshair size={18} />} value={`${winRate}%`} label="Win Rate" hint="Based on outcomes" tint="from-sky-50 to-indigo-50" iconBg="bg-sky-100 text-sky-600" />
          <StatCard icon={<TrendingUp size={18} />} value={`1:${avgRr.toFixed(1)}`} label="Avg Risk:Reward" hint="Average RR" tint="from-amber-50 to-orange-50" iconBg="bg-amber-100 text-amber-600" />
          <StatCard icon={<Trophy size={18} />} value={formatPnl(pnl)} label="Total PnL" hint={pnl === 0 ? "Flat" : "Net"} tint="from-emerald-50 to-teal-50" iconBg="bg-emerald-100 text-emerald-600" />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  range === r ? "bg-brand text-white shadow-soft" : "bg-slate-100 text-ink-muted dark:bg-white/10 dark:text-slate-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            className="btn-ghost h-9 rounded-full px-3 text-xs"
            onClick={() => {
              setSelected(TODAY_ISO);
              setMonth({ y: 2026, m: 7 });
            }}
          >
            <CalendarDays size={14} /> Today
          </button>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_240px_260px]">
          <MonthCalendar
            year={month.y}
            month={month.m}
            trades={data.trades}
            selected={selected}
            onSelect={setSelected}
            onPrev={() => setMonth((m) => (m.m === 0 ? { y: m.y - 1, m: 11 } : { y: m.y, m: m.m - 1 }))}
            onNext={() => setMonth((m) => (m.m === 11 ? { y: m.y + 1, m: 0 } : { y: m.y, m: m.m + 1 }))}
          />
          <div className="card p-4">
            <h3 className="text-sm font-semibold dark:text-white">
              P&L By Week — {new Date(month.y, month.m, 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <ul className="mt-3 space-y-2">
              {weekRows.map((w) => (
                <li key={w.week} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-white/5">
                  <span className="text-ink-muted">{w.week}</span>
                  <span className="text-right">
                    <span className="block font-semibold dark:text-white">{formatPnl(w.pnl)}</span>
                    <span className="text-[11px] text-ink-faint">{w.trades} Trades</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2.5 text-sm dark:bg-white/10">
              <span className="font-medium dark:text-white">Monthly Total</span>
              <span className="text-right">
                <span className="block font-semibold dark:text-white">
                  {formatPnl(weekRows.reduce((s, w) => s + w.pnl, 0))}
                </span>
                <span className="text-[11px] text-ink-faint">
                  {weekRows.reduce((s, w) => s + w.trades, 0)} Trades
                </span>
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="text-sm font-semibold dark:text-white">Day Details</h3>
              <p className="mt-1 text-xs text-ink-faint">{selected}</p>
              {dayTrades.length === 0 ? (
                <p className="mt-4 text-sm text-ink-faint">No trades on this day. Click a calendar cell to inspect it.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {dayTrades.map((t) => (
                    <li
                      key={t.id}
                      className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-white/5"
                      onClick={() => setOpen("tradeView", { tradeId: t.id })}
                    >
                      <span className={t.outcome === "WIN" ? "text-brand" : "text-loss"}>
                        {t.outcome === "WIN" ? "Win Trade" : t.outcome === "LOSS" ? "Loss Trade" : t.outcome}
                      </span>
                      <span className="font-semibold dark:text-white">{formatPnl(t.pnl)}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-white/10">
                    <span className="font-medium dark:text-white">Net P&L</span>
                    <span className="font-semibold dark:text-white">{formatPnl(dayPnl)}</span>
                  </li>
                </ul>
              )}
            </div>
            <div className="min-h-[140px] rounded-2xl border border-dashed border-line bg-slate-50/70 p-4 dark:border-[#243041] dark:bg-white/5">
              <h3 className="text-sm font-semibold dark:text-white">Session Notes</h3>
              {dayJournal ? (
                <button className="mt-2 w-full text-left text-sm text-ink-muted" onClick={() => setOpen("editDay", { journalId: dayJournal.id })}>
                  <p className="font-medium capitalize dark:text-white">{dayJournal.title}</p>
                  <p className="mt-1 line-clamp-4 text-ink-faint">
                    {journalSnippet(dayJournal.notes) || dayJournal.gratitude || dayJournal.affirmation || "Open this day’s journal."}
                  </p>
                </button>
              ) : (
                <p className="mt-2 text-sm text-ink-faint">Empty widget — pin a note or journal snippet for the selected day.</p>
              )}
            </div>
          </div>
        </div>

        <h3 className="mb-4 mt-8 text-lg font-semibold dark:text-white">Performance Analytics</h3>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold dark:text-white">Cumulative P&L</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold dark:text-white">Winning and Loss Performance by Day of Week</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} allowDecimals={false} />
                  <Tooltip />
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
      </div>
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
    for (let d = start; d < start + 7; d++) {
      if (d < 1 || d > days) continue;
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const day = trades.filter((t) => t.date === iso);
      count += day.length;
      pnl += day.reduce((s, t) => s + t.pnl, 0);
    }
    return { week: `Week ${w + 1}`, pnl, trades: count };
  });
}

function StatCard({
  icon, value, label, hint, tint, iconBg,
}: {
  icon: React.ReactNode; value: string; label: string; hint: string; tint: string; iconBg: string;
}) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br p-4 shadow-soft transition hover:shadow-card ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
        <span className="text-[11px] text-ink-faint">{hint}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold dark:text-white">{value}</p>
      <p className="text-sm text-ink-muted">{label}</p>
    </article>
  );
}

function MonthCalendar({
  year, month, trades, selected, onSelect, onPrev, onNext,
}: {
  year: number; month: number; trades: Trade[]; selected: string;
  onSelect: (iso: string) => void; onPrev: () => void; onNext: () => void;
}) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: first + days }, (_, i) => (i < first ? null : i - first + 1));
  const title = new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold dark:text-white">{title}</h3>
        <div className="flex gap-1">
          <button className="rounded-lg p-1 hover:bg-slate-50 dark:hover:bg-white/10" onClick={onPrev}><ChevronLeft size={16} /></button>
          <button className="rounded-lg p-1 hover:bg-slate-50 dark:hover:bg-white/10" onClick={onNext}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTrades = trades.filter((t) => t.date === iso);
          const pnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
          const isToday = iso === TODAY_ISO;
          const isSel = iso === selected;
          const wins = dayTrades.filter((t) => t.outcome === "WIN").length;
          const losses = dayTrades.filter((t) => t.outcome === "LOSS").length;
          const tint =
            isSel
              ? "border-violet-300 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/15"
              : wins && !losses
                ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                : losses && !wins
                  ? "border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-500/10"
                  : "border-line dark:border-[#243041]";
          return (
            <button
              key={i}
              onClick={() => onSelect(iso)}
              className={`min-h-[72px] rounded-xl border p-1.5 text-left transition hover:shadow-soft ${tint}`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-sky-500 font-semibold text-white" : "text-ink-muted"}`}>
                {day}
              </span>
              <p className="mt-1 text-[11px] font-semibold dark:text-slate-200">{formatPnl(pnl)}</p>
              <p className="text-[10px] text-ink-faint">{dayTrades.length} {dayTrades.length === 1 ? "trade" : "trades"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
