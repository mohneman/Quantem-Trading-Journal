import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Building2,
  CalendarDays,
  DollarSign,
  FileText,
  Lightbulb,
  List,
  Percent,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
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

export function AnalyticsPage() {
  const onMenu = useMenu();
  const { data } = useStore();
  const [account, setAccount] = useState("All Accounts");
  const [symbol, setSymbol] = useState("All Symbols");
  const [session, setSession] = useState("All Sessions");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const trades = data.trades.filter((t) => {
    if (symbol !== "All Symbols" && t.symbol !== symbol) return false;
    if (session !== "All Sessions" && t.session !== session) return false;
    if (account !== "All Accounts" && !t.accountIds.includes(account)) return false;
    if (start && t.date < start) return false;
    if (end && t.date > end) return false;
    return true;
  });
  const closed = trades.filter((t) => t.outcome === "WIN" || t.outcome === "LOSS");
  const wins = closed.filter((t) => t.outcome === "WIN").length;
  const losses = closed.filter((t) => t.outcome === "LOSS").length;
  const be = trades.filter((t) => t.outcome === "BE").length;
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgRr = trades.length ? trades.reduce((s, t) => s + parseRr(t.rr), 0) / trades.length : 0;
  const payoutSum = data.payouts.reduce((s, p) => s + p.payout, 0);
  const pie = [
    { name: "Wins", value: wins || 0, fill: "#22C55E" },
    { name: "Losses", value: losses || 0, fill: "#EF4444" },
    { name: "B.E", value: be, fill: "#94A3B8" },
  ];
  const equity = useMemo(() => {
    let v = 0;
    return [...trades].sort((a, b) => a.date.localeCompare(b.date)).map((t) => {
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
    trades.reduce<Record<string, { symbol: string; n: number; wins: number; pnl: number }>>((acc, t) => {
      if (!t.symbol) return acc;
      acc[t.symbol] ??= { symbol: t.symbol, n: 0, wins: 0, pnl: 0 };
      acc[t.symbol].n += 1;
      acc[t.symbol].pnl += t.pnl;
      if (t.outcome === "WIN") acc[t.symbol].wins += 1;
      return acc;
    }, {})
  );
  const pnlByDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({
    day,
    pnl: trades.filter((t) => weekdayShort(t.date) === day).reduce((s, t) => s + t.pnl, 0),
  }));
  const grades = Object.entries(
    trades.reduce<Record<string, number>>((a, t) => {
      a[t.grade] = (a[t.grade] ?? 0) + 1;
      return a;
    }, {})
  ).map(([grade, count]) => ({ grade, count }));
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
  );
  const rr = [
    { bucket: "<1:1", count: 0 },
    { bucket: "1:1-2:1", count: 0 },
    { bucket: "2:1-3:1", count: 0 },
    { bucket: "3:1-5:1", count: 0 },
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
  ).map(([m, v]) => ({ m: m.slice(5), v }));
  const firmPayouts = Object.entries(
    data.payouts.reduce<Record<string, number>>((a, p) => {
      a[p.firm || "Unknown"] = (a[p.firm || "Unknown"] ?? 0) + p.payout;
      return a;
    }, {})
  ).map(([firm, v]) => ({ firm, v }));
  const psychMax = Math.max(1, ...psych.map(([, s]) => s.n));
  const best = trades.reduce((m, t) => (t.pnl > m ? t.pnl : m), 0);
  const worst = trades.reduce((m, t) => (t.pnl < m ? t.pnl : m), 0);

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
          <button className="btn-gradient" onClick={() => printSection("RyzeLog Analytics")}>Export to PDF</button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="label">Account</span>
            <Select value={account} onChange={(e) => setAccount(e.target.value)}>
              <option>All Accounts</option>
              {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </label>
          <label className="block">
            <span className="label">Symbol</span>
            <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              <option>All Symbols</option>
              {data.symbols.map((s) => <option key={s}>{s}</option>)}
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
          <Kpi icon={<FileText size={16} />} label="Total Trades" value={String(trades.length)} hint={`${wins}W / ${losses}L / ${be}BE`} tint="from-teal-50 to-sky-50" />
          <Kpi icon={<Percent size={16} />} label="Win Rate" value={`${closed.length ? Math.round((wins / closed.length) * 100) : 0}%`} hint="Above average" tint="from-violet-50 to-indigo-50" />
          <Kpi icon={<TrendingUp size={16} />} label="Total PnL" value={formatPnl(pnl)} hint={pnl >= 0 ? "Profitable" : "Drawdown"} tint="from-amber-50 to-orange-50" />
          <Kpi icon={<Zap size={16} />} label="Avg Risk:Reward" value={`1:${avgRr.toFixed(2)}`} hint="Strong R:R" tint="from-emerald-50 to-teal-50" />
          <Kpi icon={<DollarSign size={16} />} label="Total Payouts" value={formatPnl(payoutSum).replace("+", "")} hint={`${data.payouts.length} payouts from ${new Set(data.payouts.map((p) => p.firm)).size} firms`} tint="from-cyan-50 to-teal-50" />
          <Kpi icon={<BarChart3 size={16} />} label="Active Accounts" value={String(data.accounts.length)} hint={`${data.journals.length} journal entries`} tint="from-sky-50 to-blue-50" />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <ChartCard title="Equity Curve" sub="Cumulative P&L over time" tint="bg-teal-50/60 dark:bg-teal-500/5">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={equity.length ? equity : [{ d: "—", v: 0 }]}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Win/Loss Ratio" sub="Trade outcome distribution." tint="bg-white dark:bg-transparent">
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {pie.map((p) => <Cell key={p.name} fill={p.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <p className="text-center text-sm font-semibold dark:text-white">
                  {closed.length ? Math.round((wins / closed.length) * 100) : 0}%
                  <span className="block text-[11px] font-normal text-ink-faint">Win Rate</span>
                </p>
              </div>
            </div>
            <div className="mt-2 flex justify-center gap-4 text-xs text-ink-muted">
              <span className="text-brand">Wins ({wins})</span><span className="text-loss">Losses ({losses})</span><span>B/E ({be})</span>
            </div>
          </ChartCard>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <ChartCard title="Performance by Session" sub="London vs New York vs Asian" tint="bg-white dark:bg-transparent">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sessionBars}>
                <XAxis dataKey="s" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="win" fill="#22C55E" radius={[8, 8, 0, 0]} />
                <Bar dataKey="loss" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Top Symbols" sub="Performance by trading pair" tint="bg-white dark:bg-transparent">
            {symbols.length === 0 ? <p className="text-sm text-ink-faint">No symbols yet.</p> : symbols.map((s) => (
              <div key={s.symbol} className="mb-2 rounded-xl border border-line p-3 dark:border-[#243041]">
                <p className="font-semibold text-brand">↗ {s.symbol}</p>
                <p className="text-xs text-ink-muted">{s.n} trades · {s.n ? Math.round((s.wins / s.n) * 100) : 0}% WR</p>
                <p className="mt-1 font-semibold">{formatPnl(s.pnl)}</p>
              </div>
            ))}
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="PnL by Day of Week" sub="Which days are most profitable" icon={<CalendarDays size={16} className="text-brand" />} tint="bg-violet-50/70 dark:bg-violet-500/10">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pnlByDay}><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="pnl" fill="#14C9B3" radius={[8, 8, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Setup Grade Distribution" sub="Quality of your trade setups" icon={<Lightbulb size={16} className="text-brand" />} tint="bg-teal-50/80 dark:bg-teal-500/10">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grades.length ? grades : [{ grade: "—", count: 0 }]}><XAxis dataKey="grade" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#00D1C1" radius={[8, 8, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <ChartCard title="Psychology Insights" sub="Mental state impact on performance" icon={<Brain size={16} className="text-brand" />} tint="bg-sky-50/80 dark:bg-sky-500/10">
          {psych.length === 0 ? <p className="text-sm text-ink-faint">No psychology tags yet.</p> : psych.map(([name, s]) => (
            <div key={name} className="mb-3 flex flex-wrap items-center gap-3">
              <span className="w-16 text-sm font-medium dark:text-white">{name}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(12, (s.n / psychMax) * 100)}%` }} />
              </div>
              <span className="text-xs text-ink-muted">{s.n} trades · {s.n ? Math.round((s.wins / s.n) * 100) : 0}% WR · {formatPnl(s.pnl)}</span>
            </div>
          ))}
        </ChartCard>
        <ChartCard title="Risk:Reward Distribution" sub="How your R:R ratios are distributed" icon={<AlertTriangle size={16} className="text-brand" />} tint="bg-amber-50/80 dark:bg-amber-500/10">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={rr}><XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#64748B" }} /><Tooltip /><Bar dataKey="count" fill="#22C55E" radius={[8, 8, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {data.payouts.length === 0 ? (
          <Empty tint="bg-emerald-50/80 dark:bg-emerald-500/10" icon={<DollarSign size={16} />} title="Payout Trend" sub="Monthly payout income over time" />
        ) : (
          <ChartCard title="Payout Trend" sub="Monthly payout income over time" tint="bg-emerald-50/80">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.payouts.map((p) => ({ m: p.payoutDate.slice(5, 7), v: p.payout }))}><XAxis dataKey="m" /><Bar dataKey="v" fill="#00D1C1" /></BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {firmPayouts.length === 0 ? (
          <Empty tint="bg-violet-50/80 dark:bg-violet-500/10" icon={<Building2 size={16} />} title="Payouts by Firm" sub="Income distribution across firms" />
        ) : (
          <ChartCard title="Payouts by Firm" sub="Income distribution across firms" tint="bg-violet-50/80">
            {firmPayouts.map((f) => (
              <p key={f.firm} className="flex justify-between text-sm"><span>{f.firm}</span><b>{formatPnl(f.v)}</b></p>
            ))}
          </ChartCard>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Monthly PnL" sub="Month-over-month performance" icon={<BarChart3 size={16} className="text-brand" />} tint="bg-cyan-50/80 dark:bg-cyan-500/10">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly.length ? monthly : [{ m: "Aug", v: 0 }]}><XAxis dataKey="m" /><YAxis /><Bar dataKey="v" fill="#00D1C1" radius={[8, 8, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="space-y-5">
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold dark:text-white">Trade Extremes</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
                <p className="text-xs text-brand">Best Trade</p>
                <p className="mt-1 font-semibold text-brand">{formatPnl(best)}</p>
              </div>
              <div className="rounded-xl bg-loss-soft p-3 text-center">
                <p className="text-xs text-loss">Worst Trade</p>
                <p className="mt-1 font-semibold text-loss">{worst < 0 ? formatPnl(worst) : "-$0.00"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-amber-50/80 p-4 dark:bg-amber-500/10">
            <p className="mb-3 text-sm font-semibold dark:text-white">Journal & Accounts</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-ink-muted">Journal Streak</span><b>{data.journals.length} days</b></li>
              <li className="flex justify-between"><span className="text-ink-muted">Journal Entries</span><b>{data.journals.length}</b></li>
              <li className="flex justify-between"><span className="text-ink-muted">Pending Payouts</span><b className="text-amber-600">{formatPnl(data.payouts.filter((p) => p.status === "Pending").reduce((s, p) => s + p.payout, 0))}</b></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-indigo-50/70 dark:bg-indigo-500/10">
        <div className="flex items-center gap-2 px-5 pt-5">
          <List size={16} className="text-indigo-500" />
          <div>
            <h3 className="text-sm font-semibold dark:text-white">Recent Trades</h3>
            <p className="text-xs text-ink-muted">Your latest 20 trade entries.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto bg-white dark:bg-[#151a21]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-line text-xs uppercase tracking-wide text-ink-faint dark:border-[#243041]">
              <tr>{["DATE", "SYMBOL", "DIRECTION", "SESSION", "GRADE", "R:R", "OUTCOME", "PnL"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {trades.slice(0, 20).map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0 dark:border-[#243041]">
                  <td className="px-5 py-3 text-ink-muted">{t.date}</td>
                  <td className="px-5 py-3 font-medium dark:text-white">{t.symbol}</td>
                  <td className="px-5 py-3"><Badge tone={t.direction === "Sell" ? "sell" : "buy"}>{t.direction === "Sell" ? "↓ Sell" : t.direction ? "↑ Buy" : "—"}</Badge></td>
                  <td className="px-5 py-3 text-ink-muted">{t.session}</td>
                  <td className="px-5 py-3"><Badge tone="grade">{t.grade}</Badge></td>
                  <td className="px-5 py-3 font-medium text-brand">{t.rr}</td>
                  <td className="px-5 py-3"><Badge tone={t.outcome === "WIN" ? "win" : t.outcome === "LOSS" ? "loss" : "neutral"}>{t.outcome}</Badge></td>
                  <td className="px-5 py-3 font-semibold">{formatPnl(t.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, hint, tint }: { icon: React.ReactNode; label: string; value: string; hint: string; tint: string }) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br p-4 ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-brand">{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold dark:text-white">{value}</p>
      <p className="text-[11px] text-ink-faint">{hint}</p>
    </article>
  );
}

function ChartCard({ title, sub, children, tint, icon }: { title: string; sub: string; children: React.ReactNode; tint: string; icon?: React.ReactNode }) {
  return (
    <section className={`rounded-2xl p-4 ${tint}`}>
      <div className="mb-3 flex items-start gap-2">
        {icon}
        <div>
          <h3 className="text-sm font-semibold dark:text-white">{title}</h3>
          <p className="text-xs text-ink-muted">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Empty({ title, sub, tint, icon }: { title: string; sub: string; tint: string; icon: React.ReactNode }) {
  return (
    <section className={`flex min-h-[200px] flex-col rounded-2xl p-4 ${tint}`}>
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <h3 className="text-sm font-semibold dark:text-white">{title}</h3>
          <p className="text-xs text-ink-muted">{sub}</p>
        </div>
      </div>
      <p className="m-auto text-lg font-medium text-ink-faint">No payout data yet</p>
    </section>
  );
}
