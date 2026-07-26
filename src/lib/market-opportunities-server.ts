import { z } from "zod";

import type { VerifiedMarketOpportunity } from "@/lib/ivory-coast-market";
import { isIsoCalendarDate } from "@/lib/market-opportunity-public";
import { query } from "@/lib/server/db";
import { verifiedMarketOpportunities } from "@/lib/verified-market-opportunities";

const localisedTextSchema = z.object({
  fr: z.string().trim().min(1).max(2_000),
  en: z.string().trim().min(1).max(2_000),
}).strict();

const isoDateSchema = z.string().refine(
  isIsoCalendarDate,
  "Invalid calendar date.",
);

function addIsoDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const marketOpportunitySchema = z.object({
  slug: z.string().trim().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  company: z.string().trim().min(1).max(200),
  title: localisedTextSchema,
  location: localisedTextSchema,
  workMode: z.enum(["on-site", "hybrid", "remote-flexible"]),
  contract: localisedTextSchema,
  summary: localisedTextSchema,
  tags: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
  publishedAt: isoDateSchema.optional(),
  deadlineAt: isoDateSchema.optional(),
  verifiedAt: isoDateSchema,
  expiresAt: isoDateSchema,
  sourceUrl: z.string().url().max(2_048).refine((value) => value.startsWith("https://"), {
    message: "The official source must use HTTPS.",
  }),
}).strict().superRefine((opportunity, context) => {
  if (opportunity.expiresAt < opportunity.verifiedAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "The expiry date cannot precede the verification date.",
    });
  }
  if (opportunity.deadlineAt) {
    if (opportunity.deadlineAt < opportunity.verifiedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadlineAt"],
        message: "A listing cannot be verified after its official deadline.",
      });
    }
    if (opportunity.expiresAt > opportunity.deadlineAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: "A listing must be hidden no later than its official deadline.",
      });
    }
  } else if (opportunity.expiresAt > addIsoDays(opportunity.verifiedAt, 14)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "Listings without a deadline may remain visible for at most fourteen days.",
    });
  }
  if (opportunity.publishedAt && opportunity.publishedAt > opportunity.expiresAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["publishedAt"],
      message: "The publication date cannot follow the listing expiry date.",
    });
  }
});

export const marketOpportunityPageSchema = z.object({
  opportunities: z.array(marketOpportunitySchema).max(100).superRefine((opportunities, context) => {
    const slugs = new Set<string>();
    for (const [index, opportunity] of opportunities.entries()) {
      if (slugs.has(opportunity.slug)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "slug"],
          message: "Opportunity slugs must be unique.",
        });
      }
      slugs.add(opportunity.slug);
    }
  }),
}).strict();

type MarketOpportunityPageRow = {
  data: unknown;
  updated_at: Date | string;
};

export type ManagedMarketOpportunities = {
  opportunities: VerifiedMarketOpportunity[];
  updatedAt: string | null;
  managed: boolean;
};

function defaultOpportunities() {
  return verifiedMarketOpportunities.map((opportunity) => ({
    ...opportunity,
    title: { ...opportunity.title },
    location: { ...opportunity.location },
    contract: { ...opportunity.contract },
    summary: { ...opportunity.summary },
    tags: [...opportunity.tags],
  }));
}

export async function getManagedMarketOpportunities(): Promise<ManagedMarketOpportunities> {
  const result = await query<MarketOpportunityPageRow>(
    "SELECT data, updated_at FROM pages WHERE id = $1",
    ["market-opportunities"],
  );
  const row = result.rows[0];

  if (!row) {
    return {
      opportunities: defaultOpportunities(),
      updatedAt: null,
      managed: false,
    };
  }

  const parsed = marketOpportunityPageSchema.safeParse(row.data);
  if (!parsed.success) {
    console.error("Stored market opportunities failed validation.", parsed.error.flatten());
    return {
      opportunities: defaultOpportunities(),
      updatedAt: null,
      managed: false,
    };
  }

  return {
    opportunities: parsed.data.opportunities,
    updatedAt: new Date(row.updated_at).toISOString(),
    managed: true,
  };
}
