import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Écoles et universités en Côte d’Ivoire",
  description:
    "Repérez les établissements ivoiriens et découvrez ceux qui utilisent Yahnu pour accompagner leurs diplômés vers l’emploi.",
  path: "/schools",
  keywords: ["universités Côte d’Ivoire", "écoles supérieures Abidjan", "INP-HB", "UVCI"],
});

export default function SchoolsLayout({ children }: { children: ReactNode }) {
  return children;
}
