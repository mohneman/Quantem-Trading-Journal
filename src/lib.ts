export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatPnl(n: number) {
  const abs = Math.abs(n).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return n > 0 ? `+${abs}` : n < 0 ? `-${abs}` : abs;
}

export function parseRr(rr: string) {
  const m = String(rr ?? "").replace(/\s/g, "").match(/1:(\d+(?:\.\d+)?)/i);
  if (m) return Number(m[1]);
  const n = Number(rr);
  return Number.isFinite(n) ? n : 0;
}

export function parseRiskPct(risk: string) {
  const n = Number(String(risk ?? "").replace("%", "").trim());
  return Number.isFinite(n) ? n : 0;
}

/** Estimate $ P&L from risk %, R:R, and account size — a trader's default before they override. */
export function suggestPnl(opts: {
  outcome: "WIN" | "LOSS" | "BE" | "OPEN";
  risk: string;
  rr: string;
  balance?: number;
}) {
  if (opts.outcome === "OPEN" || opts.outcome === "BE") return 0;
  const riskPct = parseRiskPct(opts.risk);
  const balance = opts.balance && opts.balance > 0 ? opts.balance : 10_000;
  const riskAmt = (balance * riskPct) / 100;
  if (!riskAmt) return 0;
  if (opts.outcome === "LOSS") return Math.round(-riskAmt * 100) / 100;
  const rr = parseRr(opts.rr) || 1;
  return Math.round(riskAmt * rr * 100) / 100;
}

export function rrFromPips(sl: string, tp: string) {
  const s = Number(sl);
  const t = Number(tp);
  if (!s || !t) return "";
  return `1:${(t / s).toFixed(2).replace(/\.00$/, "")}`;
}

export function gradeFromChecked(checked: number, total: number) {
  if (!total) return "C";
  if (checked === total) return "A+";
  if (checked >= Math.ceil(total * 0.8)) return "A";
  if (checked >= Math.ceil(total * 0.6)) return "B";
  if (checked >= Math.ceil(total * 0.4)) return "C";
  return "F";
}

export function startOfDay(iso: string) {
  return iso.slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysAgo(iso: string, n: number) {
  return addDays(iso, -n);
}

export function inRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function weekdayShort(iso: string) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${iso}T12:00:00`).getDay()];
}

export function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function prettyDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function monthDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

export function weekdayName(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
}

export function downloadText(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printSection(title: string) {
  const prev = document.title;
  document.title = title;
  window.print();
  document.title = prev;
}

export function csvEscape(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function traderShare(split: string) {
  const n = Number(String(split).split("/")[0]);
  return Number.isFinite(n) && n > 0 ? n / 100 : 1;
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function journalSnippet(notes: string) {
  const cleaned = notes
    .replace(/---\s*Account Plane[s]?\s*---/gi, "")
    .replace(/\[\{[\s\S]*\}\]/g, "")
    .trim();
  return cleaned;
}

export function journalPreview(j: {
  notes: string;
  gratitude?: string;
  affirmation?: string;
  plans?: { accountId: string; balance: string; trades: string; pips: string; risk: string; amount: string }[];
}) {
  if (j.notes.trim()) return j.notes.replace(/\s+/g, " ").trim();
  if (j.plans?.length) {
    return `--- Account Plans --- ${JSON.stringify(
      j.plans.map((p) => ({ account: p.accountId, balance: p.balance, trades: p.trades, pips: p.pips, risk: p.risk })),
    )}`;
  }
  return (j.gratitude || j.affirmation || "").replace(/\s+/g, " ").trim();
}

export function outcomeStreak(results: Array<"WIN" | "LOSS" | string>) {
  if (!results.length) return "—";
  const first = results[0];
  if (first !== "WIN" && first !== "LOSS") return "—";
  let n = 0;
  for (const r of results) {
    if (r !== first) break;
    n += 1;
  }
  return `${n}${first === "WIN" ? "W" : "L"}`;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

export function readLocalImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!IMAGE_TYPES.includes(file.type) && !/\.(png|jpe?g|gif|webp)$/i.test(file.name)) {
      reject(new Error("Please choose a PNG, JPG, GIF, or WEBP image."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Image is too large. Use a file under 8 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const raw = String(reader.result || "");
      if (file.size <= 900_000) {
        resolve(raw);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(raw);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(raw);
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}
