import { useState } from "react";
import {
  Check,
  Crosshair,
  Heart,
  NotebookPen,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select, TextArea } from "../ui/Field";
import { Button } from "../ui/Button";
import { TODAY_ISO } from "../../data";
import { useStore } from "../../store";
import { useToast } from "../../context/ToastContext";
import { uid } from "../../lib";

const moods = [
  { id: "Happy", emoji: "😊", tint: "bg-amber-50" },
  { id: "Sad", emoji: "🥺", tint: "bg-sky-50" },
  { id: "Annoyed", emoji: "😒", tint: "bg-orange-50" },
  { id: "Excited", emoji: "🤩", tint: "bg-fuchsia-50" },
  { id: "Calm", emoji: "😌", tint: "bg-emerald-50" },
];

const tags = [
  { id: "Trading", on: "bg-brand text-white shadow-[0_6px_16px_rgba(0,209,193,0.35)]" },
  { id: "Personal", on: "bg-sky-500 text-white shadow-[0_6px_16px_rgba(56,189,248,0.35)]" },
  { id: "Reflection", on: "bg-violet-500 text-white shadow-[0_6px_16px_rgba(139,92,246,0.35)]" },
  { id: "Wins", on: "bg-emerald-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.35)]" },
  { id: "Lessons", on: "bg-amber-500 text-white shadow-[0_6px_16px_rgba(245,158,11,0.35)]" },
  { id: "Strategy", on: "bg-orange-500 text-white shadow-[0_6px_16px_rgba(249,115,22,0.35)]" },
];

const emptyPlan = () => ({
  id: uid(),
  accountId: "",
  balance: "",
  trades: "2-3",
  pips: "50",
  risk: "1%",
  amount: "$50",
});

export function NewDayModal({
  onClose,
  journalId,
  initialDate,
}: {
  onClose: () => void;
  journalId?: string;
  initialDate?: string;
}) {
  const { data, addJournal, updateJournal, deleteJournal } = useStore();
  const { toast } = useToast();
  const existing = data.journals.find((j) => j.id === journalId);
  const editing = Boolean(existing);
  const [mood, setMood] = useState(existing?.mood ?? "Excited");
  const [activeTags, setActiveTags] = useState(existing?.tags ?? ["Trading", "Personal"]);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(existing?.date ?? initialDate ?? TODAY_ISO);
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? "");
  const [affirmation, setAffirmation] = useState(existing?.affirmation ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [plans, setPlans] = useState(existing?.plans?.length ? existing.plans : [emptyPlan()]);
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState(existing?.tasks ?? []);

  function save() {
    const payload = {
      title: title || "untitled",
      date,
      mood,
      tags: activeTags,
      gratitude,
      affirmation,
      notes,
      tasks,
      plans,
    };
    if (existing) {
      updateJournal(existing.id, payload);
      toast("Day updated");
    } else {
      const sameDay = data.journals.find((j) => j.date === date);
      if (sameDay) {
        updateJournal(sameDay.id, payload);
        toast("Existing day for this date was updated");
      } else {
        addJournal(payload);
        toast("Day saved");
      }
    }
    onClose();
  }

  function addTask() {
    if (!task.trim()) return;
    setTasks((t) => [...t, { id: uid(), text: task.trim(), done: false }]);
    setTask("");
  }

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <Modal
      title={editing ? "Edit Day" : "New Day"}
      subtitle="Log your daily trading journey"
      onClose={onClose}
      xl
      glow
      muted
      icon={
        <div className="grid h-11 w-11 place-items-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
          {editing ? <Pencil size={18} /> : <Sparkles size={18} />}
        </div>
      }
      action={
        <div className="flex items-center gap-2">
          {existing ? (
            <Button
              variant="danger-outline"
              className="h-10"
              onClick={() => {
                deleteJournal(existing.id);
                onClose();
              }}
            >
              Delete
            </Button>
          ) : null}
          <Button
            variant="gradient"
            className="h-10 shadow-[0_8px_22px_rgba(0,209,193,0.28)]"
            icon={<Check size={16} />}
            onClick={save}
          >
            {editing ? "Update Day" : "Save Day"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <section className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-teal-600">
                <Pencil size={13} />
              </span>
              <p className="font-semibold text-brand">Day Details</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Day title..." />
              </Field>
              <Field label="Date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 text-rose-500">
                <Heart size={13} />
              </span>
              <p className="font-semibold text-rose-500">Gratitude</p>
            </div>
            <TextArea
              placeholder="What fills your heart with gratitude today..."
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
            />
          </section>

          <section className="card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-teal-600">
                  <NotebookPen size={13} />
                </span>
                <div>
                  <p className="font-semibold text-brand">Daily Battle Plan</p>
                  <p className="text-xs text-ink-muted">Set your targets before the session</p>
                </div>
              </div>
              <button
                className="btn-gradient h-9 px-3 text-xs"
                onClick={() => setPlans((a) => [...a, emptyPlan()])}
              >
                <Plus size={14} /> Add Account
              </button>
            </div>
            {plans.map((p, i) => (
              <div key={p.id} className="mb-3 rounded-xl bg-slate-50 p-3 last:mb-0 dark:bg-white/5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-ink-muted">Account {i + 1}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Select
                    value={p.accountId}
                    onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, accountId: e.target.value } : r)))}
                  >
                    <option value="">Select account</option>
                    {data.accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Account balance detail"
                    value={p.balance}
                    onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, balance: e.target.value } : r)))}
                  />
                  <button
                    className="grid h-11 w-11 place-items-center rounded-xl text-ink-faint hover:bg-loss-soft hover:text-loss"
                    onClick={() => setPlans((rows) => rows.filter((r) => r.id !== p.id))}
                    aria-label="Remove plan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <MiniField icon={<Crosshair size={12} />} label="No. of Trades">
                    <Input value={p.trades} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, trades: e.target.value } : r)))} />
                  </MiniField>
                  <MiniField icon={<TrendingUp size={12} />} label="Pips Target">
                    <Input value={p.pips} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, pips: e.target.value } : r)))} />
                  </MiniField>
                  <MiniField icon={<Shield size={12} />} label="Risk %">
                    <Input value={p.risk} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, risk: e.target.value } : r)))} />
                  </MiniField>
                </div>
                <MiniField icon={<Wallet size={12} />} label="Risk Amount" className="mt-2">
                  <Input value={p.amount} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, amount: e.target.value } : r)))} />
                </MiniField>
              </div>
            ))}
          </section>

          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-indigo-500">
                  <Target size={13} />
                </span>
                <p className="font-semibold dark:text-white">Focus Tasks</p>
              </div>
              <span className="text-xs font-medium text-ink-faint">{doneCount}/{tasks.length}</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a focus task..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTask();
                }}
              />
              <button className="btn-gradient px-3" onClick={addTask}>
                <Plus size={14} /> Add
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-ink-faint dark:bg-white/5">
                No tasks added yet. Start planning your trading day!
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      t.done
                        ? "border-emerald-100 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                        : "border-line dark:border-[#243041]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-brand"
                      checked={t.done}
                      onChange={() => setTasks((rows) => rows.map((r) => (r.id === t.id ? { ...r, done: !r.done } : r)))}
                    />
                    <span className={t.done ? "flex-1 line-through text-ink-faint" : "flex-1"}>{t.text}</span>
                    <button className="text-ink-faint hover:text-loss" onClick={() => setTasks((rows) => rows.filter((r) => r.id !== t.id))}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="card p-4">
            <p className="label">How are you feeling?</p>
            <div className="grid grid-cols-5 gap-1.5">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`rounded-xl border p-2 text-center text-[10px] font-semibold transition duration-200 ${
                    mood === m.id
                      ? "mood-glow scale-105 border-brand bg-brand/10 text-brand"
                      : `${m.tint} border-transparent text-ink-muted hover:-translate-y-1 hover:shadow-soft dark:bg-white/5`
                  }`}
                >
                  <div className="text-lg">{m.emoji}</div>
                  {m.id.toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              <p className="label mb-0">Today's Affirmation</p>
            </div>
            <TextArea
              placeholder="I am disciplined, patient, and profitable..."
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
            />
          </section>

          <section className="card p-4">
            <p className="label">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const on = activeTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTags((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition duration-200 hover:-translate-y-0.5 ${
                      on ? t.on : "border border-line bg-slate-50 text-ink-muted dark:border-[#243041] dark:bg-white/5"
                    }`}
                  >
                    {t.id}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-4">
            <Field label="Additional Notes">
              <TextArea
                placeholder="Any additional thoughts, observations, or market insights..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </section>
        </div>
      </div>
    </Modal>
  );
}

function MiniField({
  icon, label, children, className = "",
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}
