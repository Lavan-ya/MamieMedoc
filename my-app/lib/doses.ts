export const DOSE_STORAGE_PREFIX = "mmd-doses-";
export const DOSE_CHANGED_EVENT = "mmd-doses-change";

export function getDoseStorageKey(dateKey: string) {
  return `${DOSE_STORAGE_PREFIX}${dateKey}`;
}

export function parseDoseSnapshot(snapshot: string): string[] {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function readTakenDoses(dateKey: string): string[] {
  if (typeof window === "undefined" || !dateKey) return [];

  try {
    const raw = window.localStorage.getItem(getDoseStorageKey(dateKey));
    return raw ? parseDoseSnapshot(raw) : [];
  } catch {
    return [];
  }
}

export function getDoseSnapshot(dateKey: string): string {
  return JSON.stringify(readTakenDoses(dateKey));
}

export function saveTakenDoses(dateKey: string, doseIds: string[]): void {
  if (typeof window === "undefined" || !dateKey) return;

  try {
    const uniqueIds = Array.from(new Set(doseIds));
    window.localStorage.setItem(
      getDoseStorageKey(dateKey),
      JSON.stringify(uniqueIds),
    );
    window.dispatchEvent(new Event(DOSE_CHANGED_EVENT));
  } catch {
    // Storage can be unavailable; the demo should keep working.
  }
}

export function clearTakenDoses(dateKey: string): void {
  if (typeof window === "undefined" || !dateKey) return;

  try {
    window.localStorage.removeItem(getDoseStorageKey(dateKey));
    window.dispatchEvent(new Event(DOSE_CHANGED_EVENT));
  } catch {
    // Storage can be unavailable; nothing to do.
  }
}

export function subscribeToDoseChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DOSE_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DOSE_CHANGED_EVENT, onStoreChange);
  };
}
