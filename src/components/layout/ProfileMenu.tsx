import { useEffect, useRef, useState } from "react";
import {
  Bolt,
  CheckSquare,
  LifeBuoy,
  LogOut,
  Moon,
  MoreHorizontal,
  Sun,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext";
import { useTheme } from "../../theme";
import { useStore } from "../../store";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { setOpen: setModal } = useModal();
  const { theme, toggle } = useTheme();
  const { data, logout, isSuperAdmin } = useStore();
  const nav = useNavigate();
  const user = data.profile;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const item = "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition";

  return (
    <div ref={ref} className="relative border-t border-line px-3 py-3 dark:border-[#243041]">
      {open ? (
        <div className="animate-details-in absolute bottom-[72px] left-3 right-3 z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-modal dark:border-[#243041] dark:bg-[#151a21]">
          <button
            className={`${item} bg-brand/10 font-semibold text-brand hover:bg-brand/15`}
            onClick={() => {
              setModal("upgrade");
              setOpen(false);
            }}
          >
            <Bolt size={16} /> Upgrade Plan
          </button>
          <button
            className={`${item} text-ink hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-white/5`}
            onClick={() => {
              setModal("profile");
              setOpen(false);
            }}
          >
            <UserRound size={16} className="text-brand" /> Profile Settings
          </button>
          <button
            className={`${item} text-ink hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-white/5`}
            onClick={() => {
              setModal("checklist");
              setOpen(false);
            }}
          >
            <CheckSquare size={16} className="text-brand" /> Checklist Settings
          </button>
          <div className="h-px bg-line dark:bg-[#243041]" />
          <button
            className={`${item} text-ink hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-white/5`}
            onClick={() => {
              setModal("help");
              setOpen(false);
            }}
          >
            <LifeBuoy size={16} className="text-purple-brand" /> Help & Support
          </button>
          <div className="h-px bg-line dark:bg-[#243041]" />
          <button
            className={`${item} text-ink hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-white/5`}
            onClick={() => {
              toggle();
              setOpen(false);
            }}
          >
            {theme === "dark" ? (
              <Sun size={16} className="text-amber-400" />
            ) : (
              <Moon size={16} className="text-purple-brand" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <div className="h-px bg-line dark:bg-[#243041]" />
          <button
            className={`${item} text-loss hover:bg-loss-soft dark:hover:bg-loss/10`}
            onClick={() => {
              logout();
              nav("/login", { replace: true });
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
            {user.initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium capitalize text-ink dark:text-white">
            {user.name}
          </p>
          {isSuperAdmin ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand">Super Admin</p>
          ) : null}
        </div>
        <button
          aria-label="Profile menu"
          onClick={() => setOpen((v) => !v)}
          className={`rounded-lg p-1 text-ink-faint transition hover:bg-slate-50 hover:text-ink dark:hover:bg-white/10 ${open ? "bg-slate-100 text-ink dark:bg-white/10 dark:text-white" : ""}`}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
