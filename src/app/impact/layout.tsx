import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Impact — mesurer l’insertion professionnelle",
  description:
    "Découvrez le cadre de mesure du pilote Yahnu en Côte d’Ivoire, ses objectifs proposés et les indicateurs suivis sans confondre ambitions et résultats.",
  path: "/impact",
});

export default function ImpactLayout({ children }: { children: ReactNode }) {
  return children;
}
