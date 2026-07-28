import 'server-only';

export type ApprovedJobSource = {
  id: string;
  organizationName: string;
  adapter: 'lever' | 'greenhouse';
  feedUrl: string;
  careerUrl: string;
  officialDomain: string;
  marketScope: 'ivory_coast' | 'africa';
  feedHosts: readonly string[];
  applicationHosts: readonly string[];
  applicationPathPrefixes: readonly string[];
  atsProvider: 'Lever' | 'Greenhouse';
  maxItems: number;
  includeAfricaRemote: boolean;
};

// Endpoints are deliberately code-pinned. Admins can pause a source, but cannot
// turn Yahnu into a generic URL fetcher. These are public job feeds documented
// by Lever and Greenhouse and verified against each employer's live job board.
export const approvedJobSources = [
  {
    id: 'lever-heetch',
    organizationName: 'Heetch / Fleetch',
    adapter: 'lever',
    feedUrl: 'https://api.lever.co/v0/postings/heetch?mode=json',
    careerUrl: 'https://www.heetch.com/jobs',
    officialDomain: 'heetch.com',
    marketScope: 'ivory_coast',
    feedHosts: ['api.lever.co'],
    applicationHosts: ['jobs.lever.co'],
    applicationPathPrefixes: ['/heetch/'],
    atsProvider: 'Lever',
    maxItems: 100,
    includeAfricaRemote: false,
  },
  {
    id: 'lever-yassir',
    organizationName: 'Yassir',
    adapter: 'lever',
    feedUrl: 'https://api.lever.co/v0/postings/Yassir?mode=json',
    careerUrl: 'https://yassir.com/career',
    officialDomain: 'yassir.com',
    marketScope: 'africa',
    feedHosts: ['api.lever.co'],
    applicationHosts: ['jobs.lever.co'],
    applicationPathPrefixes: ['/Yassir/'],
    atsProvider: 'Lever',
    maxItems: 200,
    includeAfricaRemote: false,
  },
  {
    id: 'greenhouse-jumia',
    organizationName: 'Jumia',
    adapter: 'greenhouse',
    feedUrl: 'https://boards-api.greenhouse.io/v1/boards/jumia/jobs?content=true',
    careerUrl: 'https://group.jumia.com/careers',
    officialDomain: 'jumia.com',
    marketScope: 'africa',
    feedHosts: ['boards-api.greenhouse.io'],
    applicationHosts: [
      'job-boards.greenhouse.io',
      'job-boards.eu.greenhouse.io',
      'boards.greenhouse.io',
      'boards.eu.greenhouse.io',
    ],
    applicationPathPrefixes: ['/jumia/'],
    atsProvider: 'Greenhouse',
    maxItems: 100,
    includeAfricaRemote: false,
  },
  {
    id: 'greenhouse-alx-africa',
    organizationName: 'ALX Africa',
    adapter: 'greenhouse',
    feedUrl: 'https://boards-api.greenhouse.io/v1/boards/alxafrica/jobs?content=true',
    careerUrl: 'https://careers.alxafrica.com/joinus/',
    officialDomain: 'alxafrica.com',
    marketScope: 'africa',
    feedHosts: ['boards-api.greenhouse.io'],
    applicationHosts: [
      'job-boards.greenhouse.io',
      'job-boards.eu.greenhouse.io',
      'boards.greenhouse.io',
      'boards.eu.greenhouse.io',
    ],
    applicationPathPrefixes: ['/alxafrica/'],
    atsProvider: 'Greenhouse',
    maxItems: 100,
    includeAfricaRemote: true,
  },
] as const satisfies readonly ApprovedJobSource[];

const byId = new Map<string, ApprovedJobSource>(
  approvedJobSources.map((source) => [source.id, source]),
);

export function approvedJobSource(id: string) {
  return byId.get(id) ?? null;
}
