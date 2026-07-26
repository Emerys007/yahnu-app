import {
  marketOpportunityIsCurrent,
  serializePublicMarketOpportunity,
} from "@/lib/market-opportunity-public";
import { getManagedMarketOpportunities } from "@/lib/market-opportunities-server";
import { handleApiError, jsonOk } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await getManagedMarketOpportunities();
    return jsonOk({
      opportunities: catalog.opportunities
        .filter((opportunity) => marketOpportunityIsCurrent(opportunity))
        .map(serializePublicMarketOpportunity),
      updatedAt: catalog.updatedAt,
      managed: catalog.managed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
