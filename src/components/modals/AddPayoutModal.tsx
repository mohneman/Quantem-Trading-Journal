import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select, TextArea } from "../ui/Field";
import { Button } from "../ui/Button";
import { TODAY_ISO } from "../../data";
import { useStore } from "../../store";
import { traderShare } from "../../lib";

export function AddPayoutModal({ onClose, payoutId }: { onClose: () => void; payoutId?: string }) {
  const { data, addPayout, updatePayout } = useStore();
  const existing = data.payouts.find((p) => p.id === payoutId);
  const [accountId, setAccountId] = useState(existing?.accountId ?? "");
  const [firm, setFirm] = useState(existing?.firm ?? "");
  const [accountName, setAccountName] = useState(existing?.accountName ?? "");
  const [size, setSize] = useState(existing?.size ?? "");
  const [profit, setProfit] = useState(existing ? String(existing.amount) : "");
  const [amount, setAmount] = useState(existing ? String(existing.payout || existing.amount) : "");
  const [status, setStatus] = useState<"Pending" | "Completed" | "Rejected">(existing?.status ?? "Pending");
  const [method, setMethod] = useState(existing?.method ?? "Crypto");
  const [requestDate, setRequestDate] = useState(existing?.requestDate ?? TODAY_ISO);
  const [payoutDate, setPayoutDate] = useState(existing?.payoutDate ?? TODAY_ISO);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState("");
  const acc = data.accounts.find((a) => a.id === accountId);
  const split = acc?.split || existing?.split || "";
  const share = traderShare(split);
  const payoutValue = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * share * 100) / 100;
  }, [amount, share]);

  return (
    <Modal title={existing ? "Edit Payout" : "Add Payout"} onClose={onClose} wide>
      <div className="space-y-5">
        <p className="section-title">Payout Details</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Select Account *">
            <Select
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                const a = data.accounts.find((x) => x.id === e.target.value);
                if (a) {
                  setAccountName(a.name);
                  setFirm(a.website || a.name);
                  setSize(String(a.balance));
                  setProfit(String(a.balance));
                }
              }}
            >
              <option value="">Select...</option>
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prop Firm"><Input value={firm} onChange={(e) => setFirm(e.target.value)} /></Field>
          <Field label="Account Name"><Input value={accountName} onChange={(e) => setAccountName(e.target.value)} /></Field>
          <Field label="Account Size"><Input value={size} onChange={(e) => setSize(e.target.value)} /></Field>
          <Field label="Available Profit *">
            <Input className="text-brand" value={profit} onChange={(e) => setProfit(e.target.value)} />
          </Field>
          <Field label="Payout Amount *">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Trader Share">
            <Input value={split ? `${split} · $${payoutValue.toFixed(2)}` : "$0.00"} readOnly />
          </Field>
          <Field label="Request Date"><Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} /></Field>
          <Field label="Payout Date"><Input type="date" value={payoutDate} onChange={(e) => setPayoutDate(e.target.value)} /></Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option>Pending</option>
              <option>Completed</option>
              <option>Rejected</option>
            </Select>
          </Field>
          <Field label="Payment Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Crypto</option>
              <option>Rise</option>
              <option>Wise</option>
            </Select>
          </Field>
        </div>
        <Field label="Notes"><TextArea placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <div className="flex justify-end gap-3 border-t border-line pt-4 dark:border-[#243041]">
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={() => {
              const n = Number(amount) || 0;
              if (!accountName.trim() && !firm.trim()) {
                setError("Select an account or enter a firm name.");
                return;
              }
              if (!n) {
                setError("Enter a payout amount.");
                return;
              }
              const row = {
                accountId,
                firm,
                accountName,
                size,
                amount: Number(profit) || n,
                split,
                payout: payoutValue || n,
                status,
                method,
                requestDate,
                payoutDate,
                notes,
              };
              if (existing) updatePayout(existing.id, row);
              else addPayout(row);
              onClose();
            }}
          >
            {existing ? "UPDATE PAYOUT" : "SAVE PAYOUT"}
          </Button>
          <Button variant="danger-outline" onClick={onClose} icon={<X size={16} />}>CANCEL</Button>
        </div>
      </div>
    </Modal>
  );
}
