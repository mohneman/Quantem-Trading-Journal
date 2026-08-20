import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  CheckSquare,
  ExternalLink,
  Landmark,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { useMenu } from "../hooks";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { useStore, type Account } from "../store";
import { formatPnl } from "../lib";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function signedMoney(n: number) {
  const abs = money(Math.abs(n));
  if (n < 0) return `-${abs}`;
  return `+${abs}`;
}

function compactSize(n: number) {
  if (Math.abs(n) >= 1000) {
    const k = n / 1000;
    const label = Number.isInteger(k) ? String(k) : k.toFixed(1).replace(/\.0$/, "");
    return `$${label}K`;
  }
  return money(n);
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "funded") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (s === "failed") return "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300";
  if (s.includes("2")) return "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300";
  if (s === "active") return "bg-brand/10 text-brand-700";
  return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
}

function nextPhase(status: string) {
  if (status === "Phase 1") return "Phase 2";
  if (status === "Phase 2") return "Funded";
  return null;
}

export function PortfolioPage() {
  const onMenu = useMenu();
  const { setOpen } = useModal();
  const { toast } = useToast();
  const { data, deleteAccount, updateAccount } = useStore();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [phaseId, setPhaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuId]);

  const phaseAccount = data.accounts.find((a) => a.id === phaseId) ?? null;

  return (
    <div>
      <PageHeader
        title="Portfolio Accounts"
        subtitle="Monitor account health, targets, and funded progress in one place."
        onMenu={onMenu}
      />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-gradient-to-r from-violet-50/70 via-white to-teal-50/70 px-1 py-1 dark:from-white/5 dark:via-transparent dark:to-brand/5">
          <div>
            <span className="inline-flex rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              ACCOUNTS SETUP
            </span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">Portfolio</h2>
            <p className="mt-1 text-sm text-ink-muted">Manage your trading accounts</p>
          </div>
          <button className="btn-gradient rounded-full shadow-[0_8px_20px_rgba(0,209,193,0.28)]" onClick={() => setOpen("account")}>
            <Plus size={16} /> Add Account
          </button>
        </div>

        {data.accounts.length === 0 ? (
          <div className="mt-10 flex min-h-[280px] flex-col items-center justify-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">
              <Wallet size={28} strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-sm text-ink-muted">No accounts yet. Add your first trading account.</p>
            <button className="btn-gradient mt-5 rounded-full" onClick={() => setOpen("account")}>
              <Plus size={16} /> Add Account
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                menuOpen={menuId === account.id}
                onToggleMenu={(e) => {
                  e.stopPropagation();
                  setMenuId((id) => (id === account.id ? null : account.id));
                }}
                onEdit={() => {
                  setMenuId(null);
                  setOpen(account.type === "Prop" ? "propAccount" : "account", { accountId: account.id });
                }}
                onCheckPhase={() => {
                  setMenuId(null);
                  setPhaseId(account.id);
                }}
                onDelete={() => {
                  setMenuId(null);
                  deleteAccount(account.id);
                  toast("Account deleted.");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {phaseAccount ? (
        <PhaseCheckModal
          account={phaseAccount}
          onClose={() => setPhaseId(null)}
          onAdvance={(next) => {
            updateAccount(phaseAccount.id, { status: next, challengeType: next === "Funded" ? "Funded" : next });
            toast("Phase updated successfully!");
            setPhaseId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function AccountCard({
  account: a,
  menuOpen,
  onToggleMenu,
  onEdit,
  onCheckPhase,
  onDelete,
}: {
  account: Account;
  menuOpen: boolean;
  onToggleMenu: (e: MouseEvent) => void;
  onEdit: () => void;
  onCheckPhase: () => void;
  onDelete: () => void;
}) {
  const { data } = useStore();
  const linked = data.trades.filter((t) => t.accountIds.includes(a.id));
  const net = linked.reduce((s, t) => s + t.pnl, 0);
  const gross = linked.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const targetPct = Number.parseFloat(a.target) || (a.type === "Prop" ? 10 : 0);
  const goal = a.balance * (targetPct / 100);
  const progress = goal > 0 ? Math.min(100, Math.max(0, (net / goal) * 100)) : 0;
  const payouts = data.payouts.filter((p) => p.accountId === a.id || p.firm.toLowerCase() === a.name.toLowerCase());
  const payoutSum = payouts.reduce((s, p) => s + p.payout, 0);
  const site = a.website ? (a.website.startsWith("http") ? a.website : `https://${a.website}`) : "";
  const profitPct = a.balance ? (net / a.balance) * 100 : 0;
  const phase = a.challengeType || a.status || a.type;
  const Icon = a.type === "Prop" ? Landmark : Wallet;

  return (
    <article
      className="account-card card relative cursor-pointer p-5"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-brand">{a.name}</h3>
            {site ? (
              <a
                href={site}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Visit Website <ExternalLink size={11} />
              </a>
            ) : null}
            <p className="mt-1 text-xs text-ink-muted">
              {compactSize(a.balance)} • {phase} • {a.type}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {a.status ? (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${statusTone(a.status)}`}>
              {a.status}
            </span>
          ) : null}
          <div className="relative">
            <button
              aria-label="Account actions"
              className="rounded-lg p-1 text-ink-faint hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10"
              onClick={onToggleMenu}
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen ? (
              <div
                className="animate-details-in absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-modal dark:border-[#243041] dark:bg-[#151a21]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-orange-50 dark:hover:bg-white/5"
                  onClick={onEdit}
                >
                  <Pencil size={14} className="text-orange-500" /> Edit
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-teal-50 dark:hover:bg-white/5"
                  onClick={onCheckPhase}
                >
                  <CheckSquare size={14} className="text-brand" /> Check Phase
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-loss hover:bg-red-50 dark:hover:bg-loss/10"
                  onClick={onDelete}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Balance</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight dark:text-white">{money(a.balance)}</p>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Profit Target ({targetPct || 0}%)
            </p>
            <span className="text-xs text-ink-muted">{Math.round(progress)}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-brand-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Net P&L" value={signedMoney(net)} tone={net >= 0 ? "up" : "down"} />
        <Stat label="Gross" value={signedMoney(gross)} tone="up" />
        <Stat
          label="Profit %"
          value={`${profitPct >= 0 ? "+" : ""}${profitPct.toFixed(1)}%`}
          tone={profitPct >= 0 ? "up" : "down"}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Total Payouts" value={formatPnl(payoutSum).replace("+", "")} />
        <Stat label="Split" value={a.split || "—"} tone="up" large />
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  tone,
  large,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  large?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p
        className={`mt-1 font-semibold ${large ? "text-lg" : "text-sm"} ${
          tone === "up" ? "text-emerald-600" : tone === "down" ? "text-loss" : "text-ink dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PhaseCheckModal({
  account,
  onClose,
  onAdvance,
}: {
  account: Account;
  onClose: () => void;
  onAdvance: (next: string) => void;
}) {
  const { data } = useStore();
  const rows = useMemo(() => {
    const linked = data.trades.filter((t) => t.accountIds.includes(account.id));
    const net = linked.reduce((s, t) => s + t.pnl, 0);
    const targetPct = Number.parseFloat(account.target) || 10;
    const drawdownPct = Number.parseFloat(account.drawdown) || 10;
    const goal = account.balance * (targetPct / 100);
    const profitPct = account.balance ? (net / account.balance) * 100 : 0;
    const ddUsed = net < 0 && account.balance ? (Math.abs(net) / account.balance) * 100 : 0;
    const targetMet = net >= goal && goal > 0;
    const ddOk = ddUsed <= drawdownPct;
    return {
      net,
      targetPct,
      drawdownPct,
      goal,
      profitPct,
      ddUsed,
      targetMet,
      ddOk,
      next: nextPhase(account.status),
      rows: [
        {
          check: "Profit target",
          required: `${targetPct}% (${money(goal)})`,
          current: `${profitPct.toFixed(1)}% (${signedMoney(net)})`,
          result: targetMet ? "Met" : "Not met",
          ok: targetMet,
        },
        {
          check: "Max drawdown",
          required: `${drawdownPct}%`,
          current: `${ddUsed.toFixed(1)}%`,
          result: ddOk ? "Pass" : "Breach",
          ok: ddOk,
        },
        {
          check: "Account status",
          required: account.challengeType || account.status || "—",
          current: account.status || "—",
          result: account.status === "Failed" ? "Failed" : "Active",
          ok: account.status !== "Failed",
        },
      ],
    };
  }, [account, data.trades]);

  return (
    <Modal title="Phase Check" subtitle={account.name} onClose={onClose} stacked icon={
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
        <CheckSquare size={18} />
      </span>
    }>
      <div className="overflow-x-auto rounded-xl border border-line dark:border-[#243041]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint dark:bg-white/5">
            <tr>
              {["Check", "Required", "Current", "Result"].map((h) => (
                <th key={h} className="px-3 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.rows.map((row) => (
              <tr key={row.check} className="border-t border-line dark:border-[#243041]">
                <td className="px-3 py-2.5 font-medium dark:text-white">{row.check}</td>
                <td className="px-3 py-2.5 text-ink-muted">{row.required}</td>
                <td className="px-3 py-2.5 dark:text-white">{row.current}</td>
                <td className={`px-3 py-2.5 font-semibold ${row.ok ? "text-emerald-600" : "text-loss"}`}>{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {rows.next ? (
          <Button
            variant="gradient"
            disabled={!rows.targetMet || !rows.ddOk}
            onClick={() => onAdvance(rows.next!)}
          >
            Advance to {rows.next}
          </Button>
        ) : null}
      </div>
      {!rows.targetMet && rows.next ? (
        <p className="mt-2 text-right text-xs text-ink-muted">Reach the profit target before advancing this phase.</p>
      ) : null}
    </Modal>
  );
}
