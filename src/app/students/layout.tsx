import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Jeunes diplômés — rendre ses compétences visibles",
  description:
    "Créez votre profil, démontrez vos compétences, trouvez des emplois et stages et suivez vos candidatures en Côte d’Ivoire avec Yahnu.",
  path: "/students",
  keywords: ["premier emploi Abidjan", "profil jeune diplômé", "stage Côte d’Ivoire"],
});

export default function StudentsLayout({ children }: { children: ReactNode }) {
  return children;
}
