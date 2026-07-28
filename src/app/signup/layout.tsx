import type { ReactNode } from "react";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Créer un compte");

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
