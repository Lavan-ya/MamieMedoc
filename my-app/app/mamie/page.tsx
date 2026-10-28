import type { Metadata } from "next";

import { AppNav } from "@/components/AppNav";
import { MamieCare } from "@/components/mamie/MamieCare";
import { demoData } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: `${demoData.mamie.name} — MamieMédoc`,
  description: `Today's medicines and family contacts for ${demoData.mamie.name}.`,
};

export default function MamiePage() {
  return (
    <>
      <AppNav />
      <MamieCare />
    </>
  );
}
