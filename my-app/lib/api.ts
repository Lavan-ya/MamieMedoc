export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const SESSION_STORAGE_KEY = "mmd-session";

export const SERVER_UNAVAILABLE = "Server unavailable, try the demo account.";

export const DEMO_EMAIL = "demo@mamiemedoc.app";
export const DEMO_PASSWORD = "Mamie2026!";

export type Account = {
  familyName: string;
  name: string;
  email: string;
};

export type Session = Account & { token: string };

/** Error with a message that is safe to show to the user. */
export class ApiError extends Error {}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(SERVER_UNAVAILABLE);
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // NestJS errors look like { statusCode, message, error }.
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? (data as { message: unknown }).message
        : null;
    throw new ApiError(
      typeof message === "string" ? message : SERVER_UNAVAILABLE,
    );
  }

  return data as T;
}

export function signIn(email: string, password: string) {
  return post<Session>("/auth/signin", { email, password });
}

export function signUp(input: Account & { password: string }) {
  return post<Account>("/auth/signup", input);
}

/** A profile from GET /profiles: the patient first, then family members. */
export type Profile = {
  key: string;
  type: "patient" | "family";
  firstName: string;
  role: string;
  avatarUrl: string | null;
};

export function getProfiles() {
  return request<Profile[]>("/profiles", { cache: "no-store" });
}

export function addFamilyMember(input: {
  firstName: string;
  relation: string;
  phone: string;
}) {
  return post<Profile>("/family", input);
}

/** Sign in as the demo account. Never throws: the demo must always work. */
export async function signInAsDemo(): Promise<void> {
  try {
    saveSession(await signIn(DEMO_EMAIL, DEMO_PASSWORD));
  } catch {
    // Server unreachable or demo account changed: continue without a session.
  }
}

export function saveSession(session: Session): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable; the demo should keep working.
  }
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Session).familyName === "string"
      ? (parsed as Session)
      : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable; nothing to do.
  }
}
