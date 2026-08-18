import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Download,
  Focus,
  Fullscreen,
  Grid3x3,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Network,
  Pin,
  Plus,
  Quote,
  Redo2,
  StickyNote,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { useMenu } from "../hooks";
import { useStore, type MindNode } from "../store";
import { uid } from "../lib";

const NOTE_COLORS = ["#00D1C1", "#22C55E", "#3B82F6", "#8B5CF6", "#F97316", "#EAB308"];
const MAP_COLORS = ["#00D1C1", "#38BDF8", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316"];

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86400_000) return `${Math.floor(ms / 3600_000)}h`;
  return `${Math.floor(ms / 86400_000)}d`;
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
      <div className="page-shell p-8 sm:p-12">
        <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
          TRADING NOTEBOOK
        </span>
        <h2 className="mt-3 text-3xl font-semibold dark:text-white">Choose your workspace</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Write quick trading notes, or map out your ideas visually. Pick how you want to work — you can switch any time.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Link to="/notebook/notes" className="card p-6 transition hover:border-brand/30 hover:shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white">
              <StickyNote size={22} />
            </div>
            <h3 className="mt-4 text-lg font-semibold dark:text-white">Notebook</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Classic notes for journaling trades, plans and reflections — fast, simple, distraction-free writing.
            </p>
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-ink-faint">{data.notes.length} notes</span>
              <span className="font-medium text-brand">Open Notebook →</span>
            </div>
          </Link>
          <Link to="/notebook/maps" className="card p-6 transition hover:border-purple-brand/30 hover:shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-brand text-white">
              <Network size={22} />
            </div>
            <h3 className="mt-4 text-lg font-semibold dark:text-white">Mind Maps</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Visual canvas to connect ideas, build setups and strategy trees with shapes, colors and sticky notes.
            </p>
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-ink-faint">{data.maps.length} maps</span>
              <span className="font-medium text-purple-brand">Open Mind Maps →</span>
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
  const { data, addNote, updateNote, deleteNote } = useStore();
  const notes = [...data.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  const [activeId, setActiveId] = useState(notes[0]?.id ?? "");
  const active = notes.find((n) => n.id === activeId) ?? notes[0];
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && editor.current && editor.current.innerHTML !== active.html) {
      editor.current.innerHTML = active.html || "";
    }
  }, [active?.id]);

  return (
    <div>
      <PageHeader
        title="Trader Notebook"
        subtitle={`${data.notes.length} notes - ${data.notes.filter((n) => n.pinned).length} pinned.`}
        onMenu={onMenu}
      />
      <div className="page-shell p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-line p-2 dark:border-[#243041]" onClick={() => navigate("/notebook")}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                TRADING NOTEBOOK
              </span>
              <h2 className="mt-1 text-2xl font-semibold dark:text-white">Notebook</h2>
            </div>
          </div>
          <button
            className="btn-gradient"
            onClick={() => {
              const n = addNote();
              setActiveId(n.id);
            }}
          >
            <Plus size={16} /> New Note
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="card p-3">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">NOTES</p>
            <div className="space-y-1">
              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActiveId(n.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left ${n.id === active?.id ? "bg-brand/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  <p className="flex items-center gap-2 text-sm font-medium dark:text-white">
                    <span className="h-2 w-2 rounded-full" style={{ background: n.color }} />
                    {n.pinned ? <Pin size={12} className="text-brand" /> : null}
                    {n.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">{ago(n.updatedAt)}</p>
                </button>
              ))}
            </div>
          </div>
          {active ? (
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <input
                  className="flex-1 bg-transparent text-lg font-semibold outline-none dark:text-white"
                  value={active.title}
                  onChange={(e) => updateNote(active.id, { title: e.target.value })}
                />
                <button
                  className={active.pinned ? "text-brand" : "text-ink-faint hover:text-brand"}
                  onClick={() => updateNote(active.id, { pinned: !active.pinned })}
                >
                  <Pin size={16} />
                </button>
                <button
                  className="text-ink-faint hover:text-loss"
                  onClick={() => {
                    deleteNote(active.id);
                    setActiveId(notes.find((n) => n.id !== active.id)?.id ?? "");
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateNote(active.id, { color: c })}
                    className="h-5 w-5 rounded-full"
                    style={{
                      background: c,
                      boxShadow: active.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-slate-50 px-2 py-2 text-ink-muted dark:bg-white/5">
                <Tbtn onClick={() => document.execCommand("formatBlock", false, "h1")}><Heading1 size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("formatBlock", false, "h2")}><Heading2 size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("formatBlock", false, "p")}><Type size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("bold")}><Bold size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("italic")}><Italic size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("underline")}><Underline size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("strikeThrough")}><Strikethrough size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("insertUnorderedList")}><List size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("insertOrderedList")}><ListOrdered size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("formatBlock", false, "blockquote")}><Quote size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("justifyLeft")}><AlignLeft size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("justifyCenter")}><AlignCenter size={14} /></Tbtn>
                <Tbtn onClick={() => document.execCommand("justifyRight")}><AlignRight size={14} /></Tbtn>
                <button
                  className="grid h-7 w-7 place-items-center rounded-full bg-red-500 text-[10px] text-white"
                  onClick={() => document.execCommand("hiliteColor", false, "#fecaca")}
                />
                <button
                  className="h-7 w-7 rounded bg-yellow-300"
                  onClick={() => document.execCommand("hiliteColor", false, "#fde047")}
                />
                <Tbtn
                  onClick={() => {
                    const url = prompt("Image URL");
                    if (url) document.execCommand("insertImage", false, url);
                  }}
                >
                  <ImageIcon size={14} />
                </Tbtn>
              </div>
              <div
                ref={editor}
                contentEditable
                className="min-h-[280px] w-full text-sm outline-none dark:text-slate-100"
                data-placeholder="Start writing your note..."
                onInput={(e) => updateNote(active.id, { html: (e.target as HTMLDivElement).innerHTML })}
              />
            </div>
          ) : (
            <div className="card grid place-items-center p-10 text-sm text-ink-faint">Create a note to start writing.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tbtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white dark:hover:bg-white/10" onClick={onClick}>
      {children}
    </button>
  );
}

export function MindMapsPage() {
  const onMenu = useMenu();
  const navigate = useNavigate();
  const { data, addMap, deleteMap } = useStore();
  const maps = [...data.maps].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div>
      <PageHeader
        title="Trader Notebook"
        subtitle="Keep market notes, mind maps, and setup snapshots organized."
        onMenu={onMenu}
      />
      <div className="page-shell p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-line p-2 dark:border-[#243041]" onClick={() => navigate("/notebook")}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                TRADING NOTEBOOK
              </span>
              <h2 className="mt-1 text-2xl font-semibold dark:text-white">Mind Maps</h2>
              <p className="text-xs text-ink-muted">{maps.length} maps - {maps.filter((m) => m.pinned).length} pinned</p>
            </div>
          </div>
          <button
            className="btn-gradient"
            onClick={() => {
              const m = addMap();
              navigate(`/notebook/maps/${m.id}`);
            }}
          >
            <Plus size={16} /> New Map
          </button>
        </div>
        {maps.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <p className="text-sm text-ink-muted">No mind maps yet — create your first one</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {maps.map((m) => (
              <button key={m.id} onClick={() => navigate(`/notebook/maps/${m.id}`)} className="card w-full p-4 text-left">
                <div className="flex items-start justify-between">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  <span
                    className="text-ink-faint hover:text-loss"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMap(m.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </span>
                </div>
                <p className="mt-6 font-semibold dark:text-white">{m.title}</p>
                <p className="text-sm text-ink-muted">{m.nodes.length} nodes</p>
                <p className="mt-6 text-xs text-ink-faint">{ago(m.updatedAt)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MindMapCanvasPage() {
  const onMenu = useMenu();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, updateMap, deleteMap, addMap } = useStore();
  const map = data.maps.find((m) => m.id === id) ?? data.maps[0];
  const [selected, setSelected] = useState<string | null>(map?.nodes[0]?.id ?? null);
  const [history, setHistory] = useState<MindNode[][]>([]);
  const [future, setFuture] = useState<MindNode[][]>([]);
  const [grid, setGrid] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (!id && map) navigate(`/notebook/maps/${map.id}`, { replace: true });
  }, [id, map, navigate]);

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

  const node = map.nodes.find((n) => n.id === selected) ?? map.nodes[0];

  function commit(nodes: MindNode[]) {
    setHistory((h) => [...h.slice(-30), map.nodes]);
    setFuture([]);
    updateMap(map.id, { nodes });
  }

  function addChild(type: MindNode["type"], parent?: MindNode) {
    const p = parent ?? node;
    if (!p) return;
    const n: MindNode = {
      id: uid(),
      x: p.x + 220,
      y: p.y + map.nodes.filter((x) => x.parentId === p.id).length * 70,
      text: type === "topic" ? "New topic" : type === "image" ? "Image" : "Double-click to edit...",
      color: p.color,
      type,
      parentId: p.id,
    };
    commit([...map.nodes, n]);
    setSelected(n.id);
  }

  function exportMap() {
    const blob = JSON.stringify(map, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([blob], { type: "application/json" }));
    a.download = `${map.title.replace(/\s+/g, "-")}.json`;
    a.click();
  }

  return (
    <div>
      <PageHeader title="Trader Notebook" subtitle="Keep market notes, mind maps, and setup snapshots organized." onMenu={onMenu} />
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
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-xs dark:border-[#243041] dark:bg-[#151a21]">
            <button className="rounded-full px-2 py-1 hover:bg-slate-50" onClick={() => addChild("topic")}>+ Topic</button>
            <button className="rounded-full px-2 py-1 hover:bg-slate-50" onClick={() => addChild("note")}>Note</button>
            <button className="rounded-full px-2 py-1 hover:bg-slate-50" onClick={() => addChild("image")}>Image</button>
            <button className="rounded-lg p-1" onClick={() => { const prev = history.at(-1); if (!prev) return; setFuture((f) => [map.nodes, ...f]); setHistory((h) => h.slice(0, -1)); updateMap(map.id, { nodes: prev }); }}><Undo2 size={14} /></button>
            <button className="rounded-lg p-1" onClick={() => { const next = future[0]; if (!next) return; setHistory((h) => [...h, map.nodes]); setFuture((f) => f.slice(1)); updateMap(map.id, { nodes: next }); }}><Redo2 size={14} /></button>
            <button className="rounded-lg p-1" onClick={() => {
              const xs = map.nodes.map((n) => n.x);
              const min = Math.min(...xs);
              commit(map.nodes.map((n) => ({ ...n, x: n.parentId ? n.x : min })));
            }}><AlignLeft size={14} /></button>
            <button className="rounded-lg p-1" onClick={() => setGrid((g) => !g)}><Grid3x3 size={14} /></button>
            <button className="rounded-lg p-1" onClick={() => setFocusMode((f) => !f)}><Focus size={14} /></button>
            <button className="rounded-lg p-1" onClick={() => void document.documentElement.requestFullscreen?.()}><Fullscreen size={14} /></button>
            <button className="rounded-full px-2 py-1 hover:bg-slate-50" onClick={exportMap}><Download size={12} className="inline" /> Export</button>
          </div>
          <div className="flex items-center gap-2">
            {MAP_COLORS.map((c) => (
              <button
                key={c}
                className="h-5 w-5 rounded-full"
                style={{ background: c, boxShadow: node?.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
                onClick={() => node && commit(map.nodes.map((n) => (n.id === node.id ? { ...n, color: c } : n)))}
              />
            ))}
            <button className={map.pinned ? "text-brand" : "text-ink-faint"} onClick={() => updateMap(map.id, { pinned: !map.pinned })}>
              <Pin size={16} />
            </button>
            <button
              className="text-ink-faint hover:text-loss"
              onClick={() => {
                deleteMap(map.id);
                navigate("/notebook/maps");
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div
          className="relative min-h-[520px] overflow-hidden"
          style={{
            backgroundImage: grid ? "radial-gradient(circle, #cbd5e1 1px, transparent 1px)" : undefined,
            backgroundSize: "22px 22px",
            transform: `scale(${map.zoom})`,
            transformOrigin: "top left",
          }}
          onMouseMove={(e) => {
            if (!drag.current) return;
            const { id: nid, dx, dy } = drag.current;
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const x = (e.clientX - rect.left) / map.zoom - dx;
            const y = (e.clientY - rect.top) / map.zoom - dy;
            updateMap(map.id, { nodes: map.nodes.map((n) => (n.id === nid ? { ...n, x, y } : n)) });
          }}
          onMouseUp={() => (drag.current = null)}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {map.nodes.filter((n) => n.parentId).map((n) => {
              const p = map.nodes.find((x) => x.id === n.parentId);
              if (!p) return null;
              return (
                <path
                  key={n.id}
                  d={`M ${p.x + 90} ${p.y + 22} C ${p.x + 160} ${p.y + 22}, ${n.x - 40} ${n.y + 22}, ${n.x} ${n.y + 22}`}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="2"
                  markerEnd="url(#arr)"
                />
              );
            })}
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="#00D1C1" />
              </marker>
            </defs>
          </svg>
          {map.nodes.map((n) => (
            <div
              key={n.id}
              className={`absolute cursor-grab rounded-2xl px-5 py-3 text-sm shadow-card ${n.parentId ? "border-l-4 bg-white dark:bg-[#151a21]" : "font-semibold text-white"}`}
              style={{
                left: n.x,
                top: n.y,
                background: n.parentId ? undefined : n.color,
                borderLeftColor: n.parentId ? n.color : undefined,
                minWidth: 160,
              }}
              onMouseDown={(e) => {
                setSelected(n.id);
                drag.current = { id: n.id, dx: e.nativeEvent.offsetX, dy: e.nativeEvent.offsetY };
              }}
              onDoubleClick={() => {
                const text = prompt("Edit node", n.text);
                if (text != null) commit(map.nodes.map((x) => (x.id === n.id ? { ...x, text } : x)));
                if (n.type === "image") {
                  const url = prompt("Image URL", n.imageUrl ?? "");
                  if (url != null) commit(map.nodes.map((x) => (x.id === n.id ? { ...x, imageUrl: url } : x)));
                }
              }}
            >
              {n.imageUrl ? <img src={n.imageUrl} alt="" className="mb-2 max-h-20 rounded" /> : null}
              {n.text}
              <button
                className="absolute -right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white text-brand shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  addChild("note", n);
                }}
              >
                +
              </button>
            </div>
          ))}
          <div className="absolute bottom-4 left-4 flex gap-1" style={{ transform: `scale(${1 / map.zoom})` }}>
            <button className="rounded-lg border border-line bg-white px-2 py-1 text-sm dark:border-[#243041] dark:bg-[#151a21]" onClick={() => updateMap(map.id, { zoom: Math.min(1.6, map.zoom + 0.1) })}>+</button>
            <button className="rounded-lg border border-line bg-white px-2 py-1 text-sm dark:border-[#243041] dark:bg-[#151a21]" onClick={() => updateMap(map.id, { zoom: Math.max(0.6, map.zoom - 0.1) })}>−</button>
          </div>
        </div>
      </div>
    </div>
  );
}
