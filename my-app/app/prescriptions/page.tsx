import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { PrescriptionReview } from "@/components/prescription-review";

export const metadata: Metadata = {
  title: "MamieMedoc — Prescription Scan & Review",
  description: "Scan a prescription, review the detected medications, and manage Jeanne's schedule.",
};

export default function PrescriptionsPage() {
  return (
    <>
      <AppNav />
      <PrescriptionReview />
    </>
  );
}
