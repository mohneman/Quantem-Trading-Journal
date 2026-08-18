import { Plus, Trash2, Wallet } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { useMenu } from "../hooks";
import { useModal } from "../context/ModalContext";
import { useStore } from "../store";
import { formatPnl } from "../lib";

export function PortfolioPage() {
  const onMenu = useMenu();
  const { setOpen } = useModal();
  const { data, deleteAccount } = useStore();
  return (
    <div>
      <PageHeader
        title="Portfolio Accounts"
        subtitle="Review account health, targets, and funded progress in one place."
        onMenu={onMenu}
      />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              ACCOUNTS SETUP
            </span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">Portfolio</h2>
            <p className="mt-1 text-sm text-ink-muted">Manage your trading accounts</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setOpen("propAccount")}>+ Prop</button>
            <button className="btn-gradient" onClick={() => setOpen("account")}>
              <Plus size={16} /> Add Account
            </button>
          </div>
        </div>
        {data.accounts.length === 0 ? (
          <div className="mt-10 flex min-h-[280px] flex-col items-center justify-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Wallet size={26} />
            </div>
            <p className="mt-4 text-sm text-ink-muted">No accounts yet. Add your first trading account.</p>
            <button className="mt-3 text-sm font-medium text-brand" onClick={() => setOpen("propAccount")}>
              Add a prop account
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.accounts.map((a) => (
              <article key={a.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-faint">{a.type}</p>
                    <h3 className="mt-1 text-lg font-semibold dark:text-white">{a.name}</h3>
                    <p className="text-sm text-ink-muted">{a.website || "No website"}</p>
                  </div>
                  <button className="text-ink-faint hover:text-loss" onClick={() => deleteAccount(a.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="mt-4 text-2xl font-semibold dark:text-white">{formatPnl(a.balance).replace("+", "")}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {a.status ? <span className="rounded-full bg-brand/10 px-2 py-1 text-brand">{a.status}</span> : null}
                  {a.split ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10">Split {a.split}</span> : null}
                  {a.target ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10">Target {a.target}</span> : null}
                  {a.drawdown ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10">DD {a.drawdown}%</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
