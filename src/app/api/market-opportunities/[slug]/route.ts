import { z } from "zod";

import { marketOpportunityIsCurrent } from "@/lib/market-opportunity-public";
import { getManagedMarketOpportunities } from "@/lib/market-opportunities-server";
import { requireUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk } from "@/lib/server/http";

const slugSchema = z.string().trim().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await requireUser();
    const slug = slugSchema.parse((await context.params).slug);
    const catalog = await getManagedMarketOpportunities();
    const opportunity = catalog.opportunities.find((item) => item.slug === slug);

    if (!opportunity || !marketOpportunityIsCurrent(opportunity)) {
      throw new ApiError(404, "opportunity_not_found", "This opportunity is unavailable.");
    }

    return jsonOk({ opportunity });
  } catch (error) {
    return handleApiError(error);
  }
}
