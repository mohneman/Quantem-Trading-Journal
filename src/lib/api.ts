import type { AuthResult, AuthUser, StoreData, UserRole } from "../store";
import { consumeReferralCode } from "./referral";

const TOKEN_KEY = "q-api-token";

export type RemoteUser = AuthUser;

type Json = Record<string, unknown>;

export function getApiToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setApiToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getApiToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`/api/${path.replace(/^\//, "")}`, { ...init, headers });
  const json = (await res.json().catch(() => ({}))) as Json;
  if (!res.ok) {
    const err = String(json.error || `Request failed (${res.status})`);
    const error = new Error(err) as Error & { status?: number; awaitingApproval?: boolean };
    error.status = res.status;
    error.awaitingApproval = Boolean(json.awaitingApproval) || err.toLowerCase().includes("approval");
    throw error;
  }
  return json as T;
}

export async function probeApi(): Promise<boolean> {
  try {
    const res = await fetch("/api/health", { headers: { Accept: "application/json" } });
    if (!res.ok) return false;
    const json = (await res.json()) as { ok?: boolean };
    return json.ok === true;
  } catch {
    return false;
  }
}

export async function apiLogin(email: string, password: string) {
  const out = await request<{ token: string; user: RemoteUser }>("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setApiToken(out.token);
  return out.user;
}

export async function apiSignup(input: { name: string; email: string; password: string; phone?: string }): Promise<AuthResult> {
  try {
    await request("auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...input, referredByCode: consumeReferralCode() }),
    });
    return { error: "Contact the admin for approval", awaitingApproval: true };
  } catch (err) {
    const e = err as Error & { awaitingApproval?: boolean };
    return { error: e.message, awaitingApproval: e.awaitingApproval };
  }
}

export async function apiGoogle(profile: { name: string; email: string }): Promise<{ user?: RemoteUser } & AuthResult> {
  try {
    const out = await request<{ token: string; user: RemoteUser }>("auth/google", {
      method: "POST",
      body: JSON.stringify({ ...profile, referredByCode: consumeReferralCode() }),
    });
    setApiToken(out.token);
    return { error: null, user: out.user };
  } catch (err) {
    const e = err as Error & { awaitingApproval?: boolean };
    return { error: e.message, awaitingApproval: e.awaitingApproval };
  }
}

export async function apiLogout() {
  try {
    await request("auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  setApiToken(null);
}

export async function apiMe() {
  return request<{ user: RemoteUser; users: RemoteUser[] }>("auth/me");
}

export async function apiForgot(email: string) {
  try {
    return await request<{ error: null; token?: string }>("auth/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Reset failed" };
  }
}

export async function apiReset(email: string, token: string, password: string) {
  const out = await request<{ token: string; user: RemoteUser }>("auth/reset", {
    method: "POST",
    body: JSON.stringify({ email, token, password }),
  });
  setApiToken(out.token);
  return out.user;
}

export async function apiGetData() {
  const out = await request<{ data: Partial<StoreData> }>("data");
  return out.data;
}

export async function apiPutData(data: StoreData) {
  await request("data", { method: "PUT", body: JSON.stringify({ data }) });
}

export async function apiListUsers() {
  const out = await request<{ users: RemoteUser[] }>("users");
  return out.users;
}

export async function apiCreateUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}) {
  const out = await request<{ user: RemoteUser }>("users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return out.user;
}

export async function apiUpdateUser(
  id: string,
  patch: Partial<Pick<AuthUser, "name" | "email" | "phone" | "role" | "status">>
) {
  const out = await request<{ user: RemoteUser }>(`users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return out.user;
}

export async function apiSetPassword(id: string, password: string) {
  await request(`users/${id}/password`, { method: "POST", body: JSON.stringify({ password }) });
}

export async function apiDeleteUser(id: string) {
  await request(`users/${id}`, { method: "DELETE" });
}

export async function apiResetUserData(id: string) {
  const out = await request<{ data?: StoreData }>(`users/${id}/reset-data`, { method: "POST" });
  return out.data;
}

export function isApprovalError(err: unknown) {
  const e = err as Error & { awaitingApproval?: boolean };
  return Boolean(e.awaitingApproval) || (e.message || "").includes("approval");
}
