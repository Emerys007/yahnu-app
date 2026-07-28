import type { ReactNode } from "react";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Renvoyer l’e-mail de vérification");

export default function ResendVerificationLayout({ children }: { children: ReactNode }) {
  return children;
}
