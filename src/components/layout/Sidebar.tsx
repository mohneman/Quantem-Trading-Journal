import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  BookOpen,
  BookMarked,
  Briefcase,
  SquarePen,
  BarChart3,
  Globe,
  Calculator,
  Tag,
  TrendingUp,
  ChartColumn,
  FileChartColumn,
  Users,
  Menu,
  X,
  ChevronRight,
  Settings,
} from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";
import { LogoLockup } from "../ui/Logo";
import { useStore } from "../../store";

const groups = [
  {
    label: "",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
      { to: "/journals", label: "Daily Journal", icon: BookOpen },
      { to: "/trades", label: "Trading Journal", icon: BookMarked },
      { to: "/portfolio", label: "My Portfolio", icon: Briefcase },
      { to: "/notebook", label: "Notebook", icon: SquarePen },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { to: "/calendar", label: "Economic Calendar", icon: Globe },
      { to: "/calculator", label: "Position Calculator", icon: Calculator },
      { to: "/coupons", label: "Coupons", icon: Tag },
    ],
  },
  {
    label: "BACKTESTING AREA",
    items: [
      { to: "/backtests", label: "Backtested Trades", icon: TrendingUp },
      { to: "/stats", label: "Statistics Center", icon: ChartColumn },
    ],
  },
  {
    label: "PAYOUTS",
    items: [
      { to: "/payouts", label: "Dashboard", icon: LayoutGrid },
      { to: "/payout-journal", label: "Payout Journal", icon: FileChartColumn },
    ],
  },
  {
    label: "PARTNERS",
    items: [{ to: "/affiliate", label: "Affiliate Program", icon: Users }],
  },
];

const adminGroup = {
  label: "ADMIN",
  items: [{ to: "/settings", label: "Settings", icon: Settings, end: false as const }],
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const { pathname } = useLocation();
  const { isSuperAdmin } = useStore();
  const navGroups = isSuperAdmin ? [...groups, adminGroup] : groups;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-line bg-white transition-transform dark:border-[#243041] dark:bg-[#10151c] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <LogoLockup size={34} />
          <button className="rounded-lg p-1 text-ink-muted lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {navGroups.map((group) => (
            <div key={group.label || "main"} className="mb-3">
              {group.label ? (
                <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.end
                    ? pathname === item.to
                    : pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-all duration-200 ${
                          active
                            ? "bg-white text-ink shadow-soft dark:bg-white/10 dark:text-white"
                            : "text-ink-muted hover:translate-x-0.5 hover:bg-slate-50 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
                        }`}
                      >
                        {active ? (
                          <span className="absolute left-0 top-1.5 h-[70%] w-[3px] rounded-r-full bg-brand-gradient" />
                        ) : null}
                        <Icon
                          size={16}
                          strokeWidth={1.75}
                          className={active ? "text-ink dark:text-white" : "text-slate-500"}
                        />
                        {item.label}
                        {active ? (
                          <ChevronRight size={14} className="ml-auto text-brand" />
                        ) : null}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <ProfileMenu />
      </aside>
    </>
  );
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="rounded-xl border border-line bg-white p-2 text-ink-muted shadow-soft lg:hidden dark:border-[#243041] dark:bg-[#151a21]"
      onClick={onClick}
      aria-label="Open navigation"
    >
      <Menu size={18} />
    </button>
  );
}
