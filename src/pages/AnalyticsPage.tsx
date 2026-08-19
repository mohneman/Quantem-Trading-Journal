import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  CalendarDays,
  DollarSign,
  Download,
  FileText,
  Flame,
  Lightbulb,
  List,
  Percent,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { useMenu } from "../hooks";
import { useStore } from "../store";
import { formatPnl, parseRr, printSection, weekdayShort } from "../lib";

const WIN = "#22C55E";
const LOSS = "#EF4444";
const BE = "#F59E0B";
const MUTED = "#CBD5E1";
const TEAL = "#00D1C1";
const GRID = "#E2E8F0";
const TICK = "#94A3B8";

export function AnalyticsPage() {
  const onMenu = useMenu();
  const { data } = useStore();
  const [account, setAccount] = useState("All Accounts");
  const [symbol, setSymbol] = useState("All Symbols");
  const [session, setSession] = useState("All Sessions");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [activePie, setActivePie] = useState<number | undefined>();
  const filterKey = `${account}|${symbol}|${session}|${start}|${end}`;

  const trades = useMemo(
    () =>
      data.trades.filter((t) => {
        if (symbol !== "All Symbols" && t.symbol !== symbol) return false;
        if (session !== "All Sessions" && t.session !== session) return false;
        if (account !== "All Accounts" && !t.accountIds.includes(account)) return false;
        if (start && t.date < start) return false;
        if (end && t.date > end) return false;
        return true;
      }),
    [data.trades, account, symbol, session, start, end]
  );

  const closed = trades.filter((t) => t.outcome === "WIN" || t.outcome === "LOSS");
  const wins = closed.filter((t) => t.outcome === "WIN").length;
  const losses = closed.filter((t) => t.outcome === "LOSS").length;
  const be = trades.filter((t) => t.outcome === "BE").length;
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgRr = trades.length ? trades.reduce((s, t) => s + parseRr(t.rr), 0) / trades.length : 0;
  const payoutSum = data.payouts.reduce((s, p) => s + p.payout, 0);
  const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;
  const firms = new Set(data.payouts.map((p) => p.firm)).size;

  const pie = [
    { name: "Wins", value: wins, fill: WIN },
    { name: "Losses", value: losses, fill: LOSS },
    { name: "B/E", value: be, fill: BE },
  ];
  const pieHasData = wins + losses + be > 0;

  const equity = useMemo(() => {
    let v = 0;
    return [...trades]
      .sort((a, b) => a.date.localeCompare(b.date) || a.no - b.no)
      .map((t) => {
        v += t.pnl;
        return { d: t.date, v };
      });
  }, [trades]);

  const sessionBars = ["London", "New York", "Asia"].map((s) => ({
    s,
    win: trades.filter((t) => t.session === s && t.outcome === "WIN").length,
    loss: trades.filter((t) => t.session === s && t.outcome === "LOSS").length,
  }));

  const symbols = Object.values(
    trades.reduce<Record<string, { symbol: string; n: number; wins: number; losses: number; pnl: number }>>((acc, t) => {
      if (!t.symbol) return acc;
      acc[t.symbol] ??= { symbol: t.symbol, n: 0, wins: 0, losses: 0, pnl: 0 };
      acc[t.symbol].n += 1;
      acc[t.symbol].pnl += t.pnl;
      if (t.outcome === "WIN") acc[t.symbol].wins += 1;
      if (t.outcome === "LOSS") acc[t.symbol].losses += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.n - a.n || Math.abs(b.pnl) - Math.abs(a.pnl));

  const pnlByDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({
    day,
    pnl: trades.filter((t) => weekdayShort(t.date) === day).reduce((s, t) => s + t.pnl, 0),
  }));

  const grades = Object.entries(
    trades.reduce<Record<string, number>>((a, t) => {
      if (!t.grade) return a;
      a[t.grade] = (a[t.grade] ?? 0) + 1;
      return a;
    }, {})
  )
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => b.count - a.count);

  const psych = Object.entries(
    trades.reduce<Record<string, { n: number; wins: number; pnl: number }>>((a, t) => {
      t.psychology.forEach((p) => {
        a[p] ??= { n: 0, wins: 0, pnl: 0 };
        a[p].n += 1;
        a[p].pnl += t.pnl;
        if (t.outcome === "WIN") a[p].wins += 1;
      });
      return a;
    }, {})
  ).sort((a, b) => b[1].n - a[1].n);

  const rr = [
    { bucket: "<1:1", count: 0 },
    { bucket: "1:1 - 2:1", count: 0 },
    { bucket: "2:1 - 3:1", count: 0 },
    { bucket: "3:1 - 5:1", count: 0 },
    { bucket: "5:1+", count: 0 },
  ];
  trades.forEach((t) => {
    const n = parseRr(t.rr);
    if (n < 1) rr[0].count += 1;
    else if (n < 2) rr[1].count += 1;
    else if (n < 3) rr[2].count += 1;
    else if (n < 5) rr[3].count += 1;
    else rr[4].count += 1;
  });

  const monthly = Object.entries(
    trades.reduce<Record<string, number>>((a, t) => {
      const k = t.date.slice(0, 7);
      a[k] = (a[k] ?? 0) + t.pnl;
      return a;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => ({
      m: new Date(`${m}-01T12:00:00`).toLocaleString("en-US", { month: "short" }),
      v,
    }));

  const payoutMonthly = Object.entries(
    data.payouts.reduce<Record<string, number>>((a, p) => {
      const k = (p.payoutDate || p.requestDate || "").slice(0, 7) || "Unknown";
      a[k] = (a[k] ?? 0) + p.payout;
      return a;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => ({
      m: m === "Unknown" ? m : new Date(`${m}-01T12:00:00`).toLocaleString("en-US", { month: "short" }),
      v,
    }));

  const firmPayouts = Object.entries(
    data.payouts.reduce<Record<string, number>>((a, p) => {
      a[p.firm || "Unknown"] = (a[p.firm || "Unknown"] ?? 0) + p.payout;
      return a;
    }, {})
  )
    .map(([firm, v]) => ({ firm, v }))
    .sort((a, b) => b.v - a.v);
  const firmMax = Math.max(1, ...firmPayouts.map((f) => f.v));

  const psychMax = Math.max(1, ...psych.map(([, s]) => s.n));
  const best = trades.reduce((m, t) => (t.pnl > m ? t.pnl : m), 0);
  const worst = trades.reduce((m, t) => (t.pnl < m ? t.pnl : m), 0);
  const pending = data.payouts.filter((p) => p.status === "Pending").reduce((s, p) => s + p.payout, 0);
  const recent = [...trades].sort((a, b) => b.date.localeCompare(a.date) || b.no - a.no).slice(0, 20);
  const streak = journalStreak(data.journals.map((j) => j.date));

  return (
    <div className="space-y-5 print-area">
      <PageHeader
        title="Analytics Center"
        subtitle="Break down performance by setup, session, and behavioral pattern."
        onMenu={onMenu}
      />

      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              ANALYTICS OVERVIEW
            </span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">Analytics Dashboard</h2>
            <p className="mt-1 text-sm text-ink-muted">Complete performance overview across all your trading activity.</p>
          </div>
          <button className="btn-gradient no-print" onClick={() => printSection("Quantum Analytics")}>
            <Download size={16} /> Export to PDF
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-5 dark:border-[#243041] dark:bg-brand/10">
          <label className="block">
            <span className="label">Account</span>
            <Select value={account} onChange={(e) => setAccount(e.target.value)}>
              <option>All Accounts</option>
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="label">Symbol</span>
            <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              <option>All Symbols</option>
              {data.symbols.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="label">Session</span>
            <Select value={session} onChange={(e) => setSession(e.target.value)}>
              <option>All Sessions</option>
              <option>London</option>
              <option>New York</option>
              <option>Asia</option>
            </Select>
          </label>
          <label className="block">
            <span className="label">Start Date</span>
            <input className="input" type="date" aria-label="Start Date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">End Date</span>
            <input className="input" type="date" aria-label="End Date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Kpi
            icon={<FileText size={16} />}
            label="Total Trades"
            numeric={trades.length}
            hint={`${wins}W / ${losses}L / ${be}BE`}
            tint="from-teal-50 to-sky-50"
            iconBg="bg-white/80 text-brand"
          />
          <Kpi
            icon={<Percent size={16} />}
            label="Win Rate"
            numeric={winRate}
            suffix="%"
            hint={winRate >= 50 ? "Above average" : "Below average"}
            hintTone={winRate >= 50 ? "good" : "bad"}
            tint="from-violet-50 to-indigo-50"
            iconBg="bg-white/80 text-violet-500"
          />
          <Kpi
            icon={<TrendingUp size={16} />}
            label="Total PnL"
            numeric={pnl}
            money
            hint={pnl >= 0 ? "Profitable" : "Drawdown"}
            hintTone={pnl >= 0 ? "good" : "bad"}
            tint="from-amber-50 to-orange-50"
            iconBg="bg-white/80 text-amber-500"
          />
          <Kpi
            icon={<Zap size={16} />}
            label="Avg Risk:Reward"
            numeric={avgRr}
            prefix="1:"
            decimals={2}
            hint={avgRr >= 2 ? "Strong R:R" : "Needs work"}
            hintTone={avgRr >= 2 ? "good" : undefined}
            tint="from-emerald-50 to-teal-50"
            iconBg="bg-white/80 text-emerald-600"
          />
          <Kpi
            icon={<DollarSign size={16} />}
            label="Total Payouts"
            numeric={payoutSum}
            money
            unsigned
            hint={`${data.payouts.length} payouts from ${firms} firms`}
            tint="from-cyan-50 to-teal-50"
            iconBg="bg-white/80 text-cyan-600"
          />
          <Kpi
            icon={<Briefcase size={16} />}
            label="Active Accounts"
            numeric={data.accounts.length}
            hint={`${data.journals.length} journal ${data.journals.length === 1 ? "entry" : "entries"}`}
            tint="from-sky-50 to-blue-50"
            iconBg="bg-white/80 text-sky-600"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <ChartCard
            title="Equity Curve"
            sub="Cumulative P&L over time"
            icon={<TrendingUp size={15} />}
            iconBg="bg-emerald-100 text-emerald-600"
            tint="from-teal-50/90"
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart key={filterKey} data={equity.length ? equity : [{ d: "—", v: 0 }]}>
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={WIN} stopOpacity={0.38} />
                    <stop offset="95%" stopColor={WIN} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: TICK }} tickFormatter={moneyTick} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip money />} cursor={{ stroke: WIN, strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="v"
                  name="P&L"
                  stroke={WIN}
                  strokeWidth={2.5}
                  fill="url(#equityFill)"
                  animationDuration={900}
                  dot={{ r: 3.5, fill: WIN, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: WIN, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Win/Loss Ratio"
            sub="Trade outcome distribution."
            icon={<Target size={15} />}
            iconBg="bg-rose-100 text-rose-500"
            tint="from-white"
          >
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieHasData ? pie : [{ name: "None", value: 1, fill: MUTED }]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={pieHasData ? 3 : 0}
                    stroke="#fff"
                    strokeWidth={2}
                    animationDuration={800}
                    activeIndex={activePie}
                    activeShape={renderActiveSlice}
                    onMouseEnter={(_, i) => setActivePie(i)}
                    onMouseLeave={() => setActivePie(undefined)}
                  >
                    {(pieHasData ? pie : [{ name: "None", fill: MUTED }]).map((p) => (
                      <Cell key={p.name} fill={p.fill} className="cursor-pointer outline-none transition-opacity hover:opacity-90" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <p className="text-center text-lg font-semibold dark:text-white">
                  {winRate}%
                  <span className="block text-[11px] font-normal text-ink-faint">Win Rate</span>
                </p>
              </div>
            </div>
            <div className="mt-1 flex justify-center gap-4 text-xs">
              <LegendDot color={WIN} label={`Wins (${wins})`} />
              <LegendDot color={LOSS} label={`Losses (${losses})`} />
              <LegendDot color={TICK} label={`B/E (${be})`} />
            </div>
          </ChartCard>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <ChartCard
            title="Performance by Session"
            sub="London vs New York vs Asian"
            icon={<CalendarDays size={15} />}
            iconBg="bg-amber-100 text-amber-600"
            tint="from-orange-50/90"
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart key={filterKey} data={sessionBars} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="s" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip aliases={{ win: "Wins", loss: "Losses" }} />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                <Bar dataKey="win" name="Wins" fill={WIN} radius={[8, 8, 0, 0]} animationDuration={800} />
                <Bar dataKey="loss" name="Losses" fill={LOSS} radius={[8, 8, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-1 flex justify-center gap-4 text-xs text-ink-muted">
              <LegendDot color={WIN} label="Wins" />
              <LegendDot color={LOSS} label="Losses" />
            </div>
          </ChartCard>

          <ChartCard
            title="Top Symbols"
            sub="Performance by trading pair"
            icon={<BarChart3 size={15} />}
            iconBg="bg-emerald-100 text-emerald-600"
            tint="from-emerald-50/90"
          >
            {symbols.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-faint">No symbols yet.</p>
            ) : (
              symbols.map((s) => (
                <div
                  key={s.symbol}
                  className="mb-2 flex items-center justify-between rounded-xl border border-emerald-100/80 bg-white/80 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft dark:border-[#243041] dark:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none text-emerald-500">↗</span>
                    <div>
                      <p className="font-semibold text-ink dark:text-white">{s.symbol}</p>
                      <p className="text-xs text-ink-muted">
                        {s.n} trades · {s.n ? Math.round((s.wins / s.n) * 100) : 0}% WR
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${s.pnl >= 0 ? "text-emerald-600" : "text-loss"}`}>{formatPnl(s.pnl)}</p>
                    <p className="text-[11px] text-ink-faint">
                      {s.wins}W / {s.losses}L
                    </p>
                  </div>
                </div>
              ))
            )}
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="PnL by Day of Week"
          sub="Which days are most profitable"
          icon={<CalendarDays size={15} />}
          iconBg="bg-violet-100 text-violet-500"
          tint="from-violet-50/90"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart key={filterKey} data={pnlByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: TICK }} tickFormatter={moneyTick} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip money aliases={{ pnl: "PnL" }} />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Bar dataKey="pnl" name="PnL" radius={[8, 8, 0, 0]} animationDuration={800}>
                {pnlByDay.map((d) => (
                  <Cell key={d.day} fill={d.pnl > 0 ? WIN : d.pnl < 0 ? LOSS : MUTED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Setup Grade Distribution"
          sub="Quality of your trade setups"
          icon={<Lightbulb size={15} />}
          iconBg="bg-teal-100 text-brand"
          tint="from-teal-50/90"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart key={filterKey} data={grades.length ? grades : [{ grade: "—", count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="grade" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip aliases={{ count: "Trades" }} integer />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Bar dataKey="count" name="Trades" fill={TEAL} radius={[8, 8, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <ChartCard
          title="Psychology Insights"
          sub="Mental state impact on performance"
          icon={<Brain size={15} />}
          iconBg="bg-sky-100 text-sky-600"
          tint="from-sky-50/90"
        >
          {psych.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-faint">No psychology tags yet.</p>
          ) : (
            psych.map(([name, s]) => (
              <div
                key={name}
                className="mb-3 flex flex-wrap items-center gap-3 rounded-xl px-1 py-1.5 transition duration-200 hover:bg-white/70 dark:hover:bg-white/5"
              >
                <span className="w-20 text-sm font-medium dark:text-white">{name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.max(10, (s.n / psychMax) * 100)}%` }}
                  />
                </div>
                <span className="min-w-[148px] text-right text-xs text-ink-muted">
                  {s.n} trades · {s.n ? Math.round((s.wins / s.n) * 100) : 0}% WR · {formatPnl(s.pnl)}
                </span>
              </div>
            ))
          )}
        </ChartCard>
        <ChartCard
          title="Risk:Reward Distribution"
          sub="How your R:R ratios are distributed"
          icon={<AlertTriangle size={15} />}
          iconBg="bg-amber-100 text-amber-600"
          tint="from-amber-50/90"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart key={filterKey} data={rr}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip aliases={{ count: "Trades" }} integer />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Bar dataKey="count" name="Trades" fill={WIN} radius={[8, 8, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard
          title="Payout Trend"
          sub="Monthly payout income over time"
          icon={<DollarSign size={15} />}
          iconBg="bg-emerald-100 text-emerald-600"
          tint="from-emerald-50/90"
        >
          {payoutMonthly.length === 0 ? (
            <p className="flex min-h-[160px] items-center justify-center text-lg font-medium text-ink-faint">No payout data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={payoutMonthly}>
                <defs>
                  <linearGradient id="payoutFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: TICK }} tickFormatter={moneyTick} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip money aliases={{ v: "Payout" }} />} />
                <Area
                  type="monotone"
                  dataKey="v"
                  name="Payout"
                  stroke={TEAL}
                  strokeWidth={2.5}
                  fill="url(#payoutFill)"
                  dot={{ r: 3, fill: TEAL, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: TEAL, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard
          title="Payouts by Firm"
          sub="Income distribution across firms"
          icon={<Building2 size={15} />}
          iconBg="bg-violet-100 text-violet-500"
          tint="from-violet-50/90"
        >
          {firmPayouts.length === 0 ? (
            <p className="flex min-h-[160px] items-center justify-center text-lg font-medium text-ink-faint">No payout data yet</p>
          ) : (
            <div className="space-y-3 pt-1">
              {firmPayouts.map((f) => (
                <div key={f.firm} className="transition hover:translate-x-0.5">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink-muted">{f.firm}</span>
                    <b className="text-emerald-600">{formatPnl(f.v).replace("+", "")}</b>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-violet-400 transition-all duration-700" style={{ width: `${Math.max(8, (f.v / firmMax) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="Monthly PnL"
          sub="Month-over-month performance"
          icon={<BarChart3 size={15} />}
          iconBg="bg-cyan-100 text-cyan-600"
          tint="from-cyan-50/90"
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart key={filterKey} data={monthly.length ? monthly : [{ m: "Aug", v: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: TICK }} tickFormatter={moneyTick} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip money aliases={{ v: "PnL" }} />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Bar dataKey="v" name="PnL" radius={[8, 8, 0, 0]} animationDuration={800}>
                {(monthly.length ? monthly : [{ m: "Aug", v: 0 }]).map((d) => (
                  <Cell key={d.m} fill={d.v > 0 ? TEAL : d.v < 0 ? LOSS : MUTED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="space-y-5">
          <ChartCard title="Trade Extremes" sub="Best and worst closed trades" icon={<TrendingUp size={15} />} iconBg="bg-sky-100 text-sky-600" tint="from-sky-50/90">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-soft dark:bg-emerald-500/10">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Best Trade</p>
                <p className="mt-1 text-lg font-semibold text-emerald-600">{formatPnl(best)}</p>
              </div>
              <div className="rounded-xl bg-loss-soft p-3 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-soft">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-loss">Worst Trade</p>
                <p className="mt-1 text-lg font-semibold text-loss">{worst < 0 ? formatPnl(worst) : "-$0.00"}</p>
              </div>
            </div>
          </ChartCard>
          <ChartCard title="Journal & Accounts" sub="Consistency and payout status" icon={<BookOpen size={15} />} iconBg="bg-amber-100 text-amber-600" tint="from-amber-50/90">
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-muted">
                  <Flame size={14} className="text-amber-500" /> Journal Streak
                </span>
                <b className="dark:text-white">{streak} days</b>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-muted">
                  <BookOpen size={14} className="text-brand" /> Journal Entries
                </span>
                <b className="dark:text-white">{data.journals.length}</b>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-muted">
                  <DollarSign size={14} className="text-emerald-500" /> Pending Payouts
                </span>
                <b className="text-amber-600">{formatPnl(pending).replace("+", "")}</b>
              </li>
            </ul>
          </ChartCard>
          {data.accounts.length ? (
            <ChartCard title="Accounts" sub="Linked account P&L" icon={<Briefcase size={15} />} iconBg="bg-emerald-100 text-emerald-600" tint="from-emerald-50/90">
              <ul className="space-y-2 text-sm">
                {data.accounts.map((a) => {
                  const net = data.trades.filter((t) => t.accountIds.includes(a.id)).reduce((s, t) => s + t.pnl, 0);
                  return (
                    <li key={a.id} className="flex items-center justify-between rounded-lg px-1 py-1 transition hover:bg-white/70 dark:hover:bg-white/5">
                      <span className="font-medium dark:text-white">{a.name}</span>
                      <b className={net >= 0 ? "text-emerald-600" : "text-loss"}>{formatPnl(net)}</b>
                    </li>
                  );
                })}
              </ul>
            </ChartCard>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-50/90 to-white shadow-soft dark:from-indigo-500/10 dark:to-transparent">
        <div className="flex items-center gap-2 px-5 pt-5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-indigo-500">
            <List size={15} />
          </span>
          <div>
            <h3 className="text-sm font-semibold dark:text-white">Recent Trades</h3>
            <p className="text-xs text-ink-muted">Your latest 20 trade entries.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto bg-white dark:bg-[#151a21]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-line text-xs uppercase tracking-wide text-ink-faint dark:border-[#243041]">
              <tr>
                {["DATE", "SYMBOL", "DIRECTION", "SESSION", "GRADE", "R:R", "OUTCOME", "PnL"].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-ink-faint">
                    No trades in this filter.
                  </td>
                </tr>
              ) : (
                recent.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-line transition duration-150 last:border-0 hover:bg-indigo-50/50 dark:border-[#243041] dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-3 text-ink-muted">{t.date}</td>
                    <td className="px-5 py-3 font-semibold dark:text-white">{t.symbol}</td>
                    <td className="px-5 py-3">
                      <Badge tone={t.direction === "Sell" ? "sell" : "buy"}>
                        {t.direction === "Sell" ? "↘ Sell" : t.direction ? "↗ Buy" : "—"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{t.session || "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone="grade">{t.grade || "—"}</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium text-brand">{t.rr || "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={t.outcome === "WIN" ? "win" : t.outcome === "LOSS" ? "loss" : "neutral"}>
                        {t.outcome === "LOSS" ? "× LOSS" : t.outcome}
                      </Badge>
                    </td>
                    <td className={`px-5 py-3 font-semibold ${t.pnl > 0 ? "text-emerald-600" : t.pnl < 0 ? "text-loss" : ""}`}>
                      {formatPnl(t.pnl)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function moneyTick(v: number) {
  return `$${v}`;
}

function journalStreak(dates: string[]) {
  const unique = [...new Set(dates.filter(Boolean))].sort().reverse();
  if (!unique.length) return 0;
  let streak = 1;
  for (let i = 0; i < unique.length - 1; i++) {
    const a = new Date(`${unique[i]}T12:00:00`).getTime();
    const b = new Date(`${unique[i + 1]}T12:00:00`).getTime();
    if ((a - b) / 86400000 === 1) streak += 1;
    else break;
  }
  return streak;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function ChartTip({
  active,
  payload,
  label,
  money,
  integer,
  aliases = {},
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey?: string }[];
  label?: string;
  money?: boolean;
  integer?: boolean;
  aliases?: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-modal dark:border-[#243041] dark:bg-[#151a21]">
      {label != null && label !== "" ? <p className="mb-1 font-medium text-ink-muted">{label}</p> : null}
      {payload.map((p) => {
        const key = String(p.dataKey ?? p.name);
        const name = aliases[key] ?? (key === "v" ? "P&L" : p.name);
        const raw = Number(p.value) || 0;
        const value = money ? formatPnl(raw) : integer ? String(Math.round(raw)) : String(p.value);
        return (
          <p key={name} className="font-semibold" style={{ color: p.color }}>
            {name}: {value}
          </p>
        );
      })}
    </div>
  );
}

function renderActiveSlice(props: { outerRadius?: number }) {
  return <Sector {...props} outerRadius={(props.outerRadius ?? 74) + 6} />;
}

function useAnimatedNumber(target: number, duration = 480) {
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
  icon,
  label,
  hint,
  tint,
  iconBg,
  numeric,
  prefix = "",
  suffix = "",
  decimals = 0,
  money,
  unsigned,
  hintTone,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  tint: string;
  iconBg: string;
  numeric: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  money?: boolean;
  unsigned?: boolean;
  hintTone?: "good" | "bad";
}) {
  const n = useAnimatedNumber(numeric);
  const display = money
    ? unsigned
      ? formatPnl(n).replace("+", "")
      : formatPnl(n)
    : `${prefix}${decimals ? n.toFixed(decimals) : Math.round(n)}${suffix}`;
  return (
    <article
      className={`rounded-2xl bg-gradient-to-br p-4 shadow-soft transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-card ${tint} dark:from-white/5 dark:to-white/0`}
    >
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-full ${iconBg}`}>{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight dark:text-white">{display}</p>
      <p
        className={`text-[11px] ${
          hintTone === "good" ? "text-emerald-600" : hintTone === "bad" ? "text-loss" : "text-ink-faint"
        }`}
      >
        {hint}
      </p>
    </article>
  );
}

function ChartCard({
  title,
  sub,
  children,
  tint,
  icon,
  iconBg,
}: {
  title: string;
  sub: string;
  children: ReactNode;
  tint: string;
  icon?: ReactNode;
  iconBg?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-gradient-to-b ${tint} to-white p-4 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-card dark:from-white/5 dark:to-transparent`}
    >
      <div className="mb-3 flex items-start gap-2.5">
        {icon ? <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${iconBg}`}>{icon}</span> : null}
        <div>
          <h3 className="text-sm font-semibold dark:text-white">{title}</h3>
          <p className="text-xs text-ink-muted">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
