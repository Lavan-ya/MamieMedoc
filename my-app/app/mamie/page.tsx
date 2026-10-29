import type { Metadata } from "next";

import { AppNav } from "@/components/AppNav";
import { LiveRefresh } from "@/components/live-refresh";
import { MamieCare } from "@/components/mamie/MamieCare";
import { getCareCircleToday, getGarden } from "@/lib/api";
import { demoData } from "@/lib/demo-data";
import {
  demoDoses,
  demoNotes,
  stockAlertNotes,
  toCallMember,
  toMamieDose,
} from "@/lib/mamie";
import { getWeather } from "@/lib/weather";

export const metadata: Metadata = {
  title: `${demoData.mamie.name} — MamieMédoc`,
  description: `Today's medicines and family contacts for ${demoData.mamie.name}.`,
};

export default async function MamiePage() {
  // Falls back to the demo (actions stay on this screen) when the API is down.
  const [today, weather, garden] = await Promise.all([
    getCareCircleToday().catch(() => null),
    getWeather(),
    getGarden(12).catch(() => null),
  ]);
  const members = today ? today.members.map(toCallMember) : demoData.members;
  const caregiver =
    today?.members.find((member) => member.isPrimaryCaregiver)?.firstName ??
    demoData.refill.broughtBy;

  return (
    <>
      <AppNav />
      {/* Re-renders when Jeanne's data changes elsewhere (new prescription...),
          and every 2 minutes so a dose marked missed leaves her screen. */}
      <LiveRefresh everyMs={120_000} />
      <MamieCare
        live={today !== null}
        doses={today ? today.doses.map(toMamieDose) : demoDoses()}
        members={members}
        familyName={caregiver}
        weather={weather}
        garden={garden}
        familyNotes={today ? stockAlertNotes(today.stockAlerts ?? []) : demoNotes()}
      />
    </>
  );
}
