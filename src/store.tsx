import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  defaultChecklist,
  TODAY_ISO,
  user as seedUser,
} from "./data";
import { gradeFromChecked, initialsOf, rrFromPips, uid } from "./lib";
import { APPROVAL_MSG, type GoogleProfile } from "./lib/googleAuth";
import { consumeReferralCode, makeReferralCode, referralSignupLink } from "./lib/referral";
import * as api from "./lib/api";

export { APPROVAL_MSG };

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
  w?: number;
  h?: number;
  text: string;
  color: string;
  type: "topic" | "note" | "image";
  parentId: string | null;
  imageUrl?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  textColor?: string;
  align?: "left" | "center" | "right";
  collapsed?: boolean;
  emoji?: string;
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
  details?: string;
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

export type UserRole = "superadmin" | "trader";
export type UserStatus = "pending" | "active" | "disabled";
export type AuthResult = { error: string | null; awaitingApproval?: boolean };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  provider: "email" | "google";
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  referralCode: string;
  referredByCode?: string;
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
    pnl: -100,
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
    pnl: 400,
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
        tags: ["Monday", "Trading", "Personal"],
        gratitude: "",
        affirmation: "",
        notes: '--- Account Plans --- [{"account":"","balance":"10000","trades":"1-2","pips":"50","risk":"2"}]',
        tasks: [],
        plans: [
          {
            id: "jp1",
            accountId: "",
            balance: "10000",
            trades: "1-2",
            pips: "50",
            risk: "2%",
            amount: "100$",
          },
        ],
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
        code: "QUANTUM10",
        discount: "10% off",
        url: "https://ftmo.com",
        details: "FTMO challenge discount when this code is active at checkout.",
        expiry: "2026-12-31",
      },
      {
        id: "c2",
        firm: "FundingPips",
        code: "QUANTUM",
        discount: "20% off",
        details: "FundingPips evaluation discount. Confirm the code before payment.",
        url: "https://fundingpips.com",
        expiry: "2026-10-31",
      },
    ],
    symbols: ["GBPUSD", "EURUSD", "USDJPY", "XAUUSD", "EURGBP"],
    tasks: [],
    affiliateCode: `QUANTUM-${profile.initials || "Q"}`,
  };
}

function demoUser(): AuthUser {
  return {
    id: "u-demo",
    name: seedUser.name,
    email: seedUser.email,
    phone: seedUser.phone,
    password: "quantum",
    provider: "email",
    role: "trader",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    referralCode: "",
  };
}

function superAdminUser(): AuthUser {
  return {
    id: "u-admin",
    name: "Quantum Admin",
    email: "admin@quantum.local",
    phone: "",
    password: "quantum-admin",
    provider: "email",
    role: "superadmin",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    referralCode: "",
  };
}

function normalizeUser(u: AuthUser): AuthUser {
  return {
    ...u,
    role: u.role === "superadmin" ? "superadmin" : "trader",
    status: u.status === "pending" ? "pending" : u.status === "disabled" ? "disabled" : "active",
    provider: u.provider === "google" ? "google" : "email",
    createdAt: u.createdAt || new Date().toISOString(),
    phone: u.phone ?? "",
    referralCode: (u.referralCode || "").toUpperCase(),
    referredByCode: u.referredByCode ? u.referredByCode.toUpperCase() : undefined,
  };
}

function withReferralCodes(users: AuthUser[]): AuthUser[] {
  const taken = new Set<string>();
  return users.map((u) => {
    const cleaned = (u.referralCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    let referralCode = cleaned;
    if (!referralCode || taken.has(referralCode)) {
      referralCode = makeReferralCode(u.name, u.id, taken);
    } else {
      taken.add(referralCode);
    }
    return { ...u, referralCode, referredByCode: u.referredByCode || undefined };
  });
}

function attachReferral(name: string, id: string, existing: AuthUser[]) {
  const taken = new Set(existing.map((u) => u.referralCode).filter(Boolean));
  const referralCode = makeReferralCode(name, id, taken);
  const pending = consumeReferralCode();
  const referrer = existing.find((u) => u.referralCode === pending && u.id !== id);
  return { referralCode, referredByCode: referrer?.referralCode };
}

function denialMessage(user: AuthUser) {
  if (user.status === "pending" || user.status === "disabled") return APPROVAL_MSG;
  return null;
}

function persistUserSeed(user: AuthUser) {
  if (localStorage.getItem(dataKey(user.id))) return;
  localStorage.setItem(
    dataKey(user.id),
    JSON.stringify(
      seedData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: "",
        initials: initialsOf(user.name),
      })
    )
  );
}

function asArray<T>(value: T[] | undefined, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}

function normalizeData(raw: Partial<StoreData> | undefined, profile: Profile): StoreData {
  const seed = seedData(profile);
  if (!raw) return seed;
  const trades = asArray(raw.trades, seed.trades).map((t) => ({
    ...t,
    psychology: Array.isArray(t.psychology) ? t.psychology : [],
    rules: Array.isArray(t.rules) ? t.rules : [],
    accountIds: Array.isArray(t.accountIds) ? t.accountIds : [],
    outcome: t.outcome || "OPEN",
    pnl: typeof t.pnl === "number" ? t.pnl : 0,
  }));
  const bothSeedZero =
    trades.some((t) => t.id === "t1" && t.pnl === 0 && t.outcome === "LOSS") &&
    trades.some((t) => t.id === "t2" && t.pnl === 0 && t.outcome === "WIN");
  return {
    profile: {
      ...seed.profile,
      ...raw.profile,
      initials: initialsOf(raw.profile?.name || profile.name),
    },
    accounts: asArray(raw.accounts, seed.accounts),
    trades: bothSeedZero
      ? trades.map((t) =>
          t.id === "t1" ? { ...t, pnl: -100 } : t.id === "t2" ? { ...t, pnl: 400 } : t
        )
      : trades,
    journals: asArray(raw.journals, seed.journals).map((j) => ({
      ...j,
      tags: Array.isArray(j.tags) ? j.tags : [],
      tasks: Array.isArray(j.tasks) ? j.tasks : [],
      plans: Array.isArray(j.plans) ? j.plans : [],
      gratitude: j.gratitude ?? "",
      affirmation: j.affirmation ?? "",
    })),
    notes: asArray(raw.notes, seed.notes),
    maps: asArray(raw.maps, seed.maps).map((m) => ({
      ...m,
      nodes: Array.isArray(m.nodes) ? m.nodes : [],
      zoom: m.zoom ?? 1,
    })),
    checklists: asArray(raw.checklists, seed.checklists),
    payouts: asArray(raw.payouts, seed.payouts),
    backtests: asArray(raw.backtests, seed.backtests).map((b) => ({
      ...b,
      rules: Array.isArray(b.rules) ? b.rules : [],
    })),
    coupons: asArray(raw.coupons, seed.coupons),
    symbols: asArray(raw.symbols, seed.symbols),
    tasks: asArray(raw.tasks, seed.tasks),
    affiliateCode: raw.affiliateCode || seed.affiliateCode,
  };
}

function loadUsers(): AuthUser[] {
  let users: AuthUser[] = [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) users = (JSON.parse(raw) as AuthUser[]).map(normalizeUser);
  } catch {
    users = [];
  }
  const demo = demoUser();
  const admin = superAdminUser();
  if (!users.some((u) => u.email.toLowerCase() === demo.email.toLowerCase())) {
    users = [demo, ...users];
  } else {
    users = users.map((u) =>
      u.email.toLowerCase() === demo.email.toLowerCase()
        ? { ...normalizeUser(u), password: "quantum", provider: "email" }
        : u
    );
  }
  if (!users.some((u) => u.email.toLowerCase() === admin.email.toLowerCase())) {
    users = [admin, ...users];
  } else {
    users = users.map((u) =>
      u.email.toLowerCase() === admin.email.toLowerCase()
        ? { ...normalizeUser(u), role: "superadmin", status: "active", provider: "email" }
        : u
    );
  }
  persistUserSeed(users.find((u) => u.email.toLowerCase() === demo.email.toLowerCase()) ?? demo);
  persistUserSeed(users.find((u) => u.email.toLowerCase() === admin.email.toLowerCase()) ?? admin);
  users = withReferralCodes(users);
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
  const fallback: Profile = user
    ? {
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: "",
        initials: initialsOf(user.name),
      }
    : { name: "", email: "", phone: "", avatar: "", initials: "Q" };
  if (!user) return seedData(fallback);
  try {
    const raw = localStorage.getItem(dataKey(user.id));
    if (raw) return normalizeData(JSON.parse(raw) as Partial<StoreData>, fallback);
  } catch {
    /* ignore */
  }
  return seedData(fallback);
}

type Ctx = {
  session: Session | null;
  currentUser: AuthUser | undefined;
  isSuperAdmin: boolean;
  users: AuthUser[];
  data: StoreData;
  firstName: string;
  storage: "local" | "mysql";
  login: (email: string, password: string) => Promise<string | null>;
  signup: (input: { name: string; email: string; password: string; phone?: string }) => Promise<AuthResult>;
  googleContinue: (profile: GoogleProfile) => Promise<AuthResult>;
  requestReset: (email: string) => Promise<{ error: string | null; token?: string }>;
  resetPassword: (email: string, token: string, password: string) => Promise<string | null>;
  logout: () => void;
  adminCreateUser: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
  }) => Promise<string | null>;
  adminUpdateUser: (
    id: string,
    patch: Partial<Pick<AuthUser, "name" | "email" | "phone" | "role" | "status">>
  ) => Promise<string | null>;
  adminSetPassword: (id: string, password: string) => Promise<string | null>;
  adminDeleteUser: (id: string) => Promise<string | null>;
  adminResetUserData: (id: string) => Promise<string | null>;
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
  addChecklist: (c: Omit<Checklist, "id">) => Checklist;
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
  const emptyProfile: Profile = { name: "", email: "", phone: "", avatar: "", initials: "Q" };
  const [ready, setReady] = useState(false);
  const [remote, setRemote] = useState(false);
  const remoteRef = useRef(false);
  const skipPersist = useRef(true);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const currentUser = users.find((u) => u.id === session?.userId);
  const [data, setData] = useState<StoreData>(() => seedData(emptyProfile));

  useEffect(() => {
    let live = true;
    (async () => {
      const online = await api.probeApi();
      if (!live) return;
      remoteRef.current = online;
      setRemote(online);
      if (online) {
        if (api.getApiToken()) {
          try {
            const me = await api.apiMe();
            setUsers(me.users.map(normalizeUser));
            setSession({ userId: me.user.id, email: me.user.email });
            const payload = await api.apiGetData();
            setData(
              normalizeData(payload, {
                name: me.user.name,
                email: me.user.email,
                phone: me.user.phone,
                avatar: "",
                initials: initialsOf(me.user.name),
              })
            );
          } catch {
            api.setApiToken(null);
            setUsers([]);
            setSession(null);
          }
        }
      } else {
        const loaded = loadUsers();
        const sess = loadSession();
        setUsers(loaded);
        setSession(sess);
        setData(loadData(loaded.find((u) => u.id === sess?.userId)));
      }
      skipPersist.current = false;
      setReady(true);
    })();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || remote) return;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users, ready, remote]);

  useEffect(() => {
    if (!ready) return;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session, ready]);

  useEffect(() => {
    if (!ready || skipPersist.current || !session?.userId) return;
    if (!remote) {
      localStorage.setItem(dataKey(session.userId), JSON.stringify(data));
      return;
    }
    const timer = window.setTimeout(() => {
      void api.apiPutData(data).catch(() => undefined);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [data, session, ready, remote]);

  useEffect(() => {
    if (!ready || remote) return;
    const user = users.find((u) => u.id === session?.userId);
    setData(loadData(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId, ready, remote]);

  const patchData = useCallback((fn: (d: StoreData) => StoreData) => {
    setData((d) => fn(d));
  }, []);

  useEffect(() => {
    if (session && currentUser && currentUser.status !== "active") {
      setSession(null);
      api.setApiToken(null);
    }
  }, [session, currentUser]);

  const hydrateRemote = async (user: AuthUser) => {
    const me = await api.apiMe();
    setUsers(me.users.map(normalizeUser));
    setSession({ userId: user.id, email: user.email });
    const payload = await api.apiGetData();
    skipPersist.current = true;
    setData(
      normalizeData(payload, {
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: "",
        initials: initialsOf(user.name),
      })
    );
    skipPersist.current = false;
  };

  const login = async (email: string, password: string) => {
    if (remoteRef.current) {
      try {
        const user = await api.apiLogin(email, password);
        await hydrateRemote(user);
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Login failed.";
      }
    }
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return "No account found for that email.";
    const denied = denialMessage(u);
    if (denied) return denied;
    if (u.provider === "email" && u.password && u.password !== password) return "Incorrect password.";
    if (u.provider === "google" && u.password && u.password !== password) return "Incorrect password.";
    if (u.provider === "google" && !u.password) {
      return "This account uses Google. Continue with Google to sign in.";
    }
    setSession({ userId: u.id, email: u.email });
    return null;
  };

  const signup = async (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResult> => {
    if (remoteRef.current) return api.apiSignup(input);
    if (!input.name.trim() || !input.email.trim() || !input.password) return { error: "All fields are required." };
    if (input.password.length < 6) return { error: "Password must be at least 6 characters." };
    const existing = users.find((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
    if (existing) {
      if (existing.status !== "active") return { error: APPROVAL_MSG, awaitingApproval: true };
      return { error: "An account with that email already exists." };
    }
    const id = uid();
    const name = input.name.trim();
    const user: AuthUser = {
      id,
      name,
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? "",
      password: input.password,
      provider: "email",
      role: "trader",
      status: "pending",
      createdAt: new Date().toISOString(),
      ...attachReferral(name, id, users),
    };
    persistUserSeed(user);
    setUsers((p) => [...p, user]);
    return { error: APPROVAL_MSG, awaitingApproval: true };
  };

  const googleContinue = async (profile: GoogleProfile): Promise<AuthResult> => {
    if (remoteRef.current) {
      const res = await api.apiGoogle(profile);
      if (res.user && !res.error) await hydrateRemote(res.user);
      return { error: res.error, awaitingApproval: res.awaitingApproval };
    }
    const email = profile.email.trim().toLowerCase();
    const name = profile.name.trim() || email.split("@")[0] || "Trader";
    if (!email) return { error: "Google did not return an email." };
    const existing = users.find((x) => x.email.toLowerCase() === email);
    if (existing) {
      const denied = denialMessage(existing);
      if (denied) return { error: denied, awaitingApproval: existing.status !== "active" };
      setUsers((p) =>
        p.map((u) => (u.id === existing.id ? { ...u, provider: "google", name: existing.name || name } : u))
      );
      setSession({ userId: existing.id, email: existing.email });
      return { error: null };
    }
    const id = uid();
    const user: AuthUser = {
      id,
      name,
      email,
      phone: "",
      password: "",
      provider: "google",
      role: "trader",
      status: "pending",
      createdAt: new Date().toISOString(),
      ...attachReferral(name, id, users),
    };
    persistUserSeed(user);
    setUsers((p) => [...p, user]);
    return { error: APPROVAL_MSG, awaitingApproval: true };
  };

  const requestReset = async (email: string) => {
    if (remoteRef.current) return api.apiForgot(email);
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return { error: "No account found for that email." };
    const token = Math.random().toString(36).slice(2, 10).toUpperCase();
    const next = users.map((x) => (x.id === u.id ? { ...x, resetToken: token } : x));
    setUsers(next);
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
    return { error: null, token };
  };

  const resetPassword = async (email: string, token: string, password: string) => {
    if (remoteRef.current) {
      try {
        const user = await api.apiReset(email, token, password);
        await hydrateRemote(user);
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Reset failed.";
      }
    }
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return "No account found.";
    if (!u.resetToken || u.resetToken !== token.trim().toUpperCase()) return "Invalid reset code.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    setUsers((p) =>
      p.map((x) => (x.id === u.id ? { ...x, password, resetToken: undefined, provider: "email" } : x))
    );
    const denied = denialMessage(u);
    if (denied) return denied;
    setSession({ userId: u.id, email: u.email });
    return null;
  };

  const logout = () => {
    if (remoteRef.current) void api.apiLogout();
    else api.setApiToken(null);
    setSession(null);
  };

  const writeRemoteProfile = (userId: string, patch: Partial<Profile>) => {
    try {
      const raw = localStorage.getItem(dataKey(userId));
      if (!raw) return;
      const d = JSON.parse(raw) as StoreData;
      const name = patch.name ?? d.profile.name;
      localStorage.setItem(
        dataKey(userId),
        JSON.stringify({
          ...d,
          profile: { ...d.profile, ...patch, initials: initialsOf(name) },
        })
      );
    } catch {
      /* ignore */
    }
  };

  const adminCreateUser = async (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
  }) => {
    if (remoteRef.current) {
      try {
        const user = await api.apiCreateUser(input);
        setUsers((p) => [...p, normalizeUser(user)]);
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Could not create user.";
      }
    }
    if (!input.name.trim() || !input.email.trim() || !input.password) return "All fields are required.";
    if (input.password.length < 6) return "Password must be at least 6 characters.";
    if (users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
      return "An account with that email already exists.";
    }
    const id = uid();
    const name = input.name.trim();
    const taken = new Set(users.map((u) => u.referralCode).filter(Boolean));
    const user: AuthUser = {
      id,
      name,
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? "",
      password: input.password,
      provider: "email",
      role: input.role === "superadmin" ? "superadmin" : "trader",
      status: "active",
      createdAt: new Date().toISOString(),
      referralCode: makeReferralCode(name, id, taken),
    };
    localStorage.setItem(
      dataKey(user.id),
      JSON.stringify(
        seedData({
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: "",
          initials: initialsOf(user.name),
        })
      )
    );
    setUsers((p) => [...p, user]);
    return null;
  };

  const adminUpdateUser = async (
    id: string,
    patch: Partial<Pick<AuthUser, "name" | "email" | "phone" | "role" | "status">>
  ) => {
    if (remoteRef.current) {
      try {
        const next = normalizeUser(await api.apiUpdateUser(id, patch));
        setUsers((p) => p.map((u) => (u.id === id ? next : u)));
        if (session?.userId === id) {
          setData((d) => ({
            ...d,
            profile: {
              ...d.profile,
              name: next.name,
              email: next.email,
              phone: next.phone,
              initials: initialsOf(next.name),
            },
          }));
          setSession({ userId: id, email: next.email });
        }
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Update failed.";
      }
    }
    const target = users.find((u) => u.id === id);
    if (!target) return "User not found.";
    const nextEmail = patch.email?.trim().toLowerCase();
    if (nextEmail && users.some((u) => u.id !== id && u.email.toLowerCase() === nextEmail)) {
      return "An account with that email already exists.";
    }
    if (patch.role === "trader" && target.role === "superadmin") {
      const admins = users.filter((u) => u.role === "superadmin");
      if (admins.length < 2) return "Cannot demote the last super admin.";
    }
    if (patch.status === "disabled" && target.role === "superadmin") {
      const otherAdmins = users.filter((u) => u.role === "superadmin" && u.id !== id && u.status !== "disabled");
      if (!otherAdmins.length) return "Cannot disable the last active super admin.";
    }
    if (patch.status === "disabled" && session?.userId === id) {
      return "You cannot disable the account you are signed in with.";
    }
    const next: AuthUser = {
      ...target,
      ...patch,
      email: nextEmail || target.email,
      name: patch.name?.trim() || target.name,
    };
    setUsers((p) => p.map((u) => (u.id === id ? next : u)));
    writeRemoteProfile(id, { name: next.name, email: next.email, phone: next.phone });
    if (session?.userId === id) {
      setData((d) => ({
        ...d,
        profile: {
          ...d.profile,
          name: next.name,
          email: next.email,
          phone: next.phone,
          initials: initialsOf(next.name),
        },
      }));
      if (nextEmail) setSession({ userId: id, email: next.email });
    }
    return null;
  };

  const adminSetPassword = async (id: string, password: string) => {
    if (remoteRef.current) {
      try {
        await api.apiSetPassword(id, password);
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Password update failed.";
      }
    }
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!users.some((u) => u.id === id)) return "User not found.";
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, password, provider: "email", resetToken: undefined } : u)));
    return null;
  };

  const adminDeleteUser = async (id: string) => {
    if (remoteRef.current) {
      try {
        await api.apiDeleteUser(id);
        setUsers((p) => p.filter((u) => u.id !== id));
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Delete failed.";
      }
    }
    if (session?.userId === id) return "You cannot delete the account you are signed in with.";
    const target = users.find((u) => u.id === id);
    if (!target) return "User not found.";
    if (target.role === "superadmin" && users.filter((u) => u.role === "superadmin").length < 2) {
      return "Cannot delete the last super admin.";
    }
    setUsers((p) => p.filter((u) => u.id !== id));
    localStorage.removeItem(dataKey(id));
    return null;
  };

  const adminResetUserData = async (id: string) => {
    if (remoteRef.current) {
      try {
        const next = await api.apiResetUserData(id);
        if (session?.userId === id && next) {
          setData(
            normalizeData(next, {
              name: currentUser?.name || "",
              email: currentUser?.email || "",
              phone: currentUser?.phone || "",
              avatar: "",
              initials: initialsOf(currentUser?.name || "Q"),
            })
          );
        }
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Reset failed.";
      }
    }
    const u = users.find((x) => x.id === id);
    if (!u) return "User not found.";
    const next = seedData({
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatar: "",
      initials: initialsOf(u.name),
    });
    localStorage.setItem(dataKey(id), JSON.stringify(next));
    if (session?.userId === id) setData(next);
    return null;
  };

  const value = useMemo<Ctx>(() => {
    const firstName = data.profile.name.split(" ")[0] || "trader";
    const isSuperAdmin = currentUser?.role === "superadmin" && currentUser.status === "active";
    return {
      session,
      currentUser,
      isSuperAdmin,
      users,
      data,
      firstName,
      storage: remote ? "mysql" : "local",
      login,
      signup,
      googleContinue,
      requestReset,
      resetPassword,
      logout,
      adminCreateUser,
      adminUpdateUser,
      adminSetPassword,
      adminDeleteUser,
      adminResetUserData,
      updateProfile: (patch) => {
        patchData((d) => {
          const profile = {
            ...d.profile,
            ...patch,
            initials: initialsOf(patch.name ?? d.profile.name),
          };
          return { ...d, profile };
        });
        if (session?.userId) {
          setUsers((p) =>
            p.map((u) =>
              u.id === session.userId
                ? { ...u, name: patch.name ?? u.name, phone: patch.phone ?? u.phone }
                : u
            )
          );
        }
      },
      addAccount: (a) => {
        const row: Account = { ...a, id: uid(), createdAt: new Date().toISOString() };
        patchData((d) => (d.accounts.some((x) => x.id === row.id) ? d : { ...d, accounts: [...d.accounts, row] }));
      },
      updateAccount: (id, patch) =>
        patchData((d) => ({
          ...d,
          accounts: d.accounts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteAccount: (id) =>
        patchData((d) => ({
          ...d,
          accounts: d.accounts.filter((x) => x.id !== id),
          trades: d.trades.map((t) => ({ ...t, accountIds: t.accountIds.filter((x) => x !== id) })),
          payouts: d.payouts.map((p) => (p.accountId === id ? { ...p, accountId: "" } : p)),
          journals: d.journals.map((j) => ({
            ...j,
            plans: (j.plans ?? []).map((p) => (p.accountId === id ? { ...p, accountId: "" } : p)),
          })),
        })),
      addTrade: (input) => {
        const id = uid();
        let created!: Trade;
        patchData((d) => {
          const existing = d.trades.find((t) => t.id === id);
          if (existing) {
            created = existing;
            return d;
          }
          const no = d.trades.reduce((m, t) => Math.max(m, t.no), 0) + 1;
          const checked = input.rules.filter((r) => r.checked).length;
          created = {
            ...input,
            id,
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
        patchData((d) => (d.journals.some((x) => x.id === row.id) ? d : { ...d, journals: [row, ...d.journals] }));
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
        patchData((d) => (d.notes.some((x) => x.id === note.id) ? d : { ...d, notes: [note, ...d.notes] }));
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
        patchData((d) => (d.maps.some((x) => x.id === map.id) ? d : { ...d, maps: [map, ...d.maps] }));
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
      addChecklist: (c) => {
        const row: Checklist = { ...c, id: uid() };
        patchData((d) => (d.checklists.some((x) => x.id === row.id) ? d : { ...d, checklists: [...d.checklists, row] }));
        return row;
      },
      updateChecklist: (id, patch) =>
        patchData((d) => ({
          ...d,
          checklists: d.checklists.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteChecklist: (id) =>
        patchData((d) => ({ ...d, checklists: d.checklists.filter((x) => x.id !== id) })),
      addPayout: (p) => {
        const row: Payout = { ...p, id: uid() };
        patchData((d) => (d.payouts.some((x) => x.id === row.id) ? d : { ...d, payouts: [row, ...d.payouts] }));
      },
      updatePayout: (id, patch) =>
        patchData((d) => ({
          ...d,
          payouts: d.payouts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deletePayout: (id) =>
        patchData((d) => ({ ...d, payouts: d.payouts.filter((x) => x.id !== id) })),
      addBacktest: (b) => {
        const id = uid();
        patchData((d) => {
          if (d.backtests.some((x) => x.id === id)) return d;
          const no = d.backtests.reduce((m, t) => Math.max(m, t.no), 0) + 1;
          return { ...d, backtests: [{ ...b, id, no }, ...d.backtests] };
        });
      },
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
        const code = currentUser?.referralCode || data.affiliateCode;
        const link = referralSignupLink(code);
        void navigator.clipboard?.writeText(link);
        return link;
      },
    };
  }, [session, currentUser, users, data, patchData, remote, login, signup, googleContinue, requestReset, resetPassword, logout, adminCreateUser, adminUpdateUser, adminSetPassword, adminDeleteUser, adminResetUserData]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F6FA] text-sm text-ink-muted">
        Loading Quantum…
      </div>
    );
  }

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
