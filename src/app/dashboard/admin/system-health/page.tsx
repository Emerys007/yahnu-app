
import type { Metadata } from "next"

import SystemHealth from "@/components/dashboard/support/system-health"

export const metadata: Metadata = {
  title: "État de la plateforme · Yahnu",
  description: "Diagnostic en direct de l’infrastructure Yahnu.",
}

export default function SystemHealthPage() {
  return <SystemHealth />
}
