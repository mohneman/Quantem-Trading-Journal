export const TODAY_LABEL = "Tuesday, Aug 18";
export const TODAY_ISO = "2026-08-18";

export const user = {
  name: "ali ahmed",
  email: "nejahseid750@gmail.com",
  phone: "251962091945",
  initials: "AA",
};

export const defaultChecklist = [
  "Soo hel Trend-ka (H1/H4 for S1) (15M for S2/S3) (5M for S4)",
  "Soo hel Zone-ka maamulaya Order Flow-ga suuqa.",
  "Sug in Liquidity-ga lagu jebiyo Reversal Volume muuqda.",
  "Hubi in Volume-ka uu keeno Countertrend Break.",
  "Hubi in Momentum-ku la jaanqaadayo direction-ka.",
];

export const psychologyTags = [
  "FOMO",
  "Calm",
  "Fear",
  "Greed",
  "Overconfident",
  "Hesitation",
  "Revenge",
  "Impatient",
  "Focused",
  "Uncertain",
];

export const startingBalances = [
  "$5,000",
  "$10,000",
  "$20,000",
  "$50,000",
  "$100,000",
  "$200,000",
];

export type Trade = {
  no: number;
  date: string;
  symbol: string;
  direction: "Buy" | "Sell";
  session: string;
  grade: string;
  rr: string;
  outcome: "WIN" | "LOSS";
  pnl: number;
  psychology: string;
  confluences: string;
  notes: string;
  risk: string;
};

export const trades: Trade[] = [
  {
    no: 2,
    date: "2026-08-18",
    symbol: "GBPUSD",
    direction: "Buy",
    session: "New York",
    grade: "A+",
    rr: "1:2",
    outcome: "WIN",
    pnl: 0,
    psychology: "Calm",
    confluences: "5/5 matched",
    notes: "waan ku dagdag oo kale",
    risk: "2.00%",
  },
  {
    no: 1,
    date: "2026-08-17",
    symbol: "GBPUSD",
    direction: "Buy",
    session: "New York",
    grade: "A+",
    rr: "1:2.33",
    outcome: "LOSS",
    pnl: 0,
    psychology: "Calm",
    confluences: "5/5 matched",
    notes: "",
    risk: "1.00%",
  },
];

export const journalEntry = {
  title: "monday",
  date: "Aug 18 Sun",
  iso: "2026-08-18",
  tags: ["Monday", "Trading Personal", "Excited"],
  mood: "Excited",
  snippet: '--- Account Plane --- [ {"account":...',
};

export const moodMonth = [
  { label: "Great", emoji: "😄", pct: 100, color: "#22C55E" },
  { label: "Good", emoji: "🙂", pct: 0, color: "#14C9B3" },
  { label: "Okay", emoji: "😐", pct: 0, color: "#F59E0B" },
  { label: "Bad", emoji: "😞", pct: 0, color: "#EF4444" },
];

export const calendarEvents = [
  {
    date: "Aug 18, 06:00",
    left: "done",
    currency: "GBP",
    event: "Average Earnings incl. Bonus (3Mo/Yr) (Jun)",
    impact: "HIGH" as const,
    previous: "3.4%",
    consensus: "3.4%",
    actual: "3.5%",
    better: true,
  },
  {
    date: "Aug 18, 08:30",
    left: "21 m",
    currency: "USD",
    event: "Building Permits (Jul)",
    impact: "MED" as const,
    previous: "1.39M",
    consensus: "1.42M",
    actual: "1.37M",
    better: false,
  },
  {
    date: "Aug 18, 10:00",
    left: "2 h",
    currency: "EUR",
    event: "German ZEW Economic Sentiment (Aug)",
    impact: "HIGH" as const,
    previous: "41.8",
    consensus: "42.5",
    actual: "—",
    better: true,
  },
  {
    date: "Aug 18, 14:00",
    left: "6 h",
    currency: "USD",
    event: "Existing Home Sales (Jul)",
    impact: "LOW" as const,
    previous: "3.93M",
    consensus: "3.99M",
    actual: "—",
    better: true,
  },
  {
    date: "Aug 18, 07:30",
    left: "done",
    currency: "CHF",
    event: "Trade Balance (Jul)",
    impact: "MED" as const,
    previous: "3.8B",
    consensus: "4.0B",
    actual: "4.2B",
    better: true,
  },
];

export function formatPnl(n: number) {
  const abs = Math.abs(n).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return n > 0 ? `+${abs}` : n < 0 ? `-${abs}` : abs;
}
