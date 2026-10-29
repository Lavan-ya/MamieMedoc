"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { subscribeToPatientEvents } from "@/lib/api";

/**
 * Re-renders the current server page whenever the patient's data changes
 * (a dose confirmed, a new prescription...). With `everyMs`, also refreshes
 * on a timer, so time-based changes (a dose becoming missed) show up even
 * when nothing else happens. Renders nothing.
 */
export function LiveRefresh({ everyMs }: { everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToPatientEvents(() => router.refresh());
    const interval = everyMs ? window.setInterval(() => router.refresh(), everyMs) : undefined;
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [router, everyMs]);

  return null;
}
