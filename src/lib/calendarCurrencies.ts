export type CalendarRegion = "All" | "G20" | "Asia" | "Middle East" | "Europe" | "Americas" | "Africa";

export type CalendarCurrency = {
  code: string;
  iso2: string;
  country: string;
  flag: string;
  region: Exclude<CalendarRegion, "All" | "G20">;
  g20?: boolean;
};

export const DEFAULT_CALENDAR_CURRENCIES = ["CHF", "EUR", "GBP", "USD"];

export const CALENDAR_CURRENCIES: CalendarCurrency[] = [
  { code: "AUD", iso2: "AU", country: "Australia", flag: "🇦🇺", region: "Asia", g20: true },
  { code: "BRL", iso2: "BR", country: "Brazil", flag: "🇧🇷", region: "Americas", g20: true },
  { code: "CAD", iso2: "CA", country: "Canada", flag: "🇨🇦", region: "Americas", g20: true },
  { code: "CHF", iso2: "CH", country: "Switzerland", flag: "🇨🇭", region: "Europe" },
  { code: "CLP", iso2: "CL", country: "Chile", flag: "🇨🇱", region: "Americas" },
  { code: "CNY", iso2: "CN", country: "China", flag: "🇨🇳", region: "Asia", g20: true },
  { code: "COP", iso2: "CO", country: "Colombia", flag: "🇨🇴", region: "Americas" },
  { code: "CZK", iso2: "CZ", country: "Czech Republic", flag: "🇨🇿", region: "Europe" },
  { code: "DKK", iso2: "DK", country: "Denmark", flag: "🇩🇰", region: "Europe" },
  { code: "EUR", iso2: "EU", country: "Euro Zone", flag: "🇪🇺", region: "Europe", g20: true },
  { code: "GBP", iso2: "GB", country: "United Kingdom", flag: "🇬🇧", region: "Europe", g20: true },
  { code: "HKD", iso2: "HK", country: "Hong Kong", flag: "🇭🇰", region: "Asia" },
  { code: "HUF", iso2: "HU", country: "Hungary", flag: "🇭🇺", region: "Europe" },
  { code: "IDR", iso2: "ID", country: "Indonesia", flag: "🇮🇩", region: "Asia", g20: true },
  { code: "ILS", iso2: "IL", country: "Israel", flag: "🇮🇱", region: "Middle East" },
  { code: "INR", iso2: "IN", country: "India", flag: "🇮🇳", region: "Asia", g20: true },
  { code: "ISK", iso2: "IS", country: "Iceland", flag: "🇮🇸", region: "Europe" },
  { code: "JPY", iso2: "JP", country: "Japan", flag: "🇯🇵", region: "Asia", g20: true },
  { code: "KRW", iso2: "KR", country: "South Korea", flag: "🇰🇷", region: "Asia", g20: true },
  { code: "MXN", iso2: "MX", country: "Mexico", flag: "🇲🇽", region: "Americas", g20: true },
  { code: "MYR", iso2: "MY", country: "Malaysia", flag: "🇲🇾", region: "Asia" },
  { code: "NOK", iso2: "NO", country: "Norway", flag: "🇳🇴", region: "Europe" },
  { code: "NZD", iso2: "NZ", country: "New Zealand", flag: "🇳🇿", region: "Asia" },
  { code: "PHP", iso2: "PH", country: "Philippines", flag: "🇵🇭", region: "Asia" },
  { code: "PLN", iso2: "PL", country: "Poland", flag: "🇵🇱", region: "Europe" },
  { code: "RON", iso2: "RO", country: "Romania", flag: "🇷🇴", region: "Europe" },
  { code: "RUB", iso2: "RU", country: "Russia", flag: "🇷🇺", region: "Europe", g20: true },
  { code: "SAR", iso2: "SA", country: "Saudi Arabia", flag: "🇸🇦", region: "Middle East", g20: true },
  { code: "SEK", iso2: "SE", country: "Sweden", flag: "🇸🇪", region: "Europe" },
  { code: "SGD", iso2: "SG", country: "Singapore", flag: "🇸🇬", region: "Asia" },
  { code: "THB", iso2: "TH", country: "Thailand", flag: "🇹🇭", region: "Asia" },
  { code: "TRY", iso2: "TR", country: "Turkey", flag: "🇹🇷", region: "Middle East", g20: true },
  { code: "TWD", iso2: "TW", country: "Taiwan", flag: "🇹🇼", region: "Asia" },
  { code: "USD", iso2: "US", country: "United States", flag: "🇺🇸", region: "Americas", g20: true },
  { code: "ZAR", iso2: "ZA", country: "South Africa", flag: "🇿🇦", region: "Africa", g20: true },
  { code: "NGN", iso2: "NG", country: "Nigeria", flag: "🇳🇬", region: "Africa" },
  { code: "EGP", iso2: "EG", country: "Egypt", flag: "🇪🇬", region: "Africa" },
  { code: "KES", iso2: "KE", country: "Kenya", flag: "🇰🇪", region: "Africa" },
  { code: "AED", iso2: "AE", country: "UAE", flag: "🇦🇪", region: "Middle East" },
  { code: "QAR", iso2: "QA", country: "Qatar", flag: "🇶🇦", region: "Middle East" },
  { code: "KWD", iso2: "KW", country: "Kuwait", flag: "🇰🇼", region: "Middle East" },
  { code: "FJD", iso2: "FJ", country: "Fiji", flag: "🇫🇯", region: "Asia" },
];

export const CALENDAR_REGIONS: CalendarRegion[] = ["All", "G20", "Asia", "Middle East", "Europe", "Americas", "Africa"];

export function currenciesForRegion(region: CalendarRegion) {
  if (region === "All") return CALENDAR_CURRENCIES.map((c) => c.code);
  if (region === "G20") return CALENDAR_CURRENCIES.filter((c) => c.g20).map((c) => c.code);
  return CALENDAR_CURRENCIES.filter((c) => c.region === region).map((c) => c.code);
}

export function pairLabel(code: string) {
  const hit = CALENDAR_CURRENCIES.find((c) => c.code === code);
  return `${hit?.iso2 ?? code.slice(0, 2)} ${code}`;
}

/** Calendar table + clock use GMT, so "today" follows UTC. */
export function gmtYmd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function eventGmtYmd(iso: string) {
  return gmtYmd(new Date(iso));
}
