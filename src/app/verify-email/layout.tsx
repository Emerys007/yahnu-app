import type { ReactNode } from "react";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Vérifier mon adresse e-mail");

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return children;
}
