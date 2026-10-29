"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { focusRing } from "@/components/auth/auth-ui";
import { clearSession, readSession } from "@/lib/api";

/** Shows who is signed in. Renders nothing without a session: the demo never blocks. */
export function SessionBar() {
  const router = useRouter();
  const [familyName, setFamilyName] = useState<string | null>(null);

  useEffect(() => {
    // localStorage only exists in the browser, so read it after mount.
    setFamilyName(readSession()?.familyName ?? null);
  }, []);

  if (!familyName) return null;

  function handleSignOut() {
    clearSession();
    router.push("/signin");
  }

  return (
    <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[18px] text-on-surface-variant">
      <span>
        Signed in as{" "}
        <span className="font-semibold text-on-surface">{familyName}</span>
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className={`rounded-full px-2 py-1 text-[16px] font-semibold text-primary underline underline-offset-4 hover:text-on-secondary-container ${focusRing}`}
      >
        Sign out
      </button>
    </p>
  );
}
