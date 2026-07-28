import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "À propos — relier le diplôme au premier emploi",
  description:
    "Découvrez la mission de Yahnu : rendre le passage des études à l’emploi plus visible, humain et mesurable en Côte d’Ivoire.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
