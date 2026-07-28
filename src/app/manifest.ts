import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yahnu — Le talent ivoirien en mouvement",
    short_name: "Yahnu",
    description:
      "Emploi, compétences et connexions professionnelles pour les jeunes diplômés de Côte d’Ivoire.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7ef",
    theme_color: "#14613f",
    lang: "fr-CI",
    categories: ["business", "education", "productivity"],
    icons: [
      {
        src: "/images/yahnu-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
