import { Footer } from '@/components/landing/footer';
import { MainNav } from '@/components/landing/main-nav';
import { JobBrowser } from '@/components/careers/job-browser';

export default function JobsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1"><JobBrowser /></main>
      <Footer />
    </div>
  );
}
