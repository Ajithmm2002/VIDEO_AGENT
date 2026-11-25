import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Content Studio",
    short_name: "Studio",
    description: "Plan, write, and schedule YouTube and Instagram videos.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fafafa",
    theme_color: "#7c3aed",
    categories: ["productivity", "social"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New content", url: "/content/new" },
      { name: "Calendar", url: "/calendar" },
      { name: "Planner", url: "/planner" },
    ],
  };
}
