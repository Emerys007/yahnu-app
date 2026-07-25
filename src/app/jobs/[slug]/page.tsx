import { Footer } from '@/components/landing/footer';
import { MainNav } from '@/components/landing/main-nav';
import { JobDetail } from '@/components/careers/job-browser';

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1"><JobDetail id={slug} /></main>
      <Footer />
    </div>
  );
}
