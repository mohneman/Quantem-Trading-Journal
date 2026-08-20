const REF_KEY = "q-pending-ref";

export function makeReferralCode(name: string, id: string, taken: Set<string>) {
  const prefix = (name.replace(/[^a-zA-Z]/g, "").slice(0, 5) || "USER").toUpperCase();
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "CODE";
  let code = `${prefix}${tail}`;
  let n = 2;
  while (taken.has(code)) {
    code = `${prefix}${tail}${n}`;
    n += 1;
  }
  taken.add(code);
  return code;
}

export function captureReferralCode(raw: string | null | undefined) {
  const code = (raw || "").trim().toUpperCase();
  if (code) localStorage.setItem(REF_KEY, code);
}

export function consumeReferralCode() {
  const code = (localStorage.getItem(REF_KEY) || "").trim().toUpperCase();
  if (code) localStorage.removeItem(REF_KEY);
  return code;
}

export function peekReferralCode() {
  return (localStorage.getItem(REF_KEY) || "").trim().toUpperCase();
}

export function referralSignupLink(code: string) {
  const origin = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`;
  return `${origin}#/signup?ref=${encodeURIComponent(code)}`;
}
