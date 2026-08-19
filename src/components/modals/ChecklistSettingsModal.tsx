import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Field, Input } from "../ui/Field";
import { Button } from "../ui/Button";
import { defaultChecklist } from "../../data";
import { useStore } from "../../store";
import { useToast } from "../../context/ToastContext";

export function ChecklistSettingsModal({
  onClose,
  stacked,
  onCreated,
}: {
  onClose: () => void;
  stacked?: boolean;
  onCreated?: (id: string) => void;
}) {
  const { data, addChecklist, updateChecklist, deleteChecklist } = useStore();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [items, setItems] = useState([...defaultChecklist]);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Modal title="Custom Checklist Settings" onClose={onClose} wide stacked={stacked} glow>
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {editingId ? "Edit Checklist" : "Create New Checklist"}
          </p>
          <Field label="Checklist Name">
            <Input
              className="bg-slate-50 dark:bg-white/5"
              placeholder="e.g., My Trading Checklist"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <p className="label mt-4">Checklist Items (5 items)</p>
          <p className="mb-2 text-xs text-ink-faint">
            Write each rule the same way you want it to appear inside the trade checklist.
          </p>
          <div className="space-y-2">
            {items.map((item, i) => (
              <Input
                key={i}
                className="bg-slate-50 dark:bg-white/5"
                value={item}
                placeholder={`Rule ${i + 1}`}
                onChange={(e) =>
                  setItems((p) => p.map((v, idx) => (idx === i ? e.target.value : v)))
                }
              />
            ))}
          </div>
          <Button
            variant="gradient"
            className="mt-4 w-full"
            onClick={() => {
              const clean = items.map((x) => x.trim()).filter(Boolean);
              if (!name.trim() || clean.length < 1) return;
              const next = clean.length >= 5 ? clean.slice(0, 5) : [...clean, ...Array(5 - clean.length).fill("Rule")];
              if (editingId) {
                updateChecklist(editingId, { name: name.trim(), items: next });
                setEditingId(null);
                toast("Checklist updated");
              } else {
                const created = addChecklist({ name: name.trim(), items: next });
                toast("Checklist saved");
                onCreated?.(created.id);
              }
              setName("");
              setItems([...defaultChecklist]);
            }}
          >
            {editingId ? "Update Checklist" : "Save Checklist"}
          </Button>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold dark:text-white">Your Custom Checklists</p>
          {data.checklists.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-ink-faint dark:bg-white/5">
              No custom checklists created yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.checklists.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-white/5">
                  <div>
                    <p className="text-sm font-medium dark:text-white">{c.name}</p>
                    <p className="text-xs text-ink-faint">{c.items.length} rules</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="text-xs font-semibold text-brand"
                      onClick={() => {
                        setEditingId(c.id);
                        setName(c.name);
                        setItems(
                          c.items.length >= 5
                            ? c.items.slice(0, 5)
                            : [...c.items, ...Array(5 - c.items.length).fill("")]
                        );
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs font-semibold text-loss"
                      onClick={() => {
                        deleteChecklist(c.id);
                        if (editingId === c.id) {
                          setEditingId(null);
                          setName("");
                          setItems([...defaultChecklist]);
                        }
                        toast("Checklist deleted");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
