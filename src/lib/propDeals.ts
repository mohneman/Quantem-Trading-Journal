export type PropDeal = {
  id: string;
  firm: string;
  code: string;
  discount: string;
  details: string;
  url: string;
  expiry: string;
  source: "live" | "catalog";
};

export const FALLBACK_PROP_DEALS: PropDeal[] = [
  {
    id: "ftmo",
    firm: "FTMO",
    code: "",
    discount: "Check live offer",
    details: "FTMO periodically runs evaluation discounts. Open their site to see the current challenge promo.",
    url: "https://ftmo.com",
    expiry: "",
    source: "catalog",
  },
  {
    id: "fundingpips",
    firm: "FundingPips",
    code: "",
    discount: "Check live offer",
    details: "FundingPips posts rotating coupon codes for evaluations. Visit the offer page for the latest code.",
    url: "https://www.fundingpips.com",
    expiry: "",
    source: "catalog",
  },
  {
    id: "fundednext",
    firm: "FundedNext",
    code: "",
    discount: "Check live offer",
    details: "FundedNext often advertises limited-time challenge discounts. Confirm the code on checkout.",
    url: "https://fundednext.com",
    expiry: "",
    source: "catalog",
  },
  {
    id: "the5ers",
    firm: "The5ers",
    code: "",
    discount: "Check live offer",
    details: "The5ers high-stakes and bootcamp programs run occasional promo pricing.",
    url: "https://the5ers.com",
    expiry: "",
    source: "catalog",
  },
  {
    id: "e8",
    firm: "E8 Markets",
    code: "",
    discount: "Check live offer",
    details: "E8 Markets publishes evaluation discounts and seasonal coupon codes on their pricing page.",
    url: "https://e8markets.com",
    expiry: "",
    source: "catalog",
  },
  {
    id: "fxify",
    firm: "FXIFY",
    code: "",
    discount: "Check live offer",
    details: "FXIFY lists current account discounts on their official site when a campaign is live.",
    url: "https://fxify.com",
    expiry: "",
    source: "catalog",
  },
  {
    id: "alpha",
    firm: "Alpha Capital",
    code: "",
    discount: "Check live offer",
    details: "Alpha Capital Group runs evaluation promotions. Use the official checkout to apply any published code.",
    url: "https://alphacapitalgroup.uk",
    expiry: "",
    source: "catalog",
  },
  {
    id: "goat",
    firm: "Goat Funded Trader",
    code: "",
    discount: "Check live offer",
    details: "Goat Funded Trader frequently posts coupon codes for challenge fees.",
    url: "https://www.goatfundedtrader.com",
    expiry: "",
    source: "catalog",
  },
];

export async function loadPropDeals(): Promise<{ deals: PropDeal[]; live: boolean }> {
  try {
    const res = await fetch("/api/prop-deals", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("deals unavailable");
    const json = (await res.json()) as { deals?: PropDeal[] };
    const deals = Array.isArray(json.deals) ? json.deals.filter((d) => d?.firm && d?.url) : [];
    if (deals.length) return { deals, live: deals.some((d) => d.source === "live") };
  } catch {
    /* use catalog */
  }
  return { deals: FALLBACK_PROP_DEALS, live: false };
}
