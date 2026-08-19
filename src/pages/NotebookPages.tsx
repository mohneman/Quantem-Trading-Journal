import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject, type WheelEvent as ReactWheelEvent } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eraser,
  Focus,
  Fullscreen,
  Grid3x3,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  MoreVertical,
  Network,
  Pin,
  Plus,
  Quote,
  Redo2,
  Smile,
  StickyNote,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { useToast } from "../context/ToastContext";
import { useMenu } from "../hooks";
import { uid } from "../lib";
import { useStore, type MindMap, type MindNode, type Note } from "../store";

const NOTE_COLORS = ["#22C55E", "#00D1C1", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#EAB308"];
const MAP_COLORS = ["#22C55E", "#00D1C1", "#38BDF8", "#8B5CF6", "#EC4899", "#F97316", "#EAB308"];
const TEXT_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#0F172A"];
const EMOJIS = ["📈", "📉", "🎯", "💡", "⚡", "✅", "🔥", "📌", "🧠", "⭐", "🚀", "💪"];

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86400_000) return `${Math.floor(ms / 3600_000)}h`;
  return `${Math.floor(ms / 86400_000)}d`;
}

function noteDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countLabel(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function nodeBox(n: MindNode) {
  const w =
    n.w ??
    (n.type === "note" ? 176 : n.type === "image" ? 210 : Math.max(148, Math.min(280, n.text.length * 8.2 + 56)));
  const h = n.h ?? (n.type === "note" ? 168 : n.type === "image" ? 150 : 48);
  return { w, h };
}

function visibleNodes(nodes: MindNode[]) {
  const hidden = new Set<string>();
  for (const n of nodes) {
    if (!n.collapsed) continue;
    const stack = [n.id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const c of nodes.filter((x) => x.parentId === cur)) {
        hidden.add(c.id);
        stack.push(c.id);
      }
    }
  }
  return nodes.filter((n) => !hidden.has(n.id));
}

function collectDescendants(nodes: MindNode[], id: string) {
  const drop = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of nodes) {
      if (n.parentId && drop.has(n.parentId) && !drop.has(n.id)) {
        drop.add(n.id);
        grew = true;
      }
    }
  }
  return drop;
}

function curvePath(parent: MindNode, child: MindNode) {
  const a = nodeBox(parent);
  const b = nodeBox(child);
  const x1 = parent.x + a.w;
  const y1 = parent.y + a.h / 2;
  const x2 = child.x;
  const y2 = child.y + b.h / 2;
  const gap = Math.max(60, (x2 - x1) * 0.48);
  return `M ${x1} ${y1} C ${x1 + gap} ${y1}, ${x2 - gap} ${y2}, ${x2} ${y2}`;
}

function pickImageFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink transition hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand dark:border-[#243041] dark:bg-[#151a21] dark:text-slate-100"
    >
      <ArrowLeft size={16} />
    </button>
  );
}

function ColorDots({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value?: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          className="nb-swatch h-5 w-5 rounded-full"
          style={{
            background: c,
            boxShadow: value === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "0 0 0 1px rgba(15,23,42,0.08)",
          }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

export function NotebookHomePage() {
  const onMenu = useMenu();
  const { data } = useStore();
  return (
    <div>
      <PageHeader
        title="Trader Notebook"
        subtitle="Keep market notes, model ideas, and setup snapshots organized."
        onMenu={onMenu}
      />
      <div className="page-shell nb-hero p-8 sm:p-12">
        <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
          TRADING NOTEBOOK
        </span>
        <h2 className="mt-3 text-3xl font-semibold dark:text-white">Choose your workspace</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Write quick trading notes, or map out your ideas visually. Pick how you want to work — you can switch any time.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Link to="/notebook/notes" className="card nb-workspace nb-workspace-notebook card-static p-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-soft">
              <StickyNote size={22} />
            </div>
            <h3 className="mt-4 text-lg font-semibold dark:text-white">Notebook</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Classic notes for journaling trades, plans and reflections — fast, simple, distraction-free writing.
            </p>
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-ink-faint">{countLabel(data.notes.length, "note", "notes")}</span>
              <span className="nb-open font-medium text-brand">Open Notebook →</span>
            </div>
          </Link>
          <Link to="/notebook/maps" className="card nb-workspace nb-workspace-maps card-static p-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-brand text-white shadow-soft">
              <Network size={22} />
            </div>
            <h3 className="mt-4 text-lg font-semibold dark:text-white">Mind Maps</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Visual canvas to connect ideas, build setups and strategy trees with shapes, colors and sticky notes.
            </p>
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-ink-faint">{countLabel(data.maps.length, "map", "maps")}</span>
              <span className="nb-open font-medium text-purple-brand">Open Mind Maps →</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NotesEditorPage() {
  const onMenu = useMenu();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, addNote, updateNote, deleteNote } = useStore();
  const notes = [...data.notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)
  );
  const [activeId, setActiveId] = useState(notes[0]?.id ?? "");
  const active = notes.find((n) => n.id === activeId) ?? notes[0];
  const editor = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState("Saved");
  const [wide, setWide] = useState(false);
  const [toneMenu, setToneMenu] = useState<null | "text" | "mark">(null);
  const saveTimer = useRef<number>();

  useEffect(() => {
    if (active && editor.current && editor.current.innerHTML !== (active.html || "")) {
      editor.current.innerHTML = active.html || "";
    }
  }, [active?.id]);

  function persist(patch: Partial<Note>) {
    if (!active) return;
    updateNote(active.id, patch);
    setSaved("Saving");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaved("Saved"), 500);
  }

  function run(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    if (editor.current) persist({ html: editor.current.innerHTML });
  }

  async function insertLocalImage() {
    const url = await pickImageFile();
    if (url) run("insertImage", url);
  }

  return (
    <div>
      <PageHeader
        title="Trader Notebook"
        subtitle="Keep market notes, model ideas, and setup snapshots organized."
        onMenu={onMenu}
      />
      <div className={`page-shell nb-hero p-5 sm:p-7 ${wide ? "fixed inset-3 z-40 overflow-auto" : ""}`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => (wide ? setWide(false) : navigate("/notebook"))} />
            <div>
              <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                TRADING NOTEBOOK
              </span>
              <h2 className="mt-1 text-2xl font-semibold dark:text-white">Notebook</h2>
              <p className="text-xs text-ink-muted">
                {countLabel(data.notes.length, "note", "notes")} · {data.notes.filter((n) => n.pinned).length} pinned
              </p>
            </div>
          </div>
          <button
            className="btn-gradient"
            onClick={() => {
              const n = addNote();
              setActiveId(n.id);
              toast("New note created");
            }}
          >
            <Plus size={16} /> New Note
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="card card-static p-3">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">NOTES</p>
            <div className="space-y-1">
              {notes.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-ink-faint">No notes yet</p>
              ) : (
                notes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setActiveId(n.id)}
                    className={`nb-note-row group w-full rounded-xl px-3 py-2.5 text-left ${
                      n.id === active?.id ? "bg-brand/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-medium dark:text-white">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: n.color }} />
                      <span className="min-w-0 flex-1 truncate">{n.title}</span>
                      {n.pinned ? <Pin size={12} className="shrink-0 text-brand" /> : null}
                      <span className="shrink-0 text-[11px] text-ink-faint">{ago(n.updatedAt)}</span>
                      <ChevronRight size={14} className="shrink-0 text-brand opacity-0 transition group-hover:opacity-100" />
                    </p>
                    <p className="mt-0.5 truncate pl-4 text-xs text-ink-muted">{stripHtml(n.html) || "Empty note..."}</p>
                  </button>
                ))
              )}
            </div>
          </div>
          {active ? (
            <div className="card card-static p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <input
                  className="flex-1 bg-transparent text-lg font-semibold outline-none dark:text-white"
                  value={active.title}
                  onChange={(e) => persist({ title: e.target.value })}
                />
                <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                  {saved === "Saved" ? <Check size={12} className="text-brand" /> : null}
                  {saved}
                </span>
                <button
                  className={active.pinned ? "text-brand" : "text-ink-faint hover:text-brand"}
                  title="Pin note"
                  onClick={() => persist({ pinned: !active.pinned })}
                >
                  <Pin size={16} />
                </button>
                <button
                  className="text-ink-faint hover:text-brand"
                  title="Copy note"
                  onClick={() => {
                    void navigator.clipboard?.writeText(`${active.title}\n${stripHtml(active.html)}`);
                    toast("Note copied");
                  }}
                >
                  <Copy size={16} />
                </button>
                <button className="text-ink-faint hover:text-ink" title="Expand" onClick={() => setWide((w) => !w)}>
                  <Maximize2 size={16} />
                </button>
                <button
                  className="text-ink-faint hover:text-loss"
                  title="Delete note"
                  onClick={() => {
                    const next = notes.find((n) => n.id !== active.id)?.id ?? "";
                    deleteNote(active.id);
                    setActiveId(next);
                    toast("Note deleted");
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <ColorDots colors={NOTE_COLORS} value={active.color} onChange={(c) => persist({ color: c })} />
                <span className="ml-auto text-xs text-ink-faint">{noteDate(active.updatedAt)}</span>
              </div>
              <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-slate-50 px-2 py-2 text-ink-muted dark:bg-white/5">
                <Tbtn title="Undo" onClick={() => run("undo")}>
                  <Undo2 size={14} />
                </Tbtn>
                <Tbtn title="Redo" onClick={() => run("redo")}>
                  <Redo2 size={14} />
                </Tbtn>
                <Tbtn title="Heading 1" onClick={() => run("formatBlock", "h1")}>
                  <Heading1 size={14} />
                </Tbtn>
                <Tbtn title="Heading 2" onClick={() => run("formatBlock", "h2")}>
                  <Heading2 size={14} />
                </Tbtn>
                <Tbtn title="Heading 3" onClick={() => run("formatBlock", "h3")}>
                  <Heading3 size={14} />
                </Tbtn>
                <Tbtn title="Paragraph" onClick={() => run("formatBlock", "p")}>
                  <Type size={14} />
                </Tbtn>
                <Tbtn title="Bold" onClick={() => run("bold")}>
                  <Bold size={14} />
                </Tbtn>
                <Tbtn title="Italic" onClick={() => run("italic")}>
                  <Italic size={14} />
                </Tbtn>
                <Tbtn title="Underline" onClick={() => run("underline")}>
                  <Underline size={14} />
                </Tbtn>
                <Tbtn title="Strikethrough" onClick={() => run("strikeThrough")}>
                  <Strikethrough size={14} />
                </Tbtn>
                <Tbtn title="Bulleted list" onClick={() => run("insertUnorderedList")}>
                  <List size={14} />
                </Tbtn>
                <Tbtn title="Numbered list" onClick={() => run("insertOrderedList")}>
                  <ListOrdered size={14} />
                </Tbtn>
                <Tbtn title="Quote" onClick={() => run("formatBlock", "blockquote")}>
                  <Quote size={14} />
                </Tbtn>
                <Tbtn title="Align left" onClick={() => run("justifyLeft")}>
                  <AlignLeft size={14} />
                </Tbtn>
                <Tbtn title="Align center" onClick={() => run("justifyCenter")}>
                  <AlignCenter size={14} />
                </Tbtn>
                <Tbtn title="Align right" onClick={() => run("justifyRight")}>
                  <AlignRight size={14} />
                </Tbtn>
                <Tbtn
                  title="Link"
                  onClick={() => {
                    const url = prompt("Link URL");
                    if (url) run("createLink", url);
                  }}
                >
                  <LinkIcon size={14} />
                </Tbtn>
                <div className="relative">
                  <button
                    type="button"
                    title="Text color"
                    className="grid h-7 w-7 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                    onClick={() => setToneMenu((m) => (m === "text" ? null : "text"))}
                  >
                    A
                  </button>
                  {toneMenu === "text" ? (
                    <div className="absolute left-0 top-8 z-20 flex gap-1 rounded-xl border border-line bg-white p-2 shadow-card dark:border-[#243041] dark:bg-[#151a21]">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="h-4 w-4 rounded-full"
                          style={{ background: c }}
                          onClick={() => {
                            run("foreColor", c);
                            setToneMenu(null);
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    title="Highlight"
                    className="h-7 w-7 rounded bg-yellow-300"
                    onClick={() => setToneMenu((m) => (m === "mark" ? null : "mark"))}
                  />
                  {toneMenu === "mark" ? (
                    <div className="absolute left-0 top-8 z-20 flex gap-1 rounded-xl border border-line bg-white p-2 shadow-card dark:border-[#243041] dark:bg-[#151a21]">
                      {["#fde047", "#bbf7d0", "#bae6fd", "#fbcfe8", "#e2e8f0"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="h-4 w-4 rounded-sm"
                          style={{ background: c }}
                          onClick={() => {
                            run("hiliteColor", c);
                            setToneMenu(null);
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <Tbtn title="Insert image" onClick={() => void insertLocalImage()}>
                  <ImageIcon size={14} />
                </Tbtn>
                <Tbtn title="Clear formatting" onClick={() => run("removeFormat")}>
                  <Eraser size={14} />
                </Tbtn>
              </div>
              <div className="relative flex overflow-hidden rounded-xl border border-line/80 dark:border-[#243041]">
                <div
                  ref={editor}
                  contentEditable
                  className="min-h-[280px] max-h-[560px] w-full flex-1 overflow-y-auto px-3 py-2 text-sm outline-none dark:text-slate-100 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                  data-placeholder="Start writing your note..."
                  onInput={(e) => persist({ html: (e.target as HTMLDivElement).innerHTML })}
                />
                <NoteMinimap html={active.html} scroller={editor} />
              </div>
            </div>
          ) : (
            <div className="card card-static grid min-h-[320px] place-items-center p-10 text-sm text-ink-faint">
              <div className="text-center">
                <p>Create a note to start writing.</p>
                <button
                  className="btn-gradient mt-4"
                  onClick={() => {
                    const n = addNote();
                    setActiveId(n.id);
                  }}
                >
                  <Plus size={16} /> New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tbtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      className="grid h-7 w-7 place-items-center rounded-lg transition hover:bg-white hover:text-ink dark:hover:bg-white/10"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function MindMapsPage() {
  const onMenu = useMenu();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, addMap } = useStore();
  const maps = [...data.maps].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)
  );
  const [menuId, setMenuId] = useState<string | null>(null);

  function createMap() {
    const m = addMap();
    toast("Mind map created");
    navigate(`/notebook/maps/${m.id}`);
  }

  return (
    <div>
      <PageHeader
        title="Trader Notebook"
        subtitle="Keep market notes, model ideas, and setup snapshots organized."
        onMenu={onMenu}
      />
      <div className="page-shell nb-hero p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => navigate("/notebook")} />
            <div>
              <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                TRADING NOTEBOOK
              </span>
              <h2 className="mt-1 text-2xl font-semibold dark:text-white">Mind Maps</h2>
              <p className="text-xs text-ink-muted">
                {countLabel(maps.length, "map", "maps")} · {maps.filter((m) => m.pinned).length} pinned
              </p>
            </div>
          </div>
          <button className="btn-gradient" onClick={createMap}>
            <Plus size={16} /> New Map
          </button>
        </div>
        {maps.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-200 to-purple-300 text-pink-600 shadow-soft">
              <Brain size={28} />
            </div>
            <p className="mt-4 text-sm text-ink-muted">No mind maps yet — create your first one</p>
            <button className="btn-gradient mt-4" onClick={createMap}>
              <Plus size={16} /> New Map
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {maps.filter((m) => m.pinned).length ? (
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">PINNED</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {maps.filter((m) => m.pinned).map((m) => (
                    <MapCard key={m.id} m={m} menuId={menuId} setMenuId={setMenuId} />
                  ))}
                </div>
              </div>
            ) : null}
            {maps.filter((m) => !m.pinned).length ? (
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">ALL MAPS</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {maps.filter((m) => !m.pinned).map((m) => (
                    <MapCard key={m.id} m={m} menuId={menuId} setMenuId={setMenuId} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function MindMapCanvasPage() {
  const onMenu = useMenu();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { data, updateMap, deleteMap, addMap } = useStore();
  const map = data.maps.find((m) => m.id === id) ?? data.maps[0];
  const [selected, setSelected] = useState<string | null>(map?.nodes[0]?.id ?? null);
  const [editing, setEditing] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [history, setHistory] = useState<MindNode[][]>([]);
  const [future, setFuture] = useState<MindNode[][]>([]);
  const [grid, setGrid] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [pan, setPan] = useState({ x: 40, y: 20 });
  const [menu, setMenu] = useState<null | "color" | "size" | "align" | "emoji">(null);
  const drag = useRef<
    | { kind: "node"; id: string; dx: number; dy: number }
    | { kind: "pan"; x: number; y: number; px: number; py: number }
    | { kind: "resize"; id: string; w: number; h: number; x: number; y: number }
    | null
  >(null);
  const stage = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (!id && map) navigate(`/notebook/maps/${map.id}`, { replace: true });
  }, [id, map, navigate]);

  const keyApi = useRef({ map, selected, history, future, updateMap });
  keyApi.current = { map, selected, history, future, updateMap };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cur = keyApi.current;
      if (!cur.map) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const prev = cur.history.at(-1);
        if (!prev) return;
        setFuture((f) => [cur.map!.nodes, ...f]);
        setHistory((h) => h.slice(0, -1));
        cur.updateMap(cur.map.id, { nodes: prev });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        const next = cur.future[0];
        if (!next) return;
        setHistory((h) => [...h, cur.map!.nodes]);
        setFuture((f) => f.slice(1));
        cur.updateMap(cur.map.id, { nodes: next });
        return;
      }
      if (typing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && cur.selected) {
        const target = cur.map.nodes.find((n) => n.id === cur.selected);
        if (target?.parentId && cur.selected) {
          const drop = collectDescendants(cur.map.nodes, cur.selected);
          cur.updateMap(cur.map.id, { nodes: cur.map.nodes.filter((n) => !drop.has(n.id)) });
          setSelected(cur.map.nodes.find((n) => !drop.has(n.id))?.id ?? null);
          setEditing(null);
        }
      }
      if (e.key === "Escape") {
        setEditing(null);
        setMenu(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!map) {
    return (
      <div className="page-shell p-10 text-center">
        <p className="text-sm text-ink-muted">No mind map yet.</p>
        <button
          className="btn-gradient mt-4"
          onClick={() => {
            const m = addMap();
            navigate(`/notebook/maps/${m.id}`);
          }}
        >
          New Map
        </button>
      </div>
    );
  }

  const zoom = map.zoom || 1;
  const node = map.nodes.find((n) => n.id === selected) ?? map.nodes[0];
  const visible = visibleNodes(map.nodes);

  function commit(nodes: MindNode[], record = true) {
    if (record) {
      setHistory((h) => [...h.slice(-40), map.nodes]);
      setFuture([]);
    }
    updateMap(map.id, { nodes });
  }

  function undo() {
    const prev = history.at(-1);
    if (!prev) return;
    setFuture((f) => [map.nodes, ...f]);
    setHistory((h) => h.slice(0, -1));
    updateMap(map.id, { nodes: prev });
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, map.nodes]);
    setFuture((f) => f.slice(1));
    updateMap(map.id, { nodes: next });
  }

  function patchNode(id: string, patch: Partial<MindNode>, record = true) {
    commit(
      map.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      record
    );
  }

  function addChild(type: MindNode["type"], parent?: MindNode, extra?: Partial<MindNode>) {
    const p = parent ?? node;
    const origin = p ?? { x: 360 - pan.x / zoom, y: 200 - pan.y / zoom, color: MAP_COLORS[1], id: "" };
    const siblings = map.nodes.filter((x) => x.parentId === (p?.id ?? null));
    const box = p ? nodeBox(p) : { w: 0, h: 48 };
    const n: MindNode = {
      id: uid(),
      x: (p ? p.x + box.w + 90 : origin.x + 40) + (extra?.x ?? 0),
      y: (p ? p.y + siblings.length * 70 : origin.y) + (extra?.y ?? 0),
      text: extra?.text ?? (type === "topic" ? (p ? "Double-click to edit..." : "New topic") : type === "image" ? "Image" : "Double-click to edit..."),
      color: extra?.color ?? (p?.color || MAP_COLORS[1]),
      type,
      parentId: p?.id ?? null,
      imageUrl: extra?.imageUrl,
      fontSize: type === "note" ? 13 : 15,
      align: "center",
    };
    if (type === "note") {
      n.w = 176;
      n.h = 168;
      n.color = "#EAB308";
    }
    if (type === "image") {
      n.w = 210;
      n.h = 150;
    }
    commit([...map.nodes, n]);
    setSelected(n.id);
    if (type !== "image") setEditing(n.id);
    return n;
  }

  function removeNode(nid: string) {
    const drop = collectDescendants(map.nodes, nid);
    const next = map.nodes.filter((n) => !drop.has(n.id));
    commit(next);
    setSelected(next[0]?.id ?? null);
    setEditing(null);
  }

  function screenToWorld(clientX: number, clientY: number) {
    const rect = stage.current!.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }

  function onStageMove(e: ReactMouseEvent) {
    const d = drag.current;
    if (!d) return;
    moved.current = true;
    if (d.kind === "pan") {
      setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
      return;
    }
    const world = screenToWorld(e.clientX, e.clientY);
    if (d.kind === "node") {
      updateMap(map.id, {
        nodes: map.nodes.map((n) => (n.id === d.id ? { ...n, x: world.x - d.dx, y: world.y - d.dy } : n)),
      });
    } else {
      updateMap(map.id, {
        nodes: map.nodes.map((n) =>
          n.id === d.id ? { ...n, w: Math.max(120, world.x - d.x), h: Math.max(40, world.y - d.y) } : n
        ),
      });
    }
  }

  function onStageUp() {
    if (drag.current && moved.current && drag.current.kind !== "pan") {
      setHistory((h) => [...h.slice(-40), map.nodes]);
      setFuture([]);
    }
    drag.current = null;
  }

  function centerView() {
    if (!map.nodes.length) return;
    const boxes = map.nodes.map((n) => ({ n, ...nodeBox(n) }));
    const minX = Math.min(...boxes.map((b) => b.n.x));
    const minY = Math.min(...boxes.map((b) => b.n.y));
    const maxX = Math.max(...boxes.map((b) => b.n.x + b.w));
    const maxY = Math.max(...boxes.map((b) => b.n.y + b.h));
    const rect = stage.current?.getBoundingClientRect();
    const vw = rect?.width ?? 800;
    const vh = rect?.height ?? 500;
    setPan({
      x: (vw - (maxX - minX) * zoom) / 2 - minX * zoom,
      y: (vh - (maxY - minY) * zoom) / 2 - minY * zoom,
    });
  }

  function onWheel(e: ReactWheelEvent) {
    e.preventDefault();
    const next = Math.min(1.8, Math.max(0.45, zoom + (e.deltaY > 0 ? -0.08 : 0.08)));
    updateMap(map.id, { zoom: Number(next.toFixed(2)) });
  }

  async function addImageNode() {
    const url = await pickImageFile();
    if (!url) return;
    addChild("image", node, { imageUrl: url, text: "" });
  }

  function exportPng() {
    const boxes = map.nodes.map((n) => ({ n, ...nodeBox(n) }));
    if (!boxes.length) return;
    const minX = Math.min(...boxes.map((b) => b.n.x)) - 48;
    const minY = Math.min(...boxes.map((b) => b.n.y)) - 48;
    const maxX = Math.max(...boxes.map((b) => b.n.x + b.w)) + 48;
    const maxY = Math.max(...boxes.map((b) => b.n.y + b.h)) + 48;
    const w = Math.max(400, maxX - minX);
    const h = Math.max(280, maxY - minY);
    const c = document.createElement("canvas");
    c.width = w * 2;
    c.height = h * 2;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#cbd5e1";
    for (let x = 0; x < w; x += 22) for (let y = 0; y < h; y += 22) ctx.fillRect(x, y, 1.2, 1.2);
    for (const n of map.nodes.filter((x) => x.parentId)) {
      const p = map.nodes.find((x) => x.id === n.parentId);
      if (!p) continue;
      const path = new Path2D(curvePath({ ...p, x: p.x - minX, y: p.y - minY }, { ...n, x: n.x - minX, y: n.y - minY }));
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.stroke(path);
    }
    for (const b of boxes) {
      const x = b.n.x - minX;
      const y = b.n.y - minY;
      ctx.save();
      roundRect(ctx, x, y, b.w, b.h, 16);
      if (b.n.type === "note") ctx.fillStyle = "#fef3c7";
      else if (b.n.parentId && b.n.type !== "image") ctx.fillStyle = "#ffffff";
      else ctx.fillStyle = b.n.color;
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = b.n.textColor || (b.n.parentId && b.n.type === "topic" ? "#1e293b" : "#ffffff");
      if (b.n.type === "note") ctx.fillStyle = "#1e293b";
      ctx.font = `${b.n.bold ? "600" : "500"} ${b.n.fontSize ?? 15}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.n.text || "", x + b.w / 2, y + b.h / 2, b.w - 16);
    }
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${map.title.replace(/\s+/g, "-")}.png`;
      a.click();
      toast("Mind map exported");
    });
  }

  const selectedBox = node ? nodeBox(node) : null;
  const showEditBar = Boolean(editing && node);
  const showSelectBar = Boolean(selected && node && !editing);

  return (
    <div>
      {!focusMode ? (
        <PageHeader
          title="Trader Notebook"
          subtitle="Keep market notes, model ideas, and setup snapshots organized."
          onMenu={onMenu}
        />
      ) : null}
      <div className={`page-shell overflow-hidden ${focusMode ? "fixed inset-0 z-40 rounded-none" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 dark:border-[#243041]">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/notebook/maps")} className="rounded-lg p-1 hover:bg-slate-50 dark:hover:bg-white/5">
              <ArrowLeft size={16} />
            </button>
            <input
              value={map.title}
              onChange={(e) => updateMap(map.id, { title: e.target.value })}
              className="bg-transparent font-semibold outline-none dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <ColorDots
              colors={MAP_COLORS}
              value={node?.color}
              onChange={(c) => node && patchNode(node.id, { color: c, textColor: undefined })}
            />
            <button className={map.pinned ? "text-brand" : "text-ink-faint hover:text-brand"} onClick={() => updateMap(map.id, { pinned: !map.pinned })}>
              <Pin size={16} />
            </button>
            <button
              className="text-ink-faint hover:text-loss"
              onClick={() => {
                deleteMap(map.id);
                toast("Mind map deleted");
                navigate("/notebook/maps");
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div
          ref={stage}
          className={`relative min-h-[560px] overflow-hidden ${grid ? "nb-dot-grid" : "bg-slate-50 dark:bg-[#10151c]"}`}
          style={{
            backgroundSize: grid ? `${22 * zoom}px ${22 * zoom}px` : undefined,
            backgroundPosition: grid ? `${pan.x}px ${pan.y}px` : undefined,
          }}
          onWheel={onWheel}
          onMouseMove={onStageMove}
          onMouseUp={onStageUp}
          onMouseLeave={onStageUp}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
              setEditing(null);
              setMenu(null);
              drag.current = { kind: "pan", x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
              moved.current = false;
            }
          }}
        >
          <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-xs shadow-card dark:border-[#243041] dark:bg-[#151a21]">
            <button className="rounded-full px-2 py-1 hover:bg-slate-50 dark:hover:bg-white/10" onClick={() => addChild("topic")}>
              + Topic
            </button>
            <button className="rounded-full px-2 py-1 hover:bg-slate-50 dark:hover:bg-white/10" onClick={() => addChild("note")}>
              Note
            </button>
            <button className="rounded-full px-2 py-1 hover:bg-slate-50 dark:hover:bg-white/10" onClick={() => void addImageNode()}>
              Image
            </button>
            <span className="mx-1 h-4 w-px bg-line dark:bg-[#243041]" />
            <IconBtn onClick={undo} disabled={!history.length}>
              <Undo2 size={14} />
            </IconBtn>
            <IconBtn onClick={redo} disabled={!future.length}>
              <Redo2 size={14} />
            </IconBtn>
            <IconBtn
              onClick={() => {
                const xs = map.nodes.map((n) => n.x);
                const min = Math.min(...xs);
                commit(map.nodes.map((n) => ({ ...n, x: n.parentId ? n.x : min })));
              }}
            >
              <AlignLeft size={14} />
            </IconBtn>
            <IconBtn onClick={() => setGrid((g) => !g)}>
              <Grid3x3 size={14} />
            </IconBtn>
            <IconBtn onClick={centerView}>
              <Focus size={14} />
            </IconBtn>
            <IconBtn onClick={() => updateMap(map.id, { zoom: Math.min(1.8, zoom + 0.1) })}>+</IconBtn>
            <IconBtn onClick={() => updateMap(map.id, { zoom: Math.max(0.45, zoom - 0.1) })}>−</IconBtn>
            <IconBtn onClick={() => setFocusMode((f) => !f)}>
              <Fullscreen size={14} />
            </IconBtn>
            <button className="rounded-full px-2 py-1 hover:bg-slate-50 dark:hover:bg-white/10" onClick={exportPng}>
              <Download size={12} className="mr-1 inline" /> Export
            </button>
          </div>

          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
            <svg className="pointer-events-none absolute inset-0 overflow-visible" width={2400} height={1600}>
              <defs>
                {MAP_COLORS.map((c) => (
                  <marker key={c} id={`arr-${c.slice(1)}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 z" fill={c} />
                  </marker>
                ))}
              </defs>
              {visible
                .filter((n) => n.parentId)
                .map((n) => {
                  const p = map.nodes.find((x) => x.id === n.parentId);
                  if (!p) return null;
                  return (
                    <path
                      key={n.id}
                      d={curvePath(p, n)}
                      fill="none"
                      stroke={p.color}
                      strokeWidth="2.2"
                      markerEnd={`url(#arr-${p.color.slice(1)})`}
                    />
                  );
                })}
            </svg>

            {visible.map((n) => {
              const box = nodeBox(n);
              const isSel = n.id === selected;
              const isHover = n.id === hover;
              const filled = n.type === "topic" && !n.parentId;
              const sticky = n.type === "note";
              return (
                <div
                  key={n.id}
                  className={`nb-node absolute select-none ${sticky ? "nb-sticky rounded-md" : "rounded-2xl"} ${
                    filled ? "font-semibold text-white" : "bg-white dark:bg-[#151a21]"
                  }`}
                  style={{
                    left: n.x,
                    top: n.y,
                    width: box.w,
                    minHeight: box.h,
                    background: sticky ? undefined : filled ? n.color : n.type === "image" ? "#fff" : "#fff",
                    color: n.textColor || (filled ? "#fff" : n.type === "topic" ? n.color : "#1e293b"),
                    borderLeft: !filled && !sticky ? `4px solid ${n.color}` : undefined,
                    borderRight: !filled && !sticky ? `4px solid ${n.color}` : undefined,
                    boxShadow: isSel ? `0 0 0 2px ${n.color}55, 0 12px 28px rgba(15,23,42,0.14)` : "0 8px 20px rgba(15,23,42,0.08)",
                    fontWeight: n.bold ? 700 : 600,
                    fontStyle: n.italic ? "italic" : "normal",
                    textDecoration: n.underline ? "underline" : "none",
                    fontSize: n.fontSize ?? 15,
                    textAlign: n.align ?? "center",
                    cursor: "grab",
                  }}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelected(n.id);
                    setMenu(null);
                    const world = screenToWorld(e.clientX, e.clientY);
                    drag.current = { kind: "node", id: n.id, dx: world.x - n.x, dy: world.y - n.y };
                    moved.current = false;
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSelected(n.id);
                    setEditing(n.id);
                    if (n.type === "image") void pickImageFile().then((url) => url && patchNode(n.id, { imageUrl: url }));
                  }}
                >
                  {n.emoji ? <span className="absolute -top-3 left-2 text-sm">{n.emoji}</span> : null}
                  {n.imageUrl ? <img src={n.imageUrl} alt="" className="mb-1 max-h-24 w-full rounded-lg object-cover" /> : null}
                  {editing === n.id && n.type !== "image" ? (
                    <textarea
                      autoFocus
                      className="h-full min-h-[40px] w-full resize-none bg-transparent px-3 py-2 outline-none"
                      style={{ color: "inherit", textAlign: n.align ?? "center", fontSize: "inherit" }}
                      value={n.text}
                      onChange={(e) => patchNode(n.id, { text: e.target.value }, false)}
                      onBlur={() => setEditing(null)}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="px-4 py-2.5 leading-tight">{n.text || (n.type === "image" ? "" : "Double-click to edit...")}</div>
                  )}
                  {(isSel || isHover) && (
                    <>
                      {(["t", "b", "l"] as const).map((side) => (
                        <span
                          key={side}
                          className="absolute h-2.5 w-2.5 rounded-full bg-white"
                          style={{
                            boxShadow: `0 0 0 2px ${n.color}`,
                            top: side === "t" ? -5 : side === "b" ? "auto" : "50%",
                            bottom: side === "b" ? -5 : "auto",
                            left: side === "l" ? -5 : "50%",
                            right: "auto",
                            transform: side === "l" || side === "t" || side === "b" ? "translate(-50%, -50%)" : undefined,
                            marginTop: side === "l" ? 0 : undefined,
                          }}
                        />
                      ))}
                      <span
                        className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm bg-white"
                        style={{ boxShadow: `0 0 0 2px ${n.color}` }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const world = screenToWorld(e.clientX, e.clientY);
                          drag.current = { kind: "resize", id: n.id, w: box.w, h: box.h, x: n.x, y: n.y };
                          void world;
                          moved.current = false;
                        }}
                      />
                      <button
                        className="absolute -right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white text-sm font-bold shadow"
                        style={{ color: n.color, boxShadow: `0 0 0 2px ${n.color}` }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          addChild("topic", n);
                        }}
                      >
                        +
                      </button>
                      {map.nodes.some((c) => c.parentId === n.id) ? (
                        <button
                          className="absolute -bottom-3 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full bg-white shadow"
                          style={{ color: n.color }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            patchNode(n.id, { collapsed: !n.collapsed });
                          }}
                        >
                          <ChevronDown size={12} className={n.collapsed ? "-rotate-90" : ""} />
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}

            {node && selectedBox && (showEditBar || showSelectBar) ? (
              <div
                className="nb-float-bar absolute z-30 flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-white shadow-modal"
                style={{ left: node.x, top: node.y - 48, minWidth: 220 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {showEditBar ? (
                  <>
                    <Fbtn active={node.bold} onClick={() => patchNode(node.id, { bold: !node.bold })}>
                      <Bold size={13} />
                    </Fbtn>
                    <Fbtn active={node.italic} onClick={() => patchNode(node.id, { italic: !node.italic })}>
                      <Italic size={13} />
                    </Fbtn>
                    <Fbtn active={node.underline} onClick={() => patchNode(node.id, { underline: !node.underline })}>
                      <Underline size={13} />
                    </Fbtn>
                    <Fbtn onClick={() => patchNode(node.id, { fontSize: Math.max(11, (node.fontSize ?? 15) - 1) })}>A-</Fbtn>
                    <Fbtn onClick={() => patchNode(node.id, { fontSize: Math.min(28, (node.fontSize ?? 15) + 1) })}>A+</Fbtn>
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        className="h-4 w-4 rounded-full"
                        style={{ background: c, boxShadow: node.textColor === c ? "0 0 0 2px #fff" : undefined }}
                        onClick={() => patchNode(node.id, { textColor: c })}
                      />
                    ))}
                    <Fbtn
                      onClick={() =>
                        patchNode(node.id, { bold: false, italic: false, underline: false, textColor: undefined, fontSize: 15 })
                      }
                    >
                      <Eraser size={13} />
                    </Fbtn>
                  </>
                ) : (
                  <>
                    <button className="relative grid h-7 w-7 place-items-center rounded-md" onClick={() => setMenu(menu === "color" ? null : "color")}>
                      <span className="h-4 w-4 rounded" style={{ background: node.color }} />
                      {menu === "color" ? (
                        <div className="absolute left-0 top-8 flex gap-1 rounded-xl bg-slate-800 p-2">
                          {MAP_COLORS.map((c) => (
                            <button key={c} className="h-4 w-4 rounded-full" style={{ background: c }} onClick={() => patchNode(node.id, { color: c })} />
                          ))}
                        </div>
                      ) : null}
                    </button>
                    <Fbtn onClick={() => setMenu(menu === "size" ? null : "size")}>M</Fbtn>
                    <Fbtn onClick={() => patchNode(node.id, { w: node.type === "note" ? 176 : 168, h: node.type === "note" ? 168 : 48 })}>
                      <Maximize2 size={13} />
                    </Fbtn>
                    <Fbtn onClick={() => setMenu(menu === "align" ? null : "align")}>
                      <AlignCenter size={13} />
                    </Fbtn>
                    {menu === "align" ? (
                      <div className="flex">
                        {(["left", "center", "right"] as const).map((a) => (
                          <Fbtn key={a} active={node.align === a} onClick={() => patchNode(node.id, { align: a })}>
                            {a === "left" ? <AlignLeft size={13} /> : a === "right" ? <AlignRight size={13} /> : <AlignCenter size={13} />}
                          </Fbtn>
                        ))}
                      </div>
                    ) : null}
                    <Fbtn onClick={() => setMenu(menu === "emoji" ? null : "emoji")}>
                      <Smile size={13} />
                    </Fbtn>
                    {menu === "emoji" ? (
                      <div className="absolute left-8 top-8 grid grid-cols-6 gap-1 rounded-xl bg-slate-800 p-2">
                        {EMOJIS.map((em) => (
                          <button key={em} className="h-7 w-7 rounded hover:bg-white/10" onClick={() => patchNode(node.id, { emoji: em })}>
                            {em}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <Fbtn onClick={() => setEditing(node.id)}>
                      <Type size={13} />
                    </Fbtn>
                    <Fbtn onClick={() => addChild("topic", node)}>
                      <Plus size={13} />
                    </Fbtn>
                    <button
                      className="grid h-7 w-7 place-items-center rounded-md text-rose-300 hover:bg-white/10"
                      onClick={() => node.parentId && removeNode(node.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-4 left-4 z-20 flex flex-col overflow-hidden rounded-xl border border-line bg-white text-sm shadow-card dark:border-[#243041] dark:bg-[#151a21]">
            <button className="px-2.5 py-1 hover:bg-slate-50 dark:hover:bg-white/10" onClick={() => updateMap(map.id, { zoom: Math.min(1.8, zoom + 0.1) })}>
              +
            </button>
            <button className="px-2.5 py-1 hover:bg-slate-50 dark:hover:bg-white/10" onClick={() => updateMap(map.id, { zoom: Math.max(0.45, zoom - 0.1) })}>
              −
            </button>
          </div>
          <Minimap map={map} pan={pan} zoom={zoom} stage={stage} onJump={(next) => setPan(next)} />
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded-lg p-1 hover:bg-slate-50 disabled:opacity-30 dark:hover:bg-white/10"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Fbtn({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      className={`grid h-7 min-w-7 place-items-center rounded-md px-1 text-[11px] hover:bg-white/10 ${active ? "bg-white/15" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MapCard({
  m,
  menuId,
  setMenuId,
}: {
  m: MindMap;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addMap, deleteMap, updateMap } = useStore();
  return (
    <button
      onClick={() => navigate(`/notebook/maps/${m.id}`)}
      className="card nb-map-card card-static w-full p-4 text-left"
    >
      <div className="flex items-start justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: `${m.color}22` }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
        </span>
        <div className="relative flex gap-2 text-ink-faint">
          <span
            className={m.pinned ? "text-brand" : "hover:text-brand"}
            onClick={(e) => {
              e.stopPropagation();
              updateMap(m.id, { pinned: !m.pinned });
            }}
          >
            <Pin size={14} />
          </span>
          <span
            className="hover:text-loss"
            onClick={(e) => {
              e.stopPropagation();
              deleteMap(m.id);
              toast("Mind map deleted");
            }}
          >
            <Trash2 size={14} />
          </span>
          <span
            className="hover:text-ink"
            onClick={(e) => {
              e.stopPropagation();
              setMenuId(menuId === m.id ? null : m.id);
            }}
          >
            <MoreVertical size={14} />
          </span>
          {menuId === m.id ? (
            <div
              className="absolute right-0 top-6 z-10 w-36 rounded-xl border border-line bg-white p-1 text-xs shadow-card dark:border-[#243041] dark:bg-[#151a21]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5"
                onClick={() => {
                  const copy = addMap();
                  const idMap: Record<string, string> = {};
                  const nodes = m.nodes.map((n) => {
                    const nid = uid();
                    idMap[n.id] = nid;
                    return { ...n, id: nid };
                  });
                  updateMap(copy.id, {
                    title: `${m.title} copy`,
                    color: m.color,
                    nodes: nodes.map((n) => ({ ...n, parentId: n.parentId ? idMap[n.parentId] ?? null : null })),
                  });
                  setMenuId(null);
                  toast("Mind map duplicated");
                }}
              >
                Duplicate
              </button>
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-loss hover:bg-loss-soft"
                onClick={() => {
                  deleteMap(m.id);
                  setMenuId(null);
                  toast("Mind map deleted");
                }}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="relative mt-4 h-14 overflow-hidden rounded-xl bg-slate-50 dark:bg-white/5">
        {m.nodes.slice(0, 8).map((n) => {
          const box = nodeBox(n);
          return (
            <span
              key={n.id}
              className="absolute rounded-sm"
              style={{
                left: Math.max(6, n.x / 14),
                top: Math.max(6, n.y / 16),
                width: Math.max(12, box.w / 14),
                height: Math.max(6, box.h / 16),
                background: n.color,
                opacity: n.parentId ? 0.7 : 1,
              }}
            />
          );
        })}
      </div>
      <p className="mt-4 font-semibold dark:text-white">{m.title}</p>
      <p className="text-sm text-ink-muted">{m.nodes[0]?.text || m.title}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
        <span>{ago(m.updatedAt)}</span>
        <span>{m.nodes.length} nodes</span>
      </div>
    </button>
  );
}

function NoteMinimap({ html, scroller }: { html: string; scroller: RefObject<HTMLDivElement> }) {
  const [ratio, setRatio] = useState({ top: 0, h: 1 });
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const sync = () => {
      setRatio({
        top: el.scrollTop / Math.max(1, el.scrollHeight),
        h: el.clientHeight / Math.max(1, el.scrollHeight),
      });
    };
    sync();
    el.addEventListener("scroll", sync);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [html, scroller]);

  return (
    <button
      type="button"
      aria-label="Document minimap"
      className="nb-doc-minimap"
      onClick={(e) => {
        const el = scroller.current;
        if (!el) return;
        const r = e.currentTarget.getBoundingClientRect();
        const y = (e.clientY - r.top) / r.height;
        el.scrollTo({ top: y * el.scrollHeight - el.clientHeight / 2, behavior: "smooth" });
      }}
    >
      <div className="nb-doc-minimap-preview" dangerouslySetInnerHTML={{ __html: html || "<p></p>" }} />
      <span
        className="nb-doc-minimap-view"
        style={{ top: `${ratio.top * 100}%`, height: `${Math.max(14, ratio.h * 100)}%` }}
      />
    </button>
  );
}

function Minimap({
  map,
  pan,
  zoom,
  stage,
  onJump,
}: {
  map: MindMap;
  pan: { x: number; y: number };
  zoom: number;
  stage: RefObject<HTMLDivElement>;
  onJump: (next: { x: number; y: number }) => void;
}) {
  const W = 144;
  const H = 96;
  const boxes = map.nodes.map((n) => ({ n, ...nodeBox(n) }));
  const pad = 48;
  const minX = boxes.length ? Math.min(...boxes.map((b) => b.n.x)) - pad : 0;
  const minY = boxes.length ? Math.min(...boxes.map((b) => b.n.y)) - pad : 0;
  const maxX = boxes.length ? Math.max(...boxes.map((b) => b.n.x + b.w)) + pad : 800;
  const maxY = boxes.length ? Math.max(...boxes.map((b) => b.n.y + b.h)) + pad : 500;
  const worldW = Math.max(1, maxX - minX);
  const worldH = Math.max(1, maxY - minY);
  const scale = Math.min(W / worldW, H / worldH);
  const rect = stage.current?.getBoundingClientRect();
  const viewW = (rect?.width ?? 800) / zoom;
  const viewH = (rect?.height ?? 500) / zoom;
  const viewX = -pan.x / zoom;
  const viewY = -pan.y / zoom;

  return (
    <button
      type="button"
      aria-label="Canvas minimap"
      className="nb-canvas-minimap absolute bottom-4 right-4 z-20 h-24 w-36 overflow-hidden rounded-xl border border-white/80 bg-white/80 dark:border-[#243041] dark:bg-[#151a21]/85"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width;
        const my = (e.clientY - r.top) / r.height;
        const wx = minX + mx * worldW;
        const wy = minY + my * worldH;
        onJump({
          x: (rect?.width ?? 800) / 2 - wx * zoom,
          y: (rect?.height ?? 500) / 2 - wy * zoom,
        });
      }}
    >
      {boxes.map((b) => (
        <span
          key={b.n.id}
          className="absolute rounded-[2px]"
          style={{
            left: (b.n.x - minX) * scale,
            top: (b.n.y - minY) * scale,
            width: Math.max(8, b.w * scale),
            height: Math.max(5, b.h * scale),
            background: b.n.color,
            opacity: b.n.parentId ? 0.75 : 1,
          }}
        />
      ))}
      <span
        className="pointer-events-none absolute rounded border border-brand/80 bg-brand/10"
        style={{
          left: (viewX - minX) * scale,
          top: (viewY - minY) * scale,
          width: Math.max(16, viewW * scale),
          height: Math.max(12, viewH * scale),
        }}
      />
    </button>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
