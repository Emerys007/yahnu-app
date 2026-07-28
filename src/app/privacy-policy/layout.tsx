import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Politique de confidentialité",
  description:
    "Comprendre comment Yahnu protège les données des jeunes diplômés, établissements, entreprises et équipes de la plateforme.",
  path: "/privacy-policy",
});

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
