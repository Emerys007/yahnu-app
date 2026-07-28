import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Conditions d’utilisation",
  description:
    "Les règles d’utilisation des profils, opportunités, compétences, candidatures et espaces professionnels sur Yahnu.",
  path: "/terms-of-service",
});

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
