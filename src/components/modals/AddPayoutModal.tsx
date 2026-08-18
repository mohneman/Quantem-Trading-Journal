import { useState } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select, TextArea } from "../ui/Field";
import { Button } from "../ui/Button";
import { TODAY_ISO } from "../../data";
import { useStore } from "../../store";

export function AddPayoutModal({ onClose }: { onClose: () => void }) {
  const { data, addPayout } = useStore();
  const [accountId, setAccountId] = useState("");
  const [firm, setFirm] = useState("");
  const [accountName, setAccountName] = useState("");
  const [size, setSize] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"Pending" | "Completed" | "Rejected">("Pending");
  const [method, setMethod] = useState("Crypto");
  const [requestDate, setRequestDate] = useState(TODAY_ISO);
  const [payoutDate, setPayoutDate] = useState(TODAY_ISO);
  const [notes, setNotes] = useState("");
  const acc = data.accounts.find((a) => a.id === accountId);

  return (
    <Modal title="Add Payout" onClose={onClose} wide>
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
          <Field label="Available Profit *"><Input defaultValue="$0.00" className="text-brand" /></Field>
          <Field label="Payout Amount *"><Input value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Trader Share"><Input value={acc?.split || "$0.00"} readOnly /></Field>
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
        <div className="flex justify-end gap-3 border-t border-line pt-4 dark:border-[#243041]">
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={() => {
              const n = Number(amount) || 0;
              addPayout({
                accountId,
                firm,
                accountName,
                size,
                amount: n,
                split: acc?.split || "",
                payout: n,
                status,
                method,
                requestDate,
                payoutDate,
                notes,
              });
              onClose();
            }}
          >
            SAVE PAYOUT
          </Button>
          <Button variant="danger-outline" onClick={onClose} icon={<X size={16} />}>CANCEL</Button>
        </div>
      </div>
    </Modal>
  );
}
