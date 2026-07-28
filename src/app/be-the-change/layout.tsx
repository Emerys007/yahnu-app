import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "BE THE CHANGE — le pacte d’insertion Yahnu",
  description:
    "Le pacte Yahnu organise une responsabilité partagée entre jeunes diplômés, établissements, entreprises et institutions de Côte d’Ivoire.",
  path: "/be-the-change",
});

export default function BeTheChangeLayout({ children }: { children: ReactNode }) {
  return children;
}
