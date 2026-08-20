import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Apple,
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  Box,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Copy,
  Diamond,
  Download,
  ExternalLink,
  Flame,
  LayoutGrid,
  Link2,
  ListChecks,
  Plus,
  Ruler,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Ticket,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  RefreshCw,
  Users,
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Field, Input, Select } from "../components/ui/Field";
import { TODAY_ISO } from "../data";
import { useMenu } from "../hooks";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { useStore } from "../store";
import { csvEscape, downloadText, formatPnl, monthLabel, outcomeStreak, parseRr, rrFromPips } from "../lib";
import { loadEconomicCalendar, type CalEvent, type CalImpact, type CalendarSource } from "../lib/economicCalendar";
import { CalendarFilterModal } from "../components/modals/CalendarFilterModal";
import {
  CALENDAR_CURRENCIES,
  DEFAULT_CALENDAR_CURRENCIES,
  eventGmtYmd,
  gmtYmd,
  pairLabel,
} from "../lib/calendarCurrencies";
import { loadPropDeals, type PropDeal } from "../lib/propDeals";
import { referralSignupLink } from "../lib/referral";

const TEAL = "#00D1C1";
const WIN = "#22C55E";
const LOSS = "#EF4444";
const AMBER = "#F59E0B";
const PURPLE = "#7C6CF0";
const GRID = "#E2E8F0";
const TICK = "#94A3B8";

const FLAGS: Record<string, string> = {
  GBP: "🇬🇧",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  CHF: "🇨🇭",
  JPY: "🇯🇵",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  NZD: "🇳🇿",
  CNY: "🇨🇳",
};

const IMPACT_FILTERS: { key: CalImpact; label: string; dot: string }[] = [
  { key: "HIGH", label: "High", dot: "bg-red-500" },
  { key: "MED", label: "Medium", dot: "bg-amber-400" },
  { key: "LOW", label: "Low", dot: "bg-sky-500" },
];

export function BacktestsPage() {
  const onMenu = useMenu();
  const { setOpen } = useModal();
  const { data, deleteBacktest } = useStore();
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const rows = data.backtests.filter((b) => {
    if (tab === "Wins" && b.result !== "WIN") return false;
    if (tab === "Losses" && b.result !== "LOSS") return false;
    if (q && !`${b.symbol} ${b.no} ${b.notes} ${b.direction} ${b.scenario}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const wins = data.backtests.filter((b) => b.result === "WIN").length;
  const losses = data.backtests.filter((b) => b.result === "LOSS").length;

  return (
    <div>
      <PageHeader title="Backtested Trades" subtitle="Review every backtested trade with full execution context." onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-gradient-to-r from-teal-50/80 via-white to-violet-50/70 p-4 dark:border-[#243041] dark:from-brand/10 dark:via-transparent dark:to-violet-500/10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="font-semibold dark:text-white">Backtested Trades</p>
              <p className="text-xs text-ink-muted">
                {data.backtests.length} trades · {wins} wins · {losses} losses
              </p>
            </div>
          </div>
          <button className="btn-gradient" onClick={() => setOpen("backtest")}>
            <Plus size={16} /> Add Backtest
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-full bg-slate-100 p-1 dark:bg-white/10">
            {[
              ["All", data.backtests.length],
              ["Wins", wins],
              ["Losses", losses],
            ].map(([t, n]) => (
              <button
                key={String(t)}
                onClick={() => setTab(String(t))}
                className={`filter-pill rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                  tab === t ? "bg-brand-gradient text-white shadow-soft" : "text-ink-muted hover:text-ink dark:hover:text-white"
                }`}
              >
                {t} ({n})
              </button>
            ))}
          </div>
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input pl-10" placeholder="Search symbol, trade #, notes..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-line text-center dark:border-[#243041]">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-gradient text-white shadow-soft">
              <BookOpen size={26} />
            </div>
            <h2 className="mt-4 text-xl font-semibold dark:text-white">No backtests yet</h2>
            <p className="mt-2 max-w-md text-sm text-ink-muted">Diwaangeli backtest-yadaada - kor u qaad guulahaaga oo arag horumarka</p>
            <button className="btn-gradient mt-5" onClick={() => setOpen("backtest")}>
              <Plus size={16} /> Add your first backtest
            </button>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-y border-line text-[11px] uppercase tracking-wide text-ink-faint dark:border-[#243041]">
                <tr>
                  {["#", "Date", "Pair", "Dir", "Scenario", "R:R", "Result", "Notes", ""].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const rr = rrFromPips(b.slPips, b.tpPips);
                  return (
                    <tr
                      key={b.id}
                      className="trade-row cursor-pointer border-b border-line last:border-0 hover:bg-teal-50/60 dark:border-[#243041] dark:hover:bg-white/5"
                      onClick={() => setOpen("backtest", { backtestId: b.id })}
                    >
                      <td className="px-3 py-3 font-medium text-ink-muted">#{b.no}</td>
                      <td className="px-3 py-3">{b.date}</td>
                      <td className="px-3 py-3 font-semibold dark:text-white">{b.symbol}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${b.direction === "Sell" ? "bg-violet-50 text-purple-brand dark:bg-violet-500/15" : "bg-brand/10 text-brand-700"}`}>
                          {b.direction || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{b.scenario || "—"}</td>
                      <td className="px-3 py-3 font-medium text-brand">{rr || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${b.result === "WIN" ? "bg-emerald-500 text-white" : "bg-loss text-white"}`}>
                          {b.result}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-3 text-ink-muted">{b.notes || "—"}</td>
                      <td className="px-3 py-3">
                        <button className="rounded-lg p-1.5 text-loss hover:bg-loss-soft" onClick={(e) => { e.stopPropagation(); deleteBacktest(b.id); }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatsPage() {
  const onMenu = useMenu();
  const { data } = useStore();
  const wins = data.backtests.filter((b) => b.result === "WIN").length;
  const losses = data.backtests.filter((b) => b.result === "LOSS").length;
  const total = data.backtests.length;
  const adhere = total
    ? Math.round((data.backtests.reduce((s, b) => s + b.rules.filter((r) => r.checked).length / Math.max(1, b.rules.length), 0) / total) * 100)
    : 0;
  const avgRr = total ? data.backtests.reduce((s, b) => s + parseRr(rrFromPips(b.slPips, b.tpPips) || "0"), 0) / total : 0;
  const streak = outcomeStreak(data.backtests.map((b) => b.result));
  const symbols = new Set(data.backtests.map((b) => b.symbol).filter(Boolean)).size;
  const dist = [
    { name: "Wins", v: wins, fill: WIN },
    { name: "Losses", v: losses, fill: LOSS },
  ];
  const bySymbol = Object.values(
    data.backtests.reduce<Record<string, { s: string; win: number; loss: number }>>((acc, b) => {
      const key = b.symbol || "—";
      acc[key] ??= { s: key, win: 0, loss: 0 };
      if (b.result === "WIN") acc[key].win += 1;
      else acc[key].loss += 1;
      return acc;
    }, {})
  );
  const cards = [
    { label: "TOTAL BACKTESTS", value: total, icon: <LayoutGrid size={16} />, tint: "from-violet-50 to-indigo-50", iconBg: "bg-violet-100 text-purple-brand", suffix: "" },
    { label: "WINS", value: wins, icon: <TrendingUp size={16} />, tint: "from-emerald-50 to-teal-50", iconBg: "bg-emerald-100 text-emerald-600", suffix: "" },
    { label: "LOSSES", value: losses, icon: <TrendingDown size={16} />, tint: "from-rose-50 to-orange-50", iconBg: "bg-rose-100 text-loss", suffix: "" },
    { label: "WIN RATE", value: total ? Math.round((wins / total) * 100) : 0, icon: <Target size={16} />, tint: "from-sky-50 to-cyan-50", iconBg: "bg-sky-100 text-sky-600", suffix: "%" },
    { label: "AVG PLANNED R:R", value: avgRr, icon: <Sparkles size={16} />, tint: "from-blue-50 to-violet-50", iconBg: "bg-blue-100 text-blue-500", prefix: total ? "1:" : "", decimals: 2, empty: !total, hint: "Add SL/TP pips" },
    { label: "CHECKLIST ADHERENCE", value: adhere, icon: <ListChecks size={16} />, tint: "from-teal-50 to-emerald-50", iconBg: "bg-teal-100 text-brand", suffix: "%", hint: "Avg of checklist completed" },
    { label: "CURRENT STREAK", value: 0, icon: <Flame size={16} />, tint: "from-violet-50 to-fuchsia-50", iconBg: "bg-violet-100 text-purple-brand", emptyLabel: streak },
    { label: "SYMBOLS TESTED", value: symbols, icon: <Trophy size={16} />, tint: "from-amber-50 to-yellow-50", iconBg: "bg-amber-100 text-amber-500", suffix: "" },
  ];

  return (
    <div>
      <PageHeader title="Statistics Center" subtitle="Dive into your backtesting performance metrics and analytics." onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <SoftKpi key={c.label} {...c} />
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <ChartPanel title="Win / Loss Distribution" sub="Outcome mix across every logged backtest" tint="from-teal-50/90" icon={<TrendingUp size={15} />} iconBg="bg-teal-100 text-brand">
            {total === 0 ? (
              <EmptyViz text="No backtests yet. Add your first one to see statistics." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bySymbol.length ? bySymbol : [{ s: "All", win: wins, loss: losses }]} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="s" tick={{ fontSize: 12, fill: TICK }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip aliases={{ win: "Wins", loss: "Losses" }} integer />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                  <Bar dataKey="win" name="Wins" fill={WIN} radius={[8, 8, 0, 0]} animationDuration={800} />
                  <Bar dataKey="loss" name="Losses" fill={LOSS} radius={[8, 8, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
          <ChartPanel title="Result Mix" sub="Wins versus losses" tint="from-white" icon={<Target size={15} />} iconBg="bg-rose-100 text-rose-500">
            {total === 0 ? (
              <EmptyViz text="No data found for the current period." />
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={dist} dataKey="v" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={3} stroke="#fff" strokeWidth={2} animationDuration={800}>
                      {dist.map((p) => (
                        <Cell key={p.name} fill={p.fill} className="cursor-pointer outline-none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip integer />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <p className="text-center text-lg font-semibold dark:text-white">
                    {Math.round((wins / total) * 100)}%
                    <span className="block text-[11px] font-normal text-ink-faint">Win Rate</span>
                  </p>
                </div>
                <div className="mt-1 flex justify-center gap-4 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: WIN }} /> Wins ({wins})</span>
                  <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: LOSS }} /> Losses ({losses})</span>
                </div>
              </div>
            )}
          </ChartPanel>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
          <div>
            <p className="font-medium dark:text-white">Want to log a new backtest?</p>
            <p className="text-xs text-ink-muted">Log a new backtest on the Backtested Trades page to generate stats.</p>
          </div>
          <Link to="/backtests" className="btn-gradient">
            + Go to Backtested Trades
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CouponsPage() {
  const onMenu = useMenu();
  const { toast } = useToast();
  const [copied, setCopied] = useState("");
  const [deals, setDeals] = useState<PropDeal[]>([]);
  const [live, setLive] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready">("loading");
  const tints = [
    "from-teal-50 to-cyan-50 dark:from-brand/15 dark:to-transparent",
    "from-violet-50 to-indigo-50 dark:from-violet-500/15 dark:to-transparent",
    "from-amber-50 to-orange-50 dark:from-amber-500/15 dark:to-transparent",
  ];

  const refresh = () => {
    setLoadState("loading");
    loadPropDeals()
      .then((result) => {
        setDeals(result.deals);
        setLive(result.live);
        setLoadState("ready");
      })
      .catch(() => {
        setDeals([]);
        setLive(false);
        setLoadState("ready");
      });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <PageHeader title="Partner Offers" subtitle="Quick access to exclusive benefits, discounts, and trading perks." onMenu={onMenu} />
      <div className="page-shell overflow-hidden p-5 sm:p-7">
        <div className="rounded-[22px] bg-gradient-to-r from-teal-50/90 via-white to-violet-50/80 p-6 dark:from-brand/15 dark:via-transparent dark:to-violet-500/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">OFFERS & DEALS</span>
              <h2 className="mt-2 text-2xl font-semibold dark:text-white">Prop Firm Coupons</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Live forex prop-firm discounts: firm name, details, code, and deal link.
              </p>
            </div>
            <button className="btn-ghost" onClick={refresh} disabled={loadState === "loading"}>
              <RefreshCw size={14} className={loadState === "loading" ? "animate-spin" : ""} />
              {loadState === "loading" ? "Checking…" : "Refresh deals"}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-ink-faint">
            {live
              ? "Showing codes found on official prop-firm sites right now. Always confirm at checkout."
              : "Live scan did not return a published code, so official deal pages are listed. Open a firm to apply any current promo."}
          </p>
        </div>

        {loadState === "loading" && deals.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <RefreshCw size={22} className="animate-spin text-brand" />
            <p className="mt-4 text-sm text-ink-muted">Scanning prop firms for live discounts…</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
              <Ticket size={22} />
            </div>
            <p className="mt-4 text-sm text-ink-muted">No active coupons currently available. Check back soon!</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {deals.map((c, i) => {
              const hasCode = Boolean(c.code.trim());
              return (
              <article key={c.id} className={`card trade-kpi overflow-hidden bg-gradient-to-br p-5 ${tints[i % tints.length]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-bold text-brand shadow-soft dark:bg-white/10">
                      {c.firm.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-faint">{c.firm}</p>
                      <p className="text-2xl font-semibold dark:text-white">{c.discount}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand dark:bg-white/10">
                    {c.source === "live" ? "Live" : "Active"}
                  </span>
                </div>
                {c.details ? <p className="mt-3 text-sm text-ink-muted">{c.details}</p> : null}
                <p className={`mt-4 rounded-xl border border-dashed border-brand/30 bg-white/80 px-3 py-2.5 ${hasCode ? "font-mono tracking-[0.18em]" : "text-sm font-semibold"} dark:bg-[#151a21]`}>
                  {hasCode ? c.code : "No code needed"}
                </p>
                <p className="mt-2 break-all text-xs text-ink-faint">{c.url}</p>
                {c.expiry ? <p className="mt-1 text-xs text-ink-faint">Expires {c.expiry}</p> : null}
                <div className="mt-4 flex gap-2">
                  {hasCode ? (
                    <button
                      className="btn-primary flex-1"
                      onClick={() => {
                        void navigator.clipboard?.writeText(c.code);
                        setCopied(c.id);
                        toast("Coupon copied");
                      }}
                    >
                      <Copy size={14} /> {copied === c.id ? "Copied" : "Copy code"}
                    </button>
                  ) : null}
                  <button className={`btn-ghost ${hasCode ? "" : "btn-primary flex-1"}`} onClick={() => window.open(c.url, "_blank", "noopener")}>
                    <ExternalLink size={14} /> Visit offer
                  </button>
                </div>
              </article>
              );
            })}
          </div>
        )}
        <p className="mt-6 text-center text-[11px] text-ink-faint">
          Coupon codes are provided for informational purposes. Verify validity with each firm before purchasing. Quantum is not affiliated with these prop firms.
        </p>
      </div>
    </div>
  );
}

export function CalculatorPage() {
  const onMenu = useMenu();
  const { data, addSymbol } = useStore();
  const { toast } = useToast();
  const [pair, setPair] = useState("EURUSD");
  const [balance, setBalance] = useState(() => String(data.accounts[0]?.balance || 10000));
  const [risk, setRisk] = useState("1");
  const [sl, setSl] = useState("");

  const result = useMemo(() => {
    const b = Number(balance);
    const r = Number(risk);
    const stop = Number(sl);
    if (!b || !r || !stop || stop <= 0) return null;
    const riskAmt = (b * r) / 100;
    const pipValue = pair.toUpperCase().includes("JPY") ? 9.09 : 10;
    const lots = riskAmt / (stop * pipValue);
    return { riskAmt, lots, stop, pair, pipValue };
  }, [balance, risk, sl, pair]);

  function reset() {
    setPair("EURUSD");
    setBalance("10000");
    setRisk("1");
    setSl("");
  }

  function addPair() {
    const next = window.prompt("Add currency pair (e.g. NZDUSD)");
    if (!next) return;
    addSymbol(next);
    setPair(next.trim().toUpperCase());
    toast("Pair added");
  }

  const display = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "—");

  return (
    <div>
      <PageHeader title="Position Calculator" subtitle="Size entries with confidence before placing the trade." onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">RISK MANAGEMENT</span>
        <h2 className="mt-2 text-2xl font-semibold dark:text-white">Position Calculator</h2>
        <p className="mt-1 text-sm text-ink-muted">Calculate your exact lot size based on your risk management rules.</p>

        <div className="card mt-6 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">INPUT VALUES</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">Currency Pair</span>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={pair} onChange={(e) => setPair(e.target.value)}>
                    {data.symbols.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                    {!data.symbols.includes(pair) ? <option>{pair}</option> : null}
                  </Select>
                </div>
                <button type="button" className="btn-primary h-11 w-11 shrink-0 px-0" onClick={addPair} aria-label="Add pair">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <Field label="Account Balance (USD)">
              <Input value={balance} onChange={(e) => setBalance(e.target.value)} />
            </Field>
            <Field label="Risk Per Trade (%)">
              <div>
                <Input value={risk} onChange={(e) => setRisk(e.target.value)} />
                <div className="mt-2 flex gap-2">
                  {["0.5", "1", "2"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRisk(n)}
                      className={`filter-pill rounded-full px-3 py-1 text-xs font-semibold ${risk === n ? "bg-brand text-white shadow-soft" : "bg-slate-100 text-ink-muted dark:bg-white/10"}`}
                    >
                      {n}%
                    </button>
                  ))}
                </div>
              </div>
            </Field>
            <Field label="Stop-Loss (Pips)">
              <Input placeholder="e.g. 50" value={sl} onChange={(e) => setSl(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-ghost" onClick={reset}>Reset</button>
            <button className="btn-primary" onClick={() => { if (!result) toast("Enter balance, risk, and stop-loss pips.", "info"); }}>
              Calculate
            </button>
          </div>
          {result ? (
            <p className="mt-4 rounded-xl bg-brand/10 px-4 py-2.5 text-sm text-brand-700 dark:text-brand">
              Risking <b>${display(result.riskAmt)}</b> on <b>{result.pair}</b> with <b>{display(result.stop, 1)} pip SL</b>.
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">CALCULATION RESULTS</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ResultTile icon={<CircleDollarSign size={18} className="text-emerald-500" />} iconBg="bg-emerald-50 dark:bg-emerald-500/15" label="Risk Amount (USD)" value={result ? `$${display(result.riskAmt)}` : "—"} />
            <ResultTile icon={<Ruler size={18} className="text-slate-500" />} iconBg="bg-slate-100 dark:bg-white/10" label="Stop Loss (pips)" value={result ? display(result.stop, 1) : "—"} />
            <ResultTile icon={<Box size={18} className="text-amber-700" />} iconBg="bg-amber-50 dark:bg-amber-500/15" label="Recommended Lots" value={result ? display(result.lots) : "—"} highlight />
            <ResultTile icon={<Diamond size={18} className="text-rose-500" />} iconBg="bg-rose-50 dark:bg-rose-500/15" label="Mini Lots (0.1)" value={result ? display(result.lots * 10, 1) : "—"} />
            <ResultTile icon={<Diamond size={18} className="text-sky-500" />} iconBg="bg-sky-50 dark:bg-sky-500/15" label="Micro Lots (0.01)" value={result ? String(Math.round(result.lots * 100)) : "—"} />
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Position size is indicative. Always verify with your broker's calculator. Pip values vary by broker. Trading involves significant risk of loss.
        </div>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const onMenu = useMenu();
  const [pair, setPair] = useState("All");
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(DEFAULT_CALENDAR_CURRENCIES);
  const [impacts, setImpacts] = useState<CalImpact[]>(["HIGH", "MED", "LOW"]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [source, setSource] = useState<CalendarSource | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [now, setNow] = useState(() => Date.now());
  const todayKey = gmtYmd();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = () => {
    setLoadState("loading");
    loadEconomicCalendar()
      .then((result) => {
        setEvents(result.events);
        setSource(result.source);
        setLoadState("ready");
      })
      .catch(() => {
        setEvents([]);
        setSource(null);
        setLoadState("error");
      });
  };

  useEffect(() => {
    refresh();
  }, []);

  const extraCodes = useMemo(
    () => [...new Set(events.map((e) => e.currency))].filter((code) => !CALENDAR_CURRENCIES.some((c) => c.code === code)),
    [events]
  );

  const pairPills = useMemo(() => ["All", ...enabledCurrencies], [enabledCurrencies]);

  const todayEvents = events.filter((e) => eventGmtYmd(e.at) === todayKey);
  const rows = todayEvents.filter((e) => {
    if (enabledCurrencies.length && !enabledCurrencies.includes(e.currency)) return false;
    if (pair !== "All" && e.currency !== pair) return false;
    if (impacts.length && !impacts.includes(e.impact)) return false;
    return true;
  });
  const gmtFmt: Intl.DateTimeFormatOptions = { timeZone: "UTC" };
  const heading = todayEvents[0]
    ? dayHeading(todayEvents[0].at)
    : new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric", ...gmtFmt });
  const clock = new Date(now).toISOString().slice(11, 19);
  const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", ...gmtFmt });
  const sessionDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", ...gmtFmt });
  const nextId = rows.find((e) => new Date(e.at).getTime() > now)?.id;

  function toggleImpact(key: CalImpact) {
    setImpacts((curr) => {
      if (curr.includes(key) && curr.length === 1) return curr;
      return curr.includes(key) ? curr.filter((c) => c !== key) : [...curr, key];
    });
  }

  function flagFor(code: string) {
    return CALENDAR_CURRENCIES.find((c) => c.code === code)?.flag ?? FLAGS[code] ?? "";
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-none">
      <PageHeader
        title="Economic Calendar"
        subtitle="Focus on the events that can move your sessions and liquidity."
        onMenu={onMenu}
        sticky={false}
        dateText={sessionDate}
        className="mb-3 sm:mb-4"
      />
      <div className="page-shell flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
        <div className="shrink-0 rounded-[24px] bg-gradient-to-r from-teal-100/90 via-cyan-50 to-violet-50 p-5 dark:from-brand/20 dark:via-transparent dark:to-violet-500/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">Event Risk Dashboard</p>
          <div className="mt-2">
            <h2 className="text-2xl font-semibold dark:text-white">Economic Calendar</h2>
            <p className="text-sm text-ink-muted">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Pairs</p>
              <div className="flex max-w-full gap-1.5 overflow-x-auto pb-0.5">
                {pairPills.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPair(p)}
                    className={`filter-pill shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                      pair === p ? "bg-sky-500 text-white shadow-soft" : "bg-white text-ink-muted dark:bg-white/10"
                    }`}
                  >
                    {p === "All" ? "All" : pairLabel(p)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Impact</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {IMPACT_FILTERS.map((item) => {
                  const on = impacts.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleImpact(item.key)}
                      className={`filter-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        on ? "bg-white text-ink shadow-soft ring-1 ring-sky-400 dark:bg-white/15 dark:text-white" : "bg-white/70 text-ink-muted dark:bg-white/10"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line dark:border-[#243041]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5 text-sm text-ink-muted dark:border-[#243041]">
            <span className="inline-flex items-center gap-2">
              {todayLabel}
              <ChevronDown size={14} className="text-ink-faint" />
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono">{clock} (GMT)</span>
              <span className="flex items-center gap-1.5 text-ink-faint">
                <PlayBadge />
                <Apple size={14} />
                <button
                  type="button"
                  className="rounded-md p-1 text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Open calendar filters"
                  onClick={() => setFilterOpen(true)}
                >
                  <SlidersHorizontal size={15} />
                </button>
              </span>
            </div>
          </div>
          <p className="shrink-0 border-b border-line px-4 py-1.5 text-[11px] text-ink-faint dark:border-[#243041]">
            {source === "myfxbook" ? (
              <>
                Live table from{" "}
                <a className="font-medium text-brand hover:underline" href="https://www.myfxbook.com/forex-economic-calendar" target="_blank" rel="noreferrer">
                  Myfxbook Economic Calendar
                </a>
                {" "}· today only
              </>
            ) : source === "public" ? (
              <>Live public economic calendar feed (Myfxbook was unavailable) · today only</>
            ) : loadState === "error" ? (
              <>Could not load live calendar data.</>
            ) : (
              <>Fetching live economic events…</>
            )}
          </p>
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-line bg-slate-50 text-[11px] uppercase tracking-wide text-ink-faint dark:border-[#243041] dark:bg-[#151a21]">
                <tr>
                  {["Date", "Time left", "Event", "Impact", "Previous", "Consensus", "Actual", ""].map((h) => (
                    <th key={h || "alert"} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadState === "loading" ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-ink-faint">Loading live economic events…</td>
                  </tr>
                ) : loadState === "error" ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-ink-faint">
                      Could not load the public calendar.
                      <button type="button" className="ml-2 font-semibold text-brand hover:underline" onClick={refresh}>
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-ink-faint">No events for today match the current filters.</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td colSpan={8} className="bg-slate-50 px-4 py-2 text-xs font-semibold dark:bg-white/5 dark:text-white">{heading}</td>
                    </tr>
                    {rows.map((e) => {
                      const left = timeLeft(e.at, now);
                      const alertOn = alerts.includes(e.id);
                      return (
                        <tr
                          key={e.id}
                          className={`dash-row border-b border-line last:border-0 hover:bg-sky-50/70 dark:border-[#243041] dark:hover:bg-white/5 ${
                            e.id === nextId ? "bg-emerald-50/80 dark:bg-emerald-500/10" : ""
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{fmtStamp(e.at)}</td>
                          <td className="px-4 py-3">
                            {left === "done" ? <CheckCircle2 size={16} className="text-brand" /> : <span className="text-xs font-medium text-ink-muted">{left}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="mr-2">{flagFor(e.currency)}</span>
                            <span className="mr-2 text-xs font-semibold text-ink-faint">{e.currency}</span>
                            {e.event}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${
                                e.impact === "HIGH" ? "bg-red-500" : e.impact === "MED" ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            >
                              {e.impact === "MED" ? "MED" : e.impact}
                            </span>
                          </td>
                          <td className="px-4 py-3">{e.previous}</td>
                          <td className="px-4 py-3">{e.consensus}</td>
                          <td className={`px-4 py-3 font-medium ${e.actual !== "—" ? (e.better ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15" : e.better === false ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15" : "") : ""}`}>
                            {e.actual}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className={`rounded-lg p-1.5 ${alertOn ? "text-brand" : "text-ink-faint hover:text-ink dark:hover:text-white"}`}
                              onClick={() => setAlerts((p) => (p.includes(e.id) ? p.filter((x) => x !== e.id) : [...p, e.id]))}
                              aria-label="Toggle event alert"
                            >
                              {alertOn ? <BellRing size={15} /> : <Bell size={15} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {filterOpen ? (
        <CalendarFilterModal
          selected={enabledCurrencies}
          impacts={impacts}
          extraCodes={extraCodes}
          onClose={() => setFilterOpen(false)}
          onApply={(currencies, nextImpacts) => {
            setEnabledCurrencies(currencies);
            setImpacts(nextImpacts);
            if (pair !== "All" && !currencies.includes(pair)) setPair("All");
            setFilterOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function PayoutsPage() {
  const onMenu = useMenu();
  const { data } = useStore();
  const { setOpen } = useModal();
  const today = new Date(`${TODAY_ISO}T12:00:00`);
  const [month, setMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(TODAY_ISO);
  const completed = data.payouts.filter((p) => p.status === "Completed");
  const pending = data.payouts.filter((p) => p.status === "Pending");
  const total = completed.reduce((s, p) => s + p.payout, 0);
  const avg = completed.length ? total / completed.length : 0;
  const largest = completed.reduce((m, p) => Math.max(m, p.payout), 0);
  const firmTotals = Object.entries(
    completed.reduce<Record<string, number>>((acc, p) => {
      const k = p.firm || "Unknown";
      acc[k] = (acc[k] ?? 0) + p.payout;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const topFirm = firmTotals[0]?.[0] ?? "N/A";
  const monthKey = `${month.y}-${String(month.m + 1).padStart(2, "0")}`;
  const monthCount = data.payouts.filter((p) => (p.payoutDate || p.requestDate).startsWith(monthKey)).length;
  const dayRows = data.payouts.filter((p) => p.payoutDate === selected || p.requestDate === selected);
  const first = new Date(month.y, month.m, 1).getDay();
  const dim = new Date(month.y, month.m + 1, 0).getDate();
  const cells = Array.from({ length: first + dim }, (_, i) => (i < first ? null : i - first + 1));
  const monthly = lastMonths(6).map(({ y, m, label }) => {
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    const v = completed.filter((p) => (p.payoutDate || p.requestDate).startsWith(key)).reduce((s, p) => s + p.payout, 0);
    return { label, v };
  });
  const pie = firmTotals.map(([name, v], i) => ({ name, v, fill: [TEAL, PURPLE, AMBER, WIN, "#38BDF8"][i % 5] }));
  const cutoff = addDaysIso(TODAY_ISO, -30);
  const last30 = completed.filter((p) => (p.payoutDate || p.requestDate) >= cutoff).reduce((s, p) => s + p.payout, 0);
  const rate = data.payouts.length ? Math.round((completed.length / data.payouts.length) * 100) : 0;

  function shiftMonth(delta: number) {
    setMonth((p) => {
      const d = new Date(p.y, p.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <div>
      <PageHeader title="Payout Dashboard" subtitle="Track requests, payout rhythm, and prop firm performance." onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">PERFORMANCE TRACKING</span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">Payouts Dashboard</h2>
          </div>
          <button className="btn-gradient" onClick={() => setOpen("payout")}>
            <Plus size={16} /> Add Payout
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SoftKpi label="Lifetime Payout" value={total} money icon={<CircleDollarSign size={16} />} tint="from-emerald-50 to-teal-50" iconBg="bg-white/80 text-emerald-600" />
          <SoftKpi label="Average Payout" value={avg} money icon={<TrendingUp size={16} />} tint="from-amber-50 to-yellow-50" iconBg="bg-white/80 text-amber-500" />
          <SoftKpi label="Largest Payout" value={largest} money icon={<Trophy size={16} />} tint="from-orange-50 to-amber-50" iconBg="bg-white/80 text-orange-500" />
          <SoftKpi label="Most Profitable Firm" value={0} emptyLabel={topFirm} icon={<Building2 size={16} />} tint="from-cyan-50 to-sky-50" iconBg="bg-white/80 text-sky-600" />
          <SoftKpi label="Payouts / Month" value={monthCount} icon={<CalendarDays size={16} />} tint="from-violet-50 to-indigo-50" iconBg="bg-white/80 text-purple-brand" />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <ChartPanel title="Monthly Payouts" sub="Completed payouts by month" tint="from-amber-50/90" icon={<TrendingUp size={15} />} iconBg="bg-amber-100 text-amber-600">
            {!completed.length ? (
              <EmptyViz text="No data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="payoutFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AMBER} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={AMBER} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: TICK }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip money aliases={{ v: "Payout" }} />} />
                  <Area type="monotone" dataKey="v" name="Payout" stroke={AMBER} strokeWidth={2.4} fill="url(#payoutFill)" animationDuration={900} dot={{ r: 3.5, fill: AMBER, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
          <ChartPanel title="Payouts by Firm" sub="Share of completed payouts" tint="from-emerald-50/90" icon={<Building2 size={15} />} iconBg="bg-emerald-100 text-emerald-600">
            {!pie.length ? (
              <EmptyViz text="No data yet." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pie} dataKey="v" nameKey="name" innerRadius={46} outerRadius={66} paddingAngle={3} stroke="#fff" strokeWidth={2} animationDuration={800}>
                      {pie.map((p) => (
                        <Cell key={p.name} fill={p.fill} className="cursor-pointer outline-none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip money />} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-1 space-y-1 text-xs">
                  {pie.map((p) => (
                    <li key={p.name} className="flex items-center justify-between text-ink-muted">
                      <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: p.fill }} /> {p.name}</span>
                      <b className="text-ink dark:text-white">{formatPnl(p.v).replace("+", "")}</b>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </ChartPanel>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl bg-gradient-to-b from-cyan-50/90 to-white p-4 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-card dark:from-white/5 dark:to-transparent">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold dark:text-white">{monthLabel(month.y, month.m)}</h3>
              <div className="flex items-center gap-1">
                <button type="button" className="btn-ghost h-8 px-3 text-xs" onClick={() => { setMonth({ y: today.getFullYear(), m: today.getMonth() }); setSelected(TODAY_ISO); }}>
                  Today
                </button>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/70 dark:hover:bg-white/10" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                  <ArrowLeft size={14} />
                </button>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/70 dark:hover:bg-white/10" onClick={() => shiftMonth(1)} aria-label="Next month">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-ink-faint">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <span key={i} />;
                const iso = `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const has = data.payouts.some((p) => p.payoutDate === iso || p.requestDate === iso);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(iso)}
                    className={`cal-day h-10 rounded-xl text-sm ${
                      iso === selected
                        ? "bg-violet-100 font-semibold text-violet-700 dark:bg-violet-500/25 dark:text-violet-200"
                        : has
                          ? "bg-emerald-100 font-medium text-emerald-700 dark:bg-emerald-500/20"
                          : "text-ink-muted hover:bg-white/80 dark:hover:bg-white/5"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-b from-violet-50/90 to-white p-4 shadow-soft dark:from-violet-500/10 dark:to-transparent">
            <h3 className="flex items-center gap-2 font-semibold dark:text-white">
              <CalendarDays size={16} className="text-purple-brand" /> Day Details
            </h3>
            <p className="mt-1 text-xs text-ink-faint">{selected}</p>
            {dayRows.length === 0 ? (
              <p className="mt-10 text-center text-sm text-ink-faint">Click any day with records to view details here.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {dayRows.map((p) => (
                  <li
                    key={p.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl bg-white/80 px-3 py-2 transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-white/5"
                    onClick={() => setOpen("payout", { payoutId: p.id })}
                  >
                    <span>{p.firm} · {p.status}</span>
                    <b>{formatPnl(p.payout)}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <ChartPanel title="Income Distribution by Firm" sub="Share of lifetime completed payouts" tint="from-violet-50/90" icon={<Building2 size={15} />} iconBg="bg-violet-100 text-purple-brand">
            {!firmTotals.length ? (
              <EmptyViz text="No data yet." />
            ) : (
              <div className="space-y-3 pt-2">
                {firmTotals.map(([firm, v]) => (
                  <div key={firm}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium dark:text-white">{firm}</span>
                      <span className="text-ink-muted">{formatPnl(v).replace("+", "")} · {Math.round((v / Math.max(1, total)) * 100)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                      <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${Math.max(6, (v / Math.max(1, total)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartPanel>
          <div className="rounded-2xl bg-gradient-to-br from-[#12324A] to-[#0F1B2D] p-5 text-white shadow-soft">
            <h3 className="font-semibold">Performance Summary</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-slate-300">Last 30 Days Net Payouts</span><b>{formatPnl(last30)}</b></li>
              <li className="flex justify-between"><span className="text-slate-300">Pending Payouts</span><b className="text-amber-300">{formatPnl(pending.reduce((s, p) => s + p.payout, 0))}</b></li>
              <li className="flex justify-between"><span className="text-slate-300">Overall Payout Rate</span><b>{rate}%</b></li>
              <li className="flex justify-between"><span className="text-slate-300">Completed</span><b>{completed.length}</b></li>
            </ul>
          </div>
        </div>

        <div className="card mt-5 overflow-hidden p-0">
          <div className="border-b border-line px-4 py-3 dark:border-[#243041]">
            <h3 className="font-semibold dark:text-white">Recent Activity</h3>
          </div>
          {data.payouts.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-faint">No payouts yet.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-ink-faint">
                <tr>
                  {["Date", "Prop Firm", "Account", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.payouts.slice(0, 8).map((p) => (
                  <tr key={p.id} className="journal-row cursor-pointer" onClick={() => setOpen("payout", { payoutId: p.id })}>
                    <td className="px-4 py-3 text-ink-muted">{p.payoutDate || p.requestDate}</td>
                    <td className="px-4 py-3 font-medium dark:text-white">{p.firm}</td>
                    <td className="px-4 py-3">{p.accountName}</td>
                    <td className="px-4 py-3 font-semibold">{formatPnl(p.payout)}</td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export function PayoutJournalPage() {
  const onMenu = useMenu();
  const { setOpen } = useModal();
  const { data, deletePayout } = useStore();
  const [q, setQ] = useState("");
  const [firm, setFirm] = useState("All Firms");
  const [month, setMonth] = useState("All Months");
  const firms = ["All Firms", ...new Set(data.payouts.map((p) => p.firm).filter(Boolean))];
  const months = ["All Months", ...new Set(data.payouts.map((p) => (p.requestDate || p.payoutDate).slice(0, 7)))];
  const rows = data.payouts.filter((p) => {
    if (q && !`${p.firm} ${p.accountName} ${p.method}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (firm !== "All Firms" && p.firm !== firm) return false;
    if (month !== "All Months" && !(p.requestDate || p.payoutDate).startsWith(month)) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Payout Journal" subtitle="Review every payout request with clearer status visibility." onMenu={onMenu} />
      <div className="page-shell overflow-hidden p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-[22px] bg-gradient-to-r from-teal-50/80 via-white to-emerald-50/80 p-5 dark:from-brand/10 dark:via-transparent dark:to-emerald-500/10">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">PAYOUT LOGS</span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">Payout Journal</h2>
            <p className="text-sm text-ink-muted">Manage and track your prop-firm payouts.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setOpen("payout")}>
              <Plus size={16} /> Add Payout
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                const header = ["DATE", "PROP FIRM", "ACCOUNT", "SIZE", "AMOUNT", "SPLIT", "PAYOUT", "STATUS", "METHOD"];
                const body = data.payouts.map((p) => [p.requestDate, p.firm, p.accountName, p.size, p.amount, p.split, p.payout, p.status, p.method].map(csvEscape).join(","));
                downloadText("payouts.csv", [header.join(","), ...body].join("\n"), "text/csv");
              }}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="input pl-10" placeholder="Search firm or account..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="w-44">
            <Select value={firm} onChange={(e) => setFirm(e.target.value)}>
              {firms.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-line bg-slate-50 text-[11px] uppercase tracking-wide text-ink-faint dark:border-[#243041] dark:bg-white/5">
              <tr>
                {["DATE", "PROP FIRM", "ACCOUNT", "SIZE", "AMOUNT", "SPLIT", "PAYOUT", "STATUS", "METHOD", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="journal-row cursor-pointer border-b border-line dark:border-[#243041]"
                  onClick={() => setOpen("payout", { payoutId: p.id })}
                >
                  <td className="px-4 py-3 text-ink-muted">{p.requestDate}</td>
                  <td className="px-4 py-3 font-medium dark:text-white">{p.firm}</td>
                  <td className="px-4 py-3">{p.accountName}</td>
                  <td className="px-4 py-3">{p.size}</td>
                  <td className="px-4 py-3">{formatPnl(p.amount)}</td>
                  <td className="px-4 py-3">{p.split || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatPnl(p.payout)}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3">
                    <button className="rounded-lg p-1.5 text-loss hover:bg-loss-soft" onClick={(e) => { e.stopPropagation(); deletePayout(p.id); }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="py-16 text-center text-sm text-ink-faint">No payouts found.</p> : null}
        </div>
      </div>
    </div>
  );
}

export function AffiliatePage() {
  const onMenu = useMenu();
  const { currentUser, isSuperAdmin, users, copyAffiliate } = useStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedUser, setCopiedUser] = useState("");
  const [openId, setOpenId] = useState("");
  const code = currentUser?.referralCode || "";
  const link = referralSignupLink(code);
  const mySignups = users.filter((u) => u.referredByCode === code);
  const ranked = [...users].sort((a, b) => {
    const ac = users.filter((u) => u.referredByCode === a.referralCode).length;
    const bc = users.filter((u) => u.referredByCode === b.referralCode).length;
    return bc - ac || a.name.localeCompare(b.name);
  });

  return (
    <div>
      <PageHeader
        title="Affiliate Program"
        subtitle={
          isSuperAdmin
            ? "Monitor every referral link and the traders who signed up through it."
            : "Share your Quantum link and see how many traders signed up with it."
        }
        onMenu={onMenu}
      />
      <div className="page-shell overflow-hidden p-5 sm:p-8">
        <div className="rounded-[24px] bg-gradient-to-r from-teal-50 via-white to-violet-50 p-6 dark:from-brand/15 dark:via-transparent dark:to-violet-500/10">
          <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">PARTNERS</span>
          <h2 className="mt-2 text-2xl font-semibold dark:text-white">Invite traders.</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Each account has a unique referral code. Anyone who opens signup with your link is counted for you.
          </p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-ink-faint">Your referral code</p>
            <p className="mt-1 font-mono text-xl font-semibold dark:text-white">{code || "—"}</p>
            <p className="mt-3 break-all rounded-xl bg-slate-50 px-3 py-2 text-sm text-ink-muted dark:bg-white/5">{link}</p>
            <button
              className="btn-gradient mt-4"
              onClick={() => {
                copyAffiliate();
                setCopied(true);
                toast("Referral link copied");
              }}
            >
              <Copy size={14} /> {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-violet-50 p-5 dark:from-white/5 dark:to-white/0">
            <p className="text-xs text-ink-muted">Signups from your link</p>
            <p className="mt-1 text-3xl font-semibold dark:text-white">{mySignups.length}</p>
            <p className="text-[11px] text-ink-faint">People who created an account using your referral code</p>
          </div>
        </div>
        {isSuperAdmin ? (
          <div className="mt-6 card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3 dark:border-[#243041]">
              <Users size={16} className="text-brand" />
              <p className="font-semibold dark:text-white">All referral activity</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-ink-faint dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-2 font-medium">User</th>
                    <th className="px-4 py-2 font-medium">Code</th>
                    <th className="px-4 py-2 font-medium">Signups</th>
                    <th className="px-4 py-2 font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((u) => {
                    const referred = users.filter((x) => x.referredByCode === u.referralCode);
                    const userLink = referralSignupLink(u.referralCode);
                    const open = openId === u.id;
                    return (
                      <tr key={u.id} className="border-t border-line dark:border-[#243041]">
                        <td className="px-4 py-3 align-top">
                          <button className="text-left" onClick={() => setOpenId(open ? "" : u.id)}>
                            <p className="font-medium dark:text-white">{u.name}</p>
                            <p className="text-xs text-ink-faint">{u.email}</p>
                          </button>
                          {open ? (
                            <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                              {referred.length === 0 ? (
                                <p className="text-xs text-ink-faint">No signups on this link yet.</p>
                              ) : (
                                referred.map((r) => (
                                  <div key={r.id} className="flex items-center justify-between gap-3 text-xs">
                                    <div>
                                      <p className="font-medium dark:text-white">{r.name}</p>
                                      <p className="text-ink-faint">{r.email}</p>
                                    </div>
                                    <div className="text-right text-ink-faint">
                                      <p className="capitalize">{r.status}</p>
                                      <p>{new Date(r.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 align-top font-mono text-xs">{u.referralCode}</td>
                        <td className="px-4 py-3 align-top">{referred.length}</td>
                        <td className="px-4 py-3 align-top">
                          <button
                            className="btn-ghost"
                            onClick={() => {
                              void navigator.clipboard?.writeText(userLink);
                              setCopiedUser(u.id);
                              toast("Referral link copied");
                            }}
                          >
                            <Copy size={14} /> {copiedUser === u.id ? "Copied" : "Copy"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["1. Share", "Send your Quantum signup link to other traders."],
              ["2. Track", "This page counts how many people used it to create an account."],
            ].map(([t, d]) => (
              <div key={t} className="card p-4">
                <div className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-brand">
                  <Link2 size={16} />
                </div>
                <p className="font-semibold dark:text-white">{t}</p>
                <p className="mt-1 text-xs text-ink-muted">{d}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultTile({
  icon,
  iconBg,
  label,
  value,
  highlight,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`trade-kpi rounded-2xl border p-4 text-center ${
        highlight
          ? "border-brand/40 bg-brand/10 dark:border-brand/40 dark:bg-brand/15"
          : "border-line bg-white dark:border-[#243041] dark:bg-[#151a21]"
      }`}
    >
      <div className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
      <p className={`text-xl font-semibold ${highlight ? "text-brand" : "dark:text-white"}`}>{value}</p>
      <p className="mt-1 text-[11px] text-ink-muted">{label}</p>
    </div>
  );
}

function SoftKpi({
  label,
  value,
  icon,
  tint,
  iconBg,
  suffix = "",
  prefix = "",
  decimals = 0,
  money,
  hint,
  empty,
  emptyLabel,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tint: string;
  iconBg: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  money?: boolean;
  hint?: string;
  empty?: boolean;
  emptyLabel?: string;
}) {
  const n = useAnimatedNumber(value);
  const display = empty
    ? "—"
    : emptyLabel && !value && !money
      ? emptyLabel
      : money
        ? formatPnl(n).replace("+", "")
        : `${prefix}${decimals ? n.toFixed(decimals) : Math.round(n)}${suffix}`;
  return (
    <article className={`trade-kpi rounded-2xl bg-gradient-to-br p-4 shadow-soft ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-full ${iconBg}`}>{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tracking-tight dark:text-white">{emptyLabel && label === "Most Profitable Firm" ? emptyLabel : display}</p>
      {hint ? <p className="text-[11px] text-ink-faint">{hint}</p> : null}
    </article>
  );
}

function ChartPanel({
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
  icon: ReactNode;
  iconBg: string;
}) {
  return (
    <section className={`rounded-2xl bg-gradient-to-b ${tint} to-white p-4 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-card dark:from-white/5 dark:to-transparent`}>
      <div className="mb-3 flex items-start gap-2.5">
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${iconBg}`}>{icon}</span>
        <div>
          <h3 className="text-sm font-semibold dark:text-white">{title}</h3>
          <p className="text-xs text-ink-muted">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyViz({ text }: { text: string }) {
  return <p className="grid min-h-[160px] place-items-center text-center text-sm text-ink-faint">{text}</p>;
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "Completed"
      ? "bg-emerald-500 text-white"
      : status === "Pending"
        ? "bg-amber-400 text-white"
        : "bg-loss text-white";
  return <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{status}</span>;
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
        const name = aliases[key] ?? p.name;
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

function PlayBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.6 21.4 13.3 1.6h3.5L6.9 21.4H3.6Zm7.7 0 9.7-19.8h3.5L14.8 21.4h-3.5ZM1.2 8.6h15.3v2.9H1.2V8.6Zm2.2 7.2h15.3v2.9H3.4v-2.9Z" />
    </svg>
  );
}

function dayHeading(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function fmtStamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
}

function timeLeft(iso: string, now: number) {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "done";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
  if (h > 0) return `${h} h ${m} m`;
  return `${m} m`;
}

function lastMonths(n: number) {
  const d = new Date(`${TODAY_ISO}T12:00:00`);
  return Array.from({ length: n }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth() - (n - 1 - i), 1);
    return { y: x.getFullYear(), m: x.getMonth(), label: x.toLocaleString("en-US", { month: "short" }) };
  });
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
