import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Download,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Field, Input, Select } from "../components/ui/Field";
import { calendarEvents, TODAY_ISO } from "../data";
import { useMenu } from "../hooks";
import { useModal } from "../context/ModalContext";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import { csvEscape, downloadText, formatPnl, outcomeStreak, parseRr, rrFromPips } from "../lib";

export function BacktestsPage() {
  const onMenu = useMenu();
  const { setOpen } = useModal();
  const { data, deleteBacktest } = useStore();
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const rows = data.backtests.filter((b) => {
    if (tab === "Wins" && b.result !== "WIN") return false;
    if (tab === "Losses" && b.result !== "LOSS") return false;
    if (q && !`${b.symbol} ${b.no} ${b.notes}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const wins = data.backtests.filter((b) => b.result === "WIN").length;
  const losses = data.backtests.filter((b) => b.result === "LOSS").length;

  return (
    <div>
      <PageHeader title="Backtested Trades" subtitle="Review every backtested trade with full execution context." onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4 dark:border-[#243041]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white"><BookOpen size={18} /></div>
            <div>
              <p className="font-semibold dark:text-white">Backtested Trades</p>
              <p className="text-xs text-ink-muted">{data.backtests.length} trades {wins} wins {losses} losses</p>
            </div>
          </div>
          <button className="btn-gradient" onClick={() => setOpen("backtest")}><Plus size={16} /> Add Backtest</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-full bg-slate-100 p-1 dark:bg-white/10">
            {["All", "Wins", "Losses"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === t ? "bg-brand text-white" : "text-ink-muted"}`}>{t}</button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input pl-10" placeholder="Search symbol, trade #, notes..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="mt-10 flex min-h-[280px] flex-col items-center justify-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-gradient text-white"><BookOpen size={26} /></div>
            <h2 className="mt-4 text-xl font-semibold dark:text-white">No backtests yet</h2>
            <p className="mt-2 max-w-md text-sm text-ink-muted">Diwaangeli backtest-yadaada - kor u qaad guulahaaga oo arag horumarka</p>
            <button className="btn-gradient mt-5" onClick={() => setOpen("backtest")}><Plus size={16} /> Add your first backtest</button>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-y border-line text-xs uppercase text-ink-faint dark:border-[#243041]">
                <tr>{["#", "DATE", "PAIR", "DIR", "RESULT", "NOTES", ""].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="cursor-pointer border-b border-line dark:border-[#243041]" onClick={() => setOpen("backtest", { backtestId: b.id })}>
                    <td className="px-3 py-2">#{b.no}</td>
                    <td className="px-3 py-2">{b.date}</td>
                    <td className="px-3 py-2 font-medium">{b.symbol}</td>
                    <td className="px-3 py-2">{b.direction}</td>
                    <td className={`px-3 py-2 font-semibold ${b.result === "WIN" ? "text-brand" : "text-loss"}`}>{b.result}</td>
                    <td className="px-3 py-2 text-ink-muted">{b.notes}</td>
                    <td className="px-3 py-2"><button className="text-loss" onClick={(e) => { e.stopPropagation(); deleteBacktest(b.id); }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
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
    ? Math.round(
        (data.backtests.reduce((s, b) => s + b.rules.filter((r) => r.checked).length / Math.max(1, b.rules.length), 0) / total) * 100
      )
    : 0;
  const avgRr = total
    ? data.backtests.reduce((s, b) => s + parseRr(rrFromPips(b.slPips, b.tpPips) || "0"), 0) / total
    : 0;
  const streak = outcomeStreak(data.backtests.map((b) => b.result));
  const cards = [
    ["TOTAL BACKTESTS", String(total)],
    ["WINS", String(wins)],
    ["LOSSES", String(losses)],
    ["WIN RATE", `${total ? Math.round((wins / total) * 100) : 0}%`],
    ["AVG PLANNED R:R", total ? `1:${avgRr.toFixed(2)}` : "—"],
    ["CHECKLIST ADHERENCE", `${adhere}%`],
    ["CURRENT STREAK", streak],
    ["SYMBOLS TESTED", String(new Set(data.backtests.map((b) => b.symbol)).size)],
  ];
  return (
    <div>
      <PageHeader title="Statistics Center" subtitle="Dive into your backtesting performance metrics and analytics." dateLabel="VERSION 2.0.2" onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([l, v]) => (
            <div key={l} className="card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{l}</p>
              <p className="mt-2 text-2xl font-semibold dark:text-white">{v}</p>
            </div>
          ))}
        </div>
        {total === 0 ? <div className="mt-8 flex min-h-[180px] items-center justify-center text-sm text-ink-faint">No backtests yet. Add your first one to see statistics.</div> : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
          <div>
            <p className="font-medium dark:text-white">Want to log a new backtest?</p>
            <p className="text-xs text-ink-muted">Log onto the backtested trades page and add a backtest.</p>
          </div>
          <Link to="/backtests" className="btn-gradient">+ Go to Backtested Trades</Link>
        </div>
      </div>
    </div>
  );
}

export function CouponsPage() {
  const onMenu = useMenu();
  const { data } = useStore();
  const [copied, setCopied] = useState("");
  return (
    <div>
      <PageHeader title="Partner Offers" subtitle="Quick access to exclusive benefits, discounts, and trading perks" onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">OFFERS & DEALS</span>
        <h2 className="mt-2 text-2xl font-semibold dark:text-white">Prop Firm Coupons</h2>
        <p className="mt-1 text-sm text-ink-muted">Exclusive discount codes for top prop trading firms.</p>
        {data.coupons.length === 0 ? (
          <div className="mt-16 flex min-h-[220px] flex-col items-center justify-center text-center">
            <p className="text-sm text-ink-muted">No active coupons currently available. Check back soon!</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.coupons.map((c) => (
              <article key={c.id} className="card p-5">
                <p className="text-xs uppercase text-ink-faint">{c.firm}</p>
                <p className="mt-1 text-xl font-semibold dark:text-white">{c.discount}</p>
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 font-mono text-sm dark:bg-white/5">{c.code}</p>
                <p className="mt-2 text-xs text-ink-faint">Expires {c.expiry}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      void navigator.clipboard?.writeText(c.code);
                      setCopied(c.id);
                    }}
                  >
                    <Copy size={14} /> {copied === c.id ? "Copied" : "Copy code"}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => window.open(c.url, "_blank", "noopener")}
                  >
                    Visit offer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="mt-6 text-[11px] text-ink-faint">Coupon codes are provided for informational purposes. Verify validity with each firm before purchasing. Q is not affiliated with these prop firms.</p>
      </div>
    </div>
  );
}

export function CalculatorPage() {
  const onMenu = useMenu();
  const [pair, setPair] = useState("EURUSD");
  const [balance, setBalance] = useState("10000");
  const [risk, setRisk] = useState("1");
  const [sl, setSl] = useState("");
  const [out, setOut] = useState<{ riskAmt: string; lots: string } | null>(null);

  function calc() {
    const b = Number(balance);
    const r = Number(risk);
    const stop = Number(sl);
    if (!b || !r || !stop) return;
    const riskAmt = (b * r) / 100;
    const pipValue = pair.includes("JPY") ? 0.91 : 10;
    const lots = riskAmt / (stop * pipValue);
    setOut({ riskAmt: riskAmt.toFixed(2), lots: lots.toFixed(2) });
  }

  return (
    <div>
      <PageHeader title="Position Calculator" subtitle="Size entries with confidence before placing the trade." onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">RISK MANAGEMENT</span>
        <h2 className="mt-2 text-2xl font-semibold dark:text-white">Position Calculator</h2>
        <p className="mt-1 text-sm text-ink-muted">Calculate your exact lot size based on your risk management rules.</p>
        <div className="mt-6 card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">INPUT VALUES</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Currency Pair">
              <Select value={pair} onChange={(e) => setPair(e.target.value)}>
                <option>EURUSD</option><option>GBPUSD</option><option>USDJPY</option><option>XAUUSD</option>
              </Select>
            </Field>
            <Field label="Account Balance (USD)"><Input value={balance} onChange={(e) => setBalance(e.target.value)} /></Field>
            <Field label="Risk Per Trade (%)">
              <div>
                <Input value={risk} onChange={(e) => setRisk(e.target.value)} />
                <div className="mt-2 flex gap-2">
                  {["0.5", "1", "2"].map((n) => (
                    <button key={n} onClick={() => setRisk(n)} className={`rounded-full px-3 py-1 text-xs font-semibold ${risk === n ? "bg-brand text-white" : "bg-slate-100 dark:bg-white/10"}`}>{n}%</button>
                  ))}
                </div>
              </div>
            </Field>
            <Field label="Stop-Loss (Pips)"><Input placeholder="e.g. 50" value={sl} onChange={(e) => setSl(e.target.value)} /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => { setPair("EURUSD"); setBalance("10000"); setRisk("1"); setSl(""); setOut(null); }}>Reset</button>
            <button className="btn-primary" onClick={calc}>Calculate</button>
          </div>
        </div>
        <div className="mt-5 card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">CALCULATION RESULTS</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Risk Amount ($)", out?.riskAmt ?? "---"],
              ["Stop-Loss (pips)", sl || "---"],
              ["Recommended Lots", out?.lots ?? "---"],
              ["Mini Lots (0.1)", out ? (Number(out.lots) * 10).toFixed(1) : "---"],
              ["Micro Lots (0.01)", out ? (Number(out.lots) * 100).toFixed(0) : "---"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-line p-4 text-center dark:border-[#243041]">
                <p className="text-[11px] text-ink-muted">{l}</p>
                <p className="mt-2 text-xl font-semibold dark:text-white">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const onMenu = useMenu();
  const [pair, setPair] = useState("All");
  const [impacts, setImpacts] = useState<string[]>(["HIGH", "MED", "LOW"]);
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toISOString().slice(11, 19));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const rows = calendarEvents.filter((e) => (pair === "All" || e.currency === pair) && impacts.includes(e.impact));
  const flags: Record<string, string> = { GBP: "🇬🇧", USD: "🇺🇸", EUR: "🇪🇺", CHF: "🇨🇭" };

  function toggleImpact(level: string) {
    setImpacts((p) => (p.includes(level) ? p.filter((x) => x !== level) : [...p, level]));
  }

  return (
    <div>
      <PageHeader title="Economic Calendar" subtitle="Focus on the events that can move your sessions and liquidity." onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <div className="rounded-[24px] bg-gradient-to-r from-teal-100/90 via-cyan-50 to-white p-6 dark:from-brand/20 dark:to-transparent">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">Event Risk Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold dark:text-white">Economic Calendar</h2>
          <p className="text-sm text-ink-muted">Tuesday, August 18, 2026</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["All", "CHF", "EUR", "GBP", "USD"].map((p) => (
                <button key={p} onClick={() => setPair(p)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${pair === p ? "bg-sky-500 text-white" : "bg-white text-ink-muted dark:bg-white/10"}`}>{p}</button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <button type="button" onClick={() => toggleImpact("HIGH")} className={impacts.includes("HIGH") ? "text-red-500" : "text-ink-faint"}>● High</button>
              <button type="button" onClick={() => toggleImpact("MED")} className={impacts.includes("MED") ? "text-amber-500" : "text-ink-faint"}>● Medium</button>
              <button type="button" onClick={() => toggleImpact("LOW")} className={impacts.includes("LOW") ? "text-sky-500" : "text-ink-faint"}>● Low</button>
            </div>
          </div>
        </div>
        <div className="mb-3 mt-5 flex flex-wrap items-center justify-between text-sm text-ink-muted">
          <span>Aug 18 - 20, 2026</span>
          <span className="font-mono">{clock} (GMT)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-line text-xs uppercase text-ink-faint dark:border-[#243041]">
              <tr>{["Date", "Time left", "Event", "Impact", "Previous", "Consensus", "Actual"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr><td colSpan={7} className="bg-slate-50 px-4 py-2 text-xs font-semibold dark:bg-white/5">Tuesday, Aug 18, 2026</td></tr>
              {rows.map((e) => (
                <tr key={e.event} className="border-b border-line last:border-0 dark:border-[#243041]">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{e.date}</td>
                  <td className="px-4 py-3">{e.left === "done" ? <CheckCircle2 size={16} className="text-brand" /> : e.left}</td>
                  <td className="px-4 py-3"><span className="mr-2">{flags[e.currency] ?? ""}</span><span className="mr-2 text-xs font-semibold text-ink-faint">{e.currency}</span>{e.event}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.impact === "HIGH" ? "bg-red-100 text-red-600" : e.impact === "MED" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{e.impact}</span>
                  </td>
                  <td className="px-4 py-3">{e.previous}</td>
                  <td className="px-4 py-3">{e.consensus}</td>
                  <td className={`px-4 py-3 ${e.actual !== "—" ? (e.better ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600") : ""}`}>{e.actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function PayoutsPage() {
  const onMenu = useMenu();
  const { data } = useStore();
  const { setOpen } = useModal();
  const [month] = useState({ y: 2026, m: 7 });
  const [selected, setSelected] = useState(TODAY_ISO);
  const completed = data.payouts.filter((p) => p.status === "Completed");
  const pending = data.payouts.filter((p) => p.status === "Pending");
  const total = completed.reduce((s, p) => s + p.payout, 0);
  const avg = completed.length ? total / completed.length : 0;
  const largest = completed.reduce((m, p) => Math.max(m, p.payout), 0);
  const lastDate = [...completed].sort((a, b) => b.payoutDate.localeCompare(a.payoutDate))[0]?.payoutDate ?? "N/A";
  const dayRows = data.payouts.filter((p) => p.payoutDate === selected || p.requestDate === selected);
  const first = new Date(month.y, month.m, 1).getDay();
  const dim = new Date(month.y, month.m + 1, 0).getDate();
  const cells = Array.from({ length: first + dim }, (_, i) => (i < first ? null : i - first + 1));

  return (
    <div>
      <PageHeader title="Payout Dashboard" subtitle="Keep track of your payouts from different prop firms." onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">PERFORMANCE FIGURES</span>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold dark:text-white">Payouts Dashboard</h2>
            <p className="text-sm text-ink-muted">Tuesday, August 18</p>
          </div>
          <button className="btn-gradient" onClick={() => setOpen("payout")}><Plus size={16} /> Add Payout</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Lifetime Payout", formatPnl(total).replace("+", "")],
            ["Average Payout", formatPnl(avg).replace("+", "")],
            ["Largest Payout", formatPnl(largest).replace("+", "")],
            ["Last Payout Date", lastDate],
            ["Pending Payouts", String(pending.length)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-gradient-to-br from-teal-50 to-violet-50 p-4 dark:from-white/5 dark:to-white/0">
              <p className="text-xs text-ink-muted">{l}</p>
              <p className="mt-2 text-xl font-semibold dark:text-white">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold dark:text-white">{new Date(month.y, month.m, 1).toLocaleString("en-US", { month: "long", year: "numeric" })}</h3>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-ink-faint">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <span key={i} />;
                const iso = `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const has = data.payouts.some((p) => p.payoutDate === iso || p.requestDate === iso);
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(iso)}
                    className={`h-9 rounded-lg text-sm ${iso === selected ? "bg-violet-100 font-semibold text-violet-700 dark:bg-violet-500/20" : has ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20" : "text-ink-muted hover:bg-slate-50 dark:hover:bg-white/5"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold dark:text-white">Day Details</h3>
            <p className="mt-1 text-xs text-ink-faint">{selected}</p>
            {dayRows.length === 0 ? (
              <p className="mt-8 text-center text-sm text-ink-faint">Click on a day with a payout to view details here.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {dayRows.map((p) => (
                  <li key={p.id} className="flex cursor-pointer justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5" onClick={() => setOpen("payout", { payoutId: p.id })}>
                    <span>{p.firm} · {p.status}</span>
                    <b>{formatPnl(p.payout)}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <EmptyCard title="Monthly Payouts" tint="bg-amber-50/80 dark:bg-amber-500/10" empty={!data.payouts.length} />
          <div className="rounded-2xl bg-[#0F1B2D] p-4 text-white">
            <h3 className="font-semibold">Performance Summary</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-slate-300">Last 30 Days Net Payouts</span><b>{formatPnl(completed.filter((p) => p.payoutDate >= "2026-07-19").reduce((s, p) => s + p.payout, 0))}</b></li>
              <li className="flex justify-between"><span className="text-slate-300">Pending Payouts</span><b className="text-amber-300">{formatPnl(pending.reduce((s, p) => s + p.payout, 0))}</b></li>
              <li className="flex justify-between"><span className="text-slate-300">Completed</span><b>{completed.length}</b></li>
            </ul>
          </div>
        </div>
        <div className="card mt-5 p-4">
          <h3 className="font-semibold dark:text-white">Recent Activity</h3>
          {data.payouts.length === 0 ? <p className="mt-8 text-center text-sm text-ink-faint">No data yet</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.payouts.slice(0, 8).map((p) => (
                <li key={p.id} className="flex cursor-pointer justify-between" onClick={() => setOpen("payout", { payoutId: p.id })}>
                  <span>{p.firm} · {p.status}</span><b>{formatPnl(p.payout)}</b>
                </li>
              ))}
            </ul>
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
  const rows = data.payouts.filter((p) => `${p.firm} ${p.accountName}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Payout Journal" subtitle="Review every payout request with clear status visibility." dateLabel="BASED ON DATE" onMenu={onMenu} />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">PAYOUTS LOGS</span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">Payout Journal</h2>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setOpen("payout")}><Plus size={16} /> Add Payout</button>
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
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-line text-xs uppercase text-brand/80 dark:border-[#243041]">
              <tr>{["DATE", "PROP FIRM", "ACCOUNT", "SIZE", "AMOUNT", "SPLIT", "PAYOUT", "STATUS", "METHOD", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                  <tr key={p.id} className="cursor-pointer border-b border-line dark:border-[#243041]" onClick={() => setOpen("payout", { payoutId: p.id })}>
                  <td className="px-4 py-3">{p.requestDate}</td>
                  <td className="px-4 py-3">{p.firm}</td>
                  <td className="px-4 py-3">{p.accountName}</td>
                  <td className="px-4 py-3">{p.size}</td>
                  <td className="px-4 py-3">{formatPnl(p.amount)}</td>
                  <td className="px-4 py-3">{p.split}</td>
                  <td className="px-4 py-3">{formatPnl(p.payout)}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3"><button className="text-loss" onClick={(e) => { e.stopPropagation(); deletePayout(p.id); }}><Trash2 size={14} /></button></td>
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
  const { data, copyAffiliate } = useStore();
  const [copied, setCopied] = useState(false);
  const link = `https://ryzelog.app/r/${data.affiliateCode}`;
  return (
    <div>
      <PageHeader title="Affiliate Program" subtitle="Share Q and earn partner rewards." onMenu={onMenu} />
      <div className="page-shell p-8">
        <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">PARTNERS</span>
        <h2 className="mt-2 text-2xl font-semibold dark:text-white">Invite traders. Earn together.</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">Share your RyzeLog referral link. Tracking is stored locally until a live partner backend is connected.</p>
        <div className="mt-6 card p-5">
          <p className="text-xs uppercase text-ink-faint">Your code</p>
          <p className="mt-1 font-mono text-xl font-semibold dark:text-white">{data.affiliateCode}</p>
          <p className="mt-3 break-all text-sm text-ink-muted">{link}</p>
          <button
            className="btn-gradient mt-4"
            onClick={() => {
              copyAffiliate();
              setCopied(true);
            }}
          >
            <Copy size={14} /> {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[["Referrals", "0"], ["Pending", "$0"], ["Paid", "$0"]].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-gradient-to-br from-teal-50 to-violet-50 p-4 dark:from-white/5 dark:to-white/0">
              <p className="text-xs text-ink-muted">{l}</p>
              <p className="mt-2 text-xl font-semibold dark:text-white">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyCard({ title, tint, empty = true, items }: { title: string; tint: string; empty?: boolean; items?: string[] }) {
  return (
    <div className={`flex min-h-[160px] flex-col rounded-2xl p-4 ${tint}`}>
      <h3 className="font-semibold dark:text-white">{title}</h3>
      {empty || !items?.length ? <p className="m-auto text-sm text-ink-faint">No data yet.</p> : (
        <ul className="mt-3 space-y-1 text-sm">{items.map((i) => <li key={i}>{i}</li>)}</ul>
      )}
    </div>
  );
}
