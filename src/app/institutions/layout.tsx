import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Établissements et institutions — suivre l’insertion",
  description:
    "Yahnu aide les écoles, universités et institutions ivoiriennes à accompagner les diplômés, travailler avec les employeurs et suivre des résultats réels.",
  path: "/institutions",
});

export default function InstitutionsLayout({ children }: { children: ReactNode }) {
  return children;
}
