import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Il Mio Congelatore",
    short_name: "Congelatore",
    description:
      "Il modo semplice per sapere sempre cosa hai nel congelatore: cosa consumare prima, diviso per categoria.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f1",
    theme_color: "#0f7a72",
    lang: "it",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "maskable" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
