import type { Metadata } from "next";

import { PilotInquiryPage } from "@/components/contact/pilot-inquiry-page";
import type { PilotInquirySubmission } from "@/lib/pilot-inquiries";

export const metadata: Metadata = {
  title: "Contact & pilote",
  description:
    "Proposer un pilote, un partenariat ou un projet d’insertion professionnelle à l’équipe Yahnu.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function source(value: string | undefined): PilotInquirySubmission["source"] {
  return value === "institutions" || value === "impact" || value === "footer" || value === "other"
    ? value
    : "contact";
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const campaignValue = first(query.utm_campaign)?.slice(0, 80);
  return (
    <PilotInquiryPage
      intent={first(query.intent)}
      source={source(first(query.source))}
      campaign={campaignValue}
    />
  );
}
