import type { ReactNode } from "react";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Créer un nouveau mot de passe");

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
