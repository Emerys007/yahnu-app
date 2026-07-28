import type { ReactNode } from "react";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Finaliser une invitation");

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
