import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Emplois et stages en Côte d’Ivoire",
  description:
    "Explorez les emplois, stages et premières expériences publiés sur Yahnu ou vérifiés depuis les sources officielles d’employeurs en Côte d’Ivoire et en Afrique.",
  path: "/jobs",
  keywords: ["emploi Abidjan", "stage Abidjan", "recrutement Côte d’Ivoire", "emploi Afrique"],
});

export default function JobsLayout({ children }: { children: ReactNode }) {
  return children;
}
