import { isProfileId, type ProfileId } from "./profile";

// Which pages each profile may open. Shared by proxy.ts (redirects) and AppNav (tabs).
// Jeanne has her care view and can scan her own prescriptions; family members
// have everything except her care view.
export const MAMIE_PAGES = ["/mamie"];
export const FAMILY_PAGES = ["/family"];
export const SHARED_PAGES = ["/prescriptions"];

export function isMamie(profile: ProfileId) {
  return profile === "jeanne";
}

/** Where a profile lands after choosing it, or when it opens a page it cannot see. */
export function homeFor(profile: ProfileId) {
  return isMamie(profile) ? "/mamie" : "/family";
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

export function canOpen(profile: string | undefined | null, pathname: string) {
  const audience = allowedProfiles(pathname);
  if (audience === null) return true;
  if (!isProfileId(profile)) return false;
  if (audience === "any") return true;
  return audience === "mamie" ? isMamie(profile) : !isMamie(profile);
}
