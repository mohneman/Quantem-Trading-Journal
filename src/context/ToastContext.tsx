import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

type Kind = "success" | "info" | "error";
type Toast = { id: number; message: string; kind: Kind };

const ToastContext = createContext<{ toast: (message: string, kind?: Kind) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const toast = useCallback((message: string, kind: Kind = "success") => {
    const id = Date.now() + Math.random();
    setItems((rows) => [...rows, { id, message, kind }]);
    window.setTimeout(() => setItems((rows) => rows.filter((t) => t.id !== id)), 2800);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[90] space-y-2">
        {items.map((item) =>
          item.kind === "success" ? (
            <div
              key={item.id}
              className="animate-toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-modal dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <Check size={12} strokeWidth={3} />
              </span>
              {item.message}
            </div>
          ) : item.kind === "error" ? (
            <div
              key={item.id}
              className="animate-toast-in pointer-events-auto rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-modal"
            >
              {item.message}
            </div>
          ) : (
            <div key={item.id} className="animate-toast-in pointer-events-auto rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-modal">
              {item.message}
            </div>
          )
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
