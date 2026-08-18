import { useState } from "react";
import { Check, TrendingDown, TrendingUp } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select, TextArea } from "../ui/Field";
import { Button } from "../ui/Button";
import { defaultChecklist, TODAY_ISO } from "../../data";
import { useStore } from "../../store";
import { ChecklistSettingsModal } from "./ChecklistSettingsModal";

export function AddBacktestModal({ onClose, backtestId }: { onClose: () => void; backtestId?: string }) {
  const { data, addBacktest, updateBacktest } = useStore();
  const existing = data.backtests.find((b) => b.id === backtestId);
  const startItems = existing?.rules.map((r) => r.text) ?? defaultChecklist;
  const [checklistId, setChecklistId] = useState("default");
  const items =
    existing && checklistId === "default"
      ? startItems
      : checklistId === "default"
        ? defaultChecklist
        : data.checklists.find((c) => c.id === checklistId)?.items ?? defaultChecklist;
  const [checked, setChecked] = useState(existing?.rules.map((r) => r.checked) ?? items.map(() => false));
  const [result, setResult] = useState<"WIN" | "LOSS" | null>(existing?.result ?? null);
  const [date, setDate] = useState(existing?.date ?? TODAY_ISO);
  const [symbol, setSymbol] = useState(existing?.symbol ?? "");
  const [direction, setDirection] = useState(existing?.direction ?? "");
  const [scenario, setScenario] = useState(existing?.scenario ?? "");
  const [sl, setSl] = useState(existing?.slPips ?? "");
  const [tp, setTp] = useState(existing?.tpPips ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [chart5, setChart5] = useState(existing?.chart5 ?? "");
  const [chart15, setChart15] = useState(existing?.chart15 ?? "");
  const [applied5, setApplied5] = useState(existing?.chart5 ?? "");
  const [applied15, setApplied15] = useState(existing?.chart15 ?? "");
  const [showChecklist, setShowChecklist] = useState(false);
  const [error, setError] = useState("");
  const done = checked.filter(Boolean).length;
  const nextNo = existing?.no ?? data.backtests.reduce((m, t) => Math.max(m, t.no), 0) + 1;

  return (
    <Modal
      title={existing ? "Edit Backtest Trade" : "Add Backtest Trade"}
      subtitle="Diwaan geli backtest cusub — Win ama Loss kaliya ayaa lagu xisaabinayaa."
      onClose={onClose}
      wide
    >
      <div className="space-y-6">
        <div>
          <p className="section-title mb-3">Trade Details</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Trade No"><Input value={`#${nextNo}`} readOnly /></Field>
            <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Symbol/Pair">
              <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                <option value="">Select...</option>
                {data.symbols.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Direction">
              <Select value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="">Select...</option>
                <option>Buy</option>
                <option>Sell</option>
              </Select>
            </Field>
            <Field label="Scenario">
              <Select value={scenario} onChange={(e) => setScenario(e.target.value)}>
                <option value="">Select...</option>
                <option>S1</option>
                <option>S2</option>
                <option>S3</option>
                <option>S4</option>
              </Select>
            </Field>
            <Field label="SL Pips"><Input placeholder="Ex: 15.5" value={sl} onChange={(e) => setSl(e.target.value)} /></Field>
            <Field label="TP Pips"><Input placeholder="Ex: 45.0" value={tp} onChange={(e) => setTp(e.target.value)} /></Field>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold dark:text-white">Confirmation Checklist</p>
            <span className="text-sm font-semibold text-brand">{done}/{items.length}</span>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="flex-1">
              <Select
                value={checklistId}
                onChange={(e) => {
                  setChecklistId(e.target.value);
                  const next = e.target.value === "default" ? defaultChecklist : data.checklists.find((c) => c.id === e.target.value)?.items ?? defaultChecklist;
                  setChecked(next.map(() => false));
                }}
              >
                <option value="default">Default Checklist</option>
                {data.checklists.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <button className="btn-primary h-11 text-xs" onClick={() => setShowChecklist(true)}>+ Create Custom Checklist</button>
          </div>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={item}>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-sm ${checked[i] ? "bg-brand/10" : "bg-white dark:bg-[#151a21]"}`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-brand"
                    checked={checked[i]}
                    onChange={() => setChecked((p) => p.map((v, idx) => (idx === i ? !v : v)))}
                  />
                  {item}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold dark:text-white">Chart Snapshots</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Snap label="5MIN CHART" color="bg-blue-500" value={chart5} onChange={setChart5} applied={applied5} onApply={() => setApplied5(chart5)} />
            <Snap label="15MIN CHART" color="bg-brand" value={chart15} onChange={setChart15} applied={applied15} onApply={() => setApplied15(chart15)} />
          </div>
        </div>

        <Field label="Notes (Optional)">
          <TextArea placeholder="Maxaad ka baratay backtest-kan?" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <p className="mb-3 font-semibold dark:text-white">Backtest Result</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setResult("WIN")} className={`flex h-12 items-center justify-center gap-2 rounded-xl font-semibold ${result === "WIN" ? "bg-brand text-white" : "bg-white dark:bg-[#151a21]"}`}>
              <TrendingUp size={16} /> WIN
            </button>
            <button type="button" onClick={() => setResult("LOSS")} className={`flex h-12 items-center justify-center gap-2 rounded-xl border border-loss font-semibold text-loss ${result === "LOSS" ? "bg-loss-soft" : "bg-white dark:bg-[#151a21]"}`}>
              <TrendingDown size={16} /> LOSS
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            className="flex-[1.2]"
            icon={<Check size={16} />}
            onClick={() => {
              if (!result) {
                setError("Choose WIN or LOSS before saving.");
                return;
              }
              const row = {
                date,
                symbol,
                direction,
                scenario,
                slPips: sl,
                tpPips: tp,
                result,
                notes,
                rules: items.map((text, i) => ({ text, checked: Boolean(checked[i]) })),
                chart5: applied5,
                chart15: applied15,
              };
              if (existing) updateBacktest(existing.id, row);
              else addBacktest(row);
              onClose();
            }}
          >
            {existing ? "Update Backtest" : "Save Backtest"}
          </Button>
        </div>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
      </div>
      {showChecklist ? <ChecklistSettingsModal stacked onClose={() => setShowChecklist(false)} /> : null}
    </Modal>
  );
}

function Snap({
  label, color, value, onChange, applied, onApply,
}: {
  label: string; color: string; value: string; onChange: (v: string) => void; applied: string; onApply: () => void;
}) {
  return (
    <div className="rounded-xl border border-line p-3 dark:border-[#243041]">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold">
        <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
      </p>
      <div className="flex gap-2">
        <Input placeholder="Paste image URL" value={value} onChange={(e) => onChange(e.target.value)} />
        <button className="btn-primary h-11 px-3 text-xs" type="button" onClick={onApply}>Apply</button>
      </div>
      {applied ? <img src={applied} alt="" className="mt-2 max-h-28 rounded-lg" /> : null}
    </div>
  );
}
