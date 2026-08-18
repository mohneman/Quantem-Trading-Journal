import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultChecklist,
  TODAY_ISO,
  user as seedUser,
} from "./data";
import { gradeFromChecked, initialsOf, rrFromPips, uid } from "./lib";

export type AccountType = "Prop" | "Personal" | "Real Account" | "Demo";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  challengeType: string;
  website: string;
  split: string;
  drawdown: string;
  target: string;
  status: string;
  balance: number;
  createdAt: string;
};

export type TradeOutcome = "WIN" | "LOSS" | "BE" | "OPEN";

export type Trade = {
  id: string;
  no: number;
  date: string;
  symbol: string;
  direction: "Buy" | "Sell" | "";
  session: string;
  grade: string;
  rr: string;
  slPips: string;
  tpPips: string;
  risk: string;
  outcome: TradeOutcome;
  pnl: number;
  psychology: string[];
  checklistName: string;
  rules: { text: string; checked: boolean }[];
  notes: string;
  proofUrl: string;
  afterUrl: string;
  accountIds: string[];
};

export type Journal = {
  id: string;
  title: string;
  date: string;
  mood: string;
  tags: string[];
  gratitude: string;
  affirmation: string;
  notes: string;
  tasks: { id: string; text: string; done: boolean }[];
  plans: {
    id: string;
    accountId: string;
    balance: string;
    trades: string;
    pips: string;
    risk: string;
    amount: string;
  }[];
};

export type Note = {
  id: string;
  title: string;
  html: string;
  color: string;
  pinned: boolean;
  updatedAt: string;
};

export type MindNode = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  type: "topic" | "note" | "image";
  parentId: string | null;
  imageUrl?: string;
};

export type MindMap = {
  id: string;
  title: string;
  color: string;
  pinned: boolean;
  updatedAt: string;
  nodes: MindNode[];
  zoom: number;
};

export type Checklist = {
  id: string;
  name: string;
  items: string[];
};

export type Payout = {
  id: string;
  accountId: string;
  firm: string;
  accountName: string;
  size: string;
  amount: number;
  split: string;
  payout: number;
  status: "Pending" | "Completed" | "Rejected";
  method: string;
  requestDate: string;
  payoutDate: string;
  notes: string;
};

export type Backtest = {
  id: string;
  no: number;
  date: string;
  symbol: string;
  direction: string;
  scenario: string;
  slPips: string;
  tpPips: string;
  result: "WIN" | "LOSS";
  notes: string;
  rules: { text: string; checked: boolean }[];
  chart5: string;
  chart15: string;
};

export type Coupon = {
  id: string;
  firm: string;
  code: string;
  discount: string;
  url: string;
  expiry: string;
};

export type FocusTask = { id: string; text: string; done: boolean };

export type Profile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  initials: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  provider: "email" | "google";
  resetToken?: string;
};

export type StoreData = {
  profile: Profile;
  accounts: Account[];
  trades: Trade[];
  journals: Journal[];
  notes: Note[];
  maps: MindMap[];
  checklists: Checklist[];
  payouts: Payout[];
  backtests: Backtest[];
  coupons: Coupon[];
  symbols: string[];
  tasks: FocusTask[];
  affiliateCode: string;
};

type Session = { userId: string; email: string };

const USERS_KEY = "q-users";
const SESSION_KEY = "q-session";
const dataKey = (userId: string) => `q-data-${userId}`;

function seedData(profile: Profile): StoreData {
  const t1: Trade = {
    id: "t1",
    no: 1,
    date: "2026-08-17",
    symbol: "GBPUSD",
    direction: "Buy",
    session: "New York",
    grade: "A+",
    rr: "1:2.33",
    slPips: "15",
    tpPips: "35",
    risk: "1.00%",
    outcome: "LOSS",
    pnl: 0,
    psychology: ["Calm"],
    checklistName: "Default Checklist",
    rules: defaultChecklist.map((text) => ({ text, checked: true })),
    notes: "",
    proofUrl: "",
    afterUrl: "",
    accountIds: [],
  };
  const t2: Trade = {
    id: "t2",
    no: 2,
    date: "2026-08-18",
    symbol: "GBPUSD",
    direction: "Buy",
    session: "New York",
    grade: "A+",
    rr: "1:2",
    slPips: "15",
    tpPips: "30",
    risk: "2.00%",
    outcome: "WIN",
    pnl: 0,
    psychology: ["Calm"],
    checklistName: "Default Checklist",
    rules: defaultChecklist.map((text) => ({ text, checked: true })),
    notes: "waan ku dagdag oo kale",
    proofUrl: "",
    afterUrl: "",
    accountIds: [],
  };
  return {
    profile,
    accounts: [],
    trades: [t1, t2],
    journals: [
      {
        id: "j1",
        title: "monday",
        date: "2026-08-16",
        mood: "Excited",
        tags: ["Monday", "Trading", "Personal", "Excited"],
        gratitude: "",
        affirmation: "",
        notes: "Prep for the week: keep risk at 1% and only take A+ setups.",
        tasks: [],
        plans: [],
      },
    ],
    notes: [
      {
        id: "n1",
        title: "New Note",
        html: "",
        color: "#00D1C1",
        pinned: false,
        updatedAt: new Date().toISOString(),
      },
    ],
    maps: [
      {
        id: "m1",
        title: "New Mind Map",
        color: "#00D1C1",
        pinned: false,
        updatedAt: new Date().toISOString(),
        zoom: 1,
        nodes: [
          {
            id: "root",
            x: 380,
            y: 220,
            text: "New Mind Map",
            color: "#00D1C1",
            type: "topic",
            parentId: null,
          },
          {
            id: "child1",
            x: 620,
            y: 220,
            text: "Double-click to edit...",
            color: "#00D1C1",
            type: "note",
            parentId: "root",
          },
        ],
      },
    ],
    checklists: [],
    payouts: [],
    backtests: [],
    coupons: [
      {
        id: "c1",
        firm: "FTMO",
        code: "RYZE10",
        discount: "10% off",
        url: "https://ftmo.com",
        expiry: "2026-12-31",
      },
      {
        id: "c2",
        firm: "FundingPips",
        code: "QUANTEM",
        discount: "20% off",
        url: "https://fundingpips.com",
        expiry: "2026-10-31",
      },
    ],
    symbols: ["GBPUSD", "EURUSD", "USDJPY", "XAUUSD", "EURGBP"],
    tasks: [],
    affiliateCode: `RYZE-${profile.initials || "Q"}`,
  };
}

function demoUser(): AuthUser {
  return {
    id: "u-demo",
    name: seedUser.name,
    email: seedUser.email,
    phone: seedUser.phone,
    password: "quantem",
    provider: "email",
  };
}

function persistDemoData(demo: AuthUser) {
  if (localStorage.getItem(dataKey(demo.id))) return;
  localStorage.setItem(
    dataKey(demo.id),
    JSON.stringify(
      seedData({
        name: demo.name,
        email: demo.email,
        phone: demo.phone,
        avatar: "",
        initials: initialsOf(demo.name),
      })
    )
  );
}

function loadUsers(): AuthUser[] {
  let users: AuthUser[] = [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) users = JSON.parse(raw) as AuthUser[];
  } catch {
    users = [];
  }
  const demo = demoUser();
  if (!users.some((u) => u.email.toLowerCase() === demo.email.toLowerCase())) {
    users = [demo, ...users];
  } else {
    users = users.map((u) =>
      u.email.toLowerCase() === demo.email.toLowerCase() ? { ...u, password: "quantem", provider: "email" } : u
    );
  }
  persistDemoData(users.find((u) => u.email.toLowerCase() === demo.email.toLowerCase()) ?? demo);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function loadData(user: AuthUser | undefined): StoreData {
  if (!user) {
    return seedData({
      name: "",
      email: "",
      phone: "",
      avatar: "",
      initials: "Q",
    });
  }
  try {
    const raw = localStorage.getItem(dataKey(user.id));
    if (raw) return JSON.parse(raw) as StoreData;
  } catch {
    /* ignore */
  }
  return seedData({
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: "",
    initials: initialsOf(user.name),
  });
}

type Ctx = {
  session: Session | null;
  users: AuthUser[];
  data: StoreData;
  firstName: string;
  login: (email: string, password: string) => string | null;
  signup: (input: { name: string; email: string; password: string; phone?: string }) => string | null;
  googleContinue: () => void;
  requestReset: (email: string) => { error: string | null; token?: string };
  resetPassword: (email: string, token: string, password: string) => string | null;
  logout: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addAccount: (a: Omit<Account, "id" | "createdAt">) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addTrade: (input: Omit<Trade, "id" | "no" | "grade" | "rr"> & { rr?: string; grade?: string }) => Trade;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  addJournal: (j: Omit<Journal, "id">) => Journal;
  updateJournal: (id: string, patch: Partial<Journal>) => void;
  deleteJournal: (id: string) => void;
  addNote: () => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addMap: () => MindMap;
  updateMap: (id: string, patch: Partial<MindMap>) => void;
  deleteMap: (id: string) => void;
  addChecklist: (c: Omit<Checklist, "id">) => void;
  updateChecklist: (id: string, patch: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  addPayout: (p: Omit<Payout, "id">) => void;
  updatePayout: (id: string, patch: Partial<Payout>) => void;
  deletePayout: (id: string) => void;
  addBacktest: (b: Omit<Backtest, "id" | "no">) => void;
  updateBacktest: (id: string, patch: Partial<Backtest>) => void;
  deleteBacktest: (id: string) => void;
  addSymbol: (s: string) => void;
  setTasks: (tasks: FocusTask[]) => void;
  copyAffiliate: () => string;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AuthUser[]>(loadUsers);
  const [session, setSession] = useState<Session | null>(loadSession);
  const currentUser = users.find((u) => u.id === session?.userId);
  const [data, setData] = useState<StoreData>(() => loadData(currentUser));

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  useEffect(() => {
    if (session?.userId) localStorage.setItem(dataKey(session.userId), JSON.stringify(data));
  }, [data, session]);

  useEffect(() => {
    const user = users.find((u) => u.id === session?.userId);
    setData(loadData(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId]);

  const patchData = useCallback((fn: (d: StoreData) => StoreData) => {
    setData((d) => fn(d));
  }, []);

  const login = (email: string, password: string) => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return "No account found for that email.";
    if (u.provider === "email" && u.password !== password) return "Incorrect password.";
    setSession({ userId: u.id, email: u.email });
    return null;
  };

  const signup = (input: { name: string; email: string; password: string; phone?: string }) => {
    if (!input.name.trim() || !input.email.trim() || !input.password) return "All fields are required.";
    if (users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
      return "An account with that email already exists.";
    }
    const user: AuthUser = {
      id: uid(),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? "",
      password: input.password,
      provider: "email",
    };
    const profile: Profile = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: "",
      initials: initialsOf(user.name),
    };
    localStorage.setItem(dataKey(user.id), JSON.stringify(seedData(profile)));
    setUsers((p) => [...p, user]);
    setSession({ userId: user.id, email: user.email });
    return null;
  };

  const googleContinue = () => {
    const email = seedUser.email;
    let u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) {
      u = {
        id: uid(),
        name: seedUser.name,
        email,
        phone: seedUser.phone,
        password: "",
        provider: "google",
      };
      localStorage.setItem(
        dataKey(u.id),
        JSON.stringify(
          seedData({
            name: u.name,
            email: u.email,
            phone: u.phone,
            avatar: "",
            initials: initialsOf(u.name),
          })
        )
      );
      setUsers((p) => [...p, u!]);
    }
    setSession({ userId: u.id, email: u.email });
  };

  const requestReset = (email: string) => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return { error: "No account found for that email." };
    const token = Math.random().toString(36).slice(2, 10).toUpperCase();
    const next = users.map((x) => (x.id === u.id ? { ...x, resetToken: token } : x));
    setUsers(next);
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
    return { error: null, token };
  };

  const resetPassword = (email: string, token: string, password: string) => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return "No account found.";
    if (!u.resetToken || u.resetToken !== token.trim().toUpperCase()) return "Invalid reset code.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    setUsers((p) =>
      p.map((x) => (x.id === u.id ? { ...x, password, resetToken: undefined, provider: "email" } : x))
    );
    setSession({ userId: u.id, email: u.email });
    return null;
  };

  const logout = () => setSession(null);

  const value = useMemo<Ctx>(() => {
    const firstName = data.profile.name.split(" ")[0] || "trader";
    return {
      session,
      users,
      data,
      firstName,
      login,
      signup,
      googleContinue,
      requestReset,
      resetPassword,
      logout,
      updateProfile: (patch) =>
        patchData((d) => {
          const profile = {
            ...d.profile,
            ...patch,
            initials: initialsOf(patch.name ?? d.profile.name),
          };
          return { ...d, profile };
        }),
      addAccount: (a) =>
        patchData((d) => ({
          ...d,
          accounts: [...d.accounts, { ...a, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateAccount: (id, patch) =>
        patchData((d) => ({
          ...d,
          accounts: d.accounts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteAccount: (id) =>
        patchData((d) => ({ ...d, accounts: d.accounts.filter((x) => x.id !== id) })),
      addTrade: (input) => {
        let created!: Trade;
        patchData((d) => {
          const no = d.trades.reduce((m, t) => Math.max(m, t.no), 0) + 1;
          const checked = input.rules.filter((r) => r.checked).length;
          created = {
            ...input,
            id: uid(),
            no,
            grade: input.grade || gradeFromChecked(checked, input.rules.length),
            rr: input.rr || rrFromPips(input.slPips, input.tpPips) || "1:0",
          };
          return { ...d, trades: [created, ...d.trades] };
        });
        return created;
      },
      updateTrade: (id, patch) =>
        patchData((d) => ({
          ...d,
          trades: d.trades.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteTrade: (id) =>
        patchData((d) => ({ ...d, trades: d.trades.filter((x) => x.id !== id) })),
      addJournal: (j) => {
        const row: Journal = { ...j, id: uid() };
        patchData((d) => ({ ...d, journals: [row, ...d.journals] }));
        return row;
      },
      updateJournal: (id, patch) =>
        patchData((d) => ({
          ...d,
          journals: d.journals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteJournal: (id) =>
        patchData((d) => ({ ...d, journals: d.journals.filter((x) => x.id !== id) })),
      addNote: () => {
        const note: Note = {
          id: uid(),
          title: "New Note",
          html: "",
          color: "#00D1C1",
          pinned: false,
          updatedAt: new Date().toISOString(),
        };
        patchData((d) => ({ ...d, notes: [note, ...d.notes] }));
        return note;
      },
      updateNote: (id, patch) =>
        patchData((d) => ({
          ...d,
          notes: d.notes.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x
          ),
        })),
      deleteNote: (id) =>
        patchData((d) => ({ ...d, notes: d.notes.filter((x) => x.id !== id) })),
      addMap: () => {
        const map: MindMap = {
          id: uid(),
          title: "New Mind Map",
          color: "#00D1C1",
          pinned: false,
          updatedAt: new Date().toISOString(),
          zoom: 1,
          nodes: [
            {
              id: uid(),
              x: 380,
              y: 220,
              text: "New Mind Map",
              color: "#00D1C1",
              type: "topic",
              parentId: null,
            },
          ],
        };
        patchData((d) => ({ ...d, maps: [map, ...d.maps] }));
        return map;
      },
      updateMap: (id, patch) =>
        patchData((d) => ({
          ...d,
          maps: d.maps.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x
          ),
        })),
      deleteMap: (id) =>
        patchData((d) => ({ ...d, maps: d.maps.filter((x) => x.id !== id) })),
      addChecklist: (c) =>
        patchData((d) => ({ ...d, checklists: [...d.checklists, { ...c, id: uid() }] })),
      updateChecklist: (id, patch) =>
        patchData((d) => ({
          ...d,
          checklists: d.checklists.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteChecklist: (id) =>
        patchData((d) => ({ ...d, checklists: d.checklists.filter((x) => x.id !== id) })),
      addPayout: (p) =>
        patchData((d) => ({ ...d, payouts: [{ ...p, id: uid() }, ...d.payouts] })),
      updatePayout: (id, patch) =>
        patchData((d) => ({
          ...d,
          payouts: d.payouts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deletePayout: (id) =>
        patchData((d) => ({ ...d, payouts: d.payouts.filter((x) => x.id !== id) })),
      addBacktest: (b) =>
        patchData((d) => {
          const no = d.backtests.reduce((m, t) => Math.max(m, t.no), 0) + 1;
          return { ...d, backtests: [{ ...b, id: uid(), no }, ...d.backtests] };
        }),
      updateBacktest: (id, patch) =>
        patchData((d) => ({
          ...d,
          backtests: d.backtests.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteBacktest: (id) =>
        patchData((d) => ({ ...d, backtests: d.backtests.filter((x) => x.id !== id) })),
      addSymbol: (s) =>
        patchData((d) => {
          const v = s.trim().toUpperCase();
          if (!v || d.symbols.includes(v)) return d;
          return { ...d, symbols: [...d.symbols, v] };
        }),
      setTasks: (tasks) => patchData((d) => ({ ...d, tasks })),
      copyAffiliate: () => {
        const code = data.affiliateCode;
        void navigator.clipboard?.writeText(`https://ryzelog.app/r/${code}`);
        return `https://ryzelog.app/r/${code}`;
      },
    };
  }, [session, users, data, patchData]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useOptionalStore() {
  return useContext(StoreContext);
}

export const SESSION_TODAY = TODAY_ISO;
