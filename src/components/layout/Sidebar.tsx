import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  NotebookPen,
  Wallet,
  StickyNote,
  BarChart3,
  CalendarDays,
  Calculator,
  Ticket,
  FlaskConical,
  LineChart,
  Banknote,
  ScrollText,
  Handshake,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";

const groups = [
  {
    label: "",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/journals", label: "Daily Journal", icon: BookOpen },
      { to: "/trades", label: "Trading Journal", icon: NotebookPen },
      { to: "/portfolio", label: "My Portfolio", icon: Wallet },
      { to: "/notebook", label: "Notebook", icon: StickyNote },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { to: "/calendar", label: "Economic Calendar", icon: CalendarDays },
      { to: "/calculator", label: "Position Calculator", icon: Calculator },
      { to: "/coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    label: "BACKTESTING AREA",
    items: [
      { to: "/backtests", label: "Backtested Trades", icon: FlaskConical },
      { to: "/stats", label: "Statistics Center", icon: LineChart },
    ],
  },
  {
    label: "PAYOUTS",
    items: [
      { to: "/payouts", label: "Dashboard", icon: Banknote },
      { to: "/payout-journal", label: "Payout Journal", icon: ScrollText },
    ],
  },
  {
    label: "PARTNERS",
    items: [{ to: "/affiliate", label: "Affiliate Program", icon: Handshake }],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const { pathname } = useLocation();

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
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8">
              <span className="absolute left-0 top-1 h-5 w-5 rounded-full bg-brand/90" />
              <span className="absolute right-0 top-2 h-5 w-5 rounded-full bg-purple-brand/90" />
            </div>
            <p className="text-[17px] font-semibold tracking-tight text-ink dark:text-white">
              RyzeLog
            </p>
          </div>
          <button className="rounded-lg p-1 text-ink-muted lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
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
                        className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition ${
                          active
                            ? "bg-brand/10 text-ink dark:bg-brand/15 dark:text-white"
                            : "text-ink-muted hover:bg-slate-50 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
                        }`}
                      >
                        {active ? (
                          <span className="absolute left-0 top-1.5 h-[70%] w-[3px] rounded-r-full bg-brand" />
                        ) : null}
                        <Icon
                          size={16}
                          className={active ? "text-brand" : "text-slate-400"}
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
