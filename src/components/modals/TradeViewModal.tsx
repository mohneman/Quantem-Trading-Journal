import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useModal } from "../../context/ModalContext";
import { useStore, type Trade } from "../../store";
import { formatPnl } from "../../lib";

export function TradeViewModal({ onClose, tradeId }: { onClose: () => void; tradeId: string }) {
  const { data, deleteTrade } = useStore();
  const t = data.trades.find((x) => x.id === tradeId);
  const { setOpen } = useModal();
  if (!t) return null;
  return (
    <Modal title={`${t.symbol || "Trade"} Trade`} subtitle={`${t.date} • #${t.no}`} onClose={onClose} wide>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-wrap gap-2">
          {[t.direction || "—", t.session || "—", t.symbol || "—", t.outcome, formatPnl(t.pnl)].map((tag) => (
            <span key={tag} className="rounded-full border border-line px-2.5 py-1 text-xs dark:border-[#243041]">{tag}</span>
          ))}
        </div>
        <span className="text-2xl font-bold text-brand">{t.grade}</span>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-white/5">
        <p className="mb-2 font-medium text-ink-muted">Timestamps</p>
        <p>Date: {t.date}</p>
        <p>Risk: {t.risk || "—"}</p>
        <p>R:R: {t.rr}</p>
      </div>
      <h3 className="mb-2 mt-5 font-semibold dark:text-white">Trade Checklist Analysis</h3>
      <ul className="space-y-2">
        {t.rules.map((item) => (
          <li key={item.text} className={`rounded-xl px-3 py-2 text-sm ${item.checked ? "bg-brand/10" : "bg-slate-50 dark:bg-white/5"}`}>
            {item.checked ? "✓" : "○"} {item.text}
          </li>
        ))}
      </ul>
      <h3 className="mb-2 mt-5 font-semibold dark:text-white">Trade Notes & Lessons</h3>
      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
        {t.psychology.map((p) => (
          <span key={p} className="mr-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-white/10">{p}</span>
        ))}
        <p className="mt-2 text-sm">{t.notes || "No notes."}</p>
      </div>
      <h3 className="mb-2 mt-5 font-semibold dark:text-white">Chart Snapshots</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {t.proofUrl ? <img src={t.proofUrl} alt="Before" className="rounded-xl" /> : <div className="rounded-xl bg-slate-100 p-8 text-center text-xs text-ink-faint dark:bg-white/5">BEFORE</div>}
        {t.afterUrl ? <img src={t.afterUrl} alt="After" className="rounded-xl" /> : <div className="rounded-xl bg-slate-100 p-8 text-center text-xs text-ink-faint dark:bg-white/5">AFTER</div>}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => { deleteTrade(t.id); onClose(); }}>Delete Trade</Button>
        <div className="flex gap-2">
          <Button variant="ghost" icon={<Pencil size={16} />} onClick={() => setOpen("trade", { tradeId: t.id })}>Edit</Button>
          <Button variant="ghost" icon={<X size={16} />} onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
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
  const [out, setOut] = useState(t.outcome === "OPEN" ? "LOSS" : t.outcome);
  const [after, setAfter] = useState(t.afterUrl);
  const [applied, setApplied] = useState(t.afterUrl);
  const [notes, setNotes] = useState(t.notes);
  const [pnl, setPnl] = useState(String(t.pnl));

  return (
    <Modal title={t.symbol || "Trade"} subtitle={`${t.date} • ${t.session || "Session"}`} onClose={onClose} wide>
      <div className="mb-4 flex gap-2">
        <span className="rounded-full border px-2 py-0.5 text-xs">{t.direction || "—"}</span>
        <span className="rounded-full border px-2 py-0.5 text-xs">{t.session || "—"}</span>
        <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">{t.grade}</span>
      </div>
      <p className="mb-2 font-semibold dark:text-white">Trade Outcome</p>
      <div className="grid grid-cols-3 gap-2">
        {(["WIN", "LOSS", "BE"] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOut(o)}
            className={`rounded-xl border py-3 text-sm font-semibold ${
              out === o ? (o === "LOSS" ? "border-loss bg-loss-soft text-loss" : "border-brand bg-brand/10 text-brand") : "border-line dark:border-[#243041]"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="mb-2 mt-5 font-semibold dark:text-white">PnL</p>
      <input className="input" type="number" value={pnl} onChange={(e) => setPnl(e.target.value)} />
      <p className="mb-2 mt-5 font-semibold dark:text-white">After Screenshot (Proof)</p>
      <div className="flex gap-2">
        <input className="input" placeholder="Paste direct image link" value={after} onChange={(e) => setAfter(e.target.value)} />
        <button className="btn-primary" type="button" onClick={() => setApplied(after)}>Apply</button>
      </div>
      {applied ? <img src={applied} alt="After" className="mt-2 max-h-40 rounded-xl" /> : null}
      <p className="mt-5 font-semibold text-loss">Trade Notes & Lessons</p>
      <textarea className="input mt-2 min-h-[88px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="danger-outline" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            updateTrade(t.id, { outcome: out as Trade["outcome"], afterUrl: applied, notes, pnl: Number(pnl) || 0 });
            onClose();
          }}
        >
          Save Details
        </Button>
      </div>
    </Modal>
  );
}
