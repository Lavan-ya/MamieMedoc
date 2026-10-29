import { NextResponse, type NextRequest } from "next/server";

import { canOpen, homeFor } from "@/lib/access";
import { isProfileId, PROFILE_COOKIE } from "@/lib/profile";

// Sends each profile to the pages it may see: Jeanne to her care view and the
// prescription scan, family members everywhere except her care view.
// No profile yet -> the profile picker.
// This is a navigation guard for the demo profiles, not authentication.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const profile = request.cookies.get(PROFILE_COOKIE)?.value;

  if (canOpen(profile, pathname)) return NextResponse.next();

  const target = isProfileId(profile) ? homeFor(profile) : "/profiles";
  return NextResponse.redirect(new URL(target, request.url));
}

// Must list every page in MAMIE_PAGES, FAMILY_PAGES and SHARED_PAGES (lib/access.ts).
export const config = {
  matcher: ["/mamie/:path*", "/family/:path*", "/prescriptions/:path*"],
};
