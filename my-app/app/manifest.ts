import type { MetadataRoute } from "next";

// Lets MamieMédoc be added to the Home Screen. On iPad/iPhone this is required
// for medication reminders: Safari only allows Web Push for installed web apps.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MamieMédoc",
    short_name: "MamieMédoc",
    description: "Medication reminders for Jeanne and her family.",
    start_url: "/mamie",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#2e7d32",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
