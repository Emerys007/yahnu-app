import type { ReactNode } from "react";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Opportunité vérifiée");

export default function OpportunityDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
