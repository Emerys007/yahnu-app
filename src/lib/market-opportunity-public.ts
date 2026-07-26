import type {
  PublicMarketOpportunity,
  VerifiedMarketOpportunity,
} from "./ivory-coast-market";

type MarketOpportunityDates = Pick<VerifiedMarketOpportunity, "expiresAt" | "deadlineAt">;

export function isIsoCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function marketOpportunityCutoffDate(opportunity: MarketOpportunityDates) {
  if (!isIsoCalendarDate(opportunity.expiresAt)) return null;
  if (!opportunity.deadlineAt) return opportunity.expiresAt;
  if (!isIsoCalendarDate(opportunity.deadlineAt)) return null;
  return opportunity.deadlineAt < opportunity.expiresAt
    ? opportunity.deadlineAt
    : opportunity.expiresAt;
}

export function marketOpportunityIsCurrent(
  opportunity: MarketOpportunityDates,
  now = new Date(),
) {
  const cutoff = marketOpportunityCutoffDate(opportunity);
  if (!cutoff) return false;
  return new Date(`${cutoff}T23:59:59Z`) >= now;
}

export function serializePublicMarketOpportunity(
  opportunity: VerifiedMarketOpportunity,
): PublicMarketOpportunity {
  const { sourceUrl: _sourceUrl, ...publicOpportunity } = opportunity;
  return publicOpportunity;
}
