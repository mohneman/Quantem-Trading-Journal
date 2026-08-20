export type GoogleProfile = { name: string; email: string };

export const APPROVAL_MSG = "Contact the admin for approval";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

function clientId() {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || "";
}

export function googleClientConfigured() {
  return Boolean(clientId());
}

function loadGsi() {
  if (window.google?.accounts) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Sign-In failed to load.")), { once: true });
      return;
    }
    const el = document.createElement("script");
    el.src = "https://accounts.google.com/gsi/client";
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Google Sign-In failed to load."));
    document.head.appendChild(el);
  });
}

function decodeJwt(credential: string): GoogleProfile {
  const payload = credential.split(".")[1];
  const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  const email = String(json.email || "").trim();
  const name = String(json.name || json.given_name || email.split("@")[0] || "Trader").trim();
  if (!email) throw new Error("Google did not return an email.");
  return { name, email };
}

async function profileFromAccessToken(token: string): Promise<GoogleProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Could not read the Google account.");
  const json = (await res.json()) as { email?: string; name?: string; given_name?: string };
  const email = String(json.email || "").trim();
  const name = String(json.name || json.given_name || email.split("@")[0] || "Trader").trim();
  if (!email) throw new Error("Google did not return an email.");
  return { name, email };
}

export async function signInWithGoogle(): Promise<GoogleProfile> {
  const id = clientId();
  if (!id) throw new Error("NO_CLIENT");
  await loadGsi();
  if (!window.google?.accounts) throw new Error("Google Sign-In is unavailable.");

  if (window.google.accounts.oauth2) {
    return new Promise((resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: id,
        scope: "openid email profile",
        callback: (resp) => {
          if (!resp.access_token) {
            reject(new Error(resp.error || "Google sign-in was cancelled."));
            return;
          }
          profileFromAccessToken(resp.access_token).then(resolve).catch(reject);
        },
      });
      client.requestAccessToken({ prompt: "select_account" });
    });
  }

  return new Promise((resolve, reject) => {
    window.google!.accounts.id.initialize({
      client_id: id,
      ux_mode: "popup",
      callback: (resp) => {
        try {
          resolve(decodeJwt(resp.credential));
        } catch (err) {
          reject(err);
        }
      },
    });
    window.google!.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        reject(new Error("NO_CLIENT"));
      }
    });
  });
}
