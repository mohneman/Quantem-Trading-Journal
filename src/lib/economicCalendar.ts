export type CalImpact = "HIGH" | "MED" | "LOW";

export type CalEvent = {
  id: string;
  at: string;
  currency: string;
  event: string;
  impact: CalImpact;
  previous: string;
  consensus: string;
  actual: string;
  better?: boolean;
};

export type CalendarSource = "myfxbook" | "public";

const MYFX_PATHS = ["/api/myfxbook/forex-economic-calendar"];
const FF_PATHS = ["/api/ff-calendar/ff_calendar_thisweek.json", "https://nfs.faireconomy.media/ff_calendar_thisweek.json"];

function cellText(el: Element | null) {
  return (el?.textContent || "").replace(/\s+/g, " ").trim();
}

function mapImpact(raw: string): CalImpact | null {
  const v = raw.trim().toUpperCase();
  if (v.startsWith("HIGH") || v === "3") return "HIGH";
  if (v.startsWith("MED") || v === "2") return "MED";
  if (v.startsWith("LOW") || v === "1") return "LOW";
  return null;
}

function dash(value: string) {
  return value || "—";
}

export function parseMyfxbookHtml(html: string): CalEvent[] {
  if (!html.includes("economicCalendarRow")) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll("tr.economicCalendarRow"));
  const events: CalEvent[] = [];

  for (const row of rows) {
    const tds = Array.from(row.querySelectorAll(":scope > td"));
    const currency = cellText(tds[3]).toUpperCase();
    const event = cellText(tds[4]);
    const impact =
      mapImpact(cellText(tds[5])) ||
      (row.querySelector(".impact_high") ? "HIGH" : row.querySelector(".impact_medium") ? "MED" : row.querySelector(".impact_low") ? "LOW" : null);
    if (!currency || !event || !impact) continue;

    const left = row.querySelector("[name='calendarLeft']");
    const ms = Number(left?.getAttribute("time") || 0);
    const stamp = row.querySelector("[data-calendarDateTd]")?.getAttribute("data-calendarDateTd");
    let at = "";
    if (ms > 0) at = new Date(ms).toISOString();
    else if (stamp) {
      const parsed = Date.parse(stamp.replace(" ", "T").replace(/\.0$/, "") + "Z");
      if (!Number.isNaN(parsed)) at = new Date(parsed).toISOString();
    }
    if (!at) continue;

    const actualTd = tds[8];
    const cls = actualTd?.className || "";
    const better = cls.includes("transparent-green") ? true : cls.includes("transparent-red") ? false : undefined;

    events.push({
      id: row.getAttribute("data-row-id") || row.id.replace(/^calRow/, "") || `${currency}-${at}-${event}`,
      at,
      currency,
      event,
      impact,
      previous: dash(cellText(tds[6])),
      consensus: dash(cellText(tds[7])),
      actual: dash(cellText(actualTd)),
      better,
    });
  }

  return events;
}

function parseForexFactory(rows: unknown): CalEvent[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row, i) => {
    if (!row || typeof row !== "object") return [];
    const e = row as Record<string, unknown>;
    const impact = mapImpact(String(e.impact ?? ""));
    const currency = String(e.country ?? "").toUpperCase();
    const title = String(e.title ?? "").trim();
    const date = String(e.date ?? "");
    if (!impact || !currency || !title || !date) return [];
    const at = new Date(date);
    if (Number.isNaN(at.getTime())) return [];
    return [
      {
        id: `ff-${date}-${i}`,
        at: at.toISOString(),
        currency,
        event: title,
        impact,
        previous: dash(String(e.previous ?? "")),
        consensus: dash(String(e.forecast ?? "")),
        actual: dash(String(e.actual ?? "")),
      },
    ];
  });
}

async function fetchOk(url: string) {
  const res = await fetch(url, { headers: { Accept: "text/html,application/json;q=0.9,*/*;q=0.8" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export async function loadEconomicCalendar(): Promise<{ events: CalEvent[]; source: CalendarSource }> {
  for (const url of MYFX_PATHS) {
    try {
      const html = await (await fetchOk(url)).text();
      const events = parseMyfxbookHtml(html);
      if (events.length) return { events, source: "myfxbook" };
    } catch {
      /* try next source */
    }
  }

  for (const url of FF_PATHS) {
    try {
      const rows = await (await fetchOk(url)).json();
      const events = parseForexFactory(rows);
      if (events.length) return { events, source: "public" };
    } catch {
      /* try next source */
    }
  }

  throw new Error("Could not load the public economic calendar.");
}
