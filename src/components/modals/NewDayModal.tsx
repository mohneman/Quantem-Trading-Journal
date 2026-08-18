import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input, Select, TextArea } from "../ui/Field";
import { Button } from "../ui/Button";
import { TODAY_ISO } from "../../data";
import { useStore } from "../../store";
import { uid } from "../../lib";

const moods = [
  { id: "Happy", emoji: "😊" },
  { id: "Sad", emoji: "🥺" },
  { id: "Annoyed", emoji: "😒" },
  { id: "Excited", emoji: "🤩" },
  { id: "Calm", emoji: "😌" },
];
const tags = ["Trading", "Personal", "Reflection", "Wins", "Lessons", "Strategy"];

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
  const existing = data.journals.find((j) => j.id === journalId);
  const editing = Boolean(existing);
  const [mood, setMood] = useState(existing?.mood ?? "Excited");
  const [activeTags, setActiveTags] = useState(existing?.tags ?? ["Trading", "Personal"]);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(existing?.date ?? initialDate ?? TODAY_ISO);
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? "");
  const [affirmation, setAffirmation] = useState(existing?.affirmation ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [plans, setPlans] = useState(existing?.plans ?? [
    { id: uid(), accountId: "", balance: "", trades: "2-3", pips: "50", risk: "1%", amount: "$50" },
  ]);
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
    if (existing) updateJournal(existing.id, payload);
    else addJournal(payload);
    onClose();
  }

  return (
    <Modal title={editing ? "Edit Day" : "New Day"} subtitle="Log your daily trading journey" onClose={onClose} xl>
      <div className="mb-4 flex justify-end gap-2">
        {existing ? (
          <Button
            variant="danger-outline"
            onClick={() => {
              deleteJournal(existing.id);
              onClose();
            }}
          >
            Delete
          </Button>
        ) : null}
        <Button variant="gradient" icon={<Check size={16} />} onClick={save}>
          {editing ? "Update Day" : "Save Day"}
        </Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="card p-4">
            <p className="mb-3 font-semibold text-brand">Day Details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Day title..." /></Field>
              <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            </div>
          </div>
          <div className="card p-4">
            <p className="mb-3 font-semibold text-loss">Gratitude</p>
            <TextArea placeholder="What fills your heart with gratitude today..." value={gratitude} onChange={(e) => setGratitude(e.target.value)} />
          </div>
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-brand">Daily Battle Plan</p>
                <p className="text-xs text-ink-muted">Set your targets before the session</p>
              </div>
              <button
                className="btn-gradient h-9 text-xs"
                onClick={() =>
                  setPlans((a) => [...a, { id: uid(), accountId: "", balance: "", trades: "2-3", pips: "50", risk: "1%", amount: "$50" }])
                }
              >
                <Plus size={14} /> Add Account
              </button>
            </div>
            {plans.map((p) => (
              <div key={p.id} className="mb-3 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select value={p.accountId} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, accountId: e.target.value } : r)))}>
                    <option value="">Select account</option>
                    {data.accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Input placeholder="Account balance detail" value={p.balance} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, balance: e.target.value } : r)))} />
                    <button
                      className="text-ink-faint hover:text-loss"
                      onClick={() => setPlans((rows) => rows.filter((r) => r.id !== p.id))}
                      aria-label="Remove plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Field label="No. of Trades"><Input value={p.trades} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, trades: e.target.value } : r)))} /></Field>
                  <Field label="Pips Target"><Input value={p.pips} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, pips: e.target.value } : r)))} /></Field>
                  <Field label="Risk %"><Input value={p.risk} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, risk: e.target.value } : r)))} /></Field>
                </div>
                <Field label="Risk Amount" className="mt-2"><Input value={p.amount} onChange={(e) => setPlans((rows) => rows.map((r) => (r.id === p.id ? { ...r, amount: e.target.value } : r)))} /></Field>
              </div>
            ))}
          </div>
          <div className="card p-4">
            <p className="mb-3 font-semibold dark:text-white">Focus Tasks</p>
            <div className="flex gap-2">
              <Input placeholder="Add a focus task..." value={task} onChange={(e) => setTask(e.target.value)} />
              <button
                className="btn-gradient"
                onClick={() => {
                  if (!task.trim()) return;
                  setTasks((t) => [...t, { id: uid(), text: task.trim(), done: false }]);
                  setTask("");
                }}
              >
                + Add
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-ink-faint dark:bg-white/5">No tasks added yet. Start planning your trading day!</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm dark:border-[#243041]">
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
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="label">How are you feeling?</p>
            <div className="grid grid-cols-5 gap-1">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`rounded-xl border p-2 text-center text-[10px] font-semibold ${mood === m.id ? "border-brand bg-brand/10 text-brand" : "border-line dark:border-[#243041]"}`}
                >
                  <div className="text-lg">{m.emoji}</div>
                  {m.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <Field label="Today's Affirmation">
            <TextArea placeholder="I am disciplined, patient, and profitable..." value={affirmation} onChange={(e) => setAffirmation(e.target.value)} />
          </Field>
          <div>
            <p className="label">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const on = activeTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTags((p) => (on ? p.filter((x) => x !== t) : [...p, t]))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${on ? "bg-brand text-white" : "border border-line dark:border-[#243041]"}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Additional Notes">
            <TextArea placeholder="Any additional thoughts, observations, or market insights..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
