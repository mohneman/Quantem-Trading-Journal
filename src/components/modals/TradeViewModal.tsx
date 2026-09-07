import { useState, type ReactNode } from "react";
import {
  Clock,
  ClipboardList,
  Image as ImageIcon,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import { useStore, type Trade } from "../../store";
import { formatPnl, suggestPnl, tradePnlForAccount, tradeTotalPnl } from "../../lib";
import { ImageProofField } from "../ui/ImageProofField";

export function TradeViewModal({ onClose, tradeId }: { onClose: () => void; tradeId: string }) {
  const { data, deleteTrade } = useStore();
  const t = data.trades.find((x) => x.id === tradeId);
  const { setOpen } = useModal();
  const { toast } = useToast();
  if (!t) return null;
  const bias = t.direction === "Sell" ? "Bearish" : t.direction === "Buy" ? "Bullish" : "—";
  const linked = data.accounts.filter((a) => t.accountIds.includes(a.id));
  const phase = linked[0]?.status || linked[0]?.challengeType || "N/A";
  const combinedPnl = tradeTotalPnl(t, data.accounts);
  return (
    <Modal title={`${t.symbol || "Trade"} Trade`} subtitle={`${t.date} • #${t.no}`} onClose={onClose} xl>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <MetaPill
            className={t.direction === "Sell" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}
            icon={t.direction === "Sell" ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
          >
            {bias}
          </MetaPill>
          <MetaPill className="bg-pink-50 text-pink-600" icon={<MapPin size={12} />}>{t.session || "—"}</MetaPill>
          <MetaPill className="bg-violet-50 text-purple-brand" icon={<Link2 size={12} />}>{t.symbol || "—"}</MetaPill>
          <MetaPill
            className={
              t.outcome === "WIN"
                ? "bg-emerald-50 text-emerald-700"
                : t.outcome === "LOSS"
                  ? "border border-rose-200 bg-white text-loss"
                  : t.outcome === "BE"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-ink-muted"
            }
            icon={t.outcome === "WIN" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          >
            {t.outcome === "WIN" ? "Win" : t.outcome === "LOSS" ? "Loss" : t.outcome === "BE" ? "BE" : "Open"}
          </MetaPill>
          <MetaPill className="bg-amber-50 text-amber-600" icon={<Link2 size={12} />}>{formatPnl(combinedPnl)}</MetaPill>
          <MetaPill className="bg-indigo-50 text-indigo-600" icon={<ClipboardList size={12} />}>{`Phase: ${phase}`}</MetaPill>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-50 text-lg font-bold text-brand dark:bg-brand/15">
          {t.grade}
        </span>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-white/5">
        <p className="mb-2 flex items-center gap-2 font-medium text-ink-muted">
          <Clock size={14} /> Timestamps
        </p>
        <p><span className="text-ink-muted">Date:</span> {t.date}</p>
        <p><span className="text-ink-muted">Risk:</span> {t.risk || "—"}</p>
        <p><span className="text-ink-muted">R:R:</span> {t.rr || "—"}</p>
        {linked.length ? (
          <div className="mt-2 space-y-1">
            {linked.map((a) => (
              <p key={a.id}>
                <span className="text-ink-muted">{a.name} ({`$${a.balance.toLocaleString()}`}):</span>{" "}
                {formatPnl(tradePnlForAccount(t, a, data.accounts))}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <h3 className="mb-2 mt-5 font-semibold dark:text-white">Trade Checklist Analysis</h3>
      <ul className="space-y-2">
        {t.rules.map((item) => (
          <li
            key={item.text}
            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm ${
              item.checked ? "bg-emerald-50 dark:bg-brand/10" : "bg-slate-50 dark:bg-white/5"
            }`}
          >
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${item.checked ? "bg-brand text-white" : "border-2 border-slate-300"}`}>
              {item.checked ? "✓" : ""}
            </span>
            {item.text}
          </li>
        ))}
      </ul>

      <h3 className="mb-2 mt-5 font-semibold dark:text-white">Trade Notes & Lessons</h3>
      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
        <div className="flex flex-wrap gap-1.5">
          {t.psychology.map((p) => (
            <span key={p} className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs dark:bg-white/10">{p}</span>
          ))}
        </div>
        <p className="mt-2 text-sm">{t.notes || "No notes provided for this trade."}</p>
      </div>

      <h3 className="mb-2 mt-5 font-semibold dark:text-white">Chart Snapshots</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Shot label="BEFORE" src={t.proofUrl} />
        <Shot label="AFTER" src={t.afterUrl} />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="danger"
          icon={<Trash2 size={16} />}
          onClick={() => {
            if (!window.confirm("Delete this trade? This cannot be undone.")) return;
            deleteTrade(t.id);
            toast("Trade deleted");
            onClose();
          }}
        >
          Delete Trade
        </Button>
        <div className="flex gap-2">
          {t.outcome === "OPEN" ? (
            <Button variant="primary" onClick={() => setOpen("tradeOutcome", { tradeId: t.id })}>Log outcome</Button>
          ) : null}
          <Button variant="ghost" icon={<Pencil size={16} />} onClick={() => setOpen("trade", { tradeId: t.id })}>Edit</Button>
          <Button variant="ghost" icon={<X size={16} />} onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

function Shot({ label, src }: { label: string; src: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      {src ? (
        <img src={src} alt={label} className="w-full rounded-xl object-cover" />
      ) : (
        <div className="grid h-36 place-items-center rounded-xl bg-slate-100 text-xs text-ink-faint dark:bg-white/5">{label}</div>
      )}
    </div>
  );
}

function MetaPill({ children, className, icon }: { children: string; className: string; icon: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {icon}
      {children}
    </span>
  );
}

export function TradeOutcomeModal({ onClose, tradeId }: { onClose: () => void; tradeId: string }) {
  const { data, updateTrade } = useStore();
  const t = data.trades.find((x) => x.id === tradeId);
  if (!t) return null;
  return <OutcomeForm t={t} onClose={onClose} updateTrade={updateTrade} />;
}

function OutcomeForm({
  t,
  onClose,
  updateTrade,
}: {
  t: Trade;
  onClose: () => void;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
}) {
  const { toast } = useToast();
  const { data } = useStore();
  const [out, setOut] = useState(t.outcome === "OPEN" ? "LOSS" : t.outcome);
  const [applied, setApplied] = useState(t.afterUrl);
  const [notes, setNotes] = useState(t.notes);
  const [accounts, setAccounts] = useState<string[]>(t.accountIds);
  const linkedAccounts = data.accounts.filter((a) => accounts.includes(a.id));
  const linkedBalance =
    linkedAccounts.find((a) => a.balance > 0)?.balance ?? data.accounts[0]?.balance ?? 10_000;

  function suggestedMap(outcome: Trade["outcome"], ids: string[]) {
    const next: Record<string, string> = {};
    for (const id of ids) {
      const a = data.accounts.find((x) => x.id === id);
      next[id] = String(suggestPnl({ outcome, risk: t.risk, rr: t.rr, balance: a?.balance ?? linkedBalance }));
    }
    return next;
  }

  const [accountPnls, setAccountPnls] = useState<Record<string, string>>(() => {
    if (!t.accountIds.length) return {};
    if (t.outcome !== "OPEN" && (t.accountPnls || t.pnl !== 0)) {
      const next: Record<string, string> = {};
      for (const id of t.accountIds) {
        const a = data.accounts.find((x) => x.id === id);
        next[id] = String(a ? tradePnlForAccount(t, a, data.accounts) : 0);
      }
      return next;
    }
    return suggestedMap(t.outcome === "OPEN" ? "LOSS" : t.outcome, t.accountIds);
  });
  const [pnl, setPnl] = useState(() =>
    String(
      t.outcome !== "OPEN" && t.pnl !== 0
        ? t.accountIds.length > 1
          ? tradeTotalPnl(t, data.accounts)
          : t.pnl
        : suggestPnl({
            outcome: t.outcome === "OPEN" ? "LOSS" : t.outcome,
            risk: t.risk,
            rr: t.rr,
            balance: linkedBalance,
          })
    )
  );
  const bias = t.direction === "Sell" ? "Bearish" : t.direction === "Buy" ? "Bullish" : "—";
  const perAccount = linkedAccounts.length > 0;
  const combinedFromAccounts = linkedAccounts.reduce((s, a) => s + (Number(accountPnls[a.id]) || 0), 0);

  function pickOutcome(key: "WIN" | "LOSS" | "BE") {
    setOut(key);
    const next = suggestedMap(key, accounts);
    setAccountPnls(next);
    setPnl(
      String(
        accounts.length
          ? Object.values(next).reduce((s, n) => s + (Number(n) || 0), 0)
          : suggestPnl({ outcome: key, risk: t.risk, rr: t.rr, balance: linkedBalance })
      )
    );
  }

  function toggleAccount(id: string) {
    setAccounts((prev) => {
      const on = prev.includes(id);
      const ids = on ? prev.filter((x) => x !== id) : [...prev, id];
      setAccountPnls((cur) => {
        const next = { ...cur };
        if (on) delete next[id];
        else {
          next[id] = String(
            suggestPnl({
              outcome: out as Trade["outcome"],
              risk: t.risk,
              rr: t.rr,
              balance: data.accounts.find((a) => a.id === id)?.balance,
            })
          );
        }
        return next;
      });
      return ids;
    });
  }

  return (
    <Modal title={t.symbol || "Trade"} subtitle={`${t.date} • ${t.session || "Session"}`} onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs dark:border-[#243041]">
          {t.direction === "Sell" ? <TrendingDown size={12} className="text-loss" /> : <TrendingUp size={12} className="text-brand" />}
          {bias}
        </span>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-xs dark:border-[#243041]">{t.session || "—"}</span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{t.grade}</span>
      </div>

      <p className="mb-2 flex items-center gap-2 font-semibold text-loss">
        <Target size={16} /> Trade Outcome
      </p>
      <div className="grid grid-cols-3 gap-2">
        {([
          { key: "WIN", icon: <TrendingUp size={16} /> },
          { key: "LOSS", icon: <TrendingDown size={16} /> },
          { key: "BE", icon: <Target size={16} /> },
        ] as const).map((o) => {
          const on = out === o.key;
          const active =
            o.key === "LOSS"
              ? "border-[#F07167] bg-rose-50 text-loss"
              : o.key === "WIN"
                ? "border-brand bg-brand/10 text-brand"
                : "border-amber-300 bg-amber-50 text-amber-700";
          return (
            <button
              key={o.key}
              onClick={() => pickOutcome(o.key)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                on ? active : "border-line text-ink-muted dark:border-[#243041]"
              }`}
            >
              {o.icon}
              {o.key}
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-5 flex items-center gap-2 font-semibold dark:text-white">
        <Wallet size={16} /> Realized P&amp;L (USD)
      </p>
      {perAccount ? (
        <div className="space-y-2">
          {linkedAccounts.map((a) => (
            <label key={a.id} className="block">
              <span className="mb-1 block text-xs text-ink-muted">
                {a.name} · ${a.balance.toLocaleString()} · {t.risk || "risk"}
              </span>
              <input
                className="input"
                type="number"
                step="0.01"
                value={accountPnls[a.id] ?? ""}
                onChange={(e) => setAccountPnls((p) => ({ ...p, [a.id]: e.target.value }))}
              />
            </label>
          ))}
          <p className="text-sm font-semibold dark:text-white">Combined: {formatPnl(combinedFromAccounts)}</p>
          <p className="text-[11px] text-ink-faint">
            Each account uses {t.risk || "your risk %"} of its own size. Override a row if the fill differed.
          </p>
        </div>
      ) : (
        <>
          <input
            className="input"
            type="number"
            step="0.01"
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-ink-faint">
            Suggested from risk {t.risk || "—"} and R:R {t.rr || "—"}
            {linkedAccounts[0] ? ` on ${linkedAccounts[0].name} ($${linkedBalance.toLocaleString()})` : ""}. Override with the actual fill.
          </p>
        </>
      )}

      <p className="mb-2 mt-5 flex items-center gap-2 font-semibold dark:text-white">
        <ImageIcon size={16} className="text-purple-brand" /> After Screenshot (Proof)
      </p>
      <ImageProofField value={applied} onChange={setApplied} />

      <p className="mb-2 mt-5 flex items-center gap-2 font-semibold text-purple-brand">
        <Wallet size={16} /> Linked Accounts
      </p>
      {data.accounts.length === 0 ? (
        <p className="text-sm text-ink-faint">No accounts linked yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {data.accounts.map((a) => {
            const on = accounts.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAccount(a.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 ${on ? "bg-purple-brand text-white" : "bg-slate-100 dark:bg-white/10"}`}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-5 flex items-center gap-2 font-semibold text-loss">
        <MessageCircle size={16} /> Trade Notes & Lessons
      </p>
      <textarea className="input mt-2 min-h-[88px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="danger-outline" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            const pnls = accounts.length
              ? Object.fromEntries(accounts.map((id) => [id, Number(accountPnls[id]) || 0]))
              : undefined;
            updateTrade(t.id, {
              outcome: out as Trade["outcome"],
              afterUrl: applied,
              notes,
              accountIds: accounts,
              pnl: pnls ? Object.values(pnls).reduce((s, n) => s + n, 0) : Number(pnl) || 0,
              accountPnls: pnls,
            });
            toast("Trade details saved");
            onClose();
          }}
        >
          Save Details
        </Button>
      </div>
    </Modal>
  );
}
