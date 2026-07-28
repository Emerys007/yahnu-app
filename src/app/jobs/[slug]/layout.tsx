import type { ReactNode } from "react";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Détail de l’opportunité");

export default function JobDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
