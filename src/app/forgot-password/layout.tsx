import type { ReactNode } from "react";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Retrouver mon accès");

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
