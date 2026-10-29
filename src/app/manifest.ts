import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Whispr — say it anonymously",
    short_name: "Whispr",
    description: "Anonymous questions, thoughtful answers, your space.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090611",
    theme_color: "#090611",
    categories: ["social", "lifestyle"],
    icons: [
      { src: "/icons/whispr.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/whispr-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
