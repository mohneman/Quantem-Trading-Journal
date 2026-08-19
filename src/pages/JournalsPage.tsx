import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Drama,
  FileText,
  Flame,
  Plus,
  Smile,
  Target,
  Trash2,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Input } from "../components/ui/Field";
import { moodMonth, TODAY_ISO } from "../data";
import { useMenu } from "../hooks";
import { useModal } from "../context/ModalContext";
import { useStore, type Journal } from "../store";
import { addDays, journalPreview, uid, weekdayShort } from "../lib";

const moodEmoji: Record<string, string> = {
  Excited: "🤩",
  Happy: "😊",
  Calm: "😌",
  Sad: "🥺",
  Annoyed: "😒",
};

const moodTone: Record<string, string> = {
  Excited: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Happy: "bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300",
  Calm: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  Sad: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  Annoyed: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

export function JournalsPage() {
  const onMenu = useMenu();
  const { setOpen } = useModal();
  const { data, setTasks } = useStore();
  const [draft, setDraft] = useState("");
  const today = new Date(`${TODAY_ISO}T12:00:00`);
  const [calMonth, setCalMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(TODAY_ISO);
  const tasks = data.tasks;
  const journals = [...data.journals].sort((a, b) => b.date.localeCompare(a.date));
  const weekStart = startOfWeek(TODAY_ISO);
  const thisWeek = journals.filter((j) => j.date >= weekStart && j.date <= TODAY_ISO).length;
  const todayMood = journals.find((j) => j.date === TODAY_ISO)?.mood ?? "—";
  const dated = new Set(journals.map((j) => j.date));
  const moodByDate = Object.fromEntries(journals.map((j) => [j.date, j.mood]));
  const streak = writingStreak(dated, TODAY_ISO);
  const moodCounts = { Great: 0, Good: 0, Okay: 0, Bad: 0 };
  journals.forEach((j) => {
    if (j.mood === "Excited" || j.mood === "Happy") moodCounts.Great += 1;
    else if (j.mood === "Calm") moodCounts.Good += 1;
    else if (j.mood === "Annoyed") moodCounts.Okay += 1;
    else moodCounts.Bad += 1;
  });
  const totalMood = Math.max(1, journals.length);
  const monthKey = `${calMonth.y}-${String(calMonth.m + 1).padStart(2, "0")}`;
  const thisMonth = journals.filter((j) => j.date.startsWith(monthKey)).length;
  const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
  const avgPerWeek = (thisMonth / Math.max(1, daysInMonth / 7)).toFixed(1);
  const doneCount = tasks.filter((t) => t.done).length;

  function addTask() {
    if (!draft.trim()) return;
    setTasks([...tasks, { id: uid(), text: draft.trim(), done: false }]);
    setDraft("");
  }

  return (
    <div>
      <PageHeader
        title="Daily Journal"
        subtitle="Capture routines, daily tasks, and the context of your day."
        onMenu={onMenu}
      />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-[24px] bg-gradient-to-r from-teal-50 via-white to-violet-50 p-5 dark:from-brand/10 dark:via-transparent dark:to-violet-500/10">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              DAILY JOURNAL
            </span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">My daily journals</h2>
            <p className="mt-1 text-sm text-ink-muted">Track your day, A+ setups, psychology, and performance.</p>
          </div>
          <button
            className="btn-gradient shadow-[0_8px_22px_rgba(0,209,193,0.28)] hover:shadow-[0_12px_28px_rgba(124,108,240,0.28)]"
            onClick={() => setOpen("newDay")}
          >
            <Plus size={16} /> New Day
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Mini label="Total entries" value={String(journals.length)} icon={<BookOpen size={16} />} tint="from-teal-50 to-emerald-50" iconBg="bg-teal-100 text-teal-600" />
          <Mini label="This week" value={String(thisWeek)} icon={<CalendarDays size={16} />} tint="from-sky-50 to-indigo-50" iconBg="bg-indigo-100 text-indigo-500" />
          <Mini label="Streak" value={`${streak}d`} icon={<Flame size={16} />} tint="from-orange-50 to-amber-50" iconBg="bg-orange-100 text-orange-500" />
          <Mini label="Today mood" value={todayMood} icon={<Smile size={16} />} tint="from-lime-50 to-yellow-50" iconBg="bg-lime-100 text-lime-600" />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-5">
            <div className="card overflow-hidden p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-brand" />
                  <h3 className="font-semibold dark:text-white">Recent Days</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-ink-muted dark:bg-white/10">
                  {journals.length} {journals.length === 1 ? "day" : "days"}
                </span>
              </div>
              <p className="mb-3 text-xs text-ink-muted">Your latest journal records.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                      <th className="pb-2 pr-3 font-medium">Day</th>
                      <th className="pb-2 pr-3 font-medium">Date</th>
                      <th className="pb-2 pr-3 font-medium">Tags</th>
                      <th className="pb-2 font-medium">Mood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="rounded-xl bg-slate-50 px-3 py-8 text-center text-sm text-ink-faint dark:bg-white/5">
                          No journal days yet. Click New Day or pick a date on the calendar.
                        </td>
                      </tr>
                    ) : (
                      journals.map((j) => (
                        <JournalRow
                          key={j.id}
                          journal={j}
                          onOpen={() => setOpen("editDay", { journalId: j.id })}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-brand" />
                  <h3 className="font-semibold dark:text-white">Focus list</h3>
                </div>
                <span className="text-xs font-medium text-ink-faint">
                  {doneCount}/{tasks.length} completed
                </span>
              </div>
              <p className="mb-3 text-xs text-ink-muted">Keep tomorrow's execution plan visible and actionable.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a new task"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTask();
                  }}
                />
                <button className="btn-gradient px-4" onClick={addTask}>
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
                    <li
                      key={t.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-soft dark:border-[#243041] ${
                        t.done
                          ? "border-emerald-100 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                          : "border-line bg-white dark:bg-transparent"
                      }`}
                    >
                      <button
                        aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                        onClick={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                          t.done ? "border-brand bg-brand text-white" : "border-line text-transparent dark:border-[#243041]"
                        }`}
                      >
                        <CheckCircle2 size={12} />
                      </button>
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
            <div className="card bg-gradient-to-b from-violet-50/70 to-white p-4 dark:from-violet-500/10 dark:to-transparent">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold dark:text-white">
                  {new Date(calMonth.y, calMonth.m, 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <div className="flex gap-1">
                  <button className="rounded-lg p-1 hover:bg-white dark:hover:bg-white/10" onClick={() => setCalMonth((m) => (m.m === 0 ? { y: m.y - 1, m: 11 } : { y: m.y, m: m.m - 1 }))}>
                    <ChevronLeft size={16} />
                  </button>
                  <button className="rounded-lg p-1 hover:bg-white dark:hover:bg-white/10" onClick={() => setCalMonth((m) => (m.m === 11 ? { y: m.y + 1, m: 0 } : { y: m.y, m: m.m + 1 }))}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <MiniCal
                year={calMonth.y}
                month={calMonth.m}
                selected={selected}
                dates={dated}
                moods={moodByDate}
                today={TODAY_ISO}
                onSelect={(iso) => {
                  setSelected(iso);
                  const hit = journals.find((j) => j.date === iso);
                  if (hit) setOpen("editDay", { journalId: hit.id });
                  else setOpen("newDay", { date: iso });
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
                        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: m.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50/90 p-4 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card dark:bg-amber-500/10">
              <h3 className="mb-3 font-semibold dark:text-white">Quick Stats</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-ink-muted">This month</span><b>{thisMonth}</b></li>
                <li className="flex justify-between"><span className="text-ink-muted">Writing streak</span><b className="text-brand">{streak} days</b></li>
                <li className="flex justify-between"><span className="text-ink-muted">Avg per week</span><b>{avgPerWeek}</b></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalRow({ journal: j, onOpen }: { journal: Journal; onOpen: () => void }) {
  const preview = useMemo(() => journalPreview(j), [j]);
  const d = new Date(`${j.date}T12:00:00`);
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate());
  return (
    <tr
      onClick={onOpen}
      className="journal-row cursor-pointer align-middle"
    >
      <td className="py-3 pr-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/20">
            <Drama size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-medium capitalize dark:text-white">{j.title || "untitled"}</p>
            {preview ? <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-ink-faint">{preview}</p> : null}
          </div>
        </div>
      </td>
      <td className="py-3 pr-3">
        <div className="flex flex-col items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-center text-[10px] font-bold leading-tight text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            {mon}
            <span className="text-xs">{day}</span>
          </span>
          <span className="mt-1 text-[10px] font-medium text-ink-faint">{weekdayShort(j.date)}</span>
        </div>
      </td>
      <td className="py-3 pr-3">
        <div className="flex flex-wrap gap-1.5">
          {j.tags.map((t) => (
            <span key={t} className="rounded-full border border-line bg-white px-2 py-0.5 text-[11px] text-ink-muted dark:border-[#243041] dark:bg-white/5">
              {t}
            </span>
          ))}
        </div>
      </td>
      <td className="py-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${moodTone[j.mood] ?? "bg-slate-100 text-ink-muted"}`}>
          {moodEmoji[j.mood] ?? "🙂"} {j.mood}
        </span>
      </td>
    </tr>
  );
}

function Mini({
  label, value, icon, tint, iconBg,
}: {
  label: string; value: string; icon: React.ReactNode; tint: string; iconBg: string;
}) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br p-4 shadow-soft transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-card ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-full ${iconBg}`}>{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold dark:text-white">{value}</p>
    </article>
  );
}

function MiniCal({
  year, month, selected, onSelect, dates, today, moods,
}: {
  year: number;
  month: number;
  selected: string;
  onSelect: (iso: string) => void;
  dates: Set<string>;
  today: string;
  moods: Record<string, string>;
}) {
  const first = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: first + dim }, (_, i) => (i < first ? null : i - first + 1));
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-semibold text-ink-faint">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const has = dates.has(iso);
          const isToday = iso === today;
          const isSel = iso === selected;
          return (
            <button
              key={i}
              onClick={() => onSelect(iso)}
              className={`cal-day relative h-9 rounded-lg text-sm ${
                has
                  ? "bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : isToday || isSel
                    ? "bg-violet-100 font-semibold text-violet-700 ring-1 ring-violet-300 dark:bg-violet-500/20 dark:text-violet-200"
                    : "text-ink-muted hover:bg-white dark:hover:bg-white/5"
              }`}
            >
              {day}
              {has ? (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] leading-none">
                  {moodEmoji[moods[iso]] ?? "•"}
                </span>
              ) : isToday ? (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-violet-500" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function startOfWeek(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function writingStreak(dates: Set<string>, today: string) {
  if (!dates.has(today)) return 0;
  let n = 0;
  let cursor = today;
  while (dates.has(cursor)) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}
