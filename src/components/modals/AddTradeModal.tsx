import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Image as ImageIcon,
  Link2,
  List,
  MapPin,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select, TextArea } from "../ui/Field";
import { Button } from "../ui/Button";
import { defaultChecklist, psychologyTags, TODAY_ISO } from "../../data";
import { useStore } from "../../store";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import { gradeFromChecked, rrFromPips } from "../../lib";
import { ChecklistSettingsModal } from "./ChecklistSettingsModal";

export function AddTradeModal({ onClose, tradeId, initialDate }: { onClose: () => void; tradeId?: string; initialDate?: string }) {
  const { data, addTrade, updateTrade, addSymbol } = useStore();
  const { setOpen } = useModal();
  const { toast } = useToast();
  const existing = data.trades.find((t) => t.id === tradeId);
  const startItems = existing?.rules.map((r) => r.text) ?? defaultChecklist;
  const [tags, setTags] = useState<string[]>(existing?.psychology ?? []);
  const [checklistId, setChecklistId] = useState("default");
  const items =
    existing && checklistId === "default" && !data.checklists.length
      ? startItems
      : checklistId === "default"
        ? defaultChecklist
        : data.checklists.find((c) => c.id === checklistId)?.items ?? defaultChecklist;
  const [rules, setRules] = useState(existing?.rules.map((r) => r.checked) ?? items.map(() => false));
  const [direction, setDirection] = useState<"" | "Buy" | "Sell">(existing?.direction ?? "");
  const [session, setSession] = useState(existing?.session ?? "");
  const [pair, setPair] = useState(existing?.symbol ?? "");
  const [date, setDate] = useState(existing?.date ?? initialDate ?? TODAY_ISO);
  const [risk, setRisk] = useState(existing?.risk.replace("%", "") ?? "");
  const [sl, setSl] = useState(existing?.slPips ?? "");
  const [tp, setTp] = useState(existing?.tpPips ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [proof, setProof] = useState(existing?.proofUrl ?? "");
  const [applied, setApplied] = useState(existing?.proofUrl ?? "");
  const [accounts, setAccounts] = useState<string[]>(existing?.accountIds ?? []);
  const [newPair, setNewPair] = useState("");
  const [showPair, setShowPair] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [error, setError] = useState("");
  const [popIndex, setPopIndex] = useState<number | null>(null);

  const checked = rules.filter(Boolean).length;
  const missing = Math.max(0, items.length - checked);
  const grade = gradeFromChecked(checked, items.length);
  const nextNo = existing?.no ?? data.trades.reduce((m, t) => Math.max(m, t.no), 0) + 1;
  const pct = items.length ? (checked / items.length) * 100 : 0;

  const summary = useMemo(
    () => [
      { label: "DIRECTION", value: direction || "None", kind: direction ? "ok" : "miss" },
      { label: "SESSION", value: session || "None", kind: session ? "ok" : "miss" },
      { label: "PAIR", value: pair || "None", kind: pair ? "ok" : "miss" },
      { label: "TOTAL RULES", value: String(items.length), kind: "ok" },
      { label: "CHECKED", value: String(checked), kind: "good" },
      { label: "MISSING", value: String(missing), kind: "bad" },
    ],
    [direction, session, pair, items.length, checked, missing]
  );

  function applyChecklist(id: string) {
    setChecklistId(id);
    const next =
      id === "default" ? defaultChecklist : data.checklists.find((c) => c.id === id)?.items ?? defaultChecklist;
    setRules(next.map(() => false));
  }

  function save(take: boolean) {
    if (!pair || !direction || !session) {
      setError("Select direction, session, and pair before taking the trade.");
      return;
    }
    const payload = {
      date,
      symbol: pair,
      direction: direction || "",
      session,
      slPips: sl,
      tpPips: tp,
      risk: risk ? `${Number(risk).toFixed(2)}%` : "",
      psychology: tags,
      checklistName:
        checklistId === "default"
          ? "Default Checklist"
          : data.checklists.find((c) => c.id === checklistId)?.name ?? "Default",
      rules: items.map((text, i) => ({ text, checked: Boolean(rules[i]) })),
      notes,
      proofUrl: applied,
      accountIds: accounts,
      rr: rrFromPips(sl, tp),
      grade,
    };
    if (existing) {
      updateTrade(existing.id, payload);
      toast("Trade updated");
      onClose();
      return;
    }
    const created = addTrade({
      ...payload,
      outcome: "OPEN",
      pnl: 0,
      afterUrl: "",
    });
    toast("Trade saved");
    if (take) setOpen("tradeOutcome", { tradeId: created.id });
    else onClose();
  }

  const gradeClass =
    grade === "A+" || grade === "A"
      ? "text-brand"
      : grade === "B"
        ? "text-sky-500"
        : grade === "C"
          ? "text-amber-500"
          : "text-loss";

  return (
    <Modal title={existing ? "Edit Trade" : "Add Trade"} onClose={onClose} xl>
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
                <button
                  type="button"
                  className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-600"
                  onClick={() => setShowPair((v) => !v)}
                >
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
              <Select value={direction} onChange={(e) => setDirection(e.target.value as "" | "Buy" | "Sell")}>
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

        <div className="rounded-2xl border border-line bg-slate-50 p-4 dark:border-[#243041] dark:bg-white/5">
          <div className="mb-2 flex justify-between">
            <p className="font-semibold dark:text-white">Confirmation Checklist</p>
            <span className="font-semibold text-brand">{checked}/{items.length}</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${pct}%` }} />
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
            <button className="btn-primary mt-5 h-11 text-xs" onClick={() => setShowChecklist(true)}>
              + Create Custom Checklist
            </button>
          </div>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={`${checklistId}-${item}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    setRules((p) => {
                      const next = [...p];
                      next[i] = !next[i];
                      return next;
                    });
                    setPopIndex(i);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition duration-200 hover:-translate-y-0.5 ${
                    rules[i] ? "bg-brand/10 text-ink dark:text-white" : "bg-white dark:bg-[#151a21]"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                      rules[i] ? `border-brand bg-brand text-white ${popIndex === i ? "check-pop" : ""}` : "border-slate-300 bg-white dark:border-white/20 dark:bg-transparent"
                    }`}
                  >
                    {rules[i] ? <Check size={11} strokeWidth={3} /> : null}
                  </span>
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
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition duration-200 hover:-translate-y-0.5 ${
                    on
                      ? "chip-in bg-brand/15 text-brand-700 ring-1 ring-brand/30 dark:bg-brand/20 dark:text-brand"
                      : "bg-slate-100 text-ink-muted hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15"
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
            <button className="btn-primary" onClick={() => setApplied(proof)}>
              <ImageIcon size={15} /> Apply
            </button>
          </div>
          <p className="mt-1 text-[11px] text-ink-faint">
            Tip: Right-click any image on the web → Copy image address to get a direct link. URLs should end with .png, .jpg, .gif, or .webp.
          </p>
          {applied ? (
            <div className="relative mt-2 inline-block">
              <img src={applied} alt="Proof" className="max-h-40 rounded-xl" />
              <button
                type="button"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-loss text-white shadow-soft"
                onClick={() => {
                  setApplied("");
                  setProof("");
                }}
              >
                <X size={12} />
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 font-semibold text-purple-brand">
            <Wallet size={16} /> Linked Accounts
          </p>
          {data.accounts.length === 0 ? (
            <p className="text-sm text-ink-faint">No accounts linked yet. Add one from My Portfolio.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.accounts.map((a) => {
                const on = accounts.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAccounts((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 ${on ? "bg-purple-brand text-white" : "bg-slate-100 dark:bg-white/10"}`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 font-semibold dark:text-white">
              <AlertCircle size={16} className="text-loss" /> Trade Summary
            </p>
            <span className={`text-2xl font-bold ${gradeClass}`}>{grade}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {summary.map((s) => (
              <div
                key={s.label}
                className={`rounded-xl p-3 transition hover:-translate-y-0.5 ${
                  s.kind === "good"
                    ? "bg-brand/10"
                    : s.kind === "bad"
                      ? "bg-loss-soft"
                      : "bg-white dark:bg-[#151a21]"
                }`}
              >
                <p className="flex items-center gap-1 text-[11px] text-ink-muted">
                  {s.label === "DIRECTION" ? (direction === "Buy" ? <TrendingUp size={12} className="text-brand" /> : <TrendingDown size={12} className="text-loss" />) : null}
                  {s.label === "SESSION" ? <MapPin size={12} className="text-pink-500" /> : null}
                  {s.label === "PAIR" ? <Link2 size={12} className="text-orange-500" /> : null}
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
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <div className="rounded-2xl border border-line p-4 dark:border-[#243041]">
          <p className="mb-3 flex items-center gap-2 font-semibold text-loss">
            <Zap size={16} /> Trade Decision
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="primary" icon={<Check size={16} />} onClick={() => save(true)}>
              {existing ? "SAVE TRADE" : "TAKE TRADE"}
            </Button>
            <Button variant="danger-outline" onClick={onClose} icon={<X size={16} />}>Cancel Trade</Button>
          </div>
        </div>
      </div>
      {showChecklist ? (
        <ChecklistSettingsModal
          stacked
          onClose={() => setShowChecklist(false)}
          onCreated={(id) => {
            applyChecklist(id);
            setShowChecklist(false);
          }}
        />
      ) : null}
    </Modal>
  );
}
