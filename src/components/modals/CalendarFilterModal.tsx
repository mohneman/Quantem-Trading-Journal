import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { CalImpact } from "../../lib/economicCalendar";
import {
  CALENDAR_CURRENCIES,
  CALENDAR_REGIONS,
  currenciesForRegion,
  DEFAULT_CALENDAR_CURRENCIES,
  type CalendarRegion,
} from "../../lib/calendarCurrencies";

const IMPACTS: { key: CalImpact; label: string; color: string }[] = [
  { key: "HIGH", label: "High", color: "text-red-500" },
  { key: "MED", label: "Medium", color: "text-orange-500" },
  { key: "LOW", label: "Low", color: "text-emerald-600" },
];

type Props = {
  selected: string[];
  impacts: CalImpact[];
  extraCodes: string[];
  onApply: (currencies: string[], impacts: CalImpact[]) => void;
  onClose: () => void;
};

export function CalendarFilterModal({ selected, impacts, extraCodes, onApply, onClose }: Props) {
  const [draftCurrencies, setDraftCurrencies] = useState<string[]>(selected);
  const [draftImpacts, setDraftImpacts] = useState<CalImpact[]>(impacts);
  const [includeNone, setIncludeNone] = useState(false);
  const [mode, setMode] = useState<"Currency" | "Country">("Currency");
  const [region, setRegion] = useState<CalendarRegion>("All");
  const [query, setQuery] = useState("");

  const catalog = useMemo(() => {
    const known = new Set(CALENDAR_CURRENCIES.map((c) => c.code));
    const extras = extraCodes
      .filter((code) => !known.has(code))
      .map((code) => ({ code, iso2: code.slice(0, 2), country: code, flag: "🏳️", region: "Europe" as const }));
    return [...CALENDAR_CURRENCIES, ...extras];
  }, [extraCodes]);

  const visible = catalog.filter((c) => {
    if (region === "G20") {
      const hit = CALENDAR_CURRENCIES.find((x) => x.code === c.code);
      if (!hit?.g20) return false;
    } else if (region !== "All" && c.region !== region) {
      return false;
    }
    const hay = `${c.code} ${c.country}`.toLowerCase();
    return !query.trim() || hay.includes(query.trim().toLowerCase());
  });

  function toggleCurrency(code: string) {
    setDraftCurrencies((curr) => (curr.includes(code) ? curr.filter((c) => c !== code) : [...curr, code]));
  }

  function toggleImpact(key: CalImpact) {
    setDraftImpacts((curr) => (curr.includes(key) ? curr.filter((c) => c !== key) : [...curr, key]));
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 py-10 sm:p-8">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close calendar filters" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-xl border border-line bg-white p-5 shadow-modal dark:border-[#243041] dark:bg-[#151a21]">
        <div className="flex flex-wrap items-center gap-4 border-b border-line pb-4 dark:border-[#243041]">
          <p className="w-16 text-xs font-semibold text-ink-muted">Impact</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {IMPACTS.map((item) => (
              <label key={item.key} className={`inline-flex items-center gap-2 ${item.color}`}>
                <input
                  type="checkbox"
                  className="accent-orange-500"
                  checked={draftImpacts.includes(item.key)}
                  onChange={() => toggleImpact(item.key)}
                />
                {item.label}
              </label>
            ))}
            <label className="inline-flex items-center gap-2 text-ink-muted">
              <input type="checkbox" className="accent-orange-500" checked={includeNone} onChange={() => setIncludeNone((v) => !v)} />
              No Impact
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="w-16 text-xs font-semibold text-ink-muted">Filter By</p>
          {(["Currency", "Country"] as const).map((item) => (
            <label key={item} className="inline-flex items-center gap-2 text-sm text-ink">
              <input type="radio" name="cal-filter-mode" checked={mode === item} onChange={() => setMode(item)} className="accent-orange-500" />
              {item}
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {CALENDAR_REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRegion(r);
                if (r !== "All") setDraftCurrencies(currenciesForRegion(r));
                else setDraftCurrencies(catalog.map((c) => c.code));
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                region === r ? "bg-slate-800 text-white dark:bg-white dark:text-ink" : "bg-slate-100 text-ink-muted dark:bg-white/10"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input h-9 pl-9 text-sm"
              placeholder="Search currencies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="button" className="text-xs font-semibold text-ink-muted hover:text-ink" onClick={() => setDraftCurrencies([])}>
            None
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-ink-muted hover:text-ink"
            onClick={() => setDraftCurrencies(visible.map((c) => c.code))}
          >
            All
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-ink-muted hover:text-ink"
            onClick={() => {
              setDraftCurrencies(DEFAULT_CALENDAR_CURRENCIES);
              setDraftImpacts(["HIGH", "MED", "LOW"]);
              setIncludeNone(false);
              setRegion("All");
              setQuery("");
            }}
          >
            Reset
          </button>
        </div>

        <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-line p-3 dark:border-[#243041]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            {visible.map((c) => (
              <label key={c.code} className="inline-flex items-center gap-2 text-sm text-ink dark:text-slate-100">
                <input
                  type="checkbox"
                  className="accent-orange-500"
                  checked={draftCurrencies.includes(c.code)}
                  onChange={() => toggleCurrency(c.code)}
                />
                <span className="text-base leading-none">{c.flag}</span>
                <span className="font-medium">{mode === "Country" ? c.country : c.code}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost h-10 px-4 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn h-10 bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600"
            onClick={() => onApply(draftCurrencies, draftImpacts.length ? draftImpacts : ["HIGH", "MED", "LOW"])}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
