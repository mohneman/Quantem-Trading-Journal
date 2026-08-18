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
  const m = rr.replace(/\s/g, "").match(/1:(\d+(?:\.\d+)?)/i);
  if (m) return Number(m[1]);
  const n = Number(rr);
  return Number.isFinite(n) ? n : 0;
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
