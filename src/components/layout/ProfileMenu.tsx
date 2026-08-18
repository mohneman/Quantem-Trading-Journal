import { useEffect, useRef, useState } from "react";
import {
  Bolt,
  CheckSquare,
  HelpCircle,
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
  const { data, logout } = useStore();
  const nav = useNavigate();
  const user = data.profile;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative border-t border-line px-3 py-3 dark:border-[#243041]">
      {open ? (
        <div className="absolute bottom-[72px] left-3 right-3 z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-modal dark:border-[#243041] dark:bg-[#151a21]">
          <button className="flex w-full items-center gap-2.5 bg-brand/10 px-3 py-2.5 text-left text-sm font-semibold text-brand"
            onClick={() => {
              setModal("upgrade");
              setOpen(false);
            }}
          >
            <Bolt size={16} /> Upgrade Plan
          </button>
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink dark:text-slate-100"
            onClick={() => {
              setModal("profile");
              setOpen(false);
            }}
          >
            <UserRound size={16} className="text-brand" /> Profile Settings
          </button>
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink dark:text-slate-100"
            onClick={() => {
              setModal("checklist");
              setOpen(false);
            }}
          >
            <CheckSquare size={16} className="text-brand" /> Checklist Settings
          </button>
          <div className="h-px bg-line dark:bg-[#243041]" />
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink dark:text-slate-100"
            onClick={() => {
              setModal("help");
              setOpen(false);
            }}
          >
            <HelpCircle size={16} className="text-purple-brand" /> Help & Support
          </button>
          <div className="h-px bg-line dark:bg-[#243041]" />
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink dark:text-slate-100"
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
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-loss"
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
        </div>
        <button
          aria-label="Profile menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-1 text-ink-faint hover:bg-slate-50 hover:text-ink dark:hover:bg-white/10"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
