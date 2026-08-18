import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Field, Input } from "../ui/Field";
import { Button } from "../ui/Button";
import { defaultChecklist } from "../../data";
import { useStore } from "../../store";

export function ChecklistSettingsModal({
  onClose,
  stacked,
}: {
  onClose: () => void;
  stacked?: boolean;
}) {
  const { data, addChecklist, updateChecklist, deleteChecklist } = useStore();
  const [name, setName] = useState("");
  const [items, setItems] = useState([...defaultChecklist]);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Modal title="Custom Checklist Settings" onClose={onClose} wide dark stacked={stacked}>
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-semibold text-white">
            {editingId ? "Edit Checklist" : "Create New Checklist"}
          </p>
          <Field label="Checklist Name">
            <Input
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              placeholder="e.g., My Trading Checklist"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <p className="label mt-4">Checklist Items (5 items)</p>
          <p className="mb-2 text-xs text-slate-400">
            Write each rule the same way you want it to appear inside the trade checklist.
          </p>
          <div className="space-y-2">
            {items.map((item, i) => (
              <Input
                key={i}
                className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
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
              } else {
                addChecklist({ name: name.trim(), items: next });
              }
              setName("");
              setItems([...defaultChecklist]);
            }}
          >
            {editingId ? "Update Checklist" : "Save Checklist"}
          </Button>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Your Custom Checklists</p>
          {data.checklists.length === 0 ? (
            <p className="rounded-xl bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
              No custom checklists created yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.checklists.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.items.length} rules</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="text-xs text-brand"
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
                    <button className="text-xs text-red-300" onClick={() => deleteChecklist(c.id)}>
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
