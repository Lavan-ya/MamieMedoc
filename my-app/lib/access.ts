import type { ProfileType } from "./profile";

// Which pages each profile may open. Shared by proxy.ts (redirects), AppNav
// (tabs) and the profile picker. Decided by the profile's type, so family
// members added from the app get the same access as the demo ones.
// The patient (Jeanne) has her care view and can scan her own prescriptions;
// family members have everything except her care view.
export const MAMIE_PAGES = ["/mamie"];
export const FAMILY_PAGES = ["/family"];
export const SHARED_PAGES = ["/prescriptions"];

export function isProfileType(value: unknown): value is ProfileType {
  return value === "patient" || value === "family";
}

export function isMamie(type: ProfileType | null | undefined) {
  return type === "patient";
}

/** Where a profile lands after choosing it, or when it opens a page it cannot see. */
export function homeFor(type: ProfileType) {
  return isMamie(type) ? "/mamie" : "/family";
}

function matches(pathname: string, pages: string[]) {
  return pages.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

/** null = not a profile-restricted page (landing, sign-in, profile picker...). */
export function allowedProfiles(pathname: string): "mamie" | "family" | "any" | null {
  if (matches(pathname, MAMIE_PAGES)) return "mamie";
  if (matches(pathname, FAMILY_PAGES)) return "family";
  if (matches(pathname, SHARED_PAGES)) return "any";
  return null;
}

/** `type` is the chosen profile's type (cookie), or undefined when none is chosen. */
export function canOpen(type: string | undefined | null, pathname: string) {
  const audience = allowedProfiles(pathname);
  if (audience === null) return true;
  if (!isProfileType(type)) return false;
  if (audience === "any") return true;
  return audience === "mamie" ? isMamie(type) : !isMamie(type);
}
