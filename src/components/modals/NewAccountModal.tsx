import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select } from "../ui/Field";
import { Button } from "../ui/Button";
import { startingBalances } from "../../data";
import { useStore, type AccountType } from "../../store";

export function NewAccountModal({
  onClose,
  prop,
  accountId,
}: {
  onClose: () => void;
  prop?: boolean;
  accountId?: string;
}) {
  const { data, addAccount, updateAccount } = useStore();
  const existing = data.accounts.find((a) => a.id === accountId);
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<AccountType>(existing?.type ?? (prop ? "Prop" : "Personal"));
  const [challenge, setChallenge] = useState(existing?.challengeType || "Phase 1");
  const [website, setWebsite] = useState(existing?.website ?? "");
  const [split, setSplit] = useState(existing?.split ?? "");
  const [drawdown, setDrawdown] = useState(existing?.drawdown ?? "");
  const [target, setTarget] = useState(existing?.target ?? "");
  const [status, setStatus] = useState(existing?.status || "Phase 1");
  const [balanceLabel, setBalanceLabel] = useState(
    existing ? startingBalances.find((b) => b.replace(/[$,]/g, "") === String(existing.balance)) ?? "" : "$10,000"
  );
  const [balance, setBalance] = useState(existing ? String(existing.balance) : "10000");
  const isProp = type === "Prop";
  const editing = Boolean(existing);

  return (
    <Modal title={editing ? "Edit Trading Account" : "New Trading Account"} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2 text-brand">
        <Wallet size={18} />
        <span className="text-sm font-semibold">{editing ? "Edit Trading Account" : "New Trading Account"}</span>
      </div>
      <div className="space-y-4">
        <Field label="Account Name">
          <Input placeholder="e.g. FTMO 100K Challenge" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Account Type">
            <Select
              className={isProp ? "ring-2 ring-violet-300" : ""}
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
            >
              <option>Prop</option>
              <option>Personal</option>
              <option>Real Account</option>
              <option>Demo</option>
            </Select>
          </Field>
          {isProp ? (
            <Field label="Challenge Type">
              <Select value={challenge} onChange={(e) => setChallenge(e.target.value)}>
                <option>Phase 1</option>
                <option>Phase 2</option>
                <option>Funded</option>
              </Select>
            </Field>
          ) : (
            <span />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website">
            <Input placeholder="e.g. ftmo.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </Field>
          <Field label="Split (%)">
            <Select value={split} onChange={(e) => setSplit(e.target.value)}>
              <option value="">Select Split...</option>
              <option>80/20</option>
              <option>90/10</option>
              <option>100/0</option>
            </Select>
          </Field>
        </div>
        {isProp ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Drawdown Allowed (%)">
                <Input placeholder="e.g. 10 or 8" value={drawdown} onChange={(e) => setDrawdown(e.target.value)} />
              </Field>
              <Field label="Target (%)">
                <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">Select Target...</option>
                  <option>8%</option>
                  <option>10%</option>
                  <option>12%</option>
                </Select>
              </Field>
            </div>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Phase 1</option>
                <option>Phase 2</option>
                <option>Funded</option>
                <option>Failed</option>
              </Select>
            </Field>
          </>
        ) : null}
        <div>
          <p className="label">Starting Balance</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {startingBalances.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setBalanceLabel(item);
                  setBalance(item.replace(/[$,]/g, ""));
                }}
                className={`h-11 rounded-xl border text-sm font-medium ${
                  item === balanceLabel
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-white dark:border-[#243041] dark:bg-[#1b2330]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <Input
            className="mt-3"
            value={balance}
            onChange={(e) => {
              setBalance(e.target.value);
              setBalanceLabel("");
            }}
          />
        </div>
        <Button
          variant="gradient"
          className="w-full"
          icon={<Plus size={16} />}
          onClick={() => {
            if (!name.trim()) return;
            const payload = {
              name: name.trim(),
              type,
              challengeType: isProp ? challenge : "",
              website,
              split,
              drawdown,
              target,
              status: isProp ? status : existing?.status || "Active",
              balance: Number(balance) || 0,
            };
            if (existing) updateAccount(existing.id, payload);
            else addAccount(payload);
            onClose();
          }}
        >
          {editing ? "Update Account" : "Create Account"}
        </Button>
      </div>
    </Modal>
  );
}
