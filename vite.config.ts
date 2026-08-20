import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { FALLBACK_PROP_DEALS, type PropDeal } from "./src/lib/propDeals";

const execFileAsync = promisify(execFile);
const MYFX_CALENDAR = "https://www.myfxbook.com/forex-economic-calendar";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const FIRM_PAGES: { firm: string; url: string }[] = [
  { firm: "FTMO", url: "https://ftmo.com/en/" },
  { firm: "FundingPips", url: "https://www.fundingpips.com/" },
  { firm: "FundedNext", url: "https://fundednext.com/" },
  { firm: "The5ers", url: "https://the5ers.com/" },
  { firm: "E8 Markets", url: "https://e8markets.com/" },
  { firm: "FXIFY", url: "https://fxify.com/" },
  { firm: "Alpha Capital", url: "https://alphacapitalgroup.uk/" },
  { firm: "Goat Funded Trader", url: "https://www.goatfundedtrader.com/" },
];

async function curlGet(url: string, maxTime = "25") {
  const bin = process.platform === "win32" ? "curl.exe" : "curl";
  const { stdout } = await execFileAsync(
    bin,
    [
      "-sS",
      "-L",
      "--compressed",
      "--max-time",
      maxTime,
      "-A",
      BROWSER_UA,
      "-H",
      "Accept: text/html,application/xhtml+xml",
      url,
    ],
    { encoding: "buffer", maxBuffer: 12 * 1024 * 1024 }
  );
  return Buffer.from(stdout).toString("utf8");
}

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

const CODE_JUNK = new Set([
  "SEE",
  "SITE",
  "APPLY",
  "CODE",
  "CODES",
  "COUPON",
  "PROMO",
  "DISCOUNT",
  "OFFER",
  "SALE",
  "SAVE",
  "GET",
  "NOW",
  "HERE",
  "NEW",
  "LIVE",
  "CLAIM",
  "START",
  "BUY",
  "USE",
  "THE",
  "AND",
  "FOR",
  "OFF",
  "WITH",
  "YOUR",
  "THIS",
  "THAT",
  "FROM",
  "FREE",
  "DEAL",
  "FLASH",
  "LIMIT",
  "TIME",
  "STEP",
  "PHASE",
  "CLASS",
  "NAME",
  "TYPE",
  "USERLANG",
  "DOCUMENT",
  "LOGIN",
  "SIGNUP",
  "ACCOUNT",
  "CHALLENGE",
  "BUTTON",
  "SUBMIT",
  "CLICK",
  "TRUE",
  "FALSE",
  "NULL",
  "NONE",
  "HTML",
  "JSON",
  "HTTP",
  "HTTPS",
  "HREF",
]);

function normalizeCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

function isPromoCode(raw: string) {
  const code = normalizeCode(raw);
  if (code.length < 4 || code.length > 16) return false;
  if (CODE_JUNK.has(code)) return false;
  if (!/[A-Z]/.test(code) || !/\d/.test(code)) return false;
  if (/^\d+$/.test(code)) return false;
  return true;
}

function nearbyPercent(text: string, index: number) {
  const percents = [...text.matchAll(/(\d{1,2})\s*%\s*(?:off|discount)/gi)];
  let best = "";
  let bestDist = Infinity;
  for (const row of percents) {
    const dist = Math.abs((row.index ?? 0) - index);
    if (dist < bestDist && dist <= 100) {
      bestDist = dist;
      best = row[1];
    }
  }
  return best;
}

function pageExpiry(text: string) {
  return (
    text.match(/expires?:?\s*(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})/i)?.[1] ||
    text.match(/until\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i)?.[1] ||
    ""
  );
}

function parseDeals(firm: string, url: string, html: string): PropDeal[] {
  const blocked =
    /vercel security checkpoint/i.test(html) ||
    html.length < 400 ||
    (/just a moment/i.test(html) && html.length < 2500);
  if (blocked) return [];
  const text = stripTags(html);
  if (!/(discount|coupon|promo|% off|save \d|code[:\s])/i.test(text)) return [];

  const found = new Map<string, { pct: string; dist: number }>();
  const remember = (raw: string, pct: string, dist: number) => {
    if (!isPromoCode(raw)) return;
    const code = normalizeCode(raw);
    const prev = found.get(code);
    if (prev && prev.dist <= dist) {
      if (!prev.pct && pct) found.set(code, { pct, dist });
      return;
    }
    found.set(code, { pct, dist });
  };

  for (const match of text.matchAll(/\b(?:promo(?:tion)?|discount|coupon)?\s*codes?[:\s]+([A-Za-z0-9_-]{4,16})\b/gi)) {
    const index = match.index ?? 0;
    remember(match[1], nearbyPercent(text, index), 0);
  }
  for (const match of text.matchAll(/\b([A-Za-z][A-Za-z0-9_-]{3,15})\s+for\s+(\d{1,2})\s*%\s*off\b/gi)) {
    remember(match[1], match[2], 0);
  }
  for (const match of text.matchAll(/(\d{1,2})\s*%\s*off/gi)) {
    const percentIndex = match.index ?? 0;
    const start = Math.max(0, percentIndex - 80);
    const around = text.slice(start, percentIndex + 90);
    for (const token of around.matchAll(/\b([A-Za-z][A-Za-z0-9_-]{3,15})\b/g)) {
      const dist = Math.abs(start + (token.index ?? 0) - percentIndex);
      remember(token[1], match[1], dist);
    }
  }

  const expiry = pageExpiry(text);
  const slug = firm.toLowerCase().replace(/\s+/g, "-");
  const rows = [...found.entries()];
  if (rows.length) {
    return rows.map(([code, row], i) => ({
      id: `live-${slug}-${code.toLowerCase()}-${i}`,
      firm,
      code,
      discount: row.pct ? `${row.pct}% off` : "Live offer",
      details: row.pct
        ? `Use code ${code} at checkout for ${row.pct}% off. Confirm it still applies before you pay.`
        : `Use code ${code} at checkout. Confirm the current terms on the offer page.`,
      url,
      expiry,
      source: "live" as const,
    }));
  }

  const pct = text.match(/(\d{1,2})\s*%\s*(?:off|discount)/i)?.[1];
  if (!pct) return [];
  return [
    {
      id: `live-${slug}-auto`,
      firm,
      code: "",
      discount: `${pct}% off`,
      details: `${firm} is advertising ${pct}% off with no published coupon code. The sale is applied on the offer page.`,
      url,
      expiry,
      source: "live",
    },
  ];
}

let dealsCache: { at: number; deals: PropDeal[] } | null = null;

async function collectPropDeals(): Promise<PropDeal[]> {
  if (dealsCache && Date.now() - dealsCache.at < 30 * 60_000) return dealsCache.deals;
  const live = await Promise.all(
    FIRM_PAGES.map(async (page) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const html = await curlGet(page.url, "18");
          const deals = parseDeals(page.firm, page.url, html);
          if (deals.length || attempt === 1) return deals;
        } catch {
          if (attempt === 1) return [] as PropDeal[];
        }
      }
      return [] as PropDeal[];
    })
  );
  const found = live.flat();
  const liveFirms = new Set(found.map((d) => d.firm.toLowerCase()));
  const deals = [
    ...found,
    ...FALLBACK_PROP_DEALS.filter((d) => !liveFirms.has(d.firm.toLowerCase()) && d.code),
  ];
  dealsCache = { at: Date.now(), deals: deals.length ? deals : FALLBACK_PROP_DEALS };
  return dealsCache.deals;
}

function myfxbookCalendarPlugin(): Plugin {
  const handle = async (_req: IncomingMessage, res: ServerResponse) => {
    try {
      const html = await curlGet(MYFX_CALENDAR);
      res.statusCode = html.includes("economicCalendarRow") ? 200 : 502;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=120");
      res.end(html);
    } catch {
      res.statusCode = 502;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Myfxbook calendar unavailable");
    }
  };

  return {
    name: "myfxbook-calendar",
    configureServer(server) {
      server.middlewares.use("/api/myfxbook/forex-economic-calendar", handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/myfxbook/forex-economic-calendar", handle);
    },
  };
}

function propDealsPlugin(): Plugin {
  const handle = async (_req: IncomingMessage, res: ServerResponse) => {
    try {
      const deals = await collectPropDeals();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.end(JSON.stringify({ deals }));
    } catch {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ deals: FALLBACK_PROP_DEALS }));
    }
  };

  return {
    name: "prop-deals",
    configureServer(server) {
      server.middlewares.use("/api/prop-deals", handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/prop-deals", handle);
    },
  };
}

const calendarProxy: Record<string, ProxyOptions> = {
  "/api/ff-calendar": {
    target: "https://nfs.faireconomy.media",
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api\/ff-calendar/, ""),
  },
};

export default defineConfig({
  base: "./",
  server: { proxy: calendarProxy },
  preview: { proxy: calendarProxy },
  plugins: [
    myfxbookCalendarPlugin(),
    propDealsPlugin(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Quantum Trading Journal",
        short_name: "Quantum",
        description: "A modern trading journal and analytics platform.",
        theme_color: "#00D1C1",
        background_color: "#F8FAFC",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
});
