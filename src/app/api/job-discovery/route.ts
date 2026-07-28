import { z } from 'zod';

import { employmentTypes } from '@/lib/careers';
import { parseDiscoveryBoolean } from '@/lib/job-discovery';
import { requireUser } from '@/lib/server/auth';
import { discoverJobs } from '@/lib/server/job-discovery-query';
import { listJobSources, triggerAccessRefresh } from '@/lib/server/job-ingestion';
import { handleApiError, jsonOk } from '@/lib/server/http';

const graduateRoles = new Set<'graduate'>(['graduate']);

const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  location: z.string().trim().max(120).default(''),
  employmentType: z.union([z.enum(employmentTypes), z.literal('')]).default(''),
  source: z.enum(['all', 'yahnu', 'external']).default('all'),
  savedOnly: z.enum(['true', 'false']).default('false'),
  trackedOnly: z.enum(['true', 'false']).default('false'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
}).strict();

export async function GET(request: Request) {
  try {
    const user = await requireUser(graduateRoles);
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      location: url.searchParams.get('location') ?? undefined,
      employmentType: url.searchParams.get('employmentType') ?? undefined,
      source: url.searchParams.get('source') ?? undefined,
      savedOnly: url.searchParams.get('savedOnly') ?? undefined,
      trackedOnly: url.searchParams.get('trackedOnly') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    const input = {
      ...parsed,
      savedOnly: parseDiscoveryBoolean(parsed.savedOnly),
      trackedOnly: parseDiscoveryBoolean(parsed.trackedOnly),
    };

    triggerAccessRefresh();
    const [discovery, sources] = await Promise.all([
      discoverJobs(user, input),
      listJobSources(),
    ]);
    return jsonOk({
      ...discovery,
      sources: sources.filter((source) => source.enabled).map((source) => ({
        id: source.id,
        organizationName: source.organizationName,
        careerUrl: source.careerUrl,
        officialDomain: source.officialDomain,
        marketScope: source.marketScope,
        lastSuccessAt: source.lastSuccessAt,
        stale: source.stale,
      })),
      refreshModel: 'access_triggered_stale_while_revalidate' as const,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
