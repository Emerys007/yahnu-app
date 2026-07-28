import { Footer } from '@/components/landing/footer';
import { MainNav } from '@/components/landing/main-nav';
import { JobBrowser } from '@/components/careers/job-browser';
import { VerifiedOpportunities } from '@/components/market/verified-opportunities';
import { publicJobListSelectColumns, serializePublicJob, type JobRow } from '@/lib/careers-server';
import { query } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

async function initialYahnuJobs() {
  try {
    const result = await query<JobRow>(`
      SELECT ${publicJobListSelectColumns}
      FROM jobs j
      LEFT JOIN users owner ON owner.id = j.company_id AND owner.deleted_at IS NULL
      WHERE j.status = 'open'
        AND (j.closes_at IS NULL OR j.closes_at > now())
      ORDER BY j.created_at DESC, j.id
      LIMIT 13
    `);
    return {
      jobs: result.rows.slice(0, 12).map(serializePublicJob),
      hasMore: result.rows.length > 12,
      nextOffset: Math.min(12, result.rows.length),
    };
  } catch (error) {
    console.error('Unable to server-render initial public jobs:', error);
    return { jobs: [], hasMore: false, nextOffset: 0 };
  }
}

export default async function JobsPage() {
  const initial = await initialYahnuJobs();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <VerifiedOpportunities />
        <JobBrowser
          initialJobs={initial.jobs}
          initialHasMore={initial.hasMore}
          initialNextOffset={initial.nextOffset}
        />
      </main>
      <Footer />
    </div>
  );
}
