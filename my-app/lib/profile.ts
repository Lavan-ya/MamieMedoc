export const PROFILE_STORAGE_KEY = "mmd-profile";
export const PROFILE_CHANGED_EVENT = "mmd-profile-change";

export const PROFILE_IDS = ["jeanne", "lavanya", "amar", "sophie"] as const;

export type ProfileId = (typeof PROFILE_IDS)[number];

export function isProfileId(value: unknown): value is ProfileId {
  return (
    typeof value === "string" &&
    (PROFILE_IDS as readonly string[]).includes(value)
  );
}

/** Read the chosen profile. Returns null on the server or when unset/invalid. */
export function readProfile(): ProfileId | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return isProfileId(stored) ? stored : null;
  } catch {
    // localStorage may be unavailable (private mode, blocked storage).
    return null;
  }
}

/** Persist the chosen profile. No-op on the server or when storage is blocked. */
export function saveProfile(profile: ProfileId): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, profile);
    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
  } catch {
    // Storage can be unavailable; the demo should keep working.
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
  } catch {
    // Storage can be unavailable; nothing to do.
  }
}
