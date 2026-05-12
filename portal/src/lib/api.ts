const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const code = body && typeof body === "object" && "error" in body ? String((body as Record<string, unknown>).error) : undefined;
    throw new ApiError(`${res.status} ${path}`, res.status, code);
  }
  return body as T;
}

export interface MeResponse {
  address: string;
  email: string | null;
  email_verified: boolean;
  notif_prefs: { cliff_7d: boolean; cliff_1d: boolean; claim_ready: boolean };
  language: string;
}

export const api = {
  authNonce: (address: string) =>
    request<{ nonce: string; message: string }>("/api/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ address }),
    }),
  authVerify: (message: string, signature: string) =>
    request<{ address: string }>("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ message, signature }),
    }),
  authLogout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me: () => request<MeResponse>("/api/me"),
  updateMe: (input: Partial<Pick<MeResponse, "language" | "notif_prefs">>) =>
    request<{ ok: true }>("/api/me", { method: "PUT", body: JSON.stringify(input) }),
  subscribeEmail: (email: string) =>
    request<{ ok: true }>("/api/me/email", { method: "POST", body: JSON.stringify({ email }) }),
  unsubscribeEmail: () =>
    request<{ ok: true }>("/api/me/email", { method: "DELETE" }),
};
