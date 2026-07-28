import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Entreprises et recrutement en Côte d’Ivoire",
  description:
    "Découvrez les employeurs présents sur Yahnu, leurs opportunités ouvertes et les parcours pour recruter de jeunes talents ivoiriens.",
  path: "/companies",
});

export default function CompaniesLayout({ children }: { children: ReactNode }) {
  return children;
}
