import { Footer } from '@/components/landing/footer';
import { MainNav } from '@/components/landing/main-nav';
import { JobDetail } from '@/components/careers/job-browser';
import { notFound } from 'next/navigation';

import { query } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug || slug.length > 200) notFound();
  const available = await query(`
    SELECT id
    FROM jobs
    WHERE id = $1
      AND status = 'open'
      AND (closes_at IS NULL OR closes_at > now())
  `, [slug]);
  if (!available.rows[0]) notFound();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1"><JobDetail id={slug} /></main>
      <Footer />
    </div>
  );
}
