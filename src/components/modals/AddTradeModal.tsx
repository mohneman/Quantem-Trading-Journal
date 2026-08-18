import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  Link2,
  List,
  MapPin,
  Plus,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select, TextArea } from "../ui/Field";
import { Button } from "../ui/Button";
import { defaultChecklist, psychologyTags, TODAY_ISO } from "../../data";
import { useStore } from "../../store";
import { useModal } from "../../context/ModalContext";
import { rrFromPips } from "../../lib";

export function AddTradeModal({ onClose }: { onClose: () => void }) {
  const { data, addTrade, addSymbol } = useStore();
  const { setOpen } = useModal();
  const [tags, setTags] = useState<string[]>([]);
  const [checklistId, setChecklistId] = useState("default");
  const items =
    checklistId === "default"
      ? defaultChecklist
      : data.checklists.find((c) => c.id === checklistId)?.items ?? defaultChecklist;
  const [rules, setRules] = useState(items.map(() => false));
  const [direction, setDirection] = useState("");
  const [session, setSession] = useState("");
  const [pair, setPair] = useState("");
  const [date, setDate] = useState(TODAY_ISO);
  const [risk, setRisk] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState("");
  const [applied, setApplied] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [newPair, setNewPair] = useState("");
  const [showPair, setShowPair] = useState(false);

  const checked = rules.filter(Boolean).length;
  const missing = rules.length - checked;
  const grade = checked === rules.length && rules.length ? "A+" : checked >= 3 ? "C" : "F";
  const nextNo = data.trades.reduce((m, t) => Math.max(m, t.no), 0) + 1;
  const pct = rules.length ? (checked / rules.length) * 100 : 0;

  const summary = useMemo(
    () => [
      { label: "DIRECTION", value: direction || "None", kind: direction ? "ok" : "miss" },
      { label: "SESSION", value: session || "None", kind: session ? "ok" : "miss" },
      { label: "PAIR", value: pair || "None", kind: pair ? "ok" : "miss" },
      { label: "TOTAL RULES", value: String(rules.length), kind: "ok" },
      { label: "CHECKED", value: String(checked), kind: "good" },
      { label: "MISSING", value: String(missing), kind: "bad" },
    ],
    [direction, session, pair, rules.length, checked, missing]
  );

  function applyChecklist(id: string) {
    setChecklistId(id);
    const next =
      id === "default" ? defaultChecklist : data.checklists.find((c) => c.id === id)?.items ?? defaultChecklist;
    setRules(next.map(() => false));
  }

  return (
    <Modal title="Add Trade" onClose={onClose} wide>
      <div className="space-y-6">
        <div>
          <p className="section-title mb-3">Trade Details</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Trade No"><Input value={`#${nextNo}`} readOnly /></Field>
            <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Session">
              <Select value={session} onChange={(e) => setSession(e.target.value)}>
                <option value="">Select...</option>
                <option>London</option>
                <option>New York</option>
                <option>Asia</option>
              </Select>
            </Field>
            <Field label="Symbol/Pair">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={pair} onChange={(e) => setPair(e.target.value)}>
                    <option value="">Select...</option>
                    {data.symbols.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <button type="button" className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white" onClick={() => setShowPair((v) => !v)}>
                  <Plus size={16} />
                </button>
              </div>
              {showPair ? (
                <div className="mt-2 flex gap-2">
                  <Input placeholder="EURUSD" value={newPair} onChange={(e) => setNewPair(e.target.value)} />
                  <button
                    className="btn-primary h-11 px-3 text-xs"
                    onClick={() => {
                      if (!newPair.trim()) return;
                      addSymbol(newPair);
                      setPair(newPair.trim().toUpperCase());
                      setNewPair("");
                      setShowPair(false);
                    }}
                  >
                    Add
                  </button>
                </div>
              ) : null}
            </Field>
            <Field label="Direction">
              <Select value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="">Select...</option>
                <option>Buy</option>
                <option>Sell</option>
              </Select>
            </Field>
            <Field label="Risk %"><Input placeholder="Ex: 1.0" type="number" step="0.1" value={risk} onChange={(e) => setRisk(e.target.value)} /></Field>
            <Field label="SL Pips"><Input placeholder="Ex: 15.5" type="number" step="0.1" value={sl} onChange={(e) => setSl(e.target.value)} /></Field>
            <Field label="TP Pips"><Input placeholder="Ex: 45.0" type="number" step="0.1" value={tp} onChange={(e) => setTp(e.target.value)} /></Field>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="mb-2 flex justify-between">
            <p className="font-semibold dark:text-white">Confirmation Checklist</p>
            <span className="font-semibold text-brand">{checked}/{rules.length}</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="flex-1">
              <p className="label">Select Checklist</p>
              <Select value={checklistId} onChange={(e) => applyChecklist(e.target.value)}>
                <option value="default">Default Checklist</option>
                {data.checklists.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <button className="btn-primary mt-5 h-11 text-xs" onClick={() => setOpen("checklist")}>
              + Create Custom Checklist
            </button>
          </div>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={`${checklistId}-${item}-${i}`}>
                <button
                  type="button"
                  onClick={() => setRules((p) => p.map((v, idx) => (idx === i ? !v : v)))}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    rules[i] ? "bg-brand/10 text-ink dark:text-white" : "bg-white dark:bg-[#151a21]"
                  }`}
                >
                  {rules[i] ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand" />
                  ) : (
                    <Circle size={18} className="mt-0.5 shrink-0 text-slate-300" />
                  )}
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold dark:text-white">Psychology (Before Entry)</p>
          <div className="flex flex-wrap gap-2">
            {psychologyTags.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags((p) => (on ? p.filter((t) => t !== tag) : [...p, tag]))}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    on ? "bg-brand text-white" : "border border-line bg-white text-ink-muted dark:border-[#243041] dark:bg-white/10"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 font-semibold dark:text-white">Proof / Chart Snapshots</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <Input className="pl-10" placeholder="Paste direct image link (e.g. https://i.imgur.com/abc123.png)" value={proof} onChange={(e) => setProof(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={() => setApplied(proof)}>Apply</button>
          </div>
          <p className="mt-1 text-[11px] text-ink-faint">Copy image address from Imgur or similar, then Apply.</p>
          {applied ? <img src={applied} alt="Proof" className="mt-2 max-h-40 rounded-xl" /> : null}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 font-semibold text-purple-brand">
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
                    onClick={() => setAccounts((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${on ? "bg-purple-brand text-white" : "bg-slate-100 dark:bg-white/10"}`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-amber-50/80 p-4 dark:bg-amber-500/10">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 font-semibold dark:text-white">
              <AlertCircle size={16} className="text-loss" /> Trade Summary
            </p>
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${grade === "A+" ? "bg-brand text-white" : "bg-amber-200 text-amber-800"}`}>
              {grade[0]}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {summary.map((s) => (
              <div
                key={s.label}
                className={`rounded-xl p-3 ${
                  s.kind === "good" ? "bg-brand/10" : s.kind === "bad" || s.kind === "miss" ? "bg-loss-soft" : "bg-white dark:bg-[#151a21]"
                }`}
              >
                <p className="flex items-center gap-1 text-[11px] text-ink-muted">
                  {s.label === "DIRECTION" ? <TrendingDown size={12} className="text-loss" /> : null}
                  {s.label === "SESSION" ? <MapPin size={12} className="text-loss" /> : null}
                  {s.label === "PAIR" ? <Link2 size={12} className="text-loss" /> : null}
                  {s.label === "TOTAL RULES" ? <List size={12} /> : null}
                  {s.label === "CHECKED" ? <Check size={12} className="text-brand" /> : null}
                  {s.label === "MISSING" ? <X size={12} className="text-loss" /> : null}
                  {s.label}
                </p>
                <p className={`mt-1 text-sm font-semibold ${s.kind === "miss" || s.kind === "bad" ? "text-loss" : s.kind === "good" ? "text-brand" : "dark:text-white"}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
        <Field label="Notes"><TextArea placeholder="Why this trade?" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={() => {
              const created = addTrade({
                date,
                symbol: pair,
                direction: (direction as "Buy" | "Sell" | "") || "",
                session,
                slPips: sl,
                tpPips: tp,
                risk: risk ? `${Number(risk).toFixed(2)}%` : "",
                outcome: "OPEN",
                pnl: 0,
                psychology: tags,
                checklistName: checklistId === "default" ? "Default Checklist" : data.checklists.find((c) => c.id === checklistId)?.name ?? "Default",
                rules: items.map((text, i) => ({ text, checked: rules[i] })),
                notes,
                proofUrl: applied,
                afterUrl: "",
                accountIds: accounts,
                rr: rrFromPips(sl, tp),
              });
              setOpen("tradeOutcome", { tradeId: created.id });
            }}
          >
            TAKE TRADE
          </Button>
          <Button variant="danger-outline" onClick={onClose} icon={<X size={16} />}>Cancel Trade</Button>
        </div>
      </div>
    </Modal>
  );
}
