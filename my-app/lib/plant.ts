// Jeanne's weekly plant. Every Monday a new seed is sown; it grows one step on
// each day she takes every planned medicine ("as needed" ones excluded). A
// missed day just means no growth that day: the plant never shrinks or dies.
// On Sunday night it is planted in her garden at the size it reached.

export const GROWTH_DAYS = 7;

export type PlantVariety = {
  name: string;
  petals: string;
  center: string;
  /** How the flower is drawn. */
  shape: "daisy" | "sunflower" | "tulip" | "lavender" | "rose";
  pot: string;
};

// One variety per week, in turn, so the garden fills with different plants.
export const VARIETIES: PlantVariety[] = [
  { name: "Sunflower", petals: "#F5C542", center: "#7A4A1C", shape: "sunflower", pot: "#B5651D" },
  { name: "Tulip", petals: "#E8505B", center: "#B83A44", shape: "tulip", pot: "#9C6B3F" },
  { name: "Lavender", petals: "#9B7ED9", center: "#7A5FC0", shape: "lavender", pot: "#A0704A" },
  { name: "Daisy", petals: "#FFFFFF", center: "#F3C560", shape: "daisy", pot: "#B5651D" },
  { name: "Rose", petals: "#F07A93", center: "#D9506E", shape: "rose", pot: "#8E5B3A" },
  { name: "Poppy", petals: "#E4572E", center: "#2B2B2B", shape: "daisy", pot: "#9C6B3F" },
  { name: "Forget-me-not", petals: "#7DB5F0", center: "#F3D060", shape: "daisy", pot: "#A0704A" },
];

/** The variety sown on a given Monday ("2026-10-26"). */
export function varietyFor(weekStart: string): PlantVariety {
  const [year, month, day] = weekStart.split("-").map(Number);
  const weeks = Math.floor(Date.UTC(year, month - 1, day) / (7 * 86_400_000));
  return VARIETIES[((weeks % VARIETIES.length) + VARIETIES.length) % VARIETIES.length];
}

/** Words for a growth step, 0 (seed) to 7 (in flower). */
export function growthLabel(grown: number) {
  if (grown <= 0) return "Seed";
  if (grown <= 2) return "Sprout";
  if (grown <= 4) return "Young plant";
  if (grown <= 5) return "Growing strong";
  if (grown === 6) return "In bud";
  return "In flower";
}
