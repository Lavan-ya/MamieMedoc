import { demoData } from "./demo-data";

export const PROFILE_STORAGE_KEY = "mmd-profile";
export const PROFILE_INFO_STORAGE_KEY = "mmd-profile-info";
export const PROFILE_CHANGED_EVENT = "mmd-profile-change";
/** Same key as localStorage, readable by the server. */
export const PROFILE_COOKIE = "mmd-profile";
/** "patient" or "family": what proxy.ts uses to decide which pages open. */
export const PROFILE_TYPE_COOKIE = "mmd-profile-type";

function setCookie(name: string, value: string | null) {
  document.cookie = value
    ? `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
    : `${name}=; path=/; max-age=0; samesite=lax`;
}

function writeProfileCookies(profile: ProfileId | null, type: ProfileType | null) {
  setCookie(PROFILE_COOKIE, profile);
  setCookie(PROFILE_TYPE_COOKIE, type);
}

/** The demo profiles. Profiles added from the app can use any other key. */
export const PROFILE_IDS = ["jeanne", "lavanya", "amar", "sophie"] as const;

/** A profile key: the first name in lowercase, e.g. "jeanne" or "marc". */
export type ProfileId = string;

export type ProfileType = "patient" | "family";

/** Who is connected, saved next to the key so every page can show it. */
export type ProfileInfo = {
  key: ProfileId;
  firstName: string;
  type: ProfileType;
  role: string;
  avatarUrl: string | null;
};

export function isProfileId(value: unknown): value is ProfileId {
  return typeof value === "string" && value.trim() !== "";
}

function readProfileCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${PROFILE_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Read the chosen profile. Returns null on the server or when unset/invalid.
 * The cookie wins: it is what proxy.ts uses to decide which pages open.
 */
export function readProfile(): ProfileId | null {
  if (typeof window === "undefined") return null;

  const fromCookie = readProfileCookie();
  if (isProfileId(fromCookie)) return fromCookie;
  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return isProfileId(stored) ? stored : null;
  } catch {
    // localStorage may be unavailable (private mode, blocked storage).
    return null;
  }
}

/** Demo-data details for a demo key, used when no info was saved. */
function demoProfileInfo(key: ProfileId): ProfileInfo | null {
  if (key === demoData.mamie.profile) {
    return {
      key,
      firstName: demoData.mamie.name.split(" ")[0],
      type: "patient",
      role: "Mamie",
      avatarUrl: demoData.mamie.image,
    };
  }

  const member = demoData.members.find((m) => m.profile === key);
  return member
    ? {
        key,
        firstName: member.name,
        type: "family",
        role: member.role,
        avatarUrl: member.image,
      }
    : null;
}

function parseProfileInfo(raw: string | null, key: ProfileId) {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (typeof parsed !== "object" || parsed === null) return null;
    const info = parsed as ProfileInfo;
    return info.key === key &&
      typeof info.firstName === "string" &&
      (info.type === "patient" || info.type === "family")
      ? info
      : null;
  } catch {
    return null;
  }
}

// Cache so repeated reads return the same object (needed by useSyncExternalStore).
let cachedInfo: { source: string; info: ProfileInfo | null } | null = null;

/**
 * Read who is connected: first name, type ("patient" or "family"), role.
 * Falls back to the demo data for the demo profiles. Null when unset.
 */
export function readProfileInfo(): ProfileInfo | null {
  const key = readProfile();
  if (!key) return null;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PROFILE_INFO_STORAGE_KEY);
  } catch {
    // Storage can be unavailable; use the demo fallback.
  }

  const source = `${key}\n${raw ?? ""}`;
  if (cachedInfo?.source !== source) {
    cachedInfo = {
      source,
      info: parseProfileInfo(raw, key) ?? demoProfileInfo(key),
    };
  }
  return cachedInfo.info;
}

/**
 * Persist the chosen profile. Pass `info` to also save who is connected.
 * No-op on the server or when storage is blocked.
 */
export function saveProfile(
  profile: ProfileId,
  info?: Omit<ProfileInfo, "key">,
): void {
  if (typeof window === "undefined") return;

  try {
    // Profiles from the database carry their type; demo keys fall back to the demo data.
    writeProfileCookies(profile, info?.type ?? demoProfileInfo(profile)?.type ?? "family");
    window.localStorage.setItem(PROFILE_STORAGE_KEY, profile);
    if (info) {
      window.localStorage.setItem(
        PROFILE_INFO_STORAGE_KEY,
        JSON.stringify({ ...info, key: profile }),
      );
    } else {
      window.localStorage.removeItem(PROFILE_INFO_STORAGE_KEY);
    }
    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
  } catch {
    // Storage can be unavailable; the demo should keep working.
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;

  try {
    writeProfileCookies(null, null);
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    window.localStorage.removeItem(PROFILE_INFO_STORAGE_KEY);
    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
  } catch {
    // Storage can be unavailable; nothing to do.
  }
}
