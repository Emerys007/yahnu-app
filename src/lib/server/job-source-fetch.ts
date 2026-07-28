import 'server-only';

import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { z } from 'zod';

import {
  collectCompleteSourcePages,
  JobSourcePaginationError,
} from '@/lib/job-source-pagination';
import { approvedHttpsUrl, isPrivateOrReservedIp } from '@/lib/job-source-security';
import type { ApprovedJobSource } from '@/lib/server/job-source-registry';

const MAX_RESPONSE_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 6_000;
const MAX_DESCRIPTION_CHARACTERS = 30_000;
const LEVER_PAGE_SIZE = 50;
const MAX_LEVER_SOURCE_POSTINGS = 500;

const leverPostingSchema = z.object({
  id: z.string().min(1).max(300),
  text: z.string().min(2).max(240),
  categories: z.object({
    location: z.string().max(500).nullish(),
    commitment: z.string().max(120).nullish(),
    team: z.string().max(160).nullish(),
    department: z.string().max(160).nullish(),
    allLocations: z.array(z.string().max(250)).max(30).nullish(),
  }).strip().default({}),
  createdAt: z.number().int().nonnegative().nullish(),
  descriptionPlain: z.string().max(200_000).nullish(),
  openingPlain: z.string().max(100_000).nullish(),
  additionalPlain: z.string().max(100_000).nullish(),
  hostedUrl: z.string().max(2_048),
  applyUrl: z.string().max(2_048),
  workplaceType: z.string().max(40).nullish(),
}).strip();

const greenhousePostingSchema = z.object({
  id: z.union([z.number().int().nonnegative(), z.string().min(1).max(300)]),
  title: z.string().min(2).max(240),
  absolute_url: z.string().max(2_048),
  location: z.object({ name: z.string().max(500).nullish() }).strip().nullish(),
  updated_at: z.string().max(100).nullish(),
  first_published: z.string().max(100).nullish(),
  content: z.string().max(250_000).nullish(),
  departments: z.array(z.object({ name: z.string().max(160) }).strip()).max(20).nullish(),
  offices: z.array(z.object({
    name: z.string().max(160),
    location: z.string().max(250).nullish(),
  }).strip()).max(30).nullish(),
  metadata: z.array(z.object({
    name: z.string().max(160),
    value: z.union([z.string().max(500), z.array(z.string().max(250)).max(20)]).nullish(),
  }).strip()).max(50).nullish(),
}).strip();

const greenhouseResponseSchema = z.object({
  jobs: z.array(greenhousePostingSchema).max(200),
}).strip();

const leverResponseSchema = z.array(leverPostingSchema).max(200);

export type NormalizedExternalJob = {
  externalId: string;
  title: string;
  companyName: string;
  location: string | null;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary' | 'volunteer' | 'other' | null;
  workplaceType: 'on_site' | 'hybrid' | 'remote' | 'unspecified' | null;
  description: string;
  applyUrl: string;
  canonicalUrl: string;
  categories: string[];
  targetMarkets: string[];
  sourcePublishedAt: string | null;
  sourceUpdatedAt: string | null;
  sourcePayload: Record<string, unknown>;
};

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

const ivoryCoastMarkers = [
  'abidjan',
  'cote d ivoire',
  'ivory coast',
  'yamoussoukro',
  'bouake',
  'san pedro',
  'korhogo',
  'daloa',
  'man',
];

const africaMarkers = [
  'africa', 'afrique', 'algeria', 'algerie', 'angola', 'benin', 'botswana',
  'burkina faso', 'burundi', 'cameroon', 'cameroun', 'cape town', 'cap vert',
  'cairo', 'caire', 'casablanca', 'chad', 'congo', 'cotonou', 'dakar',
  'dar es salaam', 'djibouti', 'egypt', 'egypte', 'ethiopia', 'ethiopie',
  'gabon', 'ghana', 'guinea', 'guinee', 'ivory coast', 'cote d ivoire',
  'johannesburg', 'kampala', 'kenya', 'kigali', 'lagos', 'liberia',
  'libreville', 'lome', 'lusaka', 'madagascar', 'malawi', 'mali',
  'mauritania', 'maurice', 'mauritius', 'morocco', 'maroc', 'mozambique',
  'nairobi', 'namibia', 'niger', 'nigeria', 'pretoria', 'rwanda', 'senegal',
  'seychelles', 'sierra leone', 'somalia', 'south africa', 'afrique du sud',
  'sudan', 'soudan', 'tanzania', 'tanzanie', 'togo', 'tunisia', 'tunisie',
  'uganda', 'zambia', 'zambie', 'zimbabwe', 'abidjan', 'yamoussoukro',
];

function markerMatch(value: string, markers: readonly string[]) {
  const candidate = normalize(value);
  return markers.some((marker) => candidate.includes(marker));
}

function targetsMarket(
  source: ApprovedJobSource,
  location: string,
  description: string,
  workplaceType: NormalizedExternalJob['workplaceType'],
) {
  if (source.marketScope === 'ivory_coast') {
    return markerMatch(location, ivoryCoastMarkers);
  }
  if (markerMatch(location, africaMarkers)) return true;
  return source.includeAfricaRemote
    && workplaceType === 'remote'
    && markerMatch(`${source.organizationName} ${description.slice(0, 2_000)}`, ['africa', 'afrique', 'african']);
}

function cleanText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, MAX_DESCRIPTION_CHARACTERS);
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"', '#39': "'",
  };
  return value
    .replace(/&#(\d+);/g, (_match, number: string) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_match, number: string) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&([a-z]+|#39);/gi, (match, entity: string) => named[entity.toLowerCase()] ?? match);
}

function htmlToPlainText(value: string) {
  const decoded = decodeHtmlEntities(value);
  return cleanText(decodeHtmlEntities(
    decoded
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/<[^>]+>/g, ' '));
}

function employmentType(value: string | null | undefined): NormalizedExternalJob['employmentType'] {
  const candidate = normalize(value ?? '');
  if (/intern|stage|apprent|alternance/.test(candidate)) return 'internship';
  if (/part time|temps partiel/.test(candidate)) return 'part_time';
  if (/full time|permanent|temps plein|cdi/.test(candidate)) return 'full_time';
  if (/temporary|temporaire|cdd/.test(candidate)) return 'temporary';
  if (/volunteer|benevol/.test(candidate)) return 'volunteer';
  if (/contract|freelance|consultant|contractor/.test(candidate)) return 'contract';
  return candidate ? 'other' : null;
}

function workplaceType(value: string | null | undefined): NormalizedExternalJob['workplaceType'] {
  const candidate = normalize(value ?? '');
  if (/remote|teletravail|a distance/.test(candidate)) return 'remote';
  if (/hybrid|hybride/.test(candidate)) return 'hybrid';
  if (/on.?site|onsite|presentiel/.test(candidate)) return 'on_site';
  return candidate ? 'unspecified' : null;
}

function isoDate(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? new Date(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function greenhouseEmployment(posting: z.infer<typeof greenhousePostingSchema>) {
  const field = posting.metadata?.find((item) => /employment|contract|type/i.test(item.name));
  return Array.isArray(field?.value) ? field.value.join(', ') : field?.value;
}

function parseLever(
  source: ApprovedJobSource,
  postings: z.infer<typeof leverPostingSchema>[],
) {
  return postings.flatMap((posting): NormalizedExternalJob[] => {
    const location = posting.categories.allLocations?.length
      ? posting.categories.allLocations.join(' / ')
      : posting.categories.location?.trim() || '';
    const description = cleanText([
      posting.openingPlain,
      posting.descriptionPlain,
      posting.additionalPlain,
    ].filter(Boolean).join('\n\n'));
    const workMode = workplaceType(posting.workplaceType);
    if (!description || !targetsMarket(source, location, description, workMode)) return [];
    const applyUrl = approvedHttpsUrl(
      posting.applyUrl,
      source.applicationHosts,
      source.applicationPathPrefixes,
    );
    const canonicalUrl = approvedHttpsUrl(
      posting.hostedUrl,
      source.applicationHosts,
      source.applicationPathPrefixes,
    );
    if (!applyUrl || !canonicalUrl) return [];
    const categories = [
      posting.categories.commitment,
      posting.categories.team,
      posting.categories.department,
    ].filter((value): value is string => Boolean(value));
    return [{
      externalId: posting.id,
      title: posting.text.trim(),
      companyName: source.organizationName,
      location: location || null,
      employmentType: employmentType(posting.categories.commitment),
      workplaceType: workMode,
      description,
      applyUrl: applyUrl.toString(),
      canonicalUrl: canonicalUrl.toString(),
      categories,
      targetMarkets: source.marketScope === 'ivory_coast' ? ['Côte d’Ivoire'] : ['Afrique'],
      sourcePublishedAt: isoDate(posting.createdAt),
      sourceUpdatedAt: isoDate(posting.createdAt),
      sourcePayload: {
        adapter: 'lever',
        commitment: posting.categories.commitment ?? null,
        department: posting.categories.department ?? null,
        team: posting.categories.team ?? null,
      },
    }];
  });
}

function parseGreenhouse(source: ApprovedJobSource, raw: unknown) {
  return greenhouseResponseSchema.parse(raw).jobs.flatMap((posting): NormalizedExternalJob[] => {
    const location = posting.location?.name?.trim()
      || posting.offices?.map((office) => office.location || office.name).filter(Boolean).join(' / ')
      || '';
    const description = htmlToPlainText(posting.content ?? '');
    const inferredWorkplace = workplaceType(`${location} ${description.slice(0, 1_000)}`);
    if (!description || !targetsMarket(source, location, description, inferredWorkplace)) return [];
    const canonicalUrl = approvedHttpsUrl(
      posting.absolute_url,
      source.applicationHosts,
      source.applicationPathPrefixes,
    );
    if (!canonicalUrl) return [];
    const categories = [
      ...(posting.departments?.map((department) => department.name) ?? []),
      ...posting.metadata?.flatMap((item) => Array.isArray(item.value) ? item.value : item.value ? [item.value] : []) ?? [],
    ].slice(0, 20);
    return [{
      externalId: String(posting.id),
      title: posting.title.trim(),
      companyName: source.organizationName,
      location: location || null,
      employmentType: employmentType(greenhouseEmployment(posting)),
      workplaceType: inferredWorkplace,
      description,
      applyUrl: canonicalUrl.toString(),
      canonicalUrl: canonicalUrl.toString(),
      categories,
      targetMarkets: source.marketScope === 'ivory_coast' ? ['Côte d’Ivoire'] : ['Afrique'],
      sourcePublishedAt: isoDate(posting.first_published),
      sourceUpdatedAt: isoDate(posting.updated_at),
      sourcePayload: {
        adapter: 'greenhouse',
        departments: posting.departments?.map((department) => department.name) ?? [],
      },
    }];
  });
}

async function assertPublicDns(hostname: string) {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => isPrivateOrReservedIp(item.address))) {
    throw new JobSourceFetchError('blocked_network_target');
  }
}

async function readJsonResponse(response: Response) {
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
    throw new JobSourceFetchError('response_too_large');
  }
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) throw new JobSourceFetchError('invalid_content_type');
  if (!response.body) throw new JobSourceFetchError('empty_response');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new JobSourceFetchError('response_too_large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new JobSourceFetchError('invalid_json');
  }
}

export class JobSourceFetchError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = 'JobSourceFetchError';
    this.code = code;
  }
}

async function fetchApprovedJson(endpoint: URL) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  timer.unref?.();
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      redirect: 'error',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'YahnuOpportunityIndexer/1.0 (+https://yahnu.org)',
      },
    });
    if (!response.ok) throw new JobSourceFetchError(`http_${response.status}`);
    return await readJsonResponse(response);
  } catch (error) {
    if (error instanceof JobSourceFetchError || error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new JobSourceFetchError('timeout');
    throw new JobSourceFetchError('network_error');
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchApprovedJobSource(source: ApprovedJobSource) {
  const endpoint = approvedHttpsUrl(source.feedUrl, source.feedHosts);
  if (!endpoint) throw new JobSourceFetchError('source_not_approved');
  await assertPublicDns(endpoint.hostname);

  try {
    if (source.adapter === 'lever') {
      return await collectCompleteSourcePages(async (offset, pageSize) => {
        const pageEndpoint = new URL(endpoint);
        pageEndpoint.searchParams.set('mode', 'json');
        pageEndpoint.searchParams.set('limit', String(pageSize));
        pageEndpoint.searchParams.set('skip', String(offset));
        const postings = leverResponseSchema.parse(await fetchApprovedJson(pageEndpoint));
        return {
          sourceItemCount: postings.length,
          items: parseLever(source, postings),
        };
      }, {
        pageSize: LEVER_PAGE_SIZE,
        maxSourceItems: MAX_LEVER_SOURCE_POSTINGS,
      });
    }

    return parseGreenhouse(source, await fetchApprovedJson(endpoint));
  } catch (error) {
    if (error instanceof JobSourcePaginationError) {
      throw new JobSourceFetchError(error.code);
    }
    throw error;
  }
}

export function externalJobIdentity(sourceId: string, externalId: string) {
  return `ext_${createHash('sha256').update(`${sourceId}\0${externalId}`).digest('hex').slice(0, 32)}`;
}

export function externalJobDedupKey(job: Pick<NormalizedExternalJob, 'companyName' | 'title' | 'location'>) {
  return createHash('sha256')
    .update([job.companyName, job.title, job.location ?? ''].map(normalize).join('\0'))
    .digest('hex');
}

export function externalJobSourceHash(job: NormalizedExternalJob) {
  return createHash('sha256').update(JSON.stringify({
    externalId: job.externalId,
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    employmentType: job.employmentType,
    workplaceType: job.workplaceType,
    description: job.description,
    applyUrl: job.applyUrl,
    canonicalUrl: job.canonicalUrl,
    categories: job.categories,
    sourceUpdatedAt: job.sourceUpdatedAt,
  })).digest('hex');
}
