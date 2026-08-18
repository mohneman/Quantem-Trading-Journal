import { useState } from "react";
import { BookOpen, CalendarDays, Flame, Plus, Smile, Target, Trash2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Input } from "../components/ui/Field";
import { moodMonth, TODAY_ISO } from "../data";
import { useMenu } from "../hooks";
import { useModal } from "../context/ModalContext";
import { useStore } from "../store";
import { monthDay, uid, weekdayName } from "../lib";

const moodEmoji: Record<string, string> = {
  Excited: "🤩",
  Happy: "😊",
  Calm: "😌",
  Sad: "🥺",
  Annoyed: "😒",
};

export function JournalsPage() {
  const onMenu = useMenu();
  const { setOpen } = useModal();
  const { data, setTasks } = useStore();
  const [draft, setDraft] = useState("");
  const [calMonth] = useState({ y: 2026, m: 7 });
  const [selected, setSelected] = useState(TODAY_ISO);
  const tasks = data.tasks;
  const journals = [...data.journals].sort((a, b) => b.date.localeCompare(a.date));
  const thisWeek = journals.filter((j) => j.date >= "2026-08-16").length;
  const todayMood = journals.find((j) => j.date === TODAY_ISO)?.mood ?? "—";
  const dated = new Set(journals.map((j) => j.date));
  const moodCounts = { Great: 0, Good: 0, Okay: 0, Bad: 0 };
  journals.forEach((j) => {
    if (j.mood === "Excited" || j.mood === "Happy") moodCounts.Great += 1;
    else if (j.mood === "Calm") moodCounts.Good += 1;
    else if (j.mood === "Annoyed") moodCounts.Okay += 1;
    else moodCounts.Bad += 1;
  });
  const totalMood = Math.max(1, journals.length);

  return (
    <div>
      <PageHeader
        title="Daily Journal"
        subtitle="Capture routines, daily tasks, and the context of your day."
        onMenu={onMenu}
      />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-[24px] bg-gradient-to-r from-teal-50 to-white p-5 dark:from-brand/10 dark:to-transparent">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              DAILY JOURNAL
            </span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">My daily journals</h2>
          </div>
          <button className="btn-gradient" onClick={() => setOpen("newDay")}>
            <Plus size={16} /> New Day
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Mini label="Total entries" value={String(journals.length)} icon={<BookOpen size={16} />} tint="from-teal-50 to-emerald-50" />
          <Mini label="This week" value={String(thisWeek)} icon={<CalendarDays size={16} />} tint="from-sky-50 to-indigo-50" />
          <Mini label="Streak" value={`${Math.min(journals.length, 7)}d`} icon={<Flame size={16} />} tint="from-orange-50 to-amber-50" />
          <Mini label="Today mood" value={todayMood} icon={<Smile size={16} />} tint="from-lime-50 to-yellow-50" />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold dark:text-white">Recent Days</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-white/10">{journals.length} day</span>
              </div>
              <p className="mb-3 text-xs text-ink-muted">Your latest journal records.</p>
              <div className="space-y-2">
                {journals.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => setOpen("editDay", { journalId: j.id })}
                    className="w-full rounded-xl border border-line p-3 text-left hover:bg-slate-50 dark:border-[#243041] dark:hover:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium capitalize dark:text-white">{j.title || weekdayName(j.date)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-white/10">{monthDay(j.date)}</span>
                      {j.tags.map((t) => (
                        <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] dark:bg-white/10">{t}</span>
                      ))}
                      <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        {moodEmoji[j.mood] ?? "🙂"} {j.mood}
                      </span>
                    </div>
                    {j.notes ? <p className="mt-2 truncate text-xs text-ink-faint">{j.notes}</p> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-brand" />
                  <h3 className="font-semibold dark:text-white">Focus list</h3>
                </div>
                <span className="text-xs text-ink-faint">{tasks.filter((t) => t.done).length}/{tasks.length} completed</span>
              </div>
              <p className="mb-3 text-xs text-ink-muted">Keep tomorrow's execution plan visible and actionable.</p>
              <div className="flex gap-2">
                <Input placeholder="Enter a new task" value={draft} onChange={(e) => setDraft(e.target.value)} />
                <button
                  className="btn-gradient px-4"
                  onClick={() => {
                    if (!draft.trim()) return;
                    setTasks([...tasks, { id: uid(), text: draft.trim(), done: false }]);
                    setDraft("");
                  }}
                >
                  Add
                </button>
              </div>
              {tasks.length === 0 ? (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-ink-faint dark:bg-white/5">
                  No tasks added yet. Start planning your trading day!
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm dark:border-[#243041]">
                      <input
                        type="checkbox"
                        className="accent-brand"
                        checked={t.done}
                        onChange={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                      />
                      <span className={t.done ? "flex-1 line-through text-ink-faint" : "flex-1"}>{t.text}</span>
                      <button className="text-ink-faint hover:text-loss" onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}>
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-4">
              <h3 className="mb-3 font-semibold dark:text-white">August 2026</h3>
              <MiniCal
                selected={Number(selected.slice(8))}
                dates={dated}
                today={18}
                onSelect={(d) => {
                  const iso = `2026-08-${String(d).padStart(2, "0")}`;
                  setSelected(iso);
                  const hit = journals.find((j) => j.date === iso);
                  if (hit) setOpen("editDay", { journalId: hit.id });
                }}
              />
            </div>
            <div className="card p-4">
              <h3 className="mb-3 font-semibold dark:text-white">Mood This Month</h3>
              <div className="space-y-3">
                {moodMonth.map((m) => {
                  const key = m.label as keyof typeof moodCounts;
                  const pct = Math.round((moodCounts[key] / totalMood) * 100);
                  return (
                    <div key={m.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{m.emoji} {m.label}</span>
                        <span className="text-ink-muted">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div className="h-full" style={{ width: `${pct}%`, background: m.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50/80 p-4 dark:bg-amber-500/10">
              <h3 className="mb-3 font-semibold dark:text-white">Quick Stats</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-ink-muted">This month</span><b>{journals.filter((j) => j.date.startsWith("2026-08")).length}</b></li>
                <li className="flex justify-between"><span className="text-ink-muted">Writing streak</span><b className="text-brand">{Math.min(journals.length, 7)} days</b></li>
                <li className="flex justify-between"><span className="text-ink-muted">Avg per week</span><b>{(journals.length / 4).toFixed(1)}</b></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">{calMonth.y}</span>
    </div>
  );
}

function Mini({ label, value, icon, tint }: { label: string; value: string; icon: React.ReactNode; tint: string }) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br p-4 ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className="mb-3 text-brand">{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold dark:text-white">{value}</p>
    </article>
  );
}

function MiniCal({
  selected, onSelect, dates, today,
}: {
  selected: number; onSelect: (n: number) => void; dates: Set<string>; today: number;
}) {
  const first = new Date(2026, 7, 1).getDay();
  const cells = Array.from({ length: first + 31 }, (_, i) => (i < first ? null : i - first + 1));
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-semibold text-ink-faint">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const iso = `2026-08-${String(day).padStart(2, "0")}`;
          const has = dates.has(iso);
          return (
            <button
              key={i}
              onClick={() => onSelect(day)}
              className={`relative h-9 rounded-lg text-sm ${
                has ? "bg-emerald-100 font-semibold text-emerald-700" : day === today ? "border border-violet-400 text-violet-700" : day === selected ? "bg-violet-100 font-semibold text-violet-700" : "text-ink-muted hover:bg-slate-50"
              }`}
            >
              {day}
              {has ? <span className="absolute bottom-0.5 right-0.5 text-[9px]">🎉</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
